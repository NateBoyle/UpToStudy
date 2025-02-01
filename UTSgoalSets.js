//import { populateCourseDropdown } from './UTSgoalsPage.js'; 
import { fetchGoalSets, fetchGoals, fetchCourses, fetchSemesters } from './UTSutils.js'; // Ensure the fetchs utilities is available

let currentSemesterId;

export async function fetchAndSetSemesterName() {
    try {
        const currentDate = new Date(); // Format as YYYY-MM-DD
        const semesters = await fetchSemesters(currentDate); // Pass the current date

        // Retrieve the first (and only) semester in the returned list
        const currentSemester = semesters[0];

        const semesterNameElement = document.getElementById('semesterName');

        if (currentSemester) {
            semesterNameElement.textContent = currentSemester.name;
            currentSemesterId = currentSemester.semester_id; // Assign semester_id to global variable
        } else {
            semesterNameElement.textContent = "No Current Semester";
            currentSemesterId = null; // Reset if no current semester
        }

    } catch (error) {
        console.error("Error fetching semester:", error);
        document.getElementById('semesterName').textContent = "Error Loading Semester";
        currentSemesterId = null; // Reset on error
    }
}

// Populate Course Dropdown
async function populateCourseDropdown() {
    const dropdown = document.getElementById('goalCourse');
    dropdown.innerHTML = '<option value="" disabled selected>Select Course (optional)</option>'; // Clear previous options

    try {
        const courses = await fetchCourses(currentSemesterId); // Fetch courses from the backend
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.prefix} ${course.course_number} - ${course.name}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

async function populateGoalSetDropdown() {
    // Get the dropdown element
    const dropdown = document.getElementById("goalSetDropdown");
    
    // Clear existing options
    dropdown.innerHTML = "";

    // Add "No Set" option
    let noSetOption = document.createElement('option');
    noSetOption.value = '0'; // Assuming 0 or '0' as the value for no set
    noSetOption.text = 'No Set';
    dropdown.appendChild(noSetOption);

    try {
        // Fetch goal sets
        const goalSets = await fetchGoalSets();

        // Check if goal sets are available
        if (goalSets.length === 0) {
            const noOptionsMessage = document.createElement("option");
            noOptionsMessage.value = "";
            noOptionsMessage.textContent = "No goal sets available";
            noOptionsMessage.disabled = true;
            dropdown.appendChild(noOptionsMessage);
            return;
        }

        // Populate the dropdown with new options
        goalSets.forEach(goalSet => {
            const option = document.createElement("option");
            option.value = goalSet.id; // Use the id as the value
            option.textContent = goalSet.title; // Display the title in the dropdown
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating goal set dropdown:", error);
        const errorMessage = document.createElement("option");
        errorMessage.value = "";
        errorMessage.textContent = "Error loading goal sets";
        errorMessage.disabled = true;
        dropdown.appendChild(errorMessage);
    }
}

async function openChangeSetModal(container) {
    // Get modal and buttons
    const modal = document.getElementById("changeSetModal");
    const confirmButton = document.getElementById("confirmChangeSet");
    const closeButton = document.getElementById("closeChangeSetModal");

    // Populate the dropdown
    await populateGoalSetDropdown();

    // Confirm button handler
    confirmButton.onclick = async () => {
        const dropdown = document.getElementById("goalSetDropdown");
        let selectedGoalSet = dropdown.value; // Get the selected goal set

        // Handle 'No Set'
        if (selectedGoalSet === '0') {
            selectedGoalSet = null; // or 'null' if your backend expects a string
        }

        const currentGoalSetId = document.getElementById(`goalSet${container}`).getAttribute('data-set-id'); // Retrieve current ID

        
        

        // Define the entity and action
        const entity = 'goalSet';
        const action = 'changeGoalSet';

        

        try {

            //console.log(`Reassigning container ${container} to ${entity} ${selectedGoalSet} and unassigning from ${currentGoalSetId}`);

            // Construct the request payload
            const data = {
                currentGoalSetId: currentGoalSetId,
                containerId: container,
                goalSetId: selectedGoalSet
            };

            // Make the backend call
            const response = await fetch('UTSgoalSets.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ entity, action, ...data }),
            });

            const result = await response.json();

            if (result.success) {
                //console.log('Reassignment successful');
                alert('Container reassignment successful'); // Display success message
                modal.style.display = "none"; // Close the modal
                window.location.reload(); // Refresh the page
            } else {
                console.error('Reassignment failed:', result.message);
                alert('Failed to reassign the goal set. Please try again.');
            }
        } catch (error) {
            console.error('Error during reassignment:', error);
            alert('An error occurred. Please check your connection and try again.');
        }
    };

    // Close button handler
    closeButton.onclick = () => {
        modal.style.display = "none"; // Close the modal
    };

    // Change modal display to visible
    modal.style.display = "flex";

}


export async function openGoalModal(goal = null, goalSetId = null) {

    //console.log(`openGoalModal called`);

    const modal = document.getElementById('goalModal');
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = modal.querySelector('#saveGoalBtn');
    const completeButton = modal.querySelector('#completeGoalButton');
    const deleteButton = modal.querySelector('#deleteGoalButton');

    form.reset(); // Clear all fields
    delete form.dataset.id; // Remove stored ID
    delete form.dataset.goalSetId; // Remove stored Goal Set ID

    // Attach the goal set ID to the form if provided
    if (goalSetId) {
        form.dataset.goalSetId = goalSetId;
    }

    

    if (goal) {
        
        // Update modal for editing
        form.dataset.id = goal.id;
        modalTitle.textContent = 'Edit Goal';

        // Populate form fields with goal data
        const titleField = form.querySelector('[name="title"]');
        const descriptionField = form.querySelector('[name="description"]');
        const dueDateField = form.querySelector('[name="due_date"]');

        if (titleField) titleField.value = goal.title || '';
        if (descriptionField) descriptionField.value = goal.description || '';
        if (dueDateField) dueDateField.value = goal.due_date || '';

        submitButton.textContent = 'Save Goal';
        completeButton.style.display = 'block';
        completeButton.onclick = async () => {
            if (confirm('Are you sure you want to complete this Goal?')) {
                await completeGoal(goal.id);
                closeModal('goalModal');
                populateGoalSets(); // Reload UI
            }
        };

        deleteButton.style.display = 'block';
        deleteButton.onclick = async () => {
            if (confirm('Are you sure you want to delete this Goal?')) {
                await deleteEntity('goal', goal.id);
                closeModal('goalModal');
            }
        };
    } else {
        // Prepare modal for creating a new goal
        modalTitle.textContent = 'New Goal';
        submitButton.textContent = 'Add Goal';
        deleteButton.style.display = 'none';
    }

    // Add event listener for the submit button
    submitButton.onclick = async (e) => {
        e.preventDefault(); // Prevent default behavior
        await saveEntity({ target: form, preventDefault: () => {} }, 'goal', 'goalModal');
    };

    document.getElementById('closeGoalModal').addEventListener('click', () => {
        closeModal('goalModal'); // Hide the modal
    });

    modal.style.display = 'flex'; // Show modal
}

function updateGoalSetProgress(totalGoals, completedGoals) {
    
    const progressBar = document.getElementById('goalProgressBar');
    const progressText = document.getElementById('goalProgressText');

    

    if (totalGoals === 0) {
        progressBar.style.width = '0%';
        progressText.textContent = '0 / 0 Goals Completed';
    } else {
        const progressPercentage = (completedGoals / totalGoals) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${completedGoals} / ${totalGoals} Goals Completed`;
    }
}

export async function openGoalSetModal(goalSet = null) {
    const modal = document.getElementById('goalSetModal');
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    
    const courseDropdown = form.querySelector('[name="course_id"]');
    const colorDropdown = form.querySelector('[name="color"]');
    const containerRadios = form.querySelectorAll('[name="container"]');
    const progressContainer = document.querySelector('.goal-progress-container');

    const submitButton = modal.querySelector('#saveGoalSetBtn');
    const deleteButton = modal.querySelector('#deleteGoalSetButton');

    form.reset(); // Clear all fields
    delete form.dataset.id; // Remove stored ID

    // Populate the course dropdown
    await populateCourseDropdown();

    if (goalSet) {
        // Use provided goalSet object directly
        Object.keys(goalSet).forEach((key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = goalSet[key];
        });

        // Handle course dropdown default
        if (!goalSet.course_id || goalSet.course_id === '') {
            courseDropdown.value = ''; // Reset to default
        }

        // Handle color dropdown default
        if (!goalSet.color || goalSet.color === '') {
            colorDropdown.value = ''; // Reset to default
        }

        // Check the container radio button
        containerRadios.forEach((radio) => {
            if (String(radio.value) === String(goalSet.container)) {
                radio.checked = true;
                //console.log(`Radio button with value ${radio.value} is checked.`);
            } else {
                //console.log(`Radio button with value ${radio.value} is NOT checked.`);
            }
        });

        // Update progress bar
        updateGoalSetProgress(goalSet.number_of_goals, goalSet.goals_completed);

        // Update modal for editing
        form.dataset.id = goalSet.id;
        modalTitle.textContent = 'Edit Goal Set';

        progressContainer.style.display = 'flex';

        submitButton.textContent = 'Save Set';
        deleteButton.style.display = 'block';
        deleteButton.onclick = async () => {
            if (confirm('Are you sure you want to delete this Goal Set?')) {
                await deleteEntity('goalSet', goalSet.id);
                modal.style.display = 'none';
            }
        };

    } else {
        // Prepare modal for creating a new goal set
        modalTitle.textContent = 'New Goal Set';
        submitButton.textContent = 'Add Set';
        deleteButton.style.display = 'none';
        progressContainer.style.display = 'none';
    }

    // Add event listener for the submit button
    submitButton.onclick = async (e) => {
        e.preventDefault(); // Prevent default behavior
        await saveEntity({ target: form, preventDefault: () => {} }, 'goalSet', 'goalSetModal');
    };

    document.getElementById('closeGoalSetModal').addEventListener('click', () => {
        closeModal('goalSetModal'); // Hide the modal
    });

    modal.style.display = 'flex'; // Show modal
}

// Close Modal Utility
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    modal.querySelector('form').reset(); // Reset form inputs
  }



function validateFields(form, entity) {
    let valid = true;
    const errors = [];

    // Reset previous highlights
    [...form.elements].forEach((input) => {
        if (input.name) input.style.border = '';
    });

    // Common Validation: Title
    const title = form.querySelector('[name="title"]');
    if (!title.value) {
        errors.push('Title is required.');
        title.style.border = '1px solid red';
        valid = false;
    }

    if (!valid) alert(errors.join('\n'));
    return valid;
}

async function saveEntity(event, entity, modalId) {
    event.preventDefault();
    const form = event.target;

    // Log the form data for debugging
    //console.log('Form Data:', new FormData(form));
    //console.log('Entity:', entity);
    //console.log('Modal ID:', modalId);

    if (!validateFields(form, entity)) return; // Stop if validation fails

    const id = form.dataset.id; // Get existing ID (if editing)
    const data = {};
    [...form.elements].forEach((input) => {
        if (input.name) {
            if (input.type === 'radio' && input.checked) {
                // Handle radio buttons for 'container'
                data[input.name] = input.value;
            } else if (input.type !== 'radio') {
                data[input.name] = input.value;
            }
        }
    });

    // If entity is a goal, retrieve its goal set ID from the form or container
    if (entity === 'goal') {
        const goalSetId = form.dataset.goalSetId || document.querySelector(`[data-set-id="${form.dataset.goalSetId}"]`)?.getAttribute('data-set-id');
        if (!goalSetId) {
            alert('No goal set ID found. Cannot save goal.');
            return;
        }
        data.goal_set_id = goalSetId; // Add goal set ID to the data object
    }

    const action = id ? 'edit' : 'add';
    if (id) data.id = id;

    try {
        const response = await fetch('UTSgoalSets.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ entity, action, ...data }),
        });

        const result = await response.json();
        if (result.success) {
            alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} ${action}ed successfully!`);
            closeModal(modalId);
            populateGoalSets(); // Reload UI
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error ${action}ing ${entity}:`, error);
        alert('An unexpected error occurred.');
    }
}

async function completeGoal(id) {
    //console.log(`Attempting to complete goal with id: ${id}`);
    try {
        const response = await fetch('UTSgoalSets.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ entity: 'goal', action: 'complete', id }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Goal marked as complete!');
            
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error completing goal:`, error);
        alert('An unexpected error occurred.');
    }
}

async function deleteEntity(entity, id) {
    try {
        const response = await fetch('UTSgoalSets.php', {
            method: 'POST', // Use POST to send the action field
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'delete', // Specify the action as 'delete'
                entity,           // Include the entity (e.g., goalSet or goal)
                id,               // Include the ID of the item to delete
            }),
        });

        const result = await response.json();
        if (result.success) {
            alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully!`);
            window.location.reload(); // Reload UI
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error deleting ${entity}:`, error);
        alert('An unexpected error occurred.');
    }
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

async function populateGoalLists() {
    try {
        // Select all goal lists
        const goalLists = document.querySelectorAll('.goal-list');

        for (const goalList of goalLists) {
            const goalSetId = goalList.getAttribute('data-set-id');
            //console.log(`Goal set id for list: ${goalSetId}`);

            // Skip if there's no associated goal set
            if (!goalSetId) {
                goalList.innerHTML = '<liclass="empty-message">No goals yet.</li>';
                continue;
            }

            /// Fetch goals for the current goal set
            const goals = await fetchGoals(null, goalSetId);

            //console.log("Goals Response:", goals); // Log the result

            // Clear existing content and handle response
            goalList.innerHTML = '';

            // Handle response
            if (goals.length > 0) {

                // Sort the goals array
                goals.sort((a, b) => {
                    // Sort by completion status: incomplete (0) before complete (1)
                    if (a.is_completed !== b.is_completed) {
                        return a.is_completed - b.is_completed;
                    }

                    // Sort by due date (null values go last)
                    const dateA = a.due_date ? new Date(a.due_date) : null;
                    const dateB = b.due_date ? new Date(b.due_date) : null;

                    if (dateA === null && dateB === null) {
                        return 0; // Both null
                    } else if (dateA === null) {
                        return 1; // `a` has no due date, so it goes after `b`
                    } else if (dateB === null) {
                        return -1; // `b` has no due date, so it goes after `a`
                    } else {
                        return dateB - dateA; // Descending order for due dates
                    }
                });

                goals.forEach(goal => {

                    // Combine due_date into a Date object, if present
                    const dueDate = goal.due_date ? new Date(goal.due_date) : null;

                    // Determine if the goal is overdue
                    const isOverdue = dueDate && dueDate < new Date() && !goal.is_completed;

                    /// Create list item
                    const listItem = document.createElement('li');
                    listItem.className = 'list-item';
                    listItem.setAttribute('data-id', goal.id); // Store unique ID
                    listItem.setAttribute('data-type', 'goal'); // Store type for event handling
                    listItem.style.backgroundColor = goal.color || '#3FA631'; // Apply color or default background

                    // Build content conditionally
                    let detailsText = '';
                    if (goal.is_completed) {
                        listItem.style.color = 'white';
                        detailsText = 'COMPLETED';
                    } else if (isOverdue) {
                        listItem.style.backgroundColor = 'black';
                        listItem.style.border = '2px solid red';
                        listItem.style.color = 'red';
                        detailsText = `OVERDUE${dueDate ? `: ${formatDate(goal.due_date)}` : ''}`;
                    } else {
                        detailsText = dueDate ? `Due: ${formatDate(goal.due_date)}` : '';
                    }

                    // Populate content
                    listItem.innerHTML = `
                        <span class="text">${goal.title}</span>
                        <span class="details">${detailsText}</span>
                    `;

                    // Add click event listener to open modal
                    listItem.addEventListener('click', () => {
                        //const id = e.currentTarget.getAttribute('data-id');
                        //console.log(`Goal id: ${goal.id}, goalsetid: ${goalSetId}`);
                        openGoalModal(goal, goalSetId); // Open goal modal with the goal and goal set ID
                    });

                    // Append to the goal list
                    goalList.appendChild(listItem);
                });
            } else {
                goalList.innerHTML = '<liclass="empty-message">No goals yet.</li>';
            }
        }
    } catch (error) {
        console.error('Error populating goal lists:', error);
    }
}

export async function populateGoalSets() {
    try {
        // Fetch all goal sets using the utility function
        const goalSets = await fetchGoalSets();
        

        // Loop through each container (1, 2, 3)
        for (let i = 1; i <= 3; i++) {
            const goalSetTitle = document.getElementById(`goalSetTitle${i}`);
            const goalSetList = document.getElementById(`goalSet${i}`);
            const newGoalButton = document.getElementById(`newGoalButton${i}`);
            const editGoalSetButton = document.getElementById(`editGoalSetButton${i}`);

            // Find the goal set for this container
            const goalSet = goalSets.find((set) => set.container == i);

            

            if (goalSet) {

                //console.log(`GoalSetID: ${goalSet.id}, set container: ${goalSet.container} i: ${i}`)
                
                // Populate the title and set data attributes
                goalSetTitle.textContent = goalSet.title;
                goalSetList.setAttribute('data-set-id', goalSet.id);

                // Add event listener for the "Add Goal" button
                if (newGoalButton) {
                    newGoalButton.addEventListener('click', () => openGoalModal(null, goalSet.id));
                }

                // Add event listener for the "Add Goal" button
                if (editGoalSetButton) {
                    editGoalSetButton.addEventListener('click', () => openGoalSetModal(goalSet));
                }

            } else {
                // No goal set in this container
                goalSetTitle.textContent = 'No goal set for this container';
                goalSetList.removeAttribute('data-set-id');

                // Add event listener for the "Add Goal" button with alert
                if (newGoalButton) {
                    newGoalButton.addEventListener('click', () => {
                        alert('No set to add goal to.');
                    });
                }
            }
        }

        await populateGoalLists();
    } catch (error) {
        console.error("Error fetching goal sets:", error);
    }
}



document.addEventListener("DOMContentLoaded", () => {

    // Goal Set Modal
    const newGoalSetButton = document.getElementById('newGoalSetButton');
    if (newGoalSetButton) {
        newGoalSetButton.addEventListener('click', () => openGoalSetModal());
    }

    if (document.getElementById("changeSetButton1")) {
        document.getElementById("changeSetButton1").addEventListener("click", () => openChangeSetModal(1));
    }
    
    if (document.getElementById("changeSetButton2")) {
        document.getElementById("changeSetButton2").addEventListener("click", () => openChangeSetModal(2));
    }
    
    if (document.getElementById("changeSetButton3")) {
        document.getElementById("changeSetButton3").addEventListener("click", () => openChangeSetModal(3));
    }

});