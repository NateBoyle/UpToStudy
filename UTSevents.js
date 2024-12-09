import { fetchCourses, fetchAssignments, fetchToDos } from './UTSutils.js'; // Import the fetchCourses utility

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

// Date Formatter
function formatDate(dateString) {
    const date = new Date(dateString); // Convert the date string to a Date object
    const day = String(date.getDate()).padStart(2, '0'); // Get day, padded to 2 digits
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month, padded to 2 digits
    const year = date.getFullYear(); // Get year
    return `${day}/${month}/${year}`; // Return formatted date
}

// Populate Containers
async function populateContainer(containerId, fetchFunction, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing content

    try {
        const items = await fetchFunction(); // Fetch data (assignments or to-dos)

        if (items.length === 0) {
            container.innerHTML = `<p class="empty-message">No ${type}s available.</p>`;
            return;
        }

        // Sort items by due_date in descending order (most recent first)
        items.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

        for (const item of items) {
            const itemId = type === 'assignment' ? item.assignment_id : item.to_do_id;

            // Default background: let CSS handle it if no course color is found
            let courseColor = null;

            // Fetch course color if course_id exists
            if (item.course_id) {
                try {
                    const course = await fetchCourses(null, item.course_id); // Fetch course by course_id
                    if (course.length > 0) {
                        courseColor = course[0].color; // Extract the course color
                    }
                } catch (error) {
                    console.error(`Error fetching course for course ID ${item.course_id}:`, error);
                }
            }

            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            if (courseColor) {
                listItem.style.backgroundColor = courseColor; // Apply the fetched color
            } // Else, let the CSS default background color take over

            listItem.setAttribute('data-id', itemId); // Store unique ID
            listItem.setAttribute('data-type', type); // Store type (assignment or to-do)
            listItem.innerHTML = `
                <span class="text">${item.title}</span>
                <span class="details">Due: ${formatDate(item.due_date)}</span>
            `;

            // Add click event listener
            listItem.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const clickedType = e.currentTarget.getAttribute('data-type');
                console.log(`Clicked ${clickedType} with ID: ${id}`);
            });

            container.appendChild(listItem);
        }
    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        container.innerHTML = `<p class="error-message">Failed to load ${type}s. Please try again later.</p>`;
    }
}


// Add/Update Modal Workflow
async function openModal(entity, modalId, id = null) {
  const modal = document.getElementById(modalId);
  const form = modal.querySelector('form');

  // Console log to display entity, modalId, and id
  console.log(`From openModal - Entity: ${entity}, Modal ID: ${modalId}, ID: ${id || 'New Entity'}`);

  form.reset(); // Clear previous values
  delete form.dataset.id; // Clear stored ID for new records
  await populateCourseDropdown(modalId); // Populate courses
  
    if (id) {
        // Fetch data for editing
        try {
            let result;
            if (entity === 'assignment') {
                result = await fetchAssignment(id);
            } else if (entity === 'todo') {
                result = await fetchToDo(id);
            } else if (entity === 'event') {
                result = await fetchEvent(id);
            }
        
            if (result.success) {
                // Populate form with fetched data
                Object.keys(result.data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = result.data[key];
                });
                form.dataset.id = id; // Store ID for editing
            } else {
                alert(`Error fetching ${entity}: ${result.message}`);
            }
        } catch (error) {
            console.error(`Error fetching ${entity}:`, error);
            alert('An unexpected error occurred while fetching the data.');
        }
    }

  modal.style.display = 'flex'; // Show modal
}

// Form Validation
function validateFields(form, entity) {
    let valid = true; // Assume form is valid initially
    const errors = []; // Collect error messages

    // Console log to display entity, modalId, and id
    console.log(`From validateFields - Form: ${form}, Entity: ${entity}`);
  
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
    } else if (entity === 'todo') {
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
  
    const action = id ? 'edit' : 'add';
    if (id) data.id = id;
  
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
        //refreshEvents(); // Refresh the UI
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
  if (!confirm(`Are you sure you want to delete this ${entity}?`)) return;

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
        openModal('todo', 'toDoModal'); // Open To-Do Modal
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
    document.getElementById('assignmentForm').addEventListener('submit', (e) => saveEntity(e, 'assignment', 'assignmentModal'));
    document.getElementById('toDoForm').addEventListener('submit', (e) => saveEntity(e, 'todo', 'toDoModal'));
    document.getElementById('eventForm').addEventListener('submit', (e) => saveEntity(e, 'event', 'eventModal'));

    populateContainer('assignmentContainer', fetchAssignments, 'assignment');
    populateContainer('toDoContainer', fetchToDos, 'to-do');

});