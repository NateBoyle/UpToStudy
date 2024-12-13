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
        //console.log(` from UTSevents ContainerId: ${containerId}`);
        items = await fetchFunction(); // Fetch data (assignments or to-dos)
      }  

        if (items.length === 0) {
            container.innerHTML = `<p class="empty-message">No ${type}s available.</p>`;
            return;
        }

        // Sort items by due_date in descending order (most recent first)
        items.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

        for (const item of items) {
            const itemId = type === 'assignment' ? item.assignment_id : item.to_do_id;

            // Combine due_date and due_time into a single Date object
            const dueDateTime = new Date(`${item.due_date}T${item.due_time || '00:00'}`);

            // Determine if the item is overdue
            const isOverdue = dueDateTime < todaysDate && !item.is_completed;

            const listItem = document.createElement('div');
            listItem.className = 'list-item';

            listItem.setAttribute('data-id', itemId); // Store unique ID
            listItem.setAttribute('data-type', type); // Store type (assignment or to-do)
            listItem.style.backgroundColor = item.color; // Apply the color if it has one
            listItem.innerHTML = `
                <span class="text">${item.title}</span>
                <span class="details">Due: ${formatDate(item.due_date)}</span>
            `;

            // Styling and content for completed items
            if (item.is_completed) {
              //listItem.style.backgroundColor = '#5DD970'; // Set a green background for completed
              listItem.style.color = 'white'; // Set text color to white
              listItem.innerHTML = `
                  <span class="text">${item.title}</span>
                  <span class="details">COMPLETED</span>
              `;
            }
            // Apply overdue styles
            else if (isOverdue) {
              listItem.style.backgroundColor = 'black'; // Set background to black
              listItem.style.border = '2px solid red'; // Set border to red
              listItem.style.color = 'red'; // Set font color to red
              listItem.innerHTML = `
                <span class="text">${item.title}</span>
                <span class="details">OVERDUE: ${formatDate(item.due_date)}</span>
            `;
            } else {
              if (courseColor) {
                  listItem.style.backgroundColor = item.color; // Apply the fetched color
              } // Else, let the CSS default background color take over
            }

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
  //console.log(`Type: ${type}, Id: ${id}`);
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
      //console.log(`Type: ${type}, Id: ${id}, Item: ${item}`);
      openModal(type, `${type}Modal`, item); // Modal ID should match the type (e.g., assignmentModal)
    }

  } catch (error) {
      console.error(`Error handling event click for type: ${type}, ID: ${id}`, error);
      alert('Failed to load event details. Please try again.');
  }
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
  const modalTitle = modal.querySelector('h2'); // Select the first <h2> within the modal
  
  if (item) {
    // Populate form fields from the item object
    Object.keys(item).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
          // Check if it's the course dropdown
          if (key === 'course_id' && !item[key]) {
              input.value = ''; // Reset to default if no course is associated
          } else {
              input.value = item[key]; // Populate other fields as usual
          }
        }
    });
    form.dataset.id = item.id; // Store the item ID for context
    //console.log(`Open Modal with ID: ${item.id}`);

    // Edit submit button within the specific form
    submitButton.textContent = 'Save'; // Updates the button text

    // Show Complete and Delete buttons
    if (entity != 'event') {
      const completeButton = modal.querySelector('#completeButton'); // Reference the button
      completeButton.style.display = 'block';
      completeButton.onclick = (e) => {
        if (confirm(`Are you sure you want to complete ${item.title}?`)) {
          console.log(`Completing item: ${item.id}`);
          completeEntity(entity, item.id)
        }
      };
    }

    const deleteButton = modal.querySelector('#deleteButton'); // Reference the button
    deleteButton.style.display = 'block';

    // Set up Delete button event listener
    deleteButton.onclick = () => {
      if (confirm(`Are you sure you want to delete this ${entity.charAt(0).toUpperCase() + entity.slice(1)}?`)) {
        deleteEntity(entity, item.id); // Call deleteEntity directly
      }
    };

    // Edit title within the specific form
    if (entity === "assignment") {
      if (!item.title) {
        modalTitle.textContent = 'Add Assignment'; // Change the title
      } else {
        modalTitle.textContent = 'Edit Assignment'; // Change the title
      }
      
    } else if (entity === "toDo") {
      modalTitle.textContent = 'Edit To-Do'; // Change the title
    } else {
      modalTitle.textContent = 'Edit Event'; // Change the title
    }

  } else {

    modal.querySelector('#completeButton').style.display = 'none';
    modal.querySelector('#deleteButton').style.display = 'none';

    // Edit submit button and title within the specific form
    if (entity === "assignment") {
      modalTitle.textContent = 'New Assignment'; // Change the title
      submitButton.textContent = 'Add Assignment';
    } else if (entity === "toDo") {
      modalTitle.textContent = 'New To-Do'; // Change the title
      submitButton.textContent = 'Create To-Do';
    } else {
      modalTitle.textContent = 'New Event'; // Change the title
      submitButton.textContent = 'Save Event';
    }
  }

  modal.style.display = 'flex'; // Show modal
}

// Form Validation
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
    const points = form.querySelector('[name="points"]');

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
    if (!points.value || isNaN(points.value) || Number(points.value) <= 0) {
      errors.push('Points must be a positive number.');
      points.style.border = '1px solid red';
      valid = false;
    }
  } else if (entity === 'toDo') {
    // To-Dos
    const dueDate = form.querySelector('[name="due_date"]');
    const dueTime = form.querySelector('[name="due_time"]');

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
    if (startDate.value && endDate.value && new Date(startDate.value) > new Date(endDate.value)) {
      errors.push('Start date cannot be later than end date.');
      startDate.style.border = '1px solid red';
      endDate.style.border = '1px solid red';
      valid = false;
    }
    if (!allDay.checked) {
      // Validate time only if all-day is not selected
      if (!startTime.value) {
        errors.push('Start time is required.');
        startTime.style.border = '1px solid red';
        valid = false;
      }
      if (!endTime.value) {
        errors.push('End time is required.');
        endTime.style.border = '1px solid red';
        valid = false;
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
  if (!validateFields(form, entity)) {
    return; // Stop submission if validation fails
  }

  const id = form.dataset.id;

  const data = {};
  [...form.elements].forEach(input => {
    if (input.name) data[input.name] = input.value;
  });

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

// Complete Functionality
async function completeEntity(entity, id) {
  try {
      const response = await fetch('UTSevents.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
              action: 'complete',
              entity: entity, // 'assignment' or 'toDo'
              id: id
          })
      });

      const data = await response.json();
      if (data.success) {
          console.log(`${entity} with ID ${id} marked as complete.`);
          refreshEvents(); // Refresh the UI (reload calendar/list)
      } else {
          console.error(`Failed to mark ${entity} with ID ${id} as complete:`, data.message);
      }
  } catch (error) {
      console.error(`Error marking ${entity} with ID ${id} as complete:`, error);
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
        openModal('event', 'eventModal'); // Open Event Modal
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