class Course {

    constructor(name, subject, professor, startTime, endTime, startDate, endDate, days, color, totalPoints, course_id) {
        this.name = name;
        this.subject = subject;
        this.professor = professor;
        this.startTime = startTime;
        this.endTime = endTime;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days;
        this.color = color;
        this.totalPoints = totalPoints;
        this.course_id = course_id;
    }

    formatDate(date) {
        if (!date) return "Unknown";
        const [year, month, day] = date.split("-");
        return `${month}-${day}-${year}`;
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
                <p>Time: ${startTimeFormatted} - ${endTimeFormatted}</p>
                <p>Start Date: ${this.formatDate(this.startDate)}</p>
                <p>End Date: ${this.formatDate(this.endDate)}</p>
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
    document.getElementById('startTime').value = course.startTime;
    document.getElementById('endTime').value = course.endTime;
    document.getElementById('startDate').value = course.startDate;
    document.getElementById('endDate').value = course.endDate;
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
    /*.then(text => {
        console.log("Response Text:", text); // Log response text to inspect HTML error message
        try {
            const data = JSON.parse(text); // Attempt to parse JSON
            if (data.status === "success") {
                alert("Course updated successfully!");
                location.reload();
            } else {
                displayErrors(data.errors || { general: "Unknown error occurred" });
            }
        } catch (error) {
            console.error("Error parsing JSON:", error, "Response Text:", text); // Log parsing error
        }
    })*/
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

    loadCoursesFromDatabase() {
        fetch('UTScoursehandler.php')
            .then(response => response.json())
            .then(courses => {
                console.log("Courses loaded:", courses); // Check the data being loaded
                courses.forEach(courseData => {
                    const loadedCourse = new Course(
                        courseData.name,
                        courseData.subject,
                        courseData.professor,
                        courseData.start_time || "N/A",
                        courseData.end_time || "N/A",
                        courseData.start_date || "Unknown",
                        courseData.end_date || "Unknown",
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

document.addEventListener("DOMContentLoaded", () => {

    //const
    courseManager = new CourseManager('courseContainer');
    courseManager.loadCoursesFromDatabase();

    const addCourseForm = document.getElementById('addCourseForm');
    const modal = document.getElementById('modal');
    const showModalBtn = document.getElementById('showModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');

    showModalBtn.addEventListener('click', () => {
        addCourseForm.reset();
        addCourseBtn.textContent = "Add Course";
        addCourseBtn.onclick = handleAddCourse;
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});

function handleAddCourse(e) {
    e.preventDefault();

    const formData = new FormData(document.getElementById('addCourseForm'));

    // Log startTime and endTime to confirm their values
    console.log("Start Time:", document.getElementById("startTime").value);
    console.log("End Time:", document.getElementById("endTime").value);

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
