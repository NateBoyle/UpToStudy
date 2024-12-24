import { fetchSemesters, fetchCourses, fetchAssignments } from './UTSutils.js';
import { openModal, populateContainer } from './UTSevents.js';
//import { callEditCourse } from './UTSmodals.js';

/*** MODAL FUNCTIONS ***/

async function loadSemesters() {
    const dropdown = document.getElementById('semesterDropdown');
    dropdown.innerHTML = ''; // Clear existing options

    // Add the "No Semester" option
    const noSemesterOption = document.createElement('option');
    noSemesterOption.value = ""; // Use a specific value for "No Semester"
    noSemesterOption.textContent = "No Semester";
    dropdown.appendChild(noSemesterOption);

    // Add the default "Select a Semester" option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select a Semester";
    dropdown.appendChild(defaultOption);

    try {
        //console.log('Attempting to fetch semesters...');
        const semesters = await fetchSemesters(); // Use the utility function to fetch semesters
        //console.log('Fetched semesters:', semesters);

        if (semesters.length > 0) {
            // Populate the dropdown with the fetched semesters
            semesters.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.semester_id;
                option.textContent = semester.name; // Adjust to match your PHP response field
                dropdown.appendChild(option);
            });
        } else {
            console.warn('No semesters available');
            dropdown.innerHTML = '<option value="">No semesters available</option>';
        }
    } catch (error) {
        console.error('Error loading semesters:', error);
        dropdown.innerHTML = '<option value="">Error loading semesters</option>';
    }
}

function openAddAssignmentModal(course) {
    const entity = 'assignment'; // Prefill entity type
    const modalId = 'assignmentModal'; // ID of the modal we just imported
    const item = {
        course_id: course.course_id, // Prefill with course ID
        title: '', // Empty title for a new assignment
        due_date: '', // Default empty date
        due_time: '', // Default empty time
        description: '', // Default empty description
        points: '', // Default empty points
    };

    openModal(entity, modalId, item);
}

function getLetterGrade(pointsEarned, pointsPossible) {
    console.log(`Points Earned: ${pointsEarned}, Points Possible: ${pointsPossible}`);
    if (pointsPossible === '0.00') return 'N/A'; // Avoid division by zero
    const percentage = (pointsEarned / pointsPossible) * 100;

    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

export async function openCourseFromCalendar(courseId) {

    console.log("Editing course with ID:", courseId); // Debugging line
    
    let course;

    const result = await fetchCourses(null, courseId);
        if (result.length > 0) {
            course = result[0];
            openCourseModal(course);
        } else {
            throw new Error(`Failed to fetch course with ID: ${courseId}`);
        }
    
    if (!course) {
        console.error("Course not found");
        return;
    }

}

export function openCourseModal(course = null) {

    const modal = document.getElementById('modal');
    const form = document.getElementById('addCourseForm');
    const modalHeading = document.getElementById('modalHeading');
    
    const assignmentsLabel = document.getElementById('assignmentsLabel');
    const assignmentContainer = document.getElementById('assignmentContainer4Course');
    const gradeLabel = document.getElementById('gradeLabel');
    const gradeSpan = document.getElementById('pointsAndGrade');

    const addCourseBtn = document.getElementById('addCourseBtn');
    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    const deleteCourseBtn = document.getElementById('deleteCourseBtn');
    

    // Reset the form to clear previous values
    form.reset();

    // Call loadSemesters to populate the dropdown
    loadSemesters().then(() => {
        // After semesters are loaded, set the selected value
        /*const semesterDropdown = document.getElementById('semesterDropdown');
        semesterDropdown.value = course.semester_id || "";*/
    });

    const closeModalBtn = document.getElementById('closeModalBtn');

    closeModalBtn.addEventListener('click', () => {

        modal.style.display = 'none';

    });


    if (course) {

        console.log("Editing course with ID:", course.course_id); // Debugging line

        // Change heading text to "Edit Course Details"
        modalHeading.textContent = "Edit Course Details";

        // Populate fields with course data
        document.getElementById('courseName').value = course.name;
        document.getElementById('prefix').value = course.prefix || '';
        document.getElementById('courseNumber').value = course.course_number || '';
        document.getElementById('startTime').value = course.start_time || '';
        document.getElementById('endTime').value = course.end_time || '';
        document.getElementById('semesterDropdown').value = course.semester_id || "";
        document.getElementById('courseColor').value = course.color;

        // Populate day checkboxes
        document.querySelectorAll('.day-checkbox').forEach(checkbox => {
            checkbox.checked = course.days.includes(checkbox.value);
        });

        // Add the "editing" class to inputs
        document.querySelectorAll('#addCourseForm input, #addCourseForm select').forEach(input => {
            if (!['startTime', 'endTime'].includes(input.id)) {
                input.classList.add('input-editing');
            }
        });
    
        // Display course-specific elements
        assignmentsLabel.style.display = 'block';
        assignmentContainer.style.display = 'flex';
        addAssignmentBtn.style.display = 'inline-block';
        deleteCourseBtn.style.display = 'inline-block';
        gradeLabel.style.display = 'block';

        // Populate assignments in the container
        populateContainer('assignmentContainer4Course', fetchAssignments, 'assignment', course.course_id);

        // Update grade label
        const totalPointsEarned = course.total_points_earned || 0;
        const totalPointsPossible = course.total_points_possible || 0;
        const letterGrade = getLetterGrade(totalPointsEarned, totalPointsPossible);
        gradeSpan.textContent = `${totalPointsEarned}/${totalPointsPossible} (${letterGrade})`;

        addCourseBtn.textContent = "Save Changes";
        addCourseBtn.onclick = function(e) {
            e.preventDefault();
            handleSaveCourseChanges(course.course_id);
        };

        // Add event listener for the Add Assignment button
        addAssignmentBtn.onclick = (e) => {
            e.preventDefault(); // Prevent the default form submission behavior
            console.log(`Adding assignment for: ${course.prefix} ${course.course_number}`);
            // Logic to add assignment (if needed)
            openAddAssignmentModal(course); // Pass the current course to prefill modal data
        };

        deleteCourseBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete ${course.prefix} ${course.course_number}?`)) {
                deleteCourse(course.course_id);
            }
        };

    } else {

        console.log(`Add new course opened.`);

        modalHeading.textContent =  "Add New Course";

        // Hide course-specific elements
        assignmentsLabel.style.display = 'none';
        assignmentContainer.style.display = 'none';
        addAssignmentBtn.style.display = 'none';
        deleteCourseBtn.style.display = 'none';
        gradeLabel.style.display = 'none';

        document.querySelectorAll('#addCourseForm input, #addCourseForm select').forEach(input => {
            input.classList.remove('input-editing');
        });

        addCourseBtn.textContent = "Add Course";
        addCourseBtn.onclick = () => {
            handleAddCourse();
        };
    }

    // Show the modal
    modal.style.display = 'flex';
}
// Attach to global window object
window.openCourseModal = openCourseModal;

/*** ADD, EDIT, DELETE COURSE FUNCTIONS ***/
function displayErrors(errors) {
    console.log("Errors:", errors); // Debugging line
    if (errors) {
        Object.entries(errors).forEach(([key, message]) => {
            const errorSpan = document.getElementById(`${key}Error`);
            if (errorSpan) errorSpan.textContent = message;
        });
    }
}

function handleAddCourse(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('addCourseForm'));

    formData.append('semester', document.getElementById('semesterDropdown').value);

    const days = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(checkbox => checkbox.value);
    formData.set('daysOfWeek', JSON.stringify(days));

    if (!formData.has('courseColor') || !formData.get('courseColor')) {
        formData.append('courseColor', '#7DBC4B');
    }

    fetch('UTScoursehandler.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert("Course added successfully!");
            location.reload();
        } else {
            displayErrors(data.errors);
        }
    })
    .catch(error => console.error('Error:', error));
}

function handleSaveCourseChanges(courseId) {

    console.log("Attemping to save changes to course with ID:", courseId); // Debugging line
    const formData = new FormData(document.getElementById('addCourseForm'));
    formData.append("courseId", String(courseId));

    // Convert empty semester value to NULL
    const semesterValue = document.getElementById('semesterDropdown').value;
    formData.append('semester', semesterValue === "" ? null : semesterValue);

    const days = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(checkbox => checkbox.value);
    formData.set('daysOfWeek', JSON.stringify(days));

    console.log("FormData contents:");
    for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    fetch("UTScoursehandler.php", {
        method: "POST",
        body: formData
    })
    .then(response =>{
        console.log("Raw response:", response); // Debugging line
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        console.log("Response data:", data); // Debugging line
        if (data.status === "success") {
            alert("Course updated successfully!");
            location.reload();
        } else {
            displayErrors(data.errors || { general: "Unknown error occurred" });
        }
    })
    .catch(error => console.error("Error updating course:", error));
}

function deleteCourse(courseId) {

    console.log("Deletinging course with ID:", courseId); // Debugging line

    
    fetch(`UTScoursehandler.php?id=${courseId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: courseId }) // Ensure courseId is set correctly
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert("Course deleted successfully!");
            location.reload();
        } else {
            alert("Failed to delete course.");
        }
    })
    .catch(error => console.error('Error deleting course:', error));
    
}
// Attach to global window object
window.deleteCourse = deleteCourse;

/*** POPULATE PAGE FUNCTIONS ***/

// Utility function for formatting time to 12-hour format
function formatTimeTo12Hour(time) {
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

async function populateCourseContainer(semesterId = null) {
    const container = document.getElementById('courseContainer');

    // Clear the container first
    container.innerHTML = '';

    try {
        // Fetch courses (optionally filtered by semesterId)
        const courses = await fetchCourses(semesterId);

        if (courses.length === 0) {
            // Handle no courses case
            container.innerHTML = '<p>No courses available</p>';
            return;
        }

        // Iterate through each course and create a card
        courses.forEach(course => {
            // Create course card
            const courseCard = document.createElement('div');
            courseCard.classList.add('course-card');

            const formattedDays = course.days.join(', ');

            const startTimeFormatted = formatTimeTo12Hour(course.start_time);
            const endTimeFormatted = formatTimeTo12Hour(course.end_time);

            courseCard.innerHTML = `
                <div class="course-header" style="background: ${course.color};">
                    <h2>${course.prefix} ${course.course_number}</h2>
                </div>
                <div class="course-content">
                    <p>Name: ${course.name}</p>
                    <p>Semester: ${course.semester_name || "Unassigned"}</p>
                    <p>Time: ${startTimeFormatted} - ${endTimeFormatted}</p>
                    <p>Days: ${formattedDays}</p>
                </div>
            `;

            // Attach click event to handle course editing
            const courseContent = courseCard.querySelector('.course-content');
            courseContent.addEventListener('click', () => openCourseModal(course));

            // Append course card to container
            container.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        container.innerHTML = '<p>Error loading courses. Please try again later.</p>';
    }
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

document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById('courseContainer')) {
        populateCourseContainer();
    }

    const showModalBtn = document.getElementById('showModalBtn');
    if (showModalBtn) {
        showModalBtn.addEventListener('click', () => {
            openCourseModal();
        });
    }

    const semesterButtonsContainer = document.getElementById('semesterButtonsContainer');

    if (semesterButtonsContainer) {
        // Populate semester buttons dynamically
        populateSemesterButtons().then(() => {
            // Add event listeners to dynamically created semester buttons
            document.querySelectorAll('.filter-btn[data-semester-id]').forEach(button => {
                button.addEventListener('click', () => {
                    const semesterId = button.getAttribute('data-semester-id');
                    populateCourseContainer(semesterId);
                });
            });
        });

        // Add event listener for the "All Semesters" button (if always in static HTML)
        const allSemestersBtn = document.getElementById('allSemestersBtn');
        if (allSemestersBtn) {
            allSemestersBtn.addEventListener('click', () => {
                populateCourseContainer(); // Fetch all courses
            });
        }
    }

    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', (e) => saveEntity(e, 'assignment', 'assignmentModal'));
    }

});