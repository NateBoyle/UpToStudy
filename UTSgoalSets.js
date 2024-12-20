import { populateCourseDropdown } from './UTSgoalsPage.js'; 
import { fetchGoalSets, fetchGoals } from './UTSutils.js'; // Ensure the fetchs utilities is available

export async function openGoalModal(id = null, goalSetId = null) {
    const modal = document.getElementById('goalModal');
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = modal.querySelector('#saveGoalBtn');
    const deleteButton = modal.querySelector('#deleteGoalButton');

    form.reset(); // Clear all fields
    delete form.dataset.id; // Remove stored ID
    delete form.dataset.goalSetId; // Remove stored Goal Set ID

    // Attach the goal set ID to the form if provided
    if (goalSetId) {
        form.dataset.goalSetId = goalSetId;
    }

    if (id) {
        // Fetch goal data
        const response = await fetch(`UTSgoalSets.php?action=fetchGoal&id=${id}`);
        const goal = await response.json();

        if (!goal.success) {
            alert(`Error: ${goal.message}`);
            return;
        }

        // Populate form with fetched data
        Object.keys(goal.data).forEach((key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = goal.data[key];
        });

        // Update modal for editing
        form.dataset.id = id;
        modalTitle.textContent = 'Edit Goal';
        submitButton.textContent = 'Save Goal';
        deleteButton.style.display = 'block';
        deleteButton.onclick = async () => {
            if (confirm('Are you sure you want to delete this Goal?')) {
                await deleteEntity('goal', id);
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


export async function openGoalSetModal(id = null) {
    const modal = document.getElementById('goalSetModal');
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = modal.querySelector('#saveGoalSetBtn');
    const deleteButton = modal.querySelector('#deleteSetButton');
    const containerRadios = form.querySelectorAll('[name="container"]');

    form.reset(); // Clear all fields
    delete form.dataset.id; // Remove stored ID

    // Populate the course dropdown
    await populateCourseDropdown();

    if (id) {
        // Fetch goal set data
        const response = await fetch(`UTSgoals.php?action=fetchGoalSet&id=${id}`);
        const goalSet = await response.json();

        if (!goalSet.success) {
            alert(`Error: ${goalSet.message}`);
            return;
        }

        // Populate form with fetched data
        Object.keys(goalSet.data).forEach((key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = goalSet.data[key];
        });

        // Check the container radio button
        containerRadios.forEach((radio) => {
            if (radio.value === goalSet.data.container) radio.checked = true;
        });

        // Update modal for editing
        form.dataset.id = id;
        modalTitle.textContent = 'Edit Goal Set';
        submitButton.textContent = 'Save Set';
        deleteButton.style.display = 'block';
        deleteButton.onclick = async () => {
            if (confirm('Are you sure you want to delete this Goal Set?')) {
                await deleteEntity('goalSet', id);
                modal.style.display = 'none';
            }
        };
    } else {
        // Prepare modal for creating a new goal set
        modalTitle.textContent = 'New Goal Set';
        submitButton.textContent = 'Add Set';
        deleteButton.style.display = 'none';
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
    console.log('Form Data:', new FormData(form));
    console.log('Entity:', entity);
    console.log('Modal ID:', modalId);

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

async function deleteEntity(entity, id) {
    try {
        const response = await fetch('UTSgoals.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ entity, id }),
        });

        const result = await response.json();
        if (result.success) {
            alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully!`);
            refreshGoals(); // Reload UI
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error deleting ${entity}:`, error);
        alert('An unexpected error occurred.');
    }
}

async function completeGoal(id) {
    try {
        const response = await fetch('UTSgoals.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ entity: 'goal', action: 'complete', id }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Goal marked as complete!');
            refreshGoals();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error completing goal:`, error);
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
            console.log(`Goal set id for list: ${goalSetId}`);

            // Skip if there's no associated goal set
            if (!goalSetId) {
                goalList.innerHTML = '<liclass="empty-message">No goals yet.</li>';
                continue;
            }

            /// Fetch goals for the current goal set
            const goals = await fetchGoals(null, goalSetId);

            console.log("Goals Response:", goals); // Log the result

            // Clear existing content and handle response
            goalList.innerHTML = '';

            // Handle response
            if (goals.length > 0) {

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
                    listItem.addEventListener('click', (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        openGoalModal(goal.id, goalSetId); // Open goal modal with the goal and goal set ID
                    });

                    // Append to the goal list
                    goalList.appendChild(listItem);
                });
            } else {
                goalList.innerHTML = '<li class="empty-message">No goals yet.</li>';
            }
        }
    } catch (error) {
        console.error('Error populating goal lists:', error);
    }
}

async function populateGoalSets() {
    try {
        // Fetch all goal sets using the utility function
        const goalSets = await fetchGoalSets();
        

        // Loop through each container (1, 2, 3)
        for (let i = 1; i <= 3; i++) {
            const goalSetTitle = document.getElementById(`goalSetTitle${i}`);
            const goalSetList = document.getElementById(`goalSet${i}`);
            const newGoalButton = document.getElementById(`newGoalButton${i}`);

            // Find the goal set for this container
            const goalSet = goalSets.find((set) => set.container == i);

            if (goalSet) {
                // Populate the title and set data attributes
                goalSetTitle.textContent = goalSet.title;
                goalSetList.setAttribute('data-set-id', goalSet.id);

                // Add event listener for the "Add Goal" button
                if (newGoalButton) {
                    newGoalButton.addEventListener('click', () => openGoalModal(null, goalSet.id));
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

    

    populateGoalSets();
    
    /*// Open Goal Creation Modal
    document.getElementById('setGoalButton').addEventListener('click', async () => {
        const modal = document.getElementById('goalCreationModal');
        modal.style.display = 'flex'; // Show the modal (flex aligns content in the center)

        // Populate the course dropdown
        await populateCourseDropdown();

        // Close Goal Creation Modal
        document.getElementById('closeGoalCreation').addEventListener('click', () => {
            const modal = document.getElementById('goalCreationModal');
            modal.style.display = 'none'; // Hide the modal
        });
    });*/
});