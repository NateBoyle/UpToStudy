// Constants for API endpoints
const API_URL = 'UTScards.php';
const FLASHCARD_SETS_URL = `${API_URL}?type=flashcard_sets`;
const COURSES_URL = `${API_URL}?type=courses`;
const FLASHCARDS_URL = `${API_URL}?type=flashcards`; // New constant for flashcards

// FlashcardSet class for managing each flashcard set
class FlashcardSet {
    constructor(setId, setName, courseName, numCards) {
        this.setId = setId;
        this.setName = setName;
        this.courseName = courseName;
        this.numCards = numCards;
    }

    render() {
        const setCard = document.createElement('div');
        setCard.classList.add('flashcard-set');

        // Clickable area in the center of the set
        const clickableCenter = document.createElement('div');
        clickableCenter.classList.add('flashcardSetClickable');
        clickableCenter.innerHTML = `
            <div class="flashcard-header">
                <h2>${this.setName}</h2>
            </div>
            <p>Course: ${this.courseName || 'N/A'}</p>
            <p>${this.numCards || 0} cards</p>
        `;

        // Add click event to the center area
        clickableCenter.onclick = () => {
            console.log(`Opening flashcard set: ${this.setId}`);
            // Add code here to open or interact with the set, e.g., navigate to flashcards
            loadFlashcards(this.setId); // Load and display flashcards for the selected set
        };

        // Add mouse events to toggle hover class on the set card
        clickableCenter.addEventListener('mouseenter', () => {
            setCard.classList.add('hover-effect');
        });
        clickableCenter.addEventListener('mouseleave', () => {
            setCard.classList.remove('hover-effect');
        });

        // Options menu setup
        setCard.innerHTML = `
            <div class="options-button-container">
                <button class="options-button">&#8942;</button>
                <div class="options-menu" style="display: none;">
                    <button onclick="openAddCardModal(${this.setId})">Add Cards</button>
                    <button onclick="editFlashcardSet(${this.setId}, '${this.setName}', '${this.courseName}')">Edit Set</button>
                    <button onclick="deleteFlashcardSet(${this.setId})">Delete Set</button>
                </div>
            </div>
        `;

        // Append the clickable area to setCard
        setCard.appendChild(clickableCenter);

        const optionsButton = setCard.querySelector('.options-button');
        const optionsMenu = setCard.querySelector('.options-menu');

        optionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        return setCard;
    }
}

// Flashcard class for individual flashcards within a set
class Flashcard {
    constructor(question, answer, flashcardId) {
        this.question = question;
        this.answer = answer;
        this.flashcardId = flashcardId;
    }

    render() {
        const card = document.createElement('div');
        card.classList.add('flashcard');

        card.innerHTML = `
            <div class="flashcard-content">
                
                <h4>${this.question}</h4>
                <p>${this.answer}</p>
            </div>
        `;


        optionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        return card;
    }
}

// Function to close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.options-menu').forEach(menu => {
        menu.style.display = 'none';
    });
}

// Function to open the modal for creating a new flashcard set
function openCreateSetModal() {
    loadCourses();
    document.getElementById("flashcardSetModal").style.display = "flex";
}

// Define the function to close the modal
function closeCreateSetModal() {
    document.getElementById("flashcardSetModal").style.display = "none";
}

function openAddCardModal(setId) {
    const modalHeading = document.querySelector("#flashcardSetModal h2");
    modalHeading.textContent = "Create New Flashcard Set"; // Reset heading
    document.getElementById('flashcardModal').style.display = 'flex';
    document.getElementById('flashcardModal').setAttribute('data-set-id', setId);
}

function closeFlashcardModal() {
    document.getElementById('flashcardModal').style.display = 'none';
    document.getElementById('flashcardQuestion').value = '';
    document.getElementById('flashcardAnswer').value = '';

    // Refresh flashcard sets to show the updated card count after closing the modal
    loadFlashcardSets();
}

function openFlashcardDisplayModal(question, answer) {
    document.getElementById("displayQuestion").textContent = question; // Updated ID for question
    document.getElementById("displayAnswer").textContent = answer;     // Updated ID for answer
    document.getElementById("displayAnswer").style.display = "none";   // Hide answer initially
    document.getElementById("flashcardDisplayModal").style.display = "flex"; // Show modal
}

function closeFlashcardDisplayModal() {
    document.getElementById("flashcardDisplayModal").style.display = "none";
}

function toggleFlashcardAnswer(direction = null) {
    const answerElement = document.getElementById("displayAnswer");
    const button = document.getElementById("toggleAnswerBtn");
    if (answerElement.style.display === "none") {
        answerElement.style.display = "block";
        button.textContent = "Hide Answer";
    } else {
        answerElement.style.display = "none";
        button.textContent = "Show Answer";

        // Move to the next or previous card if a direction is specified
        if (direction === "next") {
            showNextFlashcard();
        } else if (direction === "previous") {
            showPreviousFlashcard();
        }

    }
}

function showNextFlashcard() {
    if (window.currentFlashcards && window.currentFlashcards.length > 0) {
        // Directly hide the answer if it's visible before moving to the next card
        const answerElement = document.getElementById("displayAnswer");
        const button = document.getElementById("toggleAnswerBtn");
        
        if (answerElement.style.display === "block") {
            answerElement.style.display = "none"; // Hide the answer
            button.textContent = "Show Answer"; // Reset button text
        }

        // Move to the next index, and wrap back to 0 if at the end
        window.currentFlashcardIndex = (window.currentFlashcardIndex + 1) % window.currentFlashcards.length;
        const nextFlashcard = window.currentFlashcards[window.currentFlashcardIndex];
        openFlashcardDisplayModal(nextFlashcard.question, nextFlashcard.answer); // Display the next flashcard
    }
}

function showPreviousFlashcard() {
    if (window.currentFlashcards && window.currentFlashcards.length > 0) {
       // Directly hide the answer if it's visible before moving to the previous card
       const answerElement = document.getElementById("displayAnswer");
       const button = document.getElementById("toggleAnswerBtn");

       if (answerElement.style.display === "block") {
           answerElement.style.display = "none"; // Hide the answer
           button.textContent = "Show Answer"; // Reset button text
       }

        // Move to the previous index, and wrap to the last index if at the beginning
        window.currentFlashcardIndex = (window.currentFlashcardIndex - 1 + window.currentFlashcards.length) % window.currentFlashcards.length;
        const prevFlashcard = window.currentFlashcards[window.currentFlashcardIndex];
        openFlashcardDisplayModal(prevFlashcard.question, prevFlashcard.answer); // Display the previous flashcard
    }
}

function deleteFlashcardSet(setId) {
    console.log(`Deleting set with ID: ${setId}`);
    // Implement deletion logic here
    if (confirm("Are you sure you want to delete this flashcard set?")) {
        fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'delete_set',
                set_id: setId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json(); // This should succeed if PHP returns valid JSON
        })
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                loadFlashcardSets(); // Refresh the flashcard sets after deletion
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error('Error deleting flashcard set:', error));
    }
}

// Function to delete an individual flashcard
function deleteFlashcard(flashcardId) {
    if (confirm("Are you sure you want to delete this flashcard?")) {
        fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'delete_flashcard',
                flashcard_id: flashcardId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                // Refresh or remove the flashcard element from the DOM if needed
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error('Error deleting flashcard:', error));
    }
}

// Load available courses to populate the dropdown
function loadCourses() {
    return fetch(COURSES_URL)
        .then(response => response.json())
        .then(data => {
            const courseDropdown = document.getElementById('courseDropdown');
            courseDropdown.innerHTML = '';
            
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select Course';
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            courseDropdown.appendChild(placeholderOption);
             
            const noCourseOption = document.createElement('option');
            noCourseOption.value = '';
            noCourseOption.textContent = 'No course / N/A';
            courseDropdown.appendChild(noCourseOption);

            if (data.status === 'success' && Array.isArray(data.data)) {
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.course_id;
                    option.textContent = course.course_name;
                    courseDropdown.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading courses:', error));
}

// Load flashcard sets from the database and render them
function loadFlashcardSets() {
    fetch(FLASHCARD_SETS_URL)
        .then(response => response.json())
        .then(data => {
            const flashcardSetsContainer = document.getElementById('flashcardSetsContainer');
            flashcardSetsContainer.innerHTML = '';

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                const flashcardGrid = document.createElement('div');
                flashcardGrid.classList.add('flashcard-grid');
                
                data.data.forEach(setData => {
                    const flashcardSet = new FlashcardSet(setData.set_id, setData.set_name, setData.course_name, setData.num_cards);
                    flashcardGrid.appendChild(flashcardSet.render());
                });
                
                flashcardSetsContainer.appendChild(flashcardGrid);
            } else {
                const sampleSet = document.createElement('div');
                sampleSet.classList.add('flashcard-set');
                sampleSet.innerHTML = `
                    <h2>Sample Set Name</h2>
                    <p>Course: N/A</p>
                    <p>15 cards</p>
                `;
                flashcardSetsContainer.appendChild(sampleSet);
            }
        })
        .catch(error => console.error('Error loading flashcard sets:', error));
}

function loadFlashcards(setId) {

    console.log(`Loading flashcards for set ID: ${setId}`); // Debugging log for set ID in loadFlashcards

    fetch(`${FLASHCARDS_URL}&set_id=${setId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Flashcards response:", data); // Log the JSON response
             // Check if the response is successful and contains flashcards
             if (data.status === 'success') {
                if (data.data && data.data.length > 0) {
                    window.currentFlashcards = data.data; // Store the array of flashcards
                    window.currentFlashcardIndex = 0;
                    
                    const firstFlashcard = window.currentFlashcards[0];
                    console.log("Displaying first flashcard:", firstFlashcard); // Debug log for first flashcard
                    openFlashcardDisplayModal(firstFlashcard.question, firstFlashcard.answer);
                } else {
                    console.log("Flashcards array is empty for this set."); // Specific log for empty array
                }
            } else {
                console.log("Failed to load flashcards, server response:", data);
            }
        })
        .catch(error => console.error("Error loading flashcards:", error));
}


function editFlashcardSet(setId, setName, courseId) {

    console.log("Editing set:", { setId, setName, courseId });

    // Open the modal
    document.getElementById("flashcardSetModal").style.display = "flex";
    
    
    // Change the modal heading to "Edit Flashcard Set"
    const modalHeading = document.querySelector("#flashcardSetModal h2");
    modalHeading.textContent = "Edit Flashcard Set";
    
    // Populate the input fields with the current set data
    document.getElementById("setNameInput").value = setName;
   
    // Load courses and set the selected course
    loadCourses().then(() => {
        document.getElementById("courseDropdown").value = courseId;
    });
    
    // Save the setId for later use (e.g., in a hidden field or by setting a custom attribute)
    document.getElementById("flashcardSetModal").setAttribute("data-edit-set-id", setId);
}


// Define the function to save a flashcard set
function saveSet() {
    const setName = document.getElementById('setNameInput').value;
    const courseId = document.getElementById('courseDropdown').value;
    const setId = document.getElementById("flashcardSetModal").getAttribute("data-edit-set-id"); // Check if editing

    if (!setName) {
        alert("Set name is required.");
        return;
    }

    const requestData = {
        type: setId ? 'edit_set' : 'add_set', // Choose action based on whether it's edit or add
        set_name: setName,
        course_id: courseId
    };

    if (setId) requestData.set_id = setId; // Include set_id for editing

    console.log("Saving set:", { setName, courseId }); // Debugging log

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Save set response:", data); // Debugging log
        if (data.status === 'success') {
            alert(data.message);
            document.getElementById("flashcardSetModal").removeAttribute("data-edit-set-id");
            closeCreateSetModal();
            loadFlashcardSets();

            // Reset inputs to default values
            document.getElementById("setNameInput").value = '';
            document.getElementById("courseDropdown").value = ''; // Reset to default
            document.getElementById("flashcardSetModal").removeAttribute("data-edit-set-id"); // Remove edit mode attribute
            
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Define the function to save a flashcard
function saveFlashcard(setId) {
    const question = document.getElementById('flashcardQuestion').value;
    const answer = document.getElementById('flashcardAnswer').value;

    if (!question || !answer) {
        alert("Both question and answer are required.");
        return;
    }

    console.log("Saving new flashcard:", { question, answer, setId }); // Debugging log

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
        console.log("Save flashcard response:", data); // Debugging log
        if (data.status === 'success') {
            alert(data.message);
            document.getElementById('flashcardQuestion').value = '';
            document.getElementById('flashcardAnswer').value = '';
        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener("DOMContentLoaded", () => {
    // Load flashcard sets into the container
    loadFlashcardSets();
    
    // Event listeners for modal buttons
    const saveSetButton = document.getElementById("saveSetBtn");
    const addFlashcardButton = document.getElementById("addFlashcardBtn");
    const toggleAnswerButton = document.getElementById("toggleAnswerBtn"); // Ensure button is selected
    const prevFlashcardButton = document.getElementById("prevFlashcardBtn"); // Previous button
    const nextFlashcardButton = document.getElementById("nextFlashcardBtn"); // Next button

    if (saveSetButton) {
        saveSetButton.addEventListener("click", saveSet);
    }

    if (addFlashcardButton) {
        addFlashcardButton.addEventListener("click", () => {
            const setId = document.getElementById('flashcardModal').getAttribute('data-set-id');
            saveFlashcard(setId);
        });
    }

    if (toggleAnswerButton) {
        toggleAnswerButton.addEventListener("click", toggleFlashcardAnswer);
    }

    if (prevFlashcardButton) {
        prevFlashcardButton.addEventListener("click", showPreviousFlashcard);
    }

    if (nextFlashcardButton) {
        nextFlashcardButton.addEventListener("click", showNextFlashcard);
    }

    /*// Event listener for each flashcard set clickable area
    document.querySelectorAll(".flashcardSetClickable").forEach(setElement => {
        setElement.addEventListener("click", function () {
            const setId = setElement.getAttribute("data-set-id"); // Get the setId for the clicked set
            console.log(`Click detected for flashcard set with ID: ${setId}`); // Debugging log
            loadFlashcards(setId); // Load flashcards for this set and display them in the modal
        });
    });*/

    // Close dropdowns if clicking outside of any dropdown
    document.addEventListener('click', closeAllDropdowns);
});