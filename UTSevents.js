import { fetchCourses, fetchAssignments, fetchToDos, fetchEvents } from './UTSutils.js'; // Import the fetches utility


const todaysDate = new Date(); // Always represents today's date

// Utility: Populate Course Dropdown
async function populateCourseDropdown(modalId) {
  const dropdown = document.querySelector(`#${modalId} select[name="course_id"]`);
  
  // Adjust the default option text based on modalId
  const isOptional = modalId === 'toDoModal' || modalId === 'eventModal';
  const defaultOptionText = isOptional ? 'Select Course (optional)' : 'Select Course';

  dropdown.innerHTML = `<option value="">${defaultOptionText}</option>`; // Clear previous options and set default text

  try {
    const courses = await fetchCourses(); // Fetch courses dynamically
    courses.forEach(course => {
      const option = document.createElement('option');
      option.value = course.course_id;
      option.textContent = course.name;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    alert('Failed to load courses. Please try again later.');
  }
}

function refreshEvents() {
  window.location.reload();
}

// Date Formatter
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-'); // Split the input string into components
  const date = new Date(Number(year), Number(month) - 1, Number(day)); // Construct a date in local time
  const dayFormatted = String(date.getDate()).padStart(2, '0');
  const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
  const yearFormatted = date.getFullYear();
  return `${monthFormatted}/${dayFormatted}/${yearFormatted}`;
}

// Populate Containers
export async function populateContainer(containerId, fetchFunction, type, courseId = null) {
    
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing content
    let items;
    try {

      if (containerId === "assignmentContainer4Course") {
        //console.log(` from UTSevents ContainerId: ${courseId}`);
        items = await fetchFunction(null, null, null, courseId); // Fetch data (assignments or to-dos)
      }
      else {
        // Normalize today's date to start of the day
        const startDate = new Date(todaysDate);
        startDate.setHours(0, 0, 0, 0);

        // Calculate one month from today's date
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0); // To handle months with varying days
        endDate.setHours(23, 59, 59, 999); // Normalize to the end of the day

        const viewStartDate = startDate.toISOString().split("T")[0];
        const viewEndDate = endDate.toISOString().split("T")[0];

        // Pass the formatted date arguments to fetchFunction
        items = await fetchFunction(null, viewStartDate, viewEndDate);

        // Exclude completed items
        items = items.filter(item => item.status !== 'Completed');
      }  

        if (items.length === 0) {
            // Capitalize the first letter of 'toDo' if type is 'toDo'
            const displayType = type === 'toDo' ? type.charAt(0).toUpperCase() + type.slice(1) : type;
            
            container.innerHTML = `<p class="empty-message">No ${displayType}s available.</p>`;
            return;
        }

        // Sort items:
        // 1. By `status` to put 'Completed' and 'Graded' at the bottom
        // 2. By `due_date` within the same `status`
        items.sort((a, b) => {
          const statusOrder = ['Uncompleted', 'Completed', 'Graded'];
          const statusComparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          if (statusComparison !== 0) return statusComparison;
          return new Date(a.due_date) - new Date(b.due_date); // Sort by due_date within same status
        });

        for (const item of items) {
            const itemId = type === 'assignment' ? item.assignment_id : item.to_do_id;

            // Combine due_date and due_time into a single Date object
            const dueDateTime = new Date(`${item.due_date}T${item.due_time || '00:00'}`);


            const listItem = document.createElement('div');
            listItem.className = 'list-item';

            listItem.setAttribute('data-id', itemId); // Store unique ID
            listItem.setAttribute('data-type', type); // Store type (assignment or to-do)
            listItem.style.backgroundColor = item.color; // Apply the color if it has one
            // Determine content and styling based on the status and overdue state
            if (item.status === 'Uncompleted') {
              // Determine if the item is overdue
              const isOverdue = dueDateTime < todaysDate;
              listItem.innerHTML = `
                  <span class="text">${item.title}</span>
                  <span class="details">${isOverdue ? 'OVERDUE: ' + formatDate(item.due_date) : 'Due: ' + formatDate(item.due_date)}</span>
              `;
              if (isOverdue) {
                  listItem.style.backgroundColor = 'black'; // Optional style for overdue
                  listItem.style.border = '2px solid red'; // Highlight overdue with a red border
                  listItem.style.color = 'red'; // Optional text color for overdue
              }
            } else if (item.status === 'Completed') {
                listItem.innerHTML = `
                    <span class="text">${item.title}</span>
                    <span class="details">COMPLETED</span>
                `;
                listItem.style.color = 'white'; // Optional styling for completed items
            } /*else if (item.status === 'Graded') {
                listItem.innerHTML = `
                    <span class="text">${item.title}</span>
                    <span class="details">GRADED: ${item.points_earned} / ${item.points_possible}</span>
                `;
                listItem.style.color = 'gold'; // Optional styling for graded items
            }*/

            // Add click event listener
            listItem.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                item.id = id;
                const clickedType = e.currentTarget.getAttribute('data-type');
                const modalId = clickedType + 'Modal'; // Result: 'todoModal'
                //console.log(`Clicked ${clickedType} modalId: ${modalId} item: ${item}`);
                openModal(clickedType, modalId, item); // Pass item instead of just id
            });

            container.appendChild(listItem);
        }
    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        container.innerHTML = `<p class="error-message">Failed to load ${type}s. Please try again later.</p>`;
    }
}

// Open Modal from Calendar helper function
export async function openFromCalendar(type, id) {
  console.log(`Type: ${type}, Id: ${id}`);
  try {
    let item;

    // Determine which fetch function to call based on the type
    if (type === 'assignment') {
      const result = await fetchAssignments(id);
      if (result.length > 0) {
          item = result[0];
      } else {
          throw new Error(`Failed to fetch assignment with ID: ${id}`);
      }
    } else if (type === 'toDo') {
      const result = await fetchToDos(id);
      if (result.length > 0) {
        item = result[0]; // Extract the first item
      } else {
          throw new Error(`Failed to fetch to-do with ID: ${id}. Response: ${JSON.stringify(result)}`);
      }
    } else if (type === 'event') {
      const result = await fetchEvents(id);
      if (result.length > 0) {
          item = result[0];
      } else {
          throw new Error(`Failed to fetch event with ID: ${id}`);
      }
    } else {
      throw new Error(`Unknown event type: ${type}`);
    }

    // Call openModal with the fetched item
    if (item) {
      item.id = id;
      console.log(`Type: ${type}, Id: ${id}, Item: ${item}`);
      if (type === 'event') {
        openEventModal(item); // Use openEventModal for events
      } else {
        openModal(type, `${type}Modal`, item); // Use openModal for assignments and todos
      }
    }

  } catch (error) {
      console.error(`Error handling event click for type: ${type}, ID: ${id}`, error);
      alert('Failed to load event details. Please try again.');
  }
}

export async function openEventModal(item) {
  const modal = document.getElementById('eventModal');
  const form = modal.querySelector('form');
  const editChoice = modal.querySelector('.edit-choice'); // Assuming 'edit-choice' is the class for the radio buttons container

  form.reset(); // Clear previous values
  delete form.dataset.id; // Clear stored ID for new records
  //await populateCourseDropdown('eventModal'); // Populate courses

  const submitButton = modal.querySelector('button[type="submit"]');
  const deleteButton = modal.querySelector('#deleteButton');
  const modalTitle = modal.querySelector('h2');

  const colorDropdown = form.querySelector('#color');

  const allDayCheckbox = form.querySelector('[name="all_day"]');
  const noSchoolDayCheckbox = form.querySelector('[name="no_school_day"]');
  const startTime = form.querySelector('[name="start_time"]');
  const endTime = form.querySelector('[name="end_time"]');
  const recurrenceDropdown = form.querySelector('[name="recurrence"]');
  const recurrenceLabel = document.getElementById('recurrenceLabel');
  const startDateInput = form.querySelector('[name="start_date"]');
  const endDateInput = form.querySelector('[name="end_date"]');
  const endDateLabel = form.querySelector('label[for="end_date"]');

  // Helper function to manage form state
  function updateFormState(editType) {
    const isAllDay = allDayCheckbox.checked;
    const isRecurring = recurrenceDropdown.value !== 'None';

    // Manage color dropdown visibility
    if (colorDropdown) {
      colorDropdown.style.display = editType === 'event' ? 'block' : 'none';
      colorDropdown.disabled = editType !== 'event';
    }

    // Manage time fields based on 'All Day'
    if (startTime) startTime.disabled = isAllDay;
    if (endTime) endTime.disabled = isAllDay;
    if (noSchoolDayCheckbox) {
      const noSchoolDayOption = noSchoolDayCheckbox.closest('.no-school-day-option');
      if (noSchoolDayOption) {
          noSchoolDayOption.style.display = isAllDay ? 'block' : 'none'; // Hide or show based on allDay
      }
      noSchoolDayCheckbox.disabled = !isAllDay;
    }

    // Manage recurrence and end date fields
    if (recurrenceDropdown && recurrenceLabel) {
      recurrenceDropdown.disabled = editType !== 'event';
      recurrenceDropdown.style.display = editType === 'event' ? 'block' : 'none';
      recurrenceLabel.style.display = editType === 'event' ? 'block' : 'none';
    }
    if (endDateInput && endDateLabel) {
      endDateInput.disabled = editType !== 'event' || !isRecurring;
      endDateInput.style.display = (editType === 'event' && isRecurring) ? 'block' : 'none';
      endDateLabel.style.display = (editType === 'event' && isRecurring) ? 'block' : 'none';
    }

    // Set the start date based on editType
    if (startDateInput && item) {
      if (editType === 'event' && item.series_start_date) {
        startDateInput.value = item.series_start_date;
      } else {
        startDateInput.value = item.start_date;
      }
    }

    // Add this line to log or set editType in the form
    form.dataset.editType = editType; // This sets a data attribute on the form
    // Log the editType to console for debugging
    console.log(`Edit Type: ${form.dataset.editType}`);

  }

  // Event listeners
  if (allDayCheckbox) allDayCheckbox.addEventListener('change', () => updateFormState(document.querySelector('input[name="editType"]:checked').value));
  if (recurrenceDropdown) recurrenceDropdown.addEventListener('change', () => updateFormState(document.querySelector('input[name="editType"]:checked').value));

  // Radio buttons for edit type
  const eventRadio = modal.querySelector('input[name="editType"][value="event"]');
  const occurrenceRadio = modal.querySelector('input[name="editType"][value="occurrence"]');

  if (eventRadio && occurrenceRadio) {
    eventRadio.addEventListener('change', () => updateFormState('event'));
    occurrenceRadio.addEventListener('change', () => updateFormState('occurrence'));
  }

  // Handle existing occurrence or new event
  if (item) {
    // Populate form with existing occurrence data
    Object.keys(item).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = item[key] === 1;
        } else {
          input.value = item[key];
        }
      }
    });

    // Set the initial state of the color dropdown
    if (colorDropdown) {
      colorDropdown.style.display = 'none'; // Initially hide for occurrence
      colorDropdown.disabled = true;
      colorDropdown.value = item.color || ''; // Set to the event's color or default to empty if not set
    }

    // Ensure the recurrence dropdown is populated correctly
    if (recurrenceDropdown) {
      recurrenceDropdown.value = item.recurrence || 'None';
    }

    form.dataset.id = item.id;
    occurrenceRadio.checked = true; // Default to editing the occurrence
    updateFormState('occurrence');

    submitButton.textContent = 'Save';
    deleteButton.style.display = 'block';
    deleteButton.onclick = () => {
      if (confirm(`Are you sure you want to delete this ${document.querySelector('input[name="editType"]:checked').value === 'event' ? 'event' : 'occurrence'}?`)) {
        deleteEntity(document.querySelector('input[name="editType"]:checked').value, item.id);
      }
    };
    modalTitle.textContent = 'Edit Event:';

  } else { // New event scenario
    form.dataset.id = '';
    deleteButton.style.display = 'none';
    submitButton.textContent = 'Save Event';
    modalTitle.textContent = 'New Event';

    if (colorDropdown) {
      colorDropdown.style.display = 'block'; // Show for new events (which are series by default)
      colorDropdown.disabled = false;
    }

    if (editChoice) editChoice.style.display = 'none'; // Hide edit choice for new events
    updateFormState('event'); // Default to event series creation
  }

  modal.style.display = 'flex';
}

// Add/Update Modal Workflow
export async function openModal(entity, modalId, item) {
  const modal = document.getElementById(modalId);
  const form = modal.querySelector('form');

  // Console log to display entity, modalId, and id
  //console.log(`From openModal - Entity: ${entity}, Modal ID: ${modalId}, Item: ${item}`);

  form.reset(); // Clear previous values
  delete form.dataset.id; // Clear stored ID for new records
  await populateCourseDropdown(modalId); // Populate courses

  const submitButton = modal.querySelector('button[type="submit"]'); // Target submit button within the form
  const deleteButton = modal.querySelector('#deleteButton');
  const modalTitle = modal.querySelector('h2'); // Select the first <h2> within the modal

  const statusLabel = form.querySelector('label[for="status"]'); // Reference the Status label
  const statusDropdown = form.querySelector('[name="status"]'); // Reference to the status dropdown


  if (item) {
    // Populate form fields from the item object
    Object.keys(item).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = item[key] === 1;
          } else if (key === 'course_id' && !item[key]) {
              input.value = ''; // Reset to default if no course is associated
          } else {
            input.value = item[key];
          }
        }
    });
    form.dataset.id = item.id; // Store the item ID for context
    console.log(`Open Modal with ID: ${item.id}`);

    // Set the status dropdown value
    if (statusDropdown && statusLabel) {
      statusLabel.style.display = 'block';
      statusDropdown.style.display = 'block';
      statusDropdown.value = item.status || 'Uncompleted'; // Default to "Uncompleted" if status is missing
    }

    // Edit submit button within the specific form
    submitButton.textContent = 'Save'; // Updates the button text

    if (deleteButton) {
      deleteButton.style.display = 'block';
      deleteButton.onclick = () => {
        if (confirm(`Are you sure you want to delete this ${entity.charAt(0).toUpperCase() + entity.slice(1)}?`)) {
          deleteEntity(entity, item.id); // Call deleteEntity directly
        }
      };
    }

    // Edit title within the specific form
    if (entity === "assignment") {
      modalTitle.textContent = item.title ? 'Edit Assignment' : 'Add Assignment';
    } else if (entity === "toDo") {
      modalTitle.textContent = 'Edit To-Do';
    }

  } else {

    form.dataset.id = ''; // Ensure no ID is set for new items

    // Set the status dropdown default
    if (statusDropdown && statusLabel) {
      statusLabel.style.display = 'none';
      statusDropdown.style.display = 'none';
    }

    // Hide delete button
    if (deleteButton) {
      deleteButton.style.display = 'none';
    }

    // Edit submit button and title within the specific form
    if (entity === "assignment") {
      modalTitle.textContent = 'New Assignment';
      submitButton.textContent = 'Add Assignment';
    } else if (entity === "toDo") {
      modalTitle.textContent = 'New To-Do';
      submitButton.textContent = 'Create To-Do';
    } 
  }

  modal.style.display = 'flex'; // Show modal
}

// Form Validation
export function validateEventFields(form) {
  let valid = true; // Assume form is valid initially
  const errors = []; // Collect error messages
  const modal = document.getElementById('eventModal');

  // Reset all borders
  [...form.elements].forEach(input => {
    if (input.name) {
      input.style.border = ''; // Clear any previous highlights
    }
  });

  // Common Validation: Title
  const title = form.querySelector('[name="title"]');
  if (!title.value.trim()) {
    errors.push('Title is required.');
    title.style.border = '1px solid red';
    valid = false;
  }

  // Event-Specific Validation
  const startDate = form.querySelector('[name="start_date"]');
  const endDate = form.querySelector('[name="end_date"]');
  const allDay = form.querySelector('[name="all_day"]');
  const startTime = form.querySelector('[name="start_time"]');
  const endTime = form.querySelector('[name="end_time"]');
  const recurrence = form.querySelector('[name="recurrence"]');
  const isOccurrence = document.querySelector('input[name="editType"]:checked').value === 'occurrence';

  // Start Date validation
  if (!startDate.value) {
    errors.push('Start date is required.');
    startDate.style.border = '1px solid red';
    valid = false;
  }

  // Time validation for non-all-day events
  if (!allDay.checked) {
    if (!startTime.value) {
      errors.push('Start time is required for non-all-day events.');
      startTime.style.border = '1px solid red';
      valid = false;
    }
    if (!endTime.value) {
      errors.push('End time is required for non-all-day events.');
      endTime.style.border = '1px solid red';
      valid = false;
    } else if (startTime.value >= endTime.value) {
      errors.push('End time must be after the start time.');
      startTime.style.border = '1px solid red';
      endTime.style.border = '1px solid red';
      valid = false;
    }
  }

  // Validation specific to the base event
  if (!isOccurrence) {
    if (recurrence.value !== 'None') {
      // Recurrence validation
      if (endDate.disabled || !endDate.value) {
        errors.push('End date is required for recurring events.');
        // We won't highlight endDate since it might be disabled, but this error message still informs the user
        valid = false;
      } else {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        let occurrenceCount = 0;

        switch (recurrence.value) {
          case 'Daily':
            occurrenceCount = Math.min(52, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            break;
          case 'Weekly':
            const dayOfWeek = start.getDay();
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              if (d.getDay() === dayOfWeek) {
                occurrenceCount++;
                if (occurrenceCount >= 52) break;
              }
            }
            break;
          case 'Monthly':
            const monthsDiff = end.getMonth() - start.getMonth() + (12 * (end.getFullYear() - start.getFullYear()));
            occurrenceCount = Math.min(52, monthsDiff + 1); // +1 for the first month
            break;
        }

        if (occurrenceCount > 52) {
          errors.push("The number of occurrences exceeds the limit of 52. Please adjust the end date or choose a different recurrence.");
          valid = false;
        }
      }
    }
  }

  // Display error messages as an alert
  if (!valid) {
    alert(errors.join('\n'));
  }

  return valid; // Return overall validity
}

function validateFields(form, entity) {
  let valid = true; // Assume form is valid initially
  const errors = []; // Collect error messages

  // Console log to display entity, modalId, and id
  //console.log(`From validateFields - Form: ${form}, Entity: ${entity}`);

  // Reset all borders
  [...form.elements].forEach(input => {
    if (input.name) {
      input.style.border = ''; // Clear any previous highlights
    }
  });

  // Common Validation: Title
  const title = form.querySelector('[name="title"]');
  if (!title.value) {
    errors.push('Title is required.');
    title.style.border = '1px solid red';
    valid = false;
  }

  // Entity-Specific Validation
  if (entity === 'assignment') {
    // Assignments
    const dueDate = form.querySelector('[name="due_date"]');
    const dueTime = form.querySelector('[name="due_time"]');
    const courseId = form.querySelector('[name="course_id"]');
    //const points = form.querySelector('[name="points_possible"]');

    if (!dueDate.value) {
      errors.push('Due date is required.');
      dueDate.style.border = '1px solid red';
      valid = false;
    }
    if (!dueTime.value) {
      errors.push('Due time is required.');
      dueTime.style.border = '1px solid red';
      valid = false;
    }
    if (!courseId.value) {
      errors.push('Course is required.');
      courseId.style.border = '1px solid red';
      valid = false;
    }
    /*if (!points.value || isNaN(points.value) || Number(points.value) <= 0) {
      errors.push('Points must be a positive number.');
      points.style.border = '1px solid red';
      valid = false;
    }*/
  } else if (entity === 'toDo') {
    // To-Dos
    const dueDate = form.querySelector('[name="due_date"]');
    //const dueTime = form.querySelector('[name="due_time"]');

    if (!dueDate.value) {
      errors.push('Due date is required.');
      dueDate.style.border = '1px solid red';
      valid = false;
    }
    /*if (!dueTime.value) {
      errors.push('Due time is required.');
      dueTime.style.border = '1px solid red';
      valid = false;
    }*/
  } else if (entity === 'event') {
    // Events
    const startDate = form.querySelector('[name="start_date"]');
    const endDate = form.querySelector('[name="end_date"]');
    const allDay = form.querySelector('[name="all_day"]');
    const startTime = form.querySelector('[name="start_time"]');
    const endTime = form.querySelector('[name="end_time"]');

    if (!startDate.value) {
      errors.push('Start date is required.');
      startDate.style.border = '1px solid red';
      valid = false;
    }
    if (!endDate.value) {
      errors.push('End date is required.');
      endDate.style.border = '1px solid red';
      valid = false;
    }
    if (startDate.value && endDate.value ) {
      if (new Date(startDate.value) > new Date(endDate.value)) {
        errors.push('Start date cannot be later than end date.');
        startDate.style.border = '1px solid red';
        endDate.style.border = '1px solid red';
        valid = false;
      } else if (!allDay.checked) {
        // Only compare times and check for existence if it's not an all-day event
        if (!startTime.value) {
          errors.push('Start time is required.');
          startTime.style.border = '1px solid red';
          valid = false;
        } else if (!endTime.value) {
          errors.push('End time is required.');
          endTime.style.border = '1px solid red';
          valid = false;
        } else {
          const startDateTime = new Date(`${startDate.value}T${startTime.value}`);
          const endDateTime = new Date(`${endDate.value}T${endTime.value}`);
        
          if (startDateTime > endDateTime) {
            errors.push('Start time cannot be later than end time.');
            startTime.style.border = '1px solid red';
            endTime.style.border = '1px solid red';
            valid = false;
          }
        }
      }
    }
  }

  // Display error messages as an alert
  if (!valid) {
    alert(errors.join('\n'));
  }

  return valid; // Return overall validity
}
  

// Save Functionality
async function saveEntity(event, entity, modalId) {

  // Console log to display entity, modalId, and id
  console.log(`From saveEntity - Event Type: ${event}, Entity: ${entity}, Modal ID: ${modalId}`);

  event.preventDefault(); // Prevent form submission

  const form = event.target;

  // Validate the form
  if (entity === 'event' ? !validateEventFields(form) : !validateFields(form, entity)) {
    return;
  }

  const id = form.dataset.id;

  const data = {};
  [...form.elements].forEach(input => {
    if (input.name) {
      if (input.type === 'checkbox') {
        data[input.name] = input.checked ? 1 : 0; // Handle checkbox
      } else {
        data[input.name] = input.value;
      }
    }
  });

  // Only if the entity is an event, set editType from dataset
  if (entity === 'event') {
    data.editType = form.dataset.editType; // Default to 'event' if not set
    // Log the editType to console for debugging
    console.log(`Edit Type: ${form.dataset.editType}`);
    console.log(`Start Time: ${data.start_time}`);
  }

  // Handle All Day events
  if (data.all_day === 1) {
    data.start_time = '00:00:00';
    data.end_time = '23:59:00'; // Set end time to cover the entire last day
  }

  // Check if due_time is empty or not set, then set it to '00:00:00'
  if (!data.due_time || data.due_time === '') {
    data.due_time = '00:00:00'; // Adjust this format if your application expects a different one
  }

  //console.log('Id sent to backend:', id);

  const action = id ? 'edit' : 'add';
  if (id) data.id = id;
  console.log(`Edit id: ${id}`)

  try {
    const response = await fetch(`UTSevents.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ entity, action, ...data }),
    });

    const result = await response.json();
    if (result.success) {
      alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} ${action}ed successfully!`);
      //document.getElementById(modalId).style.display = 'none'; // Close modal
      closeModal(modalId); // Close modal
      refreshEvents(); // Refresh the UI
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error(`Error saving ${entity}:`, error);
    alert('An unexpected error occurred.');
  }
}


// Delete Functionality
export async function deleteEntity(entity, id) {

  try {
    const response = await fetch(`UTSevents.php`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ entity, id }),
    });

    const result = await response.json();
    if (result.success) {
      alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully!`);
      refreshEvents(); // Refresh the UI
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error(`Error deleting ${entity}:`, error);
    alert('An unexpected error occurred.');
  }
}


// Close Modal Utility
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
  modal.querySelector('form').reset(); // Reset form inputs
}

document.addEventListener('DOMContentLoaded', () => {
    // Event Modal
    const newEventButton = document.getElementById('newEventButton');
    if (newEventButton) {
      newEventButton.addEventListener('click', () => {
        openEventModal(); // Open Event Modal
      });
    }
  
    // Assignment Modal
    const newAssignmentButton = document.getElementById('newAssignmentButton');
    if (newAssignmentButton) {
      newAssignmentButton.addEventListener('click', () => {
        openModal('assignment', 'assignmentModal'); // Open Assignment Modal
      });
    }
  
    // To-Do Modal
    const newToDoButton = document.getElementById('newToDoButton');
    if (newToDoButton) {
      newToDoButton.addEventListener('click', () => {
        openModal('toDo', 'toDoModal'); // Open To-Do Modal
      });
    }
  
    // Close Buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const modalId = e.target.closest('.creationModal').id;
        closeModal(modalId); // Close the specific modal
      });
    });

    // Save Buttons Event Handlers
    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', (e) => saveEntity(e, 'assignment', 'assignmentModal'));
    }

    const toDoForm = document.getElementById('toDoForm');
    if (toDoForm) {
        toDoForm.addEventListener('submit', (e) => saveEntity(e, 'toDo', 'toDoModal'));
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => saveEntity(e, 'event', 'eventModal'));
    }

    const assignmentContainer = document.getElementById('assignmentContainer');
    if (assignmentContainer) {
        populateContainer('assignmentContainer', fetchAssignments, 'assignment');
    }

    const toDoContainer = document.getElementById('toDoContainer');
    if (toDoContainer) {
        populateContainer('toDoContainer', fetchToDos, 'toDo');
    }


});