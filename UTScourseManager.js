class Course {

    constructor(name, subject, professor, semester_id, semester_name, startTime, endTime, days, color, totalPoints, course_id) {
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
                <h2>${this.name}</h2>
                <button class="options-button">&#8942;</button>
                <div class="options-menu">
                    <button onclick="editCourse(${this.course_id})">Edit</button>
                    <button onclick="deleteCourse(${this.course_id})">Delete</button>
                </div>
            </div>
            <div class="course-content">
                <p>Subject: ${this.subject}</p>
                <p>Professor: ${this.professor}</p>
                <p>Semester: ${this.semester_name || "Unassigned"}</p>
                <p>Time: ${startTimeFormatted} - ${endTimeFormatted}</p>
                <p>Days: ${formattedDays}</p>
                <p>Total Points: ${this.totalPoints}</p>
            </div>
        `;

        const optionsButton = courseCard.querySelector('.options-button');
        const optionsMenu = courseCard.querySelector('.options-menu');

        optionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
        
            
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            optionsMenu.style.display = 'none';
        });

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

function editCourse(courseId) {

    console.log("Editing course with ID:", courseId); // Debugging line
    console.log("Current courses:", courseManager.courses); // Debugging line to check courseManager.courses
    const course = courseManager.courses.find(c => c.course_id === courseId);
    
    if (!course) {
        console.error("Course not found");
        return;
    }

    // Populate form fields with existing course data
    document.getElementById('courseName').value = course.name;
    document.getElementById('subject').value = course.subject;
    document.getElementById('professorName').value = course.professor;
    document.getElementById('semesterDropdown').value = course.semester_id || "";
    document.getElementById('startTime').value = course.startTime;
    document.getElementById('endTime').value = course.endTime;
    document.getElementById('totalPoints').value = course.totalPoints;
    document.getElementById('courseColor').value = course.color;

    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.checked = course.days.includes(checkbox.value);
    });

    // Change heading text to "Edit Course Details"
    document.getElementById('modalHeading').textContent = "Edit Course Details";

    const addCourseBtn = document.getElementById('addCourseBtn');
    addCourseBtn.textContent = "Save Changes";

    addCourseBtn.onclick = function(e) {
        e.preventDefault();
        handleSaveCourseChanges(courseId);
    };

    document.getElementById('modal').style.display = 'flex';

}

function handleSaveCourseChanges(courseId) {
    console.log("Attemping to save changes to course with ID:", courseId); // Debugging line
    const formData = new FormData(document.getElementById('addCourseForm'));
    formData.append("courseId", String(courseId));

    const days = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(checkbox => checkbox.value);
    formData.set('daysOfWeek', JSON.stringify(days));

    // Log courseColor to verify its value
    const courseColor = document.getElementById('courseColor').value;
    console.log("Course Color:", courseColor);

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

    if (confirm("Are you sure you want to delete this course?")) {
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
}

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

    loadCoursesFromDatabase(semester_id = null) {

        // Clear the current courses from the container
        this.container.innerHTML = '';

        // Prepare the request URL
        const url = semester_id
        ? `UTScoursehandler.php?semester_id=${semester_id}`
        : `UTScoursehandler.php`;

        fetch(url)
            .then(response => {
                console.log("Raw Response:", response);
                return response.json(); // Parse the JSON response
            })
            .then(courses => {
                console.log("Courses loaded:", courses); // Check the data being loaded
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
                        courseData.course_id
                    );
                    this.addCourse(loadedCourse);
                });
                console.log(courseManager.courses); // Check if courses are populated
            })
            .catch(error => console.error('Error loading courses:', error));
    }
}

let courseManager;

async function loadSemesters() {

    const dropdown = document.getElementById('semesterDropdown');
    dropdown.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select a Semester";
    dropdown.appendChild(defaultOption);

    try {
        console.log('Attempting to fetch semesters from UTSdefineSemester.php...');
        const response = await fetch('UTSdefineSemester.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetch' }),
        });

        console.log('Response received:', response);

        if (!response.ok) {
            console.error('Network error:', response.statusText);
            dropdown.innerHTML = '<option value="">Error loading semesters</option>';
            return;
        }

        const data = await response.json();
        console.log('Parsed response data:', data);

        if (data.success) {
            console.log('Fetched semesters:', data.data);
            // Populate the dropdown with the fetched semesters
            data.data.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.semester_id;
                option.textContent = semester.name; // Adjust to match your PHP response field
                dropdown.appendChild(option);
            });
        } else {
            console.warn('Failed to fetch semesters:', data.message);
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
        const response = await fetch('UTSdefineSemester.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetch' }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        if (data.success && data.data.length > 0) {
            data.data.forEach((semester) => {
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

function displayErrors(errors) {
    if (errors) {
        Object.entries(errors).forEach(([key, message]) => {
            const errorSpan = document.getElementById(`${key}Error`);
            if (errorSpan) errorSpan.textContent = message;
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {

    //const
    courseManager = new CourseManager('courseContainer');
    courseManager.loadCoursesFromDatabase();

    const addCourseForm = document.getElementById('addCourseForm');
    const modal = document.getElementById('modal');
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
        
        document.getElementById('modalHeading').textContent =  "Add New Course";
        
        addCourseForm.reset();
        addCourseBtn.textContent = "Add Course";
        addCourseBtn.onclick = handleAddCourse;

        // Call loadSemesters to populate the semester dropdown
        loadSemesters();
        

        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});