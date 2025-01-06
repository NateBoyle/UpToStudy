import { fetchSemesters, fetchCourses } from './UTSutils.js';

// Constants for API endpoints
const API_URL = 'UTSmcqs.php';
const MCQ_SETS_URL = `${API_URL}?type=mcq_sets`; // Fetch MCQ sets
const MCQS_URL = `${API_URL}?type=mcqs`; // Fetch MCQs within a set

let currentSemesterId = null; // Tracks the selected semester

// CLASSES CODE
// MCQSet class for managing each MCQ set
class MCQSet {
    /**
     * Constructor to initialize an MCQSet instance
     * @param {number} setId - The unique ID for the MCQ set.
     * @param {string} setName - The name of the MCQ set.
     * @param {string} courseName - The name of the associated course (or "N/A").
     * @param {number} numQuestions - The number of questions in the set.
     * @param {number} questionsMastered - The number of mastered questions in the set.
     */
    constructor(setId, setName, courseName, courseId, coursePrefix, courseNumber, numQuestions, questionsMastered = 0) {
        this.setId = setId;
        this.setName = setName;
        this.courseName = courseName;
        this.courseId = courseId;
        this.coursePrefix = coursePrefix;
        this.courseNumber = courseNumber;
        this.numQuestions = numQuestions;
        this.questionsMastered = questionsMastered;
    }

    /**
     * Renders the MCQ set as an HTML element
     * @returns {HTMLElement} - The rendered MCQ set element.
     */
    render() {
        const setCard = document.createElement('div');
        setCard.classList.add('study-set');

        // Calculate the mastered percentage
        const masteredPercentage = this.numQuestions > 0 ? (this.questionsMastered / this.numQuestions) * 100 : 0;

        // Clickable area in the center of the set
        const clickableCenter = document.createElement('div');
        clickableCenter.classList.add('studySetClickable');
        clickableCenter.innerHTML = `
            <div class="study-set-header">
                <h2>${this.setName}</h2>
            </div>
            <p>Course: ${this.coursePrefix + ' ' +  this.courseNumber || 'N/A'}</p>
            <p>${this.numQuestions || 0}&nbsp; questions &nbsp;&nbsp;|&nbsp;&nbsp; ${this.questionsMastered || 0}&nbsp; mastered</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${masteredPercentage}%;"></div>
            </div>
        `;

        // Add click event to the center area
        clickableCenter.onclick = () => {
            //console.log(`Opening MCQ set: ${this.setId}`);
            loadMCQs(this.setId); // Load and display MCQs for the selected set
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
            <button onclick="openMCQModal(${this.setId})">Add Questions</button>
            <button onclick="editMCQSet(${this.setId}, '${this.setName}', '${this.courseId}')">Edit/Upload Set</button>
            <button onclick="deleteMCQSet(${this.setId})">Delete Set</button>
            <button onclick="openMCQOverviewModal(${this.setId})">View All</button>
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

// MCQ class for individual multiple-choice questions within a set
class MCQ {
    /**
     * Constructor to initialize an MCQ instance
     * @param {number} mcqId - The unique ID for the MCQ.
     * @param {number} setId - The ID of the set this MCQ belongs to.
     * @param {string} question - The question text for the MCQ.
     * @param {string} option1 - The first answer option.
     * @param {string} option2 - The second answer option.
     * @param {string} option3 - The third answer option.
     * @param {string} option4 - The fourth answer option.
     * @param {number} correctOption - The index (1-4) of the correct option.
     * @param {boolean} isMastered - The mastered status of the MCQ.
     */
    constructor(mcqId, setId, question, option1, option2, option3, option4, correctOption, isMastered) {
        this.mcqId = mcqId;
        this.setId = setId;
        this.question = question;
        this.option1 = option1;
        this.option2 = option2;
        this.option3 = option3;
        this.option4 = option4;
        this.correctOption = correctOption; // Index of the correct answer (1-4)
        this.isMastered = isMastered;
    }

    /**
     * Converts the MCQ instance to a structured data object for rendering
     * @returns {Object} - The MCQ data, including mastered state
     */
    toDisplayObject() {
        const labels = ['A.', 'B.', 'C.', 'D.']; // Labels for the options
        return {
            mcqId: this.mcqId,
            setId: this.setId,
            question: this.question,
            options: {
                1: `${labels[0]} ${this.option1}`,
                2: `${labels[1]} ${this.option2}`,
                3: `${labels[2]} ${this.option3}`,
                4: `${labels[3]} ${this.option4}`
            },
            correctOption: this.correctOption,
            isMastered: this.isMastered // Include the mastered state
        };
    }
}

// MCQ SETS CODE

// Function to open the modal for creating a new MCQ set
function openCreateMCQSetModal() {

    console.log("openCreateMCQSetModal function called.");

    // Reset the modal heading and inputs
    const modalHeading = document.querySelector("#setCreationModal h2");
    const setNameInput = document.getElementById("setNameInput");
    const courseDropdown = document.getElementById("courseDropdown");

    modalHeading.textContent = "Create New MCQ Set";
    setNameInput.placeholder = "Set Name";
    setNameInput.value = ""; // Clear any previous input

    // Reset the course dropdown to the default state
    courseDropdown.selectedIndex = 0;

    // Load courses dynamically (if required)
    loadCourses();

    // Display the modal
    document.getElementById("setCreationModal").style.display = "flex";
}
window.openCreateMCQSetModal = openCreateMCQSetModal;

// Define the function to close the MCQ creation modal
function closeCreateMCQSetModal() {
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
window.closeCreateMCQSetModal = closeCreateMCQSetModal;

// Load available courses to populate the MCQ dropdown
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
        courseDropdown.appendChild(placeholderOption);

        const noCourseOption = document.createElement('option');
        noCourseOption.value = '';
        noCourseOption.textContent = 'No course / N/A';
        courseDropdown.appendChild(noCourseOption);

        // Fetch courses via the utility function
        const courses = await fetchCourses();

        // Populate the dropdown with fetched courses
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.prefix} ${course.course_number}: ${course.name}`; // Combine prefix and course_number
            courseDropdown.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading courses:', error);

        // Optionally, handle error state for the dropdown
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading courses';
        errorOption.disabled = true;
        courseDropdown.appendChild(errorOption);
    }
}

// Load MCQ sets from the database and render them
function loadMCQSets(semesterId = null, courseId = null, searchTerm = '') {

    // Construct the URL dynamically based on provided arguments
    let url = MCQ_SETS_URL;

    // Append query parameters conditionally
    if (semesterId) url += `&semester_id=${encodeURIComponent(semesterId)}`;
    if (courseId) url += `&course_id=${encodeURIComponent(courseId)}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const mcqSetsContainer = document.getElementById('mcqSetsContainer');
            mcqSetsContainer.innerHTML = '';

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                const mcqGrid = document.createElement('div');
                mcqGrid.classList.add('study-set-grid');
                
                data.data.forEach(setData => {
                    // Pass questionsMastered to the MCQSet constructor
                    const mcqSet = new MCQSet(
                        setData.set_id, 
                        setData.set_name, 
                        setData.course_name,
                        setData.course_id,
                        setData.prefix,
                        setData.course_number,
                        setData.num_questions,
                        setData.questions_mastered // Field for questions mastered
                    );

                    const setElement = mcqSet.render();

                    // Set attributes directly
                    setElement.setAttribute('data-set-id', setData.set_id);
                    setElement.setAttribute('data-question-count', setData.num_questions);
                    setElement.setAttribute('data-questions-mastered', setData.questions_mastered);

                    mcqGrid.appendChild(setElement);
                });

                mcqSetsContainer.appendChild(mcqGrid);
            } else {
                const sampleSet = document.createElement('div');
                sampleSet.classList.add('study-set');
                sampleSet.innerHTML = `
                    <h2>Sample Set Name</h2>
                    <p>Course: N/A</p>
                    <p>15 questions  |  0 mastered</p>
                `;
                mcqSetsContainer.appendChild(sampleSet);
            }
        })
        .catch(error => console.error('Error loading MCQ sets:', error));
}

// Define the function to save an MCQ set
function saveMCQSet() {
    const setName = document.getElementById('setNameInput').value;
    const courseId = document.getElementById('courseDropdown').value;
    const setId = document.getElementById("setCreationModal").getAttribute("data-edit-set-id"); // Check if editing

    if (!setName) {
        alert("Set name is required.");
        return Promise.reject("Set name is required."); // Return a rejected promise if validation fails
    }

    const requestData = {
        type: setId ? 'edit_mcq_set' : 'add_mcq_set', // Choose action based on whether it's edit or add
        set_name: setName,
        course_id: courseId
    };

    if (setId) requestData.set_id = setId; // Include set_id for editing

    console.log("Saving MCQ set:", { setName, courseId }); // Debugging log

    return fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(requestData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Save MCQ set response:", data); // Debugging log
        if (data.status === 'success') {
            alert(data.message);
            document.getElementById("setCreationModal").removeAttribute("data-edit-set-id");
            closeCreateMCQSetModal();
            loadMCQSets();

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

function editMCQSet(setId, setName, courseId) {
    console.log("Editing MCQ set:", { setId, setName, courseId });

    // Open the modal
    document.getElementById("setCreationModal").style.display = "flex";
    
    // Change the modal heading to "Edit MCQ Set"
    const modalHeading = document.querySelector("#setCreationModal h2");
    modalHeading.textContent = "Edit MCQ Set";
    
    // Populate the input fields with the current set data
    document.getElementById("setNameInput").value = setName;
   
    // Load courses and set the selected course
    loadCourses().then(() => {
        const courseDropdown = document.getElementById("courseDropdown");

        // Find and select the option matching courseId
        const optionToSelect = Array.from(courseDropdown.options).find(
            option => option.value === courseId.toString() // Assuming courseId is a number or string
        );

        if (optionToSelect) {
            courseDropdown.value = optionToSelect.value; // Set the selected course
        } else {
            console.warn(`Course ID "${courseId}" not found in dropdown.`);
        }
    });
    
    // Save the setId for later use (e.g., in a hidden field or by setting a custom attribute)
    document.getElementById("setCreationModal").setAttribute("data-edit-set-id", setId);
}
window.editMCQSet = editMCQSet;

function deleteMCQSet(setId) {
    console.log(`Deleting MCQ set with ID: ${setId}`);
    // Implement deletion logic here
    if (confirm("Are you sure you want to delete this MCQ set?")) {
        fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'delete_mcq_set',
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
                loadMCQSets(); // Refresh the MCQ sets after deletion
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error('Error deleting MCQ set:', error));
    }
}
window.deleteMCQSet = deleteMCQSet;

document.getElementById("fileInput").addEventListener("change", function () {
    const fileName = this.files[0]?.name || "No file chosen"; // Get the file name or fallback text
    const fileNameDisplay = document.getElementById("fileName");

    fileNameDisplay.textContent = fileName; // Set the file name in the span

    // Change color based on whether a file is chosen
    fileNameDisplay.style.color = this.files[0] ? "white" : "#666"; // White for a file, gray (default) otherwise
});

function validateMCQData(mcqs) {
    return mcqs.every(row =>
        Object.keys(row).length === 6 &&              // Ensure exactly six keys (columns)
        row.Question?.trim() &&                       // Ensure Question is non-empty
        row.Option1?.trim() &&                        // Ensure Option1 is non-empty
        row.Option2?.trim() &&                        // Ensure Option2 is non-empty
        row.Option3?.trim() &&                        // Ensure Option3 is non-empty
        row.Option4?.trim() &&                        // Ensure Option4 is non-empty
        /^[1-4]+$/.test(row.CorrectOption) &&         // Ensure CorrectOption contains only digits 1-4
        new Set(row.CorrectOption.split('')).size <= 4 // Ensure no duplicates and max 4 unique options
    );
}

function handleMCQSetUpload() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0]; // Get the uploaded file, if any

    if (file) {
        // Parse the file with PapaParse
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                console.log("Parsed results:", results.data);

                // Validate the headers
                const expectedHeaders = ["Question", "Option1", "Option2", "Option3", "Option4", "CorrectOption"];
                const actualHeaders = results.meta.fields;

                const hasValidHeaders = expectedHeaders.every(header => actualHeaders.includes(header));
                if (!hasValidHeaders) {
                    alert("Invalid file format. Ensure the file has headers: 'Question', 'Option1', 'Option2', 'Option3', 'Option4', and 'CorrectOption'.");
                    return;
                }

                // Filter and validate the parsed data
                const filteredMCQs = results.data.filter(row =>
                    // Include all rows with valid data
                    row.Question?.trim() || row.Option1?.trim() || row.Option2?.trim() || row.Option3?.trim() || row.Option4?.trim() || row.CorrectOption?.trim()
                );

                if (!validateMCQData(filteredMCQs)) {
                    alert("Some rows are missing required fields or have invalid correct options.");
                    return;
                }

                // Save the set, then process filtered MCQs
                saveMCQSet().then(async setId => {
                    if (!setId || filteredMCQs.length === 0) {
                        console.error('Invalid data: No set ID or no MCQs to upload.');
                        return;
                    }

                    console.log("Uploading MCQs in chunks...");

                    // Split MCQs into chunks of 10 rows
                    const chunkSize = 10;
                    const chunks = [];
                    for (let i = 0; i < filteredMCQs.length; i += chunkSize) {
                        chunks.push(filteredMCQs.slice(i, i + chunkSize));
                    }

                    // Upload each chunk sequentially
                    for (const chunk of chunks) {
                        console.log("Uploading chunk:", chunk);
                        try {
                            const response = await fetch(API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    type: 'add_mcqs_bulk',
                                    set_id: setId,
                                    mcqs: JSON.stringify(chunk), // Send the current chunk as JSON
                                }),
                            });

                            const data = await response.json();
                            if (data.status === 'success') {
                                console.log("Chunk uploaded successfully:");
                                // Optional: Show a success message
                            } else {
                                console.error("Error uploading chunk:", data.message);
                                alert("Error: " + data.message);
                                break; // Stop processing if an error occurs
                            }
                        } catch (error) {
                            console.error("Error uploading chunk:", error);
                            alert("Error uploading MCQs. Please try again.");
                            break; // Stop processing if an error occurs
                        }
                    }

                    // Finalize the process
                    loadMCQSets();
                }).catch(error => {
                    console.error("Error saving set:", error);
                    alert("Error saving MCQ set. Please try again.");
                });
            },
            error: function (error) {
                console.error("Error parsing file:", error);
                alert("Error processing file. Please try again.");
            },
        });
    } else {
        // No file uploaded, just save the set
        saveMCQSet().then(() => {
            loadMCQSets();
        }).catch(error => {
            console.error("Error saving set:", error);
            alert("Error saving MCQ set. Please try again.");
        });
    }
}

// INDIVIDUAL MCQs FUNCTIONS
function openMCQModal(setId, mcqId = null, question = '', options = ['', '', '', ''], correctOption = '') {

    const modal = document.getElementById('mcqCreationModal');
    const heading = document.getElementById('mcqCreationModalHeading');
    const questionInput = document.getElementById('mcqQuestionInput');
    const optionInputs = [
        document.getElementById('mcqOption1'),
        document.getElementById('mcqOption2'),
        document.getElementById('mcqOption3'),
        document.getElementById('mcqOption4')
    ];
    
    const correctOptionCheckboxes = Array.from(
        document.querySelectorAll('#mcqCreationModal .mcq-correct-options input[type="checkbox"]')
    );

    const saveButton = document.getElementById('addMCQBtn');

    // If editing, update the heading and populate fields
    if (mcqId) {
        heading.textContent = 'Edit MCQ';
        questionInput.value = question;

        // Populate options
        options.forEach((option, index) => {
            if (optionInputs[index]) {
                optionInputs[index].value = option;
            }
        });

        // Reset all checkboxes to avoid lingering states
        correctOptionCheckboxes.forEach(checkbox => {
            checkbox.checked = false; // Clear previous selections
        });

         // Retrieve the correct options from the mcqDisplayModal's data attribute
        //const displayModal = document.getElementById('mcqDisplayModal'); // Reference the correct modal
        //const modalCorrectOptions = displayModal.getAttribute('data-correct-options') || '';
        const correctOptionString = String(correctOption);

        // Debugging log to verify correct options
        console.log(`Editing MCQ ID: ${mcqId}`);
        //console.log(`Modal Correct Options (from attribute): ${modalCorrectOptions}`);
        console.log(`Converted Correct Option String: ${correctOptionString}`);

        // Populate the correct options by checking the corresponding checkboxes
        correctOptionCheckboxes.forEach(checkbox => {
            if (correctOptionString.includes(checkbox.value)) {
                checkbox.checked = true; // Check the box if it matches
            }
        });

        modal.setAttribute('data-edit-mcq-id', mcqId); // Set MCQ ID for editing
        saveButton.textContent = 'Save Changes'; // Optional: Update button text
        
    } else {

        // For creating a new MCQ
        heading.textContent = 'Create New MCQ';
        questionInput.value = '';
        optionInputs.forEach(input => (input.value = '')); // Clear all option inputs

        // Clear all correct option checkboxes
        correctOptionCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        modal.removeAttribute('data-edit-mcq-id'); // Clear any editing reference
        saveButton.textContent = 'Add MCQ'; // Reset button text
    }

    // Show the modal
    modal.style.display = 'flex';
    modal.setAttribute('data-set-id', setId); // Associate the modal with the MCQ set
}
window.openMCQModal = openMCQModal;

function closeMCQModal() {
    const modal = document.getElementById('mcqCreationModal');

    // Hide the modal
    modal.style.display = 'none';

    // Clear the inputs
    document.getElementById('mcqQuestionInput').value = '';
    document.getElementById('mcqOption1').value = '';
    document.getElementById('mcqOption2').value = '';
    document.getElementById('mcqOption3').value = '';
    document.getElementById('mcqOption4').value = '';
    
    // Clear the checkboxes
    Array.from(document.querySelectorAll('#mcqCreationModal .mcq-correct-options input[type="checkbox"]')).forEach(checkbox => {
        checkbox.checked = false; // Uncheck all checkboxes
    });

    // Refresh MCQ sets to show the updated question count after closing the modal
    loadMCQSets();
}
window.closeMCQModal = closeMCQModal;

// Define the function to save an MCQ
function saveMCQ(setId = null, question = null, options = null) {

    // Retrieve the question, options, and (optional) MCQ ID for editing
    // If not provided, get them from the modal inputs
    question = question || document.getElementById('mcqQuestionInput').value;
    options = options || [
        document.getElementById('mcqOption1').value,
        document.getElementById('mcqOption2').value,
        document.getElementById('mcqOption3').value,
        document.getElementById('mcqOption4').value
    ];

    // Collect correct options from checkboxes
    const correctOption = Array.from(document.querySelectorAll('#mcqCreationModal .mcq-correct-options input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value)
        .join('');


    if (!correctOption) {
        alert("Please select at least one correct answer.");
        return;
    }

    const mcqId = document.getElementById("mcqCreationModal").getAttribute("data-edit-mcq-id");

    // Use the provided setId, or fetch from the modal if not provided (new)
    const finalSetId = setId || document.getElementById("mcqCreationModal")?.getAttribute("data-set-id");

    /*console.log('Attempting to save MCQ called with setId:', finalSetId);
    console.log("Question:", question);
    console.log("Options:", options);
    console.log("Correct Option:", correctOption);*/

    // Validate inputs
    if (!question || options.some(opt => !opt.trim()) || !correctOption) {
        alert("Question, all options, and at least one correct answer are required.");
        return;
    }

    // Determine the type of operation (new or edit)
    const requestType = mcqId ? 'edit_mcq' : 'add_mcq';

    //console.log("Saving MCQ:", { mcqId, question, options, correctOption, setId: finalSetId, requestType });

    // Construct the request payload
    const requestData = {
        type: requestType,
        question: question,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        correct_option: correctOption,
        set_id: finalSetId, // Use finalSetId for saving MCQs
    };

    // Include the MCQ ID for editing
    if (mcqId) {
        requestData.mcq_id = mcqId;
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
        //console.log("Save MCQ response:", data); // Debugging log

        if (data.status === 'success') {
            alert(data.message);

            if (finalSetId) {

                // Refresh MCQs for the current set
                loadMCQSets();

                // Check if the overview modal is open and refresh it
                const overviewModal = document.getElementById('mcqOverviewModal');
                if (overviewModal.style.display === 'flex') {

                    openMCQOverviewModal(finalSetId);

                } else {

                    // Handle editing vs. creating
                    if (!mcqId) {

                        openMCQModal(finalSetId);

                    } else {

                        // If editing, close the modal
                        closeMCQModal();
                        loadMCQs(finalSetId);

                    }
                    
                }

            } else {
                console.error("Set ID missing when reloading MCQs.");
            }

        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to delete an individual MCQ
function deleteMCQ(mcqId) {

    const setId = document.getElementById("mcqDisplayModal").getAttribute("data-set-id");

    console.log('Set ID:', setId);

    if (confirm("Are you sure you want to delete this MCQ?")) {
        fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'delete_mcq',
                mcq_id: mcqId
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Delete MCQ response:", data);
            if (data.status === 'success') {
                alert(data.message);

                // Dynamically update the question count
                const mcqSetElement = document.querySelector(`.study-set[data-set-id="${setId}"]`);

                console.log('MCQ Set Element:', mcqSetElement);

                if (mcqSetElement) {
                    let currentCount = parseInt(mcqSetElement.getAttribute('data-question-count'), 10);
                    if (!isNaN(currentCount)) {
                        currentCount -= 1; // Decrement the count
                        console.log('Current count:', currentCount);

                        if (currentCount <= 0) {
                            closeMCQDisplayModal(); // Close modal if no questions remain
                        } else {
                            showNextMCQ(); // Show the next MCQ
                        }
                    }
                }

                // Refresh MCQ sets to reflect the updated question count
                loadMCQSets();

                // Refresh overview modal if it is open
                const overviewModal = document.getElementById('mcqOverviewModal');
                if (overviewModal.style.display === 'flex') {
                    openMCQOverviewModal(setId); // Reload the overview modal with the updated set
                }

            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error('Error deleting MCQ:', error));
    }
}

function toggleMCQMasterStatus(mcqId) {
    // Validate the MCQ ID
    if (!mcqId) {
        console.error("MCQ ID is required to toggle master status.");
        return;
    }

    // Get the button element
    const masterButton = document.getElementById(`masterMCQBtn`);
    if (!masterButton) {
        console.error("Master button not found.");
        return;
    }

    const setId = document.getElementById("mcqDisplayModal").getAttribute("data-set-id");

    // Determine the current state based on button text
    const isCurrentlyMastered = masterButton.innerText === 'Unmaster';

    // Prepare the request payload
    const requestData = {
        type: 'mark_mcq_mastered',
        mcq_id: mcqId,
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
        console.log("Toggle Master Status response:", data);

        if (data.status === 'success') {
            alert(data.message);

            // Update button text based on the new state
            masterButton.innerText = isCurrentlyMastered ? 'Master' : 'Unmaster';

            // Refresh MCQ sets and overview modal if needed
            loadMCQSets(); // Refresh to update mastered counts in the set

            const overviewModal = document.getElementById('mcqOverviewModal');
            if (overviewModal.style.display === 'flex') {
                openMCQOverviewModal(setId); // Reload the overview modal with the updated set
                console.log('yo');
            }

        } else {
            alert("Error: " + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

/* DISPLAYING AND NAVIGATING MCQ FUNCTIONS */

function loadMCQs(setId) {
    console.log(`Loading MCQs for set ID: ${setId}`);

    fetch(`${MCQS_URL}&set_id=${setId}`)
        .then(response => response.json())
        .then(data => {
            //console.log("MCQs response:", data);

            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {

                // Filter out mastered MCQs
                const filteredMCQs = data.data.filter(mcqData => !mcqData.is_mastered);
                
                if (filteredMCQs.length > 0) {
                    // Store only non-mastered MCQs and reset index
                    window.currentMCQs = filteredMCQs.map(mcqData => new MCQ(
                        mcqData.mcq_id,
                        setId, // Pass the setId to the constructor
                        mcqData.question,
                        mcqData.option_1,
                        mcqData.option_2,
                        mcqData.option_3,
                        mcqData.option_4,
                        mcqData.correct_option,
                        !!mcqData.is_mastered // Convert to boolean
                    ));

                    if(!window.currentMCQIndex){
                        window.currentMCQIndex = 0;
                    } else {
                        // Ensure the index is within bounds after reload
                        window.currentMCQIndex = Math.min(window.currentMCQIndex, window.currentMCQs.length - 1);
                    }

                    // Display the current MCQ based on the retained index
                    displayMCQ(window.currentMCQs[window.currentMCQIndex]);

                } else {
                    console.log("No non-mastered MCQs found for this set.");
                    alert("All MCQs in this set are mastered."); // Show an alert message
                }

            } else {
                console.log("MCQ array is empty for this set.");
                alert("No MCQs found for this set."); // Show an alert message
            }
        })
        .catch(error => console.error("Error loading MCQs:", error));
}

function displayMCQ(mcq) {
    console.log(`Displaying MCQ with Set ID: ${mcq.setId}, MCQ ID: ${mcq.mcqId}, Correct Option: ${mcq.correctOption}`);
    console.log(`Current MCQ Index: ${window.currentMCQIndex}`);


    const mcqModal = document.getElementById('mcqDisplayModal');

    if (!mcqModal) {
        console.error("Modal element not found in the template.");
        return; // Safely exit if the modal is missing in the template
    }

    // Set the data-set-id attribute for the modal
    mcqModal.setAttribute('data-set-id', mcq.setId);

    // Populate the MCQ data
    const questionElement = mcqModal.querySelector('#mcqQuestionDisplay');
    const optionsContainer = mcqModal.querySelector('#mcqOptionsContainer');

    questionElement.textContent = mcq.question;
    optionsContainer.innerHTML = ''; // Clear any previous options

    // Populate options dynamically
    const optionLabels = ['A.', 'B.', 'C.', 'D.']; // Labels for the options
    [mcq.option1, mcq.option2, mcq.option3, mcq.option4].forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('mcq-option');
        
        // Add label (A., B., C., D.) in front of the option text
        optionElement.textContent = `${optionLabels[index]} ${option}`;

        // Assign a data attribute for the option index (1-based)
        optionElement.setAttribute('data-option-index', index + 1);

        // Append to options container
        optionsContainer.appendChild(optionElement);
    });

    // Store the correct option(s) as a numeric attribute on the modal
    mcqModal.setAttribute('data-correct-options', mcq.correctOption);

    // "Show Answer" Button
    const toggleButton = mcqModal.querySelector('#showMCQAnswerBtn');
    // Change text to "Hide Answer"
    toggleButton.textContent = "Show Answer";
    if (toggleButton) {
        toggleButton.onclick = () => {

            const correctOptions = mcq.correctOption; // Retrieve correct options
            // Ensure correctOption is treated as a string
            const correctOptionString = String(correctOptions);

            // Toggle logic: Check if the button text is "Show Answer" or "Hide Answer"
            if (toggleButton.textContent === "Show Answer") {
                // Change text to "Hide Answer"
                toggleButton.textContent = "Hide Answer";

                if (!correctOptionString) {
                    console.error("correctOption is missing or undefined.");
                    return;
                }

                // Highlight correct options
                const correctOptions = correctOptionString.length === 1
                    ? [Number(correctOptionString)] // Single correct option as array
                    : correctOptionString.split("").map(Number); // Multiple correct options as array;

                correctOptions.forEach(optionIndex => {
                    const correctOptionElement = optionsContainer.querySelector(`[data-option-index="${optionIndex}"]`);
                    if (correctOptionElement) {
                        correctOptionElement.classList.add('highlight-correct'); // Add the class for highlighting
                    }
                });
            } else {
                // Change text back to "Show Answer"
                toggleButton.textContent = "Show Answer";

                // Remove highlighting from all options
                optionsContainer.querySelectorAll('.highlight-correct').forEach(option => {
                    option.classList.remove('highlight-correct');
                });
            }
        };
    }

    // Edit Button
    const editButton = mcqModal.querySelector('#editMCQBtn');
    if (editButton) {
        editButton.onclick = () => {
            openMCQModal(mcq.setId, mcq.mcqId, mcq.question, [mcq.option1, mcq.option2, mcq.option3, mcq.option4], mcq.correctOption);
        };
    }

    // Delete Button
    const deleteButton = mcqModal.querySelector('#deleteMCQBtn');
    if (deleteButton) {
        deleteButton.onclick = () => {
            deleteMCQ(mcq.mcqId);
        };
    }

    // Master Button
    const masterButton = mcqModal.querySelector('#masterMCQBtn');
    if (masterButton) {
        // Set initial button text based on `isMastered`
        masterButton.textContent = mcq.isMastered ? 'Unmaster' : 'Master';

        masterButton.onclick = () => {
            toggleMCQMasterStatus(mcq.mcqId);

            // Update the button text dynamically
            mcq.isMastered = !mcq.isMastered; // Toggle the state
            masterButton.textContent = mcq.isMastered ? 'Unmaster' : 'Master';
        };
    }

    // Add event listener for Previous button
    const prevButton = mcqModal.querySelector('#prevMCQBtn');
    prevButton.addEventListener('click', showPreviousMCQ);

    // Add event listener for Next button
    const nextButton = mcqModal.querySelector('#nextMCQBtn');
    nextButton.addEventListener('click', showNextMCQ);

    // Add event listener for Close button
    const closeButton = mcqModal.querySelector('#closeMCQ');
    closeButton.addEventListener('click', closeMCQDisplayModal);

    // Show the modal
    mcqModal.style.display = 'flex';
}

function closeMCQDisplayModal() {
    document.getElementById("mcqDisplayModal").style.display = "none";
    // Clear highlighted correct options
    const optionsContainer = document.getElementById('mcqOptionsContainer');
    optionsContainer.querySelectorAll('.highlight-correct').forEach(option => {
        option.classList.remove('highlight-correct');
    });
}

function wrapIndex(index, length) {
    return (index + length) % length;
}

function showNextMCQ() {
    if (window.currentMCQs && window.currentMCQs.length > 0) {

        // Increment the index and wrap around if necessary
        window.currentMCQIndex = wrapIndex(window.currentMCQIndex + 1, window.currentMCQs.length);
        //console.log(`Current MCQ Index: ${window.currentMCQIndex}`);
        const nextMCQ = window.currentMCQs[window.currentMCQIndex];

        closeMCQDisplayModal();

        displayMCQ(nextMCQ);

    }
}

function showPreviousMCQ() {
    if (window.currentMCQs && window.currentMCQs.length > 0) {

        // Decrement the index and wrap around if necessary
        window.currentMCQIndex = wrapIndex(window.currentMCQIndex - 1, window.currentMCQs.length);
        const previousMCQ = window.currentMCQs[window.currentMCQIndex];

        closeMCQDisplayModal()
  
        displayMCQ(previousMCQ);

    }
}

function openMCQOverviewModal(setId) {
    console.log(`Opening MCQ overview modal for set ID: ${setId}`);
    fetch(`${MCQS_URL}&set_id=${setId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                const modal = document.getElementById('mcqOverviewModal');
                const container = document.getElementById('mcqOverviewContainer');

                // Clear any existing content
                container.innerHTML = '';

                // Ensure the currentMCQs array and index are set
                window.currentMCQs = data.data.map(mcq => new MCQ(
                    mcq.mcq_id,
                    setId,
                    mcq.question,
                    mcq.option_1,
                    mcq.option_2,
                    mcq.option_3,
                    mcq.option_4,
                    mcq.correct_option,
                    !!mcq.is_mastered // Include isMastered for consistency
                ));


                // Populate the modal with MCQ data
                data.data.forEach((mcq, index) => {
                    const mcqOverviewItem = document.createElement('div');
                    mcqOverviewItem.classList.add('mcq-group');

                    // Set border color if mastered
                    if (mcq.is_mastered) {
                        mcqOverviewItem.style.border = '2px solid #5dd75d'; // Green border
                    }

                    const questionDiv = document.createElement('div');
                    questionDiv.textContent = `Q.${index + 1}: ${mcq.question}`;
                    questionDiv.style.fontWeight = 'bold';

                    const optionsDiv = document.createElement('div');
                    optionsDiv.innerHTML = `
                        Options: 
                        <br>1) ${mcq.option_1}, 
                        <br>2) ${mcq.option_2}, 
                        <br>3) ${mcq.option_3}, 
                        <br>4) ${mcq.option_4}
                    `;

                    mcqOverviewItem.appendChild(questionDiv);
                    mcqOverviewItem.appendChild(optionsDiv);

                    // Add click event listener to open individual MCQ display
                    mcqOverviewItem.addEventListener('click', () => {
                        window.currentMCQIndex = window.currentMCQs.findIndex(
                            question => question.mcqId === mcq.mcq_id
                        );

                        // Display the selected MCQ
                        displayMCQ(window.currentMCQs[window.currentMCQIndex]); // Call the existing displayMCQ function
                    });

                    container.appendChild(mcqOverviewItem);
                });

                // Show the modal
                modal.style.display = 'flex';
            } else {
                alert('No MCQs found for this set.');
            }
        })
        .catch(error => {
            console.error('Error loading MCQs for overview:', error);
            alert('An error occurred while loading the MCQ overview.');
        });
}
window.openMCQOverviewModal = openMCQOverviewModal;

function closeMCQOverviewModal() {
    const modal = document.getElementById('mcqOverviewModal');
    modal.style.display = 'none';
}

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
    console.log(`Populating course buttons for semesterId: ${semesterId}, type: ${typeof semesterId}`);

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
                console.log(`Course button set: ${course.course_id}`);

                // Add click event listener to the button
                button.addEventListener('click', () => {
                    const courseId = button.getAttribute('data-course-id');
                    console.log(`Course ID selected: ${courseId}`);
                    loadMCQSets(null, courseId); // Filter MCQ sets by course ID and semester
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

document.addEventListener("DOMContentLoaded", () => {
    // Load MCQ sets into the container
    loadMCQSets();

    // Event listeners for modal buttons
    const saveSetButton = document.getElementById("saveSetBtn");
    const addMCQButton = document.getElementById("addMCQBtn");
    const closeButton = document.getElementById("closeMCQOverviewModal");

    if (closeButton) {
        closeButton.addEventListener("click", closeMCQOverviewModal);
    }

    if (saveSetButton) {
        saveSetButton.addEventListener("click", handleMCQSetUpload);
    }

    if (addMCQButton) {
        addMCQButton.addEventListener("click", () => {
            const setId = document.getElementById('mcqCreationModal').getAttribute('data-set-id');
            saveMCQ(setId);
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
                console.log(`Semester ID selected: ${semesterId}`);
                
                // Dynamically populate course buttons for the selected semester
                populateCourseButtons(semesterId);

                // Load MCQ sets filtered by semester
                loadMCQSets(semesterId);

            });
        });
    });

    // Populate course buttons initially for all courses
    populateCourseButtons();

    // Add event listener for the "All Semesters" button (if always in static HTML)
    document.getElementById('allSemestersBtn').addEventListener('click', () => {
        currentSemesterId = null; // Reset to no semester filter
        loadMCQSets(); // Fetch all sets
        populateCourseButtons(currentSemesterId); // Populate all courses
    });

    // Add event listener for the "All Courses" button (if always in static HTML)
    document.getElementById('allCoursesBtn').addEventListener('click', () => {
        loadMCQSets(currentSemesterId); // Fetch all sets
    });

    // Add event listener for the search box
    document.getElementById('searchBox').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { // Check if the Enter key was pressed
            const searchTerm = event.target.value.trim(); // Get the search term
            console.log(`Search initiated with term: ${searchTerm}`); // Debugging log

            // Call loadMCQSets with the search term
            loadMCQSets(null, null, searchTerm); // Pass null for semesterId and courseId
        }
    });
    // Add event listener for Clear Search button
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        const searchBox = document.getElementById('searchBox');
        searchBox.value = ''; // Clear the input field
        loadMCQSets(); // Reset to show all MCQ sets
    });

    // Close dropdowns if clicking outside of any dropdown
    document.addEventListener('click', closeAllDropdowns);
});
