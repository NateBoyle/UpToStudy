import { populateCourseDropdown } from './UTSgoalsPage.js'; // Ensure the fetchCourses utility is available

export async function openGoalSetModal(id = null) {
    const modal = document.getElementById('goalSetModal');
    const form = modal.querySelector('form');
    const modalTitle = modal.querySelector('h2');
    const submitButton = modal.querySelector('#saveGoalSetBtn');
    const deleteButton = modal.querySelector('#deleteSetButton');
    const containerRadios = form.querySelectorAll('[name="container"]');

    form.reset(); // Clear all fields
    delete form.dataset.id; // Remove stored ID

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

    modal.style.display = 'flex'; // Show modal
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

    // Entity-Specific Validation
    if (entity === 'goalSet') {
        const courseId = form.querySelector('[name="course_id"]');
        if (!courseId.value) {
            errors.push('Course selection is required.');
            courseId.style.border = '1px solid red';
            valid = false;
        }
    } else if (entity === 'goal') {
        const goalSetId = form.querySelector('[name="goal_set_id"]');
        const dueDate = form.querySelector('[name="due_date"]');

        if (!goalSetId.value) {
            errors.push('Goal set is required.');
            goalSetId.style.border = '1px solid red';
            valid = false;
        }
        if (!dueDate.value) {
            errors.push('Due date is required.');
            dueDate.style.border = '1px solid red';
            valid = false;
        }
    }

    if (!valid) alert(errors.join('\n'));
    return valid;
}

async function saveEntity(event, entity, modalId) {
    event.preventDefault();
    const form = event.target;

    if (!validateFields(form, entity)) return; // Stop if validation fails

    const id = form.dataset.id; // Get existing ID (if editing)
    const data = {};
    [...form.elements].forEach((input) => {
        if (input.name) data[input.name] = input.value;
    });

    const action = id ? 'edit' : 'add';
    if (id) data.id = id;

    try {
        const response = await fetch('UTSgoals.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ entity, action, ...data }),
        });

        const result = await response.json();
        if (result.success) {
            alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} ${action}ed successfully!`);
            closeModal(modalId);
            refreshGoals(); // Reload UI
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error(`Error saving ${entity}:`, error);
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



document.addEventListener("DOMContentLoaded", () => {

    // Goal Set Modal
    const newGoalSetButton = document.getElementById('newGoalSetButton');
    if (newGoalSetButton) {
        newGoalSetButton.addEventListener('click', () => openModal('goalSet', 'goalSetModal'));
    }

    // New Goal Buttons for Specific Goal Sets
    for (let i = 1; i <= 3; i++) {
        const newGoalButton = document.getElementById(`newGoalButton${i}`);
        if (newGoalButton) {
            newGoalButton.addEventListener('click', () => openGoalModalForSet(i));
        }
    }
    
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