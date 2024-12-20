import { fetchSemesters, fetchCourses, fetchAssignments } from './UTSutils.js';
import { openModal, populateContainer } from './UTSevents.js';
//import { callEditCourse } from './UTSmodals.js';

class Course {

    constructor(name, subject, professor, semester_id, semester_name, startTime, endTime, days, color, totalPoints, course_id, prefix, course_number) {
        this.name = name;
        this.subject = subject;
        this.professor = professor;
        this.semester_id = semester_id;
        this.semester_name = semester_name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.days = days;
        this.color = color;
        this.totalPoints = totalPoints;
        this.course_id = course_id;
        this.prefix = prefix;
        this.course_number = course_number;
        
    }


    formatTimeTo12Hour(time) {
        let [hour, minute] = time.split(':');
        hour = parseInt(hour, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12; // Convert to 12-hour format, with 12 instead of 0
        return `${hour}:${minute} ${ampm}`;
    }
    

    render() {
        const courseCard = document.createElement('div');
        courseCard.classList.add('course-card');

        const formattedDays = this.days.join(', ');

        // Assuming course.startTime and course.endTime are in HH:MM:SS format
        const startTimeFormatted = this.formatTimeTo12Hour(this.startTime);
        const endTimeFormatted = this.formatTimeTo12Hour(this.endTime);

        courseCard.innerHTML = `
            <div class="course-header" style="background: ${this.color};">
                <h2>${this.prefix} ${this.course_number}</h2>
            </div>
            <div class="course-content">
                
                <p>Name: ${this.name}</p>
                <p>Semester: ${this.semester_name || "Unassigned"}</p>
                <p>Time: ${startTimeFormatted} - ${endTimeFormatted}</p>
                <p>Days: ${formattedDays}</p>
                
            </div>
        `;

        // Attach click event to course-content only
        const courseContent = courseCard.querySelector('.course-content');
        courseContent.addEventListener('click', () => editCourse(this.course_id));

        return courseCard;
    }


}

function displayErrors(errors) {
    console.log("Errors:", errors); // Debugging line
    if (errors) {
        Object.entries(errors).forEach(([key, message]) => {
            const errorSpan = document.getElementById(`${key}Error`);
            if (errorSpan) errorSpan.textContent = message;
        });
    }
}

// Reset input styles when adding a new course
function resetFormStyles() {
    document.querySelectorAll('#addCourseForm input, #addCourseForm select').forEach(input => {
        input.classList.remove('input-editing');
    });
}

export function editCourse(courseId) {

    //callEditCourse(courseId);

    console.log("Editing course with ID:", courseId); // Debugging line
    //console.log("Current courses:", courseManager.courses); // Debugging line to check courseManager.courses
    const course = courseManager.courses.find(c => c.course_id === courseId);
    
    if (!course) {
        console.error("Course not found");
        return;
    }

    // Populate form fields with existing course data
    document.getElementById('courseName').value = course.name;
    //document.getElementById('subject').value = course.subject;
    //document.getElementById('professorName').value = course.professor;
    document.getElementById('prefix').value = course.prefix || ""; 
    document.getElementById('courseNumber').value = course.course_number || "";
    
    // Call loadSemesters to populate the dropdown
    loadSemesters().then(() => {
        // After semesters are loaded, set the selected value
        const semesterDropdown = document.getElementById('semesterDropdown');
        semesterDropdown.value = course.semester_id || "";
    });

    document.getElementById('startTime').value = course.startTime;
    document.getElementById('endTime').value = course.endTime;
    //document.getElementById('totalPoints').value = course.totalPoints;
    document.getElementById('courseColor').value = course.color;

    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.checked = course.days.includes(checkbox.value);
    });

    // Add the "editing" class to inputs
    document.querySelectorAll('#addCourseForm input, #addCourseForm select').forEach(input => {
        if (!['startTime', 'endTime'].includes(input.id)) {
            input.classList.add('input-editing');
        }
    });

    // Change heading text to "Edit Course Details"
    document.getElementById('modalHeading').textContent = "Edit Course Details";



    const addCourseBtn = document.getElementById('addCourseBtn');
    addCourseBtn.textContent = "Save Changes";

    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    const deleteCourseBtn = document.getElementById('deleteCourseBtn');

    // Show Add Assignment and Delete Course buttons
    addAssignmentBtn.style.display = 'inline-block';
    deleteCourseBtn.style.display = 'inline-block';
    

    addCourseBtn.onclick = function(e) {
        e.preventDefault();
        handleSaveCourseChanges(courseId);
    };

    // Add event listener for the Add Assignment button
    addAssignmentBtn.onclick = (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
        console.log(`Adding assignment for: ${course.prefix} ${course.course_number}`);
        // Logic to add assignment (if needed)
        openAddAssignmentModal(course); // Pass the current course to prefill modal data
    };

    // Add event listener for the Delete Course button
    deleteCourseBtn.onclick = () => {
        if (confirm(`Are you sure you want to delete ${course.prefix} ${course.course_number}?`)) {
            deleteCourse(courseId); // Call deleteCourse method
            //modal.style.display = 'none'; // Close the modal after deletion
        }
    };

    document.getElementById('assignmentsLabel').style.display = 'block';
    document.getElementById('assignmentContainer4Course').style.display = 'flex';
    populateContainer('assignmentContainer4Course', fetchAssignments, 'assignment', courseId);

    const closeModalBtn = document.getElementById('closeModalBtn');
    

    closeModalBtn.addEventListener('click', () => {

        document.getElementById('assignmentsLabel').style.display = 'none';
        document.getElementById('assignmentContainer4Course').style.display = 'none';

        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        const deleteCourseBtn = document.getElementById('deleteCourseBtn');

        // Hide Add Assignment and Delete Course buttons
        addAssignmentBtn.style.display = 'none';
        deleteCourseBtn.style.display = 'none';

        const addCourseModal = document.getElementById('modal');
        addCourseModal.style.display = 'none';
    });

    document.getElementById('modal').style.display = 'flex';

}

// Attach to global window object
window.editCourse = editCourse;

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

class CourseManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.courses = [];
    }

    addCourse(course) {
        this.courses.push(course);
        const courseElement = course.render();
        this.container.appendChild(courseElement);
    }

    async loadCoursesFromDatabase(semester_id = null) {
        // Clear the current courses from the container
        this.container.innerHTML = '';

        try {
            // Use fetchCourses utility to retrieve courses
            const courses = await fetchCourses(semester_id);

            

            if (courses.length > 0) {
                courses.forEach(courseData => {
                    const loadedCourse = new Course(
                        courseData.name,
                        courseData.subject,
                        courseData.professor,
                        courseData.semester_id || null,
                        courseData.semester_name || "Unassigned",
                        courseData.start_time || "N/A",
                        courseData.end_time || "N/A",
                        courseData.days,
                        courseData.color,
                        courseData.total_points || 0,
                        courseData.course_id,
                        courseData.prefix || "",
                        courseData.course_number || ""
                    );
                    this.addCourse(loadedCourse);
                });
            } else {
                console.warn('No courses available for the selected semester.');
            }

        } catch (error) {
            console.error('Error loading courses:', error);
            // Optionally display an error message to the user
        }
    }
}

let courseManager;

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


document.addEventListener("DOMContentLoaded", () => {

    //const
    courseManager = new CourseManager('courseContainer');
    courseManager.loadCoursesFromDatabase();

    const addCourseForm = document.getElementById('addCourseForm');
    const addCourseModal = document.getElementById('modal');
    const showModalBtn = document.getElementById('showModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');


    // Populate semester buttons dynamically
    populateSemesterButtons().then(() => {
        // Add event listeners to dynamically created semester buttons
        document.querySelectorAll('.filter-btn[data-semester-id]').forEach(button => {
            button.addEventListener('click', () => {
                const semesterId = button.getAttribute('data-semester-id');
                courseManager.loadCoursesFromDatabase(semesterId);
            });
        });
    });

    // Add event listener for the "All Semesters" button (if always in static HTML)
    document.getElementById('allSemestersBtn').addEventListener('click', () => {
        courseManager.loadCoursesFromDatabase(); // Fetch all courses
    });

    showModalBtn.addEventListener('click', () => {

        resetFormStyles(); // Reset styles for new course

        document.getElementById('modalHeading').textContent =  "Add New Course";
        
        addCourseForm.reset();
        addCourseBtn.textContent = "Add Course";
        addCourseBtn.onclick = handleAddCourse;

        // Call loadSemesters to populate the semester dropdown
        loadSemesters();
        

        modal.style.display = 'flex';
    });

    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', (e) => saveEntity(e, 'assignment', 'assignmentModal'));
    }

    closeModalBtn.addEventListener('click', () => {
        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        const deleteCourseBtn = document.getElementById('deleteCourseBtn');

        // Hide Add Assignment and Delete Course buttons
        addAssignmentBtn.style.display = 'none';
        deleteCourseBtn.style.display = 'none';

        addCourseModal.style.display = 'none';
    });
});