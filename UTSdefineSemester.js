import { fetchSemesters } from './UTSutils.js';

function doesOverlap(existingSemesters, newStartDate, newEndDate) {
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);

    return existingSemesters.some(semester => {
        const existingStart = new Date(semester.start_date);
        const existingEnd = new Date(semester.end_date);
        return newStart <= existingEnd && newEnd >= existingStart; // Overlap condition
    });
}

async function saveSemester(semesterName, startDate, endDate) {
    try {
        const response = await fetch('UTSdefineSemester.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'save',
                semester_name: semesterName, // Ensure this matches PHP
                start_date: startDate,
                end_date: endDate,
            }),
        });

        const result = await response.json();

        if (result.success) {
            
            return true; // Indicate success
        } else {
            alert(`Error: ${result.message}`);
            console.error('Save failed:', result.message);
            return false; // Indicate failure
        }
    } catch (error) {
        console.error('Error saving semester:', error);
        alert('An error occurred while saving the semester.');
        return false; // Indicate failure
    }
}

async function updateSemester(semester) {
    try {
        console.log('UpdateSemester called with:', semester); // Log the semester object
        const response = await fetch('UTSdefineSemester.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'update', // Specify the action as 'update'
                semester_id: semester.semester_id, // Pass the semester's primary key
                semester_name: document.getElementById('semesterName').value, // Updated name
                start_date: document.getElementById('startDate').value, // Updated start date
                end_date: document.getElementById('endDate').value, // Updated end date
            }),
        });

        const result = await response.json();
        console.log('Server response:', result); // Log the server's response

        if (result.success) {
            return true; // Indicate success
        } else {
            alert(`Error: ${result.message}`);
            console.error('Update failed:', result.message);
            return false; // Indicate failure
        }
    } catch (error) {
        console.error('Error updating semester:', error);
        alert('An error occurred while updating the semester.');
        return false; // Indicate failure
    }
}


function validateSemesterInputs(semesterName, startDate, endDate) {
    if (!semesterName || !startDate || !endDate) {
        alert('Please fill out all fields.');
        return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        alert('Start date cannot be after end date.');
        return false;
    }

    return true;
}

async function handleSaveSemester(event, semester = null) {

    event.preventDefault(); // Prevent form submission

    const semesterName = document.getElementById('semesterName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // General validation
    if (!validateSemesterInputs(semesterName, startDate, endDate)) {
        return; // Stop if validation fails
    }

    let existingSemesters = await fetchSemesters();
    console.log('Existing semesters:', existingSemesters); // Debug log

    // If a semester is provided, filter it out from the existing semesters
    if (semester) {
        existingSemesters = existingSemesters.filter(
            existing => existing.semester_id !== semester.semester_id
        );
        console.log('Filtered semesters:', existingSemesters); // Debug log
    }

    // Overlap validation
    if (doesOverlap(existingSemesters, startDate, endDate)) {
        alert('Error: The proposed semester overlaps with an existing one.');
        return; // Stop if overlap detected
    }

    let isSaved;

    // If editing a semester, update it; otherwise, save it as new
    if (semester) {
        isSaved = await updateSemester(semester);
    } else {
        isSaved = await saveSemester(semesterName, startDate, endDate);
    }

    if (isSaved) {
        // Reset input fields after saving successfully
        document.getElementById('semesterName').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
    
        alert('Semester saved successfully!');

        window.location.reload();

    } else {
        console.log('Failed to save semester. Modal remains open.'); // Debug log
    }
}

async function deleteSemester(semester) {
    try {
        // Log the semester being deleted for debugging
        console.log('Attempting to delete semester:', semester);

        // Send the delete request to the server
        const response = await fetch('UTSdefineSemester.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'delete', // Specify the delete action
                semester_id: semester.semester_id, // Pass the semester ID
            }),
        });

        const result = await response.json();
        console.log('Server response:', result); // Log server response for debugging

        if (result.success) {
            alert('Semester deleted successfully!');
            window.location.reload(); // Reload the page to update the UI
            return true; // Indicate success
        } else {
            alert(`Error: ${result.message}`);
            console.error('Delete failed:', result.message);
            return false; // Indicate failure
        }
    } catch (error) {
        console.error('Error deleting semester:', error);
        alert('An error occurred while attempting to delete the semester.');
        return false; // Indicate failure
    }
}

function openDefineSemesterModal(semester = null) {

    const defineSemesterModal = document.getElementById('defineSemesterModal');

    const semesterNameField = document.getElementById('semesterName');
    const startDateField = document.getElementById('startDate');
    const endDateField = document.getElementById('endDate');
    const deleteSemesterButton = document.getElementById('deleteSemesterButton'); // Reference the delete button

    // If semester is provided, populate the fields
    if (semester) {
        semesterNameField.value = semester.name || ''; // Set the 'name' or an empty string
        startDateField.value = semester.start_date || ''; // Set the 'start_date' or an empty string
        endDateField.value = semester.end_date || ''; // Set the 'end_date' or an empty string

        deleteSemesterButton.style.display = 'inline-block'; // Show the delete button
        deleteSemesterButton.addEventListener('click', () => deleteSemester(semester));

        console.log(`Opened semester with id: ${semester.semester_id}`);

        document.getElementById('saveSemesterBtn').addEventListener('click', (event) => handleSaveSemester(event, semester));

    } else {
        // Clear fields if no semester is provided
        semesterNameField.value = '';
        startDateField.value = '';
        endDateField.value = '';

        deleteSemesterButton.style.display = 'none'; // Hide the delete button

        document.getElementById('saveSemesterBtn').addEventListener('click', (event) => handleSaveSemester(event));
    }

    // Add event listener to close button (if not already added)
    document.getElementById('closeDefineSemester').addEventListener('click', () => {
        defineSemesterModal.style.display = 'none';
    });
    

    defineSemesterModal.style.display = 'flex';
}


async function populateSemesterList() {
    console.log(`Semesters list called`);
    try {
        // Fetch semesters from the backend
        const semesters = await fetchSemesters(); // Assume fetchSemesters() returns an array of semester objects

        const modal = document.getElementById('semester-modal');
        const closeModalButton = document.querySelector('.semester-modal-close');
        const semesterList = document.getElementById('semester-modal-list');

        // Clear existing content
        semesterList.innerHTML = '';

        // Populate the list
        semesters.forEach(semester => {
            const listItem = document.createElement('li');
            listItem.textContent = semester.name; // Assume semester has a `name` property

            // Add click event to call openDefineSemesterModal
            listItem.addEventListener('click', () => openDefineSemesterModal(semester));

            semesterList.appendChild(listItem);
        });

        // Close modal
        closeModalButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.style.display = 'block';

    } catch (error) {
        console.error('Error fetching semesters:', error);
        semesterList.innerHTML = `<li>Error loading semesters</li>`;
    }
}

// Event Listener Setup
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('defineSemesterBtn').addEventListener('click', () => openDefineSemesterModal(null));

    const openModalButton = document.getElementById('viewSemestersBtn');
    if (openModalButton) { // Check if the element exists
        openModalButton.addEventListener('click', () => {
            populateSemesterList(); // Populate list before showing the modal
        });
    }

});
