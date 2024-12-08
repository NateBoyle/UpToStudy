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

async function handleSaveSemester(event) {

    event.preventDefault(); // Prevent form submission

    const semesterName = document.getElementById('semesterName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // General validation
    if (!validateSemesterInputs(semesterName, startDate, endDate)) {
        return; // Stop if validation fails
    }

    const existingSemesters = await fetchSemesters();
    console.log('Existing semesters:', existingSemesters); // Debug log

    // Overlap validation
    if (doesOverlap(existingSemesters, startDate, endDate)) {
        alert('Error: The proposed semester overlaps with an existing one.');
        return; // Stop if overlap detected
    }

    // Proceed to save if validation passes
    const isSaved = await saveSemester(semesterName, startDate, endDate);

    if (isSaved) {
        // Reset input fields after saving successfully
        document.getElementById('semesterName').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        // Only close the modal and log success if saving was successful
        closeDefineSemesterModal();
        alert('Semester saved successfully!');
        console.log('Semester saved and modal closed.'); // Debug log
    } else {
        console.log('Failed to save semester. Modal remains open.'); // Debug log
    }
}

function openDefineSemesterModal() {
    const defineSemesterModal = document.getElementById('defineSemesterModal');
    defineSemesterModal.style.display = 'flex';
}

function closeDefineSemesterModal() {
    const defineSemesterModal = document.getElementById('defineSemesterModal');
    defineSemesterModal.style.display = 'none';
}

/*async function refreshSemesterList() {
    try {
        const semesters = await fetchSemesters(); // Fetch updated list of semesters
        const semesterContainer = document.getElementById('semesterContainer'); // Your container for displaying semesters

        // Clear existing semesters
        semesterContainer.innerHTML = '';

        if (semesters.length === 0) {
            semesterContainer.innerHTML = '<p>No semesters found.</p>'; // Show a message if no semesters exist
            return;
        }

        // Loop through semesters and create UI elements for each
        semesters.forEach(semester => {
            const semesterElement = document.createElement('div');
            semesterElement.className = 'semester-item';
            semesterElement.innerHTML = `
                <h3>${semester.name}</h3>
                <p>Start Date: ${semester.start_date}</p>
                <p>End Date: ${semester.end_date}</p>
            `;
            semesterContainer.appendChild(semesterElement);
        });

        console.log('Semester list refreshed successfully.');
    } catch (error) {
        console.error('Error refreshing semester list:', error);
    }
}*/

// Event Listener Setup
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('defineSemesterBtn').addEventListener('click', openDefineSemesterModal);

    document.getElementById('closeDefineSemester').addEventListener('click', closeDefineSemesterModal);

    document.getElementById('saveSemesterBtn').addEventListener('click', handleSaveSemester);
});
