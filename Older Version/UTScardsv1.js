
// Constants for API endpoints
const API_URL = 'UTScards.php';
const FLASHCARD_SETS_URL = `${API_URL}?type=flashcard_sets`;
const COURSES_URL = `${API_URL}?type=courses`;

let openDropdown = null; // Track the currently open dropdown

// Call loadCourses() when the modal opens to populate the dropdown
function openCreateSetModal() {
    loadCourses();
    document.getElementById("modal").style.display = "flex";
}


// Define the function to close the modal
function closeCreateSetModal() {
    document.getElementById("modal").style.display = "none";
}

function openAddCardModal(setId) {

    // Open the modal for adding a card
    document.getElementById('flashcardModal').style.display = 'flex';

    // Store the setId for use in saveFlashcard
    document.getElementById('flashcardModal').setAttribute('data-set-id', setId);

}

function closeFlashcardModal() {
    document.getElementById('flashcardModal').style.display = 'none';

    // Clear input fields
    document.getElementById('flashcardQuestion').value = '';
    document.getElementById('flashcardAnswer').value = '';
}

// Function to toggle the options menu
function toggleOptionsMenu(ellipsisElement, event) {
    // Close all open dropdowns first
    document.querySelectorAll('.dropdown-options').forEach(menu => {
        menu.style.display = 'none';
    });

    // Open the current dropdown
    const optionsMenu = ellipsisElement.nextElementSibling;
    optionsMenu.style.display = 'block';

    // Stop event propagation to prevent the document click listener from closing it immediately
    event.stopPropagation();
}

// Function to close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-options').forEach(menu => {
        menu.style.display = 'none';
    });
}

function deleteFlashcardSet(setId) {
    console.log(`Deleting set with ID: ${setId}`);
    // Implement deletion logic here
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

                    // Ellipsis menu and dropdown options
                    const optionsMenu = document.createElement('div');
                    optionsMenu.classList.add('options-menu');

                    const ellipsis = document.createElement('span');
                    ellipsis.classList.add('ellipsis');
                    ellipsis.textContent = '⋮';
                    ellipsis.onclick = () => toggleOptionsMenu(ellipsis);
                    
                    const dropdownOptions = document.createElement('div');
                    dropdownOptions.classList.add('dropdown-options');

                    const addCardsBtn = document.createElement('button');
                    addCardsBtn.textContent = 'Add Cards';
                    addCardsBtn.onclick = () => openAddCardModal(set.set_id); // Pass set ID if needed

                    const deleteSetBtn = document.createElement('button');
                    deleteSetBtn.textContent = 'Delete Set';
                    deleteSetBtn.onclick = () => deleteFlashcardSet(set.set_id); // Pass set ID if needed

                    // Append buttons to dropdown
                    dropdownOptions.appendChild(addCardsBtn);
                    dropdownOptions.appendChild(deleteSetBtn);

                    // Append ellipsis and dropdown to options menu
                    optionsMenu.appendChild(ellipsis);
                    optionsMenu.appendChild(dropdownOptions);

                    setElement.innerHTML = `
                        <div class="options-button-container">
                            <button class="options-button" onclick="toggleOptionsMenu(this, event)">&#8942;</button>
                            <div class="options-menu">
                                <button onclick="openAddCardModal(${set.set_id})">Add Cards</button>
                                <button onclick="deleteFlashcardSet(${set.set_id})">Delete Set</button>
                            </div>
                        </div>
                        <div class="flashcard-header">
                            <h2>${set.set_name}</h2>
                        </div>
                        <p>Course: ${set.course_name || 'N/A'}</p>
                        <p>${set.num_cards || 0} cards</p> <!-- Display num_cards or 0 if null -->
                    `;

                     // Append options menu to the set element
                     setElement.appendChild(optionsMenu);

                    // Append set element to the grid
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
function saveSet(afterSaveAction) {

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

            type: 'add_set',  // Add a specific type to distinguish this action
            set_name: setName,
            course_id: courseId

        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            closeCreateSetModal();  // Close the modal only if save is successful
            
            if (afterSaveAction) afterSaveAction(data.set_id); // Call the callback if provided
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));

}

function saveFlashcard(setId) {

    //const setId = document.getElementById('flashcardModal').getAttribute('data-set-id');
    const question = document.getElementById('flashcardQuestion').value;
    const answer = document.getElementById('flashcardAnswer').value;

    if (!question || !answer) {
        alert("Both question and answer are required.");
        return;
    }

    // Send data to the server to save the flashcard
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            type: 'add_flashcard',
            set_id: setId,
            question: question,
            answer: answer
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {

            alert(data.message);

             // Clear input fields for the next flashcard
            document.getElementById('flashcardQuestion').value = '';
            document.getElementById('flashcardAnswer').value = '';
            
            // Keep the modal open for adding more flashcards
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
    const addFlashcardButton = document.getElementById("addFlashcardBtn"); // Add Flashcard button

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeCreateSetModal);
    }

    if (saveButton) {
        saveButton.addEventListener("click", () => saveSet(openAddCardModal));
    }

    if (addFlashcardButton) {
        addFlashcardButton.addEventListener("click", () => {
            // Assuming `currentSetId` holds the ID of the set for the flashcard being added
            const currentSetId = document.getElementById('flashcardModal').getAttribute('data-set-id');
            saveFlashcard(currentSetId);
        });
    }
});


// Close dropdowns if clicking outside of any dropdown
document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-options').forEach(menu => {
        menu.style.display = 'none';
    });
});

// Prevent closing the dropdown when clicking inside it
document.querySelectorAll('.dropdown-options').forEach(menu => {
    menu.addEventListener('click', (event) => {
        event.stopPropagation();
    });
});



