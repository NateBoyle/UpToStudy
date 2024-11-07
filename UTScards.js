// Constants for API endpoints
const API_URL = 'UTScards.php';
const FLASHCARD_SETS_URL = `${API_URL}?type=flashcard_sets`;
const COURSES_URL = `${API_URL}?type=courses`;

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

        setCard.innerHTML = `
            <div class="options-button-container">
                <button class="options-button">&#8942;</button>
                <div class="options-menu" style="display: none;">
                    <button onclick="openAddCardModal(${this.setId})">Add Cards</button>
                    <button onclick="deleteFlashcardSet(${this.setId})">Delete Set</button>
                </div>
            </div>
            <div class="flashcard-header">
                <h2>${this.setName}</h2>
            </div>
            <p>Course: ${this.courseName || 'N/A'}</p>
            <p>${this.numCards || 0} cards</p>
        `;

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
                <button class="options-button">&#8942;</button>
                <div class="options-menu" style="display: none;">
                    <button onclick="editFlashcard(${this.flashcardId})">Edit</button>
                    <button onclick="deleteFlashcard(${this.flashcardId})">Delete</button>
                </div>
            </div>
        `;

        const optionsButton = card.querySelector('.options-button');
        const optionsMenu = card.querySelector('.options-menu');

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
    document.getElementById("modal").style.display = "flex";
}

// Define the function to close the modal
function closeCreateSetModal() {
    document.getElementById("modal").style.display = "none";
}

function openAddCardModal(setId) {
    document.getElementById('flashcardModal').style.display = 'flex';
    document.getElementById('flashcardModal').setAttribute('data-set-id', setId);
}

function closeFlashcardModal() {
    document.getElementById('flashcardModal').style.display = 'none';
    document.getElementById('flashcardQuestion').value = '';
    document.getElementById('flashcardAnswer').value = '';
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
    fetch(COURSES_URL)
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

// Define the function to save a flashcard set
function saveSet() {
    const setName = document.getElementById('setNameInput').value;
    const courseId = document.getElementById('courseDropdown').value;

    if (!setName) {
        alert("Set name is required.");
        return;
    }

    console.log("Saving new set:", { setName, courseId }); // Debugging log

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            type: 'add_set',
            set_name: setName,
            course_id: courseId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Save set response:", data); // Debugging log
        if (data.status === 'success') {
            alert(data.message);
            closeCreateSetModal();
            loadFlashcardSets();
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

    if (saveSetButton) {
        saveSetButton.addEventListener("click", saveSet);
    }

    if (addFlashcardButton) {
        addFlashcardButton.addEventListener("click", () => {
            const setId = document.getElementById('flashcardModal').getAttribute('data-set-id');
            saveFlashcard(setId);
        });
    }

    // Close dropdowns if clicking outside of any dropdown
    document.addEventListener('click', closeAllDropdowns);
});