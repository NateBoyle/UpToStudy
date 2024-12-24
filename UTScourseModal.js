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

function getLetterGrade(pointsEarned, pointsPossible) {
    if (pointsPossible === 0) return 'N/A'; // Avoid division by zero
    const percentage = (pointsEarned / pointsPossible) * 100;

    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
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
        const semesterDropdown = document.getElementById('semesterDropdown');
        semesterDropdown.value = course.semester_id || "";
    });

    const closeModalBtn = document.getElementById('closeModalBtn');

    closeModalBtn.addEventListener('click', () => {

        addCourseModal.style.display = 'none';

    });


    if (course) {

        console.log("Editing course with ID:", course.courseId); // Debugging line

        // Change heading text to "Edit Course Details"
        modalHeading.textContent = "Edit Course Details";

        // Populate fields with course data
        document.getElementById('courseName').value = course.course_name;
        document.getElementById('prefix').value = course.prefix || '';
        document.getElementById('courseNumber').value = course.course_number || '';
        document.getElementById('startTime').value = course.start_time || '';
        document.getElementById('endTime').value = course.end_time || '';
        document.getElementById('courseColor').value = course.course_color;

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
        gradeSpan.textContent = `${totalPointsEarned.toFixed(2)}/${totalPointsPossible.toFixed(2)} (${letterGrade})`;

        addCourseBtn.textContent = "Save Changes";
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

        deleteCourseBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete ${course.prefix} ${course.course_number}?`)) {
                deleteCourse(course.course_id);
            }
        };

    } else {

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

