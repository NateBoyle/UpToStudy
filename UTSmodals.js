import { fetchCourses, fetchAssignments, fetchToDos, fetchEvents, fetchSemesters } from './UTSutils.js'; // Import the fetches utility
import { populateContainer } from './UTSevents.js';

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

export async function callEditCourse(courseId) {
    
    console.log("Editing course with ID:", courseId); // Debugging line
    
    let course;

    const result = await fetchCourses(null, courseId);
        if (result.length > 0) {
            course = result[0];
            console.log(course);
        } else {
            throw new Error(`Failed to fetch course with ID: ${courseId}`);
        }
    
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

    document.getElementById('startTime').value = course.start_time;
    document.getElementById('endTime').value = course.end_time;
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

    document.getElementById('assignmentContainer4Course').style.display = 'flex';
    populateContainer('assignmentContainer4Course', fetchAssignments, 'assignment', courseId);

    const closeModalBtn = document.getElementById('closeModalBtn');

    closeModalBtn.addEventListener('click', () => {
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