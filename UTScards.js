import { fetchSemesters, fetchCourses } from './UTSutils.js';

// Constants for API endpoints
const API_URL = 'UTScards.php';
const FLASHCARD_SETS_URL = `${API_URL}?type=flashcard_sets`;
const FLASHCARDS_URL = `${API_URL}?type=flashcards`; // New constant for flashcards

let currentSemesterId = null; // Tracks the selected semester

/* CLASSES CODE */

// FlashcardSet class for managing each flashcard set
class FlashcardSet {

    /**
     * Constructor to initialize a FlashcardSet instance
     * @param {number} setId - The unique ID for the flashcard set.
     * @param {string} setName - The name of the flashcard set.
     * @param {string} courseName - The name of the associated course (or "N/A").
     * @param {number} courseId - The ID of the associated course.
     * @param {string} coursePrefix - The prefix of the course.
     * @param {string} courseNumber - The number of the course.
     * @param {number} numCards - The number of flashcards in the set.
     * @param {number} cardsMastered - The number of mastered flashcards in the set.
     * @param {string} courseColor - The color associated with the course.
     */

    constructor(setId, setName, courseName, courseId, coursePrefix, courseNumber, numCards, cardsMastered = 0, courseColor) {
        this.setId = setId;
        this.setName = setName;
        this.courseName = courseName;
        this.courseId = courseId;
        this.coursePrefix = coursePrefix;
        this.courseNumber = courseNumber;
        this.numCards = numCards;
        this.cardsMastered = cardsMastered;
        this.courseColor = courseColor;
    }

    /**
     * Renders the flashcard set as an HTML element
     * @returns {HTMLElement} - The rendered flashcard set element.
     */
    render() {

        const setCard = document.createElement('div');
        setCard.classList.add('study-set');
        // Set the border color using courseColor
        setCard.style.borderColor = this.courseColor; // This line adds the border color


        // Calculate the mastered percentage
        const masteredPercentage = this.numCards > 0 ? (this.cardsMastered / this.numCards) * 100 : 0;

        // Clickable area in the center of the set
        const clickableCenter = document.createElement('div');
        clickableCenter.classList.add('studySetClickable');
        clickableCenter.innerHTML = `
            <div class="study-set-header">
                <h2>${this.setName}</h2>
            </div>
            <p>Course: ${this.coursePrefix + ' ' +  this.courseNumber || 'N/A'}</p>
            <p>${this.numCards || 0}&nbsp; cards &nbsp;&nbsp;|&nbsp;&nbsp; ${this.cardsMastered || 0}&nbsp; mastered</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${masteredPercentage}%; background-color: ${this.courseColor};"></div>
            </div>
        `;

        // Add click event to the center area
        clickableCenter.onclick = () => {
            //console.log(`Opening flashcard set: ${this.setId}`);
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

        // Options menu and button
        const optionsButton = document.createElement("button");
        optionsButton.classList.add("options-button");
        optionsButton.innerHTML = "&#8942;"; // Ellipsis symbol for the menu

        const optionsMenu = document.createElement("div");
        optionsMenu.classList.add("options-menu");
        optionsMenu.style.display = "none"; // Hidden by default
        optionsMenu.innerHTML = `
            <button onclick="openFlashcardModal(${this.setId})">Add Cards Manually</button>
            <button onclick="editFlashcardSet(${this.setId}, '${this.setName}', '${this.courseId}')">Edit/Upload Set</button>
            <button onclick="deleteFlashcardSet(${this.setId})">Delete Set</button>
            <button onclick="openOverviewModal(${this.setId})">View All</button>
        `;

        // Container for options button and menu
        const optionsContainer = document.createElement("div");
        optionsContainer.classList.add("options-button-container");
        optionsContainer.appendChild(optionsButton);
        optionsContainer.appendChild(optionsMenu);

        optionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Append elements to the set card
        setCard.appendChild(clickableCenter);
        setCard.appendChild(optionsContainer);

        return setCard;
    }
}

// Flashcard class for individual flashcards within a set
class Flashcard {
    /**
     * Constructor to initialize a Flashcard instance
     * @param {number} flashcardId - The unique ID for the flashcard.
     * @param {number} setId - The ID of the set this flashcard belongs to.
     * @param {string} question - The question text for the flashcard.
     * @param {string} answer - The answer text for the flashcard.
     * @param {boolean} isMastered - The mastered status of the flashcard.
     */
    constructor(flashcardId, setId, question, answer, isMastered) {
        this.flashcardId = flashcardId;
        this.setId = setId;
        this.question = question;
        this.answer = answer;
        this.isMastered = isMastered; // New property
    }

    /**
     * Converts the flashcard instance to a structured data object for rendering
     * @returns {Object} - The flashcard data, including mastered state
     */
    toDisplayObject() {
        return {
            flashcardId: this.flashcardId,
            setId: this.setId,
            question: this.question,
            answer: this.answer,
            isMastered: this.isMastered, // Include the mastered state
        };
    }
}




/* FLASHCARD SET FUNCTIONS */

// Function to open the modal for creating a new flashcard set
function openCreateSetModal() {
    // Reset the modal heading and inputs
    const modalHeading = document.querySelector("#setCreationModal h2");
    const setNameInput = document.getElementById("setNameInput");
    const courseDropdown = document.getElementById("courseDropdown");

    modalHeading.textContent = "Create New Flashcard Set";
    setNameInput.placeholder = "Set Name";
    setNameInput.value = ""; // Clear any previous input

    // Reset the course dropdown to the default state
    courseDropdown.selectedIndex = 0;

    // Load courses dynamically (if required)
    loadCourses();

    // Display the modal
    document.getElementById("setCreationModal").style.display = "flex";
}
window.openCreateSetModal = openCreateSetModal;

// Define the function to close the modal
function closeCreateSetModal() {
    
    // Hide the modal
    document.getElementById("setCreationModal").style.display = "none";

    // Reset the file input and filename
    const fileInput = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileName");

    if (fileInput) fileInput.value = ""; // Clear the file input
    if (fileNameDisplay) {
        fileNameDisplay.textContent = "No file chosen"; // Reset the filename display
        fileNameDisplay.style.color = "#666"; // Change text color back to gray
    }

}
window.closeCreateSetModal = closeCreateSetModal;

async function loadCourses() {
    try {
        const courseDropdown = document.getElementById('courseDropdown');
        courseDropdown.innerHTML = '';

        // Add placeholder and default "No Course" options
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Select Course';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        placeholderOption.style.color = 'white'; // Ensure white font color
        courseDropdown.appendChild(placeholderOption);

        const noCourseOption = document.createElement('option');
        noCourseOption.value = '';
        noCourseOption.textContent = 'No course / N/A';
        courseDropdown.appendChild(noCourseOption);

        // Fetch courses via the utility function
        const courses = await fetchCourses();

        // Populate the dropdown with fetched courses
        courses.forEach(course => {
            //console.log("Course ID:", course.course_id, "Course Name:", course.course_name);
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.prefix} ${course.course_number}: ${course.name}`; // Combine prefix and course_number
            option.style.color = 'white'; // Ensure white font color
            courseDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);

        // Optionally, handle error state for the dropdown
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading courses';
        errorOption.disabled = true;
        errorOption.style.color = 'white'; // Ensure white font color
        courseDropdown.appendChild(errorOption);
    }
}

// Load flashcard sets from the database and render them
function loadFlashcardSets(semesterId = null, courseId = null, searchTerm = '') {

    // Construct the URL dynamically based on provided arguments
    let url = FLASHCARD_SETS_URL;

    // Append query parameters conditionally
    if (semesterId) url += `&semester_id=${encodeURIComponent(semesterId)}`;
    if (courseId) url += `&course_id=${encodeURIComponent(courseId)}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const flashcardSetsContainer = document.getElementById('flashcardSetsContainer');
            flashcardSetsContainer.innerHTML = '';

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                const flashcardGrid = document.createElement('div');
                flashcardGrid.classList.add('study-set-grid');
                
                data.data.forEach(setData => {
                    // Pass cardsMastered to the FlashcardSet constructor
                    const flashcardSet = new FlashcardSet(
                        setData.set_id, 
                        setData.set_name, 
                        setData.course_name, 
                        setData.course_id,
                        setData.prefix,
                        setData.course_number,
                        setData.num_cards,
                        setData.cards_mastered, // New field for cards mastered
                        setData.course_color // New field for course color
                    );

                    const setElement = flashcardSet.render();

                    // Set attributes directly
                    setElement.setAttribute('data-set-id', setData.set_id);
                    setElement.setAttribute('data-card-count', setData.num_cards);
                    setElement.setAttribute('data-cards-mastered', setData.cards_mastered)

                    flashcardGrid.appendChild(setElement);
                });


                
                flashcardSetsContainer.appendChild(flashcardGrid);
            } else {
                const sampleSet = document.createElement('div');
                sampleSet.classList.add('study-set');
                sampleSet.innerHTML = `
                    <h2>Sample Set Name</h2>
                    <p>Course: N/A</p>
                    <p>15 cards  |  0 mastered</p>
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
    const setId = document.getElementById("setCreationModal").getAttribute("data-edit-set-id"); // Check if editing

    if (!setName) {
        alert("Set name is required.");
        return Promise.reject("Set name is required."); // Return a rejected promise if validation fails
    }

    const requestData = {
        type: setId ? 'edit_set' : 'add_set', // Choose action based on whether it's edit or add
        set_name: setName,
        course_id: courseId
    };

    if (setId) requestData.set_id = setId; // Include set_id for editing

    //console.log("Saving set:", { setName, courseId }); // Debugging log

    return fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData)
    })
    .then(response => response.json())
    .then(data => {
        //console.log("Save set response:", data); // Debugging log
        if (data.status === 'success') {
            alert(data.message);
            document.getElementById("setCreationModal").removeAttribute("data-edit-set-id");
            closeCreateSetModal();
            loadFlashcardSets();

            // Reset inputs to default values
            document.getElementById("setNameInput").value = '';
            document.getElementById("courseDropdown").value = ''; // Reset to default
            document.getElementById("setCreationModal").removeAttribute("data-edit-set-id"); // Remove edit mode attribute

            // Return the setId from the server's response
            return data.set_id;
        } else {
            alert("Error: " + data.message);
            return Promise.reject(data.message); // Return a rejected promise on failure
        }
    })
    .catch(error => {
        console.error('Error:', error);
        return Promise.reject(error); // Return a rejected promise for fetch errors
    });
}

function editFlashcardSet(setId, setName, courseId) {

    //console.log("Editing set:", { setId, setName, courseName });

    // Open the modal
    document.getElementById("setCreationModal").style.display = "flex";
    
    
    // Change the modal heading to "Edit Flashcard Set"
    const modalHeading = document.querySelector("#setCreationModal h2");
    modalHeading.textContent = "Edit Flashcard Set";
    
    // Populate the input fields with the current set data
    document.getElementById("setNameInput").value = setName;
   
    // Load courses and set the selected course
    loadCourses().then(() => {
        const courseDropdown = document.getElementById("courseDropdown");

        // Find and select the option matching courseName
        const optionToSelect = Array.from(courseDropdown.options).find(
            option => option.value === courseId.toString() // Assuming courseId is a number or string
        );

        if (optionToSelect) {
            courseDropdown.value = optionToSelect.value; // Set the selected course
        } else {
            console.warn(`Course name "${courseId}" not found in dropdown.`);
        }
    });
    
    // Save the setId for later use (e.g., in a hidden field or by setting a custom attribute)
    document.getElementById("setCreationModal").setAttribute("data-edit-set-id", setId);
}
window.editFlashcardSet = editFlashcardSet;

function deleteFlashcardSet(setId) {
    //console.log(`Deleting set with ID: ${setId}`);
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
window.deleteFlashcardSet = deleteFlashcardSet;

document.getElementById("fileInput").addEventListener("change", function () {
    const fileName = this.files[0]?.name || "No file chosen"; // Get the file name or fallback text
    const fileNameDisplay = document.getElementById("fileName");

    fileNameDisplay.textContent = fileName; // Set the file name in the span

    // Change color based on whether a file is chosen
    fileNameDisplay.style.color = this.files[0] ? "white" : "#666"; // White for a file, gray (default) otherwise
});

function validateFlashcardData(flashcards) {
    return flashcards.every(row =>
        Object.keys(row).length === 2 && // Ensure exactly two keys (columns)
        row.Question?.trim() &&         // Ensure Question is non-empty
        row.Answer?.trim()              // Ensure Answer is non-empty
    );
}


function handleSetUpload() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0]; // Get the uploaded file, if any

    if (file) {
        // Parse the file with PapaParse
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                //console.log("Parsed results:", results.data);

                // Validate the headers
                const expectedHeaders = ["Question", "Answer"];
                const actualHeaders = results.meta.fields;

                const hasValidHeaders = expectedHeaders.every(header => actualHeaders.includes(header));
                if (!hasValidHeaders) {
                    alert("Invalid file format. Ensure the file has headers: 'Question' and 'Answer'.");
                    return;
                }

                // Filter and validate the parsed data
                const filteredFlashcards = results.data.filter(row =>
                    row.Question?.trim() || row.Answer?.trim()
                );

                if (!validateFlashcardData(filteredFlashcards)) {
                    alert("Some rows are missing questions or answers.");
                    return;
                }

                // Save the set, then process filtered flashcards
                saveSet().then(async setId => {
                    if (!setId || filteredFlashcards.length === 0) {
                        console.error('Invalid data: No set ID or no flashcards to upload.');
                        return;
                    }

                    //console.log("Uploading flashcards in chunks...");

                    // Split flashcards into chunks of 20 rows
                    const chunkSize = 20;
                    const chunks = [];
                    for (let i = 0; i < filteredFlashcards.length; i += chunkSize) {
                        chunks.push(filteredFlashcards.slice(i, i + chunkSize));
                    }

                    // Upload each chunk sequentially
                    for (const chunk of chunks) {
                        //console.log("Uploading chunk:", chunk);
                        try {
                            const response = await fetch(API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    type: 'add_flashcards_bulk',
                                    set_id: setId,
                                    flashcards: JSON.stringify(chunk), // Send the current chunk as JSON
                                }),
                            });

                            const data = await response.json();
                            if (data.status === 'success') {
                                //console.log("Chunk uploaded successfully:");
                                //alert("Flashcards uploaded successfully!");
                                
                            } else {
                                console.error("Error uploading chunk:", data.message);
                                alert("Error: " + data.message);
                                break; // Stop processing if an error occurs
                            }
                        } catch (error) {
                            console.error("Error uploading chunk:", error);
                            alert("Error uploading flashcards. Please try again.");
                            break; // Stop processing if an error occurs
                        }
                    }

                    // Finalize the process
                    
                    loadFlashcardSets();
                }).catch(error => {
                    console.error("Error saving set:", error);
                    alert("Error saving flashcard set. Please try again.");
                });
            },
            error: function (error) {
                console.error("Error parsing file:", error);
                alert("Error processing file. Please try again.");
            },
        });
    } else {
        // No file uploaded, just save the set
        saveSet().then(() => {
            //alert("Flashcard set saved successfully!");
            loadFlashcardSets();
        }).catch(error => {
            console.error("Error saving set:", error);
            alert("Error saving flashcard set. Please try again.");
        });
    }
}



/* INDIVIDUAL FLASHCARDS FUNCTIONS */
/* CRUD FLASHCARD FUNCTIONS */


function openFlashcardModal(setId, flashcardId = null, question = '', answer = '') {
    const modal = document.getElementById('fcCreationModal');
    const heading = document.getElementById('fcCreationModalHeading');
    const questionInput = document.getElementById('flashcardQuestion');
    const answerInput = document.getElementById('flashcardAnswer');
    const saveButton = document.getElementById('addFlashcardBtn');

    // If editing, update the heading and populate fields
    if (flashcardId) {
        heading.textContent = 'Edit Flashcard';
        questionInput.value = question;
        answerInput.value = answer;
        modal.setAttribute('data-edit-flashcard-id', flashcardId); // Set flashcard ID for editing
        saveButton.textContent = 'Save Changes'; // Optional: Update button text
        //console.log(`Editing FC ID: ${flashcardId}`);
    } else {
        // For creating a new flashcard
        heading.textContent = 'Create New Flashcard';
        questionInput.value = '';
        answerInput.value = '';
        modal.removeAttribute('data-edit-flashcard-id'); // Clear any editing reference
        saveButton.textContent = 'Add Flashcard'; // Reset button text
    }

    // Show the modal
    modal.style.display = 'flex';
    modal.setAttribute('data-set-id', setId); // Associate the modal with the flashcard set
}
window.openFlashcardModal = openFlashcardModal;

function closeFlashcardModal() {
    document.getElementById('fcCreationModal').style.display = 'none';
    document.getElementById('flashcardQuestion').value = '';
    document.getElementById('flashcardAnswer').value = '';

    // Refresh flashcard sets to show the updated card count after closing the modal
    loadFlashcardSets();
}
window.closeFlashcardModal = closeFlashcardModal;

// Define the function to save a flashcard
function saveFlashcard(setId = null, question = null, answer = null) {

    // Retrieve the question, answer, and (optional) flashcard ID for editing
    // If question and answer are not provided, get them from the modal inputs
    question = question || document.getElementById('flashcardQuestion').value;
    answer = answer || document.getElementById('flashcardAnswer').value;

    const flashcardId = document.getElementById("fcCreationModal").getAttribute("data-edit-flashcard-id");
    
    // Use the provided setId, or fetch from the modal if not provided
    const finalSetId = setId || document.getElementById("fcCreationModal")?.getAttribute("data-set-id");

    //console.log('Save flashcard called with setId:', setId);
    

    // Validate inputs
    if (!question || !answer) {
        alert("Both question and answer are required.");
        return;
    }

    // Determine the type of operation (new or edit)
    const requestType = flashcardId ? 'edit_flashcard' : 'add_flashcard';

    //console.log("Saving flashcard:", { flashcardId, question, answer, setId, requestType });

    // Construct the request payload
    const requestData = {
        type: requestType,
        question: question,
        answer: answer,
        set_id: finalSetId, // Use finalSetId for saving flashcards
    };
    
    // Include the flashcard ID for editing
    if (flashcardId) {
        requestData.flashcard_id = flashcardId;
    }


    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData)
    })
    .then(response => response.json())
    .then(data => {
        //console.log("Save flashcard response:", data); // Debugging log

        if (data.status === 'success') {
            alert(data.message);
            document.getElementById('flashcardQuestion').value = '';
            document.getElementById('flashcardAnswer').value = '';
            document.getElementById("fcCreationModal").removeAttribute("data-edit-flashcard-id");

            // Refresh flashcards for the current set
            // Correctly retrieve the setId for reloading
            if (finalSetId) {
                loadFlashcardSets();

                // Check if the overview modal is open and refresh it
                const overviewModal = document.getElementById('flashcardOverviewModal');
                if (overviewModal.style.display === 'flex') {
                    openOverviewModal(finalSetId);
                }
                else{

                    // Handle editing vs. creating
                    if(!flashcardId) {
                        openFlashcardModal(finalSetId);
                    }
                    else {
                        // If editing, close the modal
                        closeFlashcardModal();
                        loadFlashcards(finalSetId);
                    }
                    
                }

            } else {
                console.error("Set ID missing when reloading flashcards.");
            }

        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to delete an individual flashcard
function deleteFlashcard(flashcardId) {

    const setId = document.getElementById("flashcardDisplayModal").getAttribute("data-set-id");

    //console.log('Set ID:', setId);

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
            //console.log("Delete flashcard response:", data);
            if (data.status === 'success') {
                alert(data.message);

                // Dynamically update the card count
                
                const flashcardSetElement = document.querySelector(`.study-set[data-set-id="${setId}"]`);
                
                //console.log('Flashcard Set Element:', flashcardSetElement);

                if (flashcardSetElement) {
                    let currentCount = parseInt(flashcardSetElement.getAttribute('data-card-count'), 10);
                    if (!isNaN(currentCount)) {
                        
                        currentCount -= 1; // Decrement the count
                        //console.log('Current count:', currentCount);
                        

                        if (currentCount <= 0) {
                            closeFlashcardDisplayModal(); // Close modal if no cards remain
                        } else {
                            showNextFlashcard(); // Show the next flashcard
                        }

                    }
                }

                // Refresh flashcard sets to reflect the updated card count
                loadFlashcardSets();

                // Refresh overview modal if it is open
                const overviewModal = document.getElementById('flashcardOverviewModal');
                if (overviewModal.style.display === 'flex') {
                    openOverviewModal(setId); // Reload the overview modal with the updated set
                }


            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error('Error deleting flashcard:', error));
    }
}

function toggleMasterStatus(flashcardId) {
    // Validate the flashcard ID
    if (!flashcardId) {
        console.error("Flashcard ID is required to toggle master status.");
        return;
    }

    // Get the button element
    const masterButton = document.getElementById(`masterFlashcardBtn`);
    if (!masterButton) {
        console.error("Master button not found.");
        return;
    }

    const setId = document.getElementById("flashcardDisplayModal").getAttribute("data-set-id");

    // Determine the current state based on button text
    const isCurrentlyMastered = masterButton.innerText === 'Unmaster';

    // Prepare the request payload
    const requestData = {
        type: 'mark_mastered',
        flashcard_id: flashcardId,
        mastered: isCurrentlyMastered ? 0 : 1 // Toggle the state
    };

    // Make the API call
    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData)
    })
    .then(response => response.json())
    .then(data => {
        //console.log("Toggle Master Status response:", data);

        if (data.status === 'success') {
            alert(data.message);

            // Update button text based on the new state
            masterButton.innerText = isCurrentlyMastered ? 'Master' : 'Unmaster';

            // Refresh flashcard sets and overview modal if needed
            loadFlashcardSets(); // Refresh to update mastered counts in the set

            const overviewModal = document.getElementById('flashcardOverviewModal');
            if (overviewModal.style.display === 'flex') {
                openOverviewModal(setId); // Reload the overview modal with the updated set
            }

        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}


/* DISPLAYING AND NAVIGATING FLASHCARDS FUNCTIONS */

function loadFlashcards(setId) {
    console.log(`Loading flashcards for set ID: ${setId}`);

    fetch(`${FLASHCARDS_URL}&set_id=${setId}`)
        .then(response => response.json())
        .then(data => {
            //console.log("Flashcards response:", data);

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                
                // Filter out mastered MCQs
                const filteredFCs = data.data.filter(flashcardData => !flashcardData.is_mastered);
                
                if (filteredFCs.length > 0) {
                    // Store flashcards and reset index
                    window.currentFlashcards = filteredFCs.map(flashcardData => new Flashcard(
                        flashcardData.flashcard_id,
                        setId, // Pass the setId to the constructor
                        flashcardData.question,
                        flashcardData.answer,
                        !!flashcardData.is_mastered // Convert to boolean
                        
                    ));

                    if(!window.currentFlashcardIndex){
                        window.currentFlashcardIndex = 0;
                    } else {
                        // Ensure the index is within bounds after reload
                        window.currentFlashcardIndex = Math.min(window.currentFlashcardIndex, window.currentFlashcards.length - 1);
                    }

                    // Display the first flashcard
                    displayCard(window.currentFlashcards[window.currentFlashcardIndex]);

                } else {
                    //console.log("No non-mastered FCs found for this set.");
                    alert("All FCs in this set are mastered."); // Show an alert message
                }
            } else {
                //console.log("Flashcards array is empty for this set.");
                alert("No flashcards found for this set."); // Show an alert message
            }
        })
        .catch(error => console.error("Error loading flashcards:", error));
}


function displayCard(flashcard) {

    //console.log(`Displaying card with Set ID: ${flashcard.setId}, Flashcard ID: ${flashcard.flashcardId}`);
    //console.log(`Current FC Index: ${window.currentFlashcardIndex}`);

    const cardModal = document.getElementById('flashcardDisplayModal'); 

    if (!cardModal) {
        console.error("Modal element not found in the template.");
        return; // Safely exit if the modal is missing in the template
    }

    // Set the data-set-id attribute for the modal
    cardModal.setAttribute('data-set-id', flashcard.setId);

    // Populate the flashcard data
    const questionElement = cardModal.querySelector('#displayQuestion');
    const answerElement = cardModal.querySelector('#displayAnswer');
    

    questionElement.textContent = flashcard.question;
    answerElement.textContent = flashcard.answer;

    // Initially hide the answer
    answerElement.style.display = 'none';

    // Toggle Answer Button
    const toggleButton = cardModal.querySelector('#toggleAnswerBtn');
    toggleButton.textContent = 'Show Answer';
    if (toggleButton) {
        toggleButton.onclick = () => {
            if (answerElement.style.display === 'none') {
                answerElement.style.display = 'block';
                toggleButton.textContent = 'Hide Answer';
            } else {
                answerElement.style.display = 'none';
                toggleButton.textContent = 'Show Answer';
            }
        };
    }

    // Edit Button
    const editButton = cardModal.querySelector('#editFlashcardBtn');
    if (editButton) {
        editButton.onclick = () => {
            openFlashcardModal(flashcard.setId, flashcard.flashcardId, flashcard.question, flashcard.answer);
        };
    }

    // Delete Button
    const deleteButton = cardModal.querySelector('#deleteFlashcardBtn');
    if (deleteButton) {
        deleteButton.onclick = () => {
            
            deleteFlashcard(flashcard.flashcardId);
            
        };
    }

    // **Master Button**
    const masterButton = cardModal.querySelector('#masterFlashcardBtn');
    if (masterButton) {
        // Set initial button text based on `isMastered`
        masterButton.textContent = flashcard.isMastered ? 'Unmaster' : 'Master';

        masterButton.onclick = () => {
            toggleMasterStatus(flashcard.flashcardId);

            // Update the button text dynamically
            flashcard.isMastered = !flashcard.isMastered; // Toggle the state
            masterButton.textContent = flashcard.isMastered ? 'Unmaster' : 'Master';
        };
    }

    // Add event listener for Previous button
    const prevButton = cardModal.querySelector('#prevFlashcardBtn');
    prevButton.addEventListener('click', showPreviousFlashcard);

    // Add event listener for Next button
    const nextButton = cardModal.querySelector('#nextFlashcardBtn');
    nextButton.addEventListener('click', showNextFlashcard);

    // Add event listener for Close button
    const closeButton = cardModal.querySelector('#closeCard');
    closeButton.addEventListener('click', closeFlashcardDisplayModal);

    // Show the modal
    cardModal.style.display = 'flex';
    
}


function closeFlashcardDisplayModal() {
    document.getElementById("flashcardDisplayModal").style.display = "none";
}

/*function toggleFlashcardAnswer(direction = null) {
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
window.toggleFlashcardAnswer = toggleFlashcardAnswer;*/

function wrapIndex(index, length) {
    return (index + length) % length;
}

function showNextFlashcard() {
    if (window.currentFlashcards && window.currentFlashcards.length > 0) {
        // Increment the index and wrap around if necessary
        window.currentFlashcardIndex = wrapIndex(window.currentFlashcardIndex + 1, window.currentFlashcards.length);
        const nextFlashcard = window.currentFlashcards[window.currentFlashcardIndex];

        closeFlashcardDisplayModal();

        displayCard(nextFlashcard);

    }
}

function showPreviousFlashcard() {
    if (window.currentFlashcards && window.currentFlashcards.length > 0) {
        // Decrement the index and wrap around if necessary
        window.currentFlashcardIndex = wrapIndex(window.currentFlashcardIndex - 1, window.currentFlashcards.length);
        const previousFlashcard = window.currentFlashcards[window.currentFlashcardIndex];

        closeFlashcardDisplayModal();

        displayCard(previousFlashcard);

    }
}

function openOverviewModal(setId) {

    //console.log(`Opening overview modal for set ID: ${setId}`);
    fetch(`${FLASHCARDS_URL}&set_id=${setId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                const modal = document.getElementById('flashcardOverviewModal');
                const container = document.getElementById('flashcardOverviewContainer');

                // Clear any existing content
                container.innerHTML = '';

                // Ensure the currentFlashcards array and index are set
                window.currentFlashcards = data.data.map(flashcard => new Flashcard(
                    flashcard.flashcard_id,
                    setId,
                    flashcard.question,
                    flashcard.answer,
                    !!flashcard.is_mastered // Include isMastered for consistency
                ));

                // Populate the modal with flashcard data
                data.data.forEach(flashcard => {
                    const flashcardPair = document.createElement('div');
                    flashcardPair.classList.add('flashcard-pair');

                    // Set border color if mastered
                    if (flashcard.is_mastered) {
                        flashcardPair.style.border = '2px solid #5dd75d'; // Green border
                    }

                    const questionDiv = document.createElement('div');
                    questionDiv.textContent = `Q: ${flashcard.question}`;
                    questionDiv.style.fontWeight = 'bold';

                    const answerDiv = document.createElement('div');
                    answerDiv.textContent = `A: ${flashcard.answer}`;

                    flashcardPair.appendChild(questionDiv);
                    flashcardPair.appendChild(answerDiv);

                    // Add click event listener to open individual flashcard display
                    flashcardPair.addEventListener('click', () => {
                       
                        window.currentFlashcardIndex = window.currentFlashcards.findIndex(
                            card => card.flashcardId === flashcard.flashcard_id
                        );

                        // Display the selected flashcard
                        displayCard(window.currentFlashcards[window.currentFlashcardIndex]); // Call the existing displayCard function
                    });

                    container.appendChild(flashcardPair);
                });

                // Show the modal
                modal.style.display = 'flex';
            } else {
                alert('No flashcards found for this set.');
            }
        })
        .catch(error => {
            console.error('Error loading flashcards for overview:', error);
            alert('An error occurred while loading the flashcard overview.');
        });
}
window.openOverviewModal = openOverviewModal;

function closeOverviewModal() {
    const modal = document.getElementById('flashcardOverviewModal');
    modal.style.display = 'none';
}
window.closeOverviewModal = closeOverviewModal;

/* GENERAL FUNCTIONS */

// Function to close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.options-menu').forEach(menu => {
        menu.style.display = 'none';
    });
}

async function populateSemesterButtons() {
    const container = document.getElementById('semesterButtonsContainer');
    container.innerHTML = ''; // Clear any existing buttons

    try {
        // Fetch semesters using the utility function
        const semesters = await fetchSemesters();

        if (semesters.length > 0) {
            semesters.forEach((semester) => {
                const button = document.createElement('button');
                button.className = 'filter-btn'; // Apply the filter-btn class
                button.textContent = semester.name;
                button.setAttribute('data-semester-id', semester.semester_id);

                // Append the button to the container
                container.appendChild(button);
            });
        } else {
            // Show a placeholder message if no semesters are available
            const message = document.createElement('p');
            message.textContent = 'No semesters defined';
            message.style.color = 'white'; // Optional: Style to match your theme
            container.appendChild(message);
        }
    } catch (error) {
        console.error('Error fetching semesters:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Error loading semesters';
        errorMessage.style.color = 'red';
        container.appendChild(errorMessage);
    }

}

async function populateCourseButtons(semesterId = null) {

    const container = document.getElementById('courseButtonsContainer');
    container.innerHTML = ''; // Clear any existing buttons

    // Log the semesterId to verify its value
    //console.log(`Populating course buttons for semesterId: ${semesterId}, type: ${typeof semesterId}`);

    try {
        // Fetch courses with optional semester filter
        const courses = semesterId 
            ? await fetchCourses(semesterId) 
            : await fetchCourses();

        if (courses.length > 0) {
            courses.forEach((course) => {
                const button = document.createElement('button');
                button.className = 'filter-btn'; // Apply the filter-btn class
                button.textContent = `${course.prefix} ${course.course_number}: ${course.name}`;
                button.setAttribute('data-course-id', course.course_id);
                // Log the courseId to verify
                //console.log(`Course button set: ${course.course_id}`);

                // Add click event listener to the button
                button.addEventListener('click', () => {
                    const courseId = button.getAttribute('data-course-id');
                    //console.log(`Course ID selected: ${courseId}`);
                    loadFlashcardSets(null, courseId); // Filter FC sets by course ID and semester
                });

                // Append the button to the container
                container.appendChild(button);
            });
        } else {
            // Show a placeholder message if no courses are available
            const message = document.createElement('p');
            message.textContent = 'No courses defined';
            message.style.color = 'white'; // Optional: Style to match your theme
            container.appendChild(message);
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Error loading courses';
        errorMessage.style.color = 'red';
        container.appendChild(errorMessage);
    }
}

// Function to check for set_id in the URL and load the corresponding flashcards
function checkAndLoadFlashcards() {
    // Get the query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get('set_id'); // Extract the set_id parameter

    console.log('checkAndLoadFlashcards called.');

    if (setId) {
        console.log(`Loading flashcards for set_id: ${setId}`);
        loadFlashcards(setId); // Call the existing loadFlashcards function
    } else {
        console.log('No set_id found in URL.');
        // Optional: Handle cases where no set_id is found, if needed
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Load flashcard sets into the container
    loadFlashcardSets();

    
    
    // Event listeners for modal buttons
    const saveSetButton = document.getElementById("saveSetBtn");
    const addFlashcardButton = document.getElementById("addFlashcardBtn");
    const closeButton = document.getElementById("closeOverviewModal");

    if (closeButton) {
        closeButton.addEventListener("click", closeOverviewModal);
    }
    

    if (saveSetButton) {
        saveSetButton.addEventListener("click", handleSetUpload);
    }

    if (addFlashcardButton) {
        addFlashcardButton.addEventListener("click", () => {
            const setId = document.getElementById('fcCreationModal').getAttribute('data-set-id');
            saveFlashcard(setId);
        });
    }

    

    // Populate semester buttons dynamically
    populateSemesterButtons().then(() => {
        // Add event listeners to dynamically created semester buttons
        document.querySelectorAll('.filter-btn[data-semester-id]').forEach(button => {
            button.addEventListener('click', () => {
                const semesterId = button.getAttribute('data-semester-id');

                currentSemesterId = semesterId; // Update global variable
                
                // Log the semesterId to verify
                //console.log(`Semester ID selected: ${semesterId}`);
                
                // Dynamically populate course buttons for the selected semester
                populateCourseButtons(semesterId);

                // Load FC sets filtered by semester
                loadFlashcardSets(semesterId);
            });
        });
    });

    // Populate course buttons initially for all courses
    populateCourseButtons();


    // Add event listener for the "All Semesters" button (if always in static HTML)
    document.getElementById('allSemestersBtn').addEventListener('click', () => {
        currentSemesterId = null; // Reset to no semester filter
        loadFlashcardSets(); // Fetch all sets
        populateCourseButtons(currentSemesterId); // Populate all courses
    });

    // Add event listener for the "All Courses" button (if always in static HTML)
    document.getElementById('allCoursesBtn').addEventListener('click', () => {
        loadFlashcardSets(currentSemesterId); // Fetch all sets
    });

    // Add event listener for the search box
    document.getElementById('searchBox').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { // Check if the Enter key was pressed
            const searchTerm = event.target.value.trim(); // Get the search term
            //console.log(`Search initiated with term: ${searchTerm}`); // Debugging log

            // Call loadMCQSets with the search term
            loadFlashcardSets(null, null, searchTerm); // Pass null for semesterId and courseId
        }
    });
    // Add event listener for Clear Search button
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        const searchBox = document.getElementById('searchBox');
        searchBox.value = ''; // Clear the input field
        loadFlashcardSets(); // Reset to show all MCQ sets
    });

    // Close dropdowns if clicking outside of any dropdown
    document.addEventListener('click', closeAllDropdowns);

    /*const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get('set_id'); // Extract the set_id parameter

    console.log('checkAndLoadFlashcards called.');

    if (setId) {
        console.log(`Loading flashcards for set_id: ${setId}`);
        loadFlashcards(setId); // Call the existing loadFlashcards function
    } else {
        console.log('No set_id found in URL.');
        // Optional: Handle cases where no set_id is found, if needed
    }*/

    checkAndLoadFlashcards();

});