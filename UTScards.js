
// Constants for API endpoints
const API_URL = 'UTScards.php';
const FLASHCARD_SETS_URL = `${API_URL}?type=flashcard_sets`;
const COURSES_URL = `${API_URL}?type=courses`;

// Call loadCourses() when the modal opens to populate the dropdown
function openCreateSetModal() {
    loadCourses();
    document.getElementById("modal").style.display = "flex";
}


// Define the function to close the modal
function closeCreateSetModal() {
    document.getElementById("modal").style.display = "none";
}

function loadCourses() {
    fetch(COURSES_URL)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Check the structure of data
            const courseDropdown = document.getElementById('courseDropdown');
            courseDropdown.innerHTML = ''; // Clear existing options

            // Add placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select Course';
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            courseDropdown.appendChild(placeholderOption);
             
            // Add "No course / N/A" option
            const noCourseOption = document.createElement('option');
            noCourseOption.value = '';
            noCourseOption.textContent = 'No course / N/A';
            courseDropdown.appendChild(noCourseOption);

            
            // Check if the response is in the expected format
            if (data.status === 'success' && Array.isArray(data.data)) {
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.course_id;
                    option.textContent = course.course_name;
                    courseDropdown.appendChild(option);
                });
            } else {
                console.error('Unexpected response format:', data);
            }
        })
        .catch(error => console.error('Error loading courses:', error));
}

function loadFlashcardSets() {
    fetch(FLASHCARD_SETS_URL)
        .then(response => response.json())
        .then(data => {
            const flashcardSetsContainer = document.getElementById('flashcardSetsContainer');
            flashcardSetsContainer.innerHTML = ''; // Clear existing content

            // Create the grid container
            const flashcardGrid = document.createElement('div');
            flashcardGrid.classList.add('flashcard-grid');

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                data.data.forEach(set => {
                    const setElement = document.createElement('div');
                    setElement.classList.add('flashcard-set');

                    setElement.innerHTML = `
                        <h2>${set.set_name}</h2>
                        <p>Course: ${set.course_name || 'N/A'}</p>
                        <p>${set.num_cards || 0} cards</p> <!-- Display num_cards or 0 if null -->
                    `;

                    flashcardGrid.appendChild(setElement);
                });
            } else {
                // Add a default sample set if no sets are available
                const sampleSet = document.createElement('div');
                sampleSet.classList.add('flashcard-set');
                sampleSet.innerHTML = `
                    <h2>Sample Set Name</h2>
                    <p>Course: N/A</p>
                    <p>15 cards</p>
                `;
                flashcardGrid.appendChild(sampleSet);
            }

            // Append the grid to the container
            flashcardSetsContainer.appendChild(flashcardGrid);
        })
        .catch(error => console.error('Error loading flashcard sets:', error));
}

// Define the function to save the set and close the modal
function saveSet() {

    const setName = document.getElementById('setNameInput').value;
    const courseId = document.getElementById('courseDropdown').value;

    if (!setName) {
        alert("Set name is required.");
        return;
    }

    // Send data to the server
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            set_name: setName,
            course_id: courseId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            closeCreateSetModal();  // Close the modal only if save is successful
            // Optionally, reload flashcard sets to reflect the new addition
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));

}


// Event listeners for modal close and save actions, after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // Load the flashcard sets into the container
    loadFlashcardSets();
    
    const closeModalButton = document.querySelector("#modal .close");
    const saveButton = document.getElementById("saveSetBtn");

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeCreateSetModal);
    }

    if (saveButton) {
        saveButton.addEventListener("click", saveSet);
    }
});





