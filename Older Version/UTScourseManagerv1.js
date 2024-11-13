class Course {
    constructor(name, subject, professor, startTime, endTime, startDate, endDate, days, color, totalPoints) {
        this.name = name;
        this.subject = subject;
        this.professor = professor;
        this.startTime = startTime;
        this.endTime = endTime;
        this.startDate = startDate;
        this.endDate = endDate;
        this.days = days; // Array of selected days
        this.color = color;
        this.totalPoints = totalPoints;
    }

    // Helper function to format date
    formatDate(date) {
        const [year, month, day] = date.split("-");
        return `${month}-${day}-${year}`;
    }

    render() {
        const courseCard = document.createElement('div');
        courseCard.classList.add('course-card'); // Assigns class instead of inline style

        const formattedDays = this.days.join(', '); // Join selected days with commas

        courseCard.innerHTML = `
            <div class="course-header" style="background: ${this.color};">
                <h2>${this.name}</h2>
            </div>
            <div class="course-content">
                <p>Subject: ${this.subject}</p>
                <p>Professor: ${this.professor}</p>
                <p>Time: ${this.startTime} - ${this.endTime}</p>
                <p>Start Date: ${this.formatDate(this.startDate)}</p>
                <p>End Date: ${this.formatDate(this.endDate)}</p>
                <p>Days: ${formattedDays}</p>
                <p>Total Points: ${this.totalPoints}</p>
            </div>
        `;

        return courseCard;
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

    // New method to load courses from the database
    loadCoursesFromDatabase() {
        fetch('/get_courses')  // Replace with the actual endpoint URL
            .then(response => response.json())
            .then(courses => {
                // Loop through each course and add it to the UI
                courses.forEach(courseData => {
                    const loadedCourse = new Course(
                        courseData.name,
                        courseData.subject,
                        courseData.professor,
                        courseData.startTime,
                        courseData.endTime,
                        courseData.startDate,
                        courseData.endDate,
                        courseData.days,
                        courseData.color,
                        courseData.totalPoints
                    );
                    this.addCourse(loadedCourse);
                });
            })
            .catch(error => {
                console.error('Error loading courses:', error);
            });
    }
    
}

document.addEventListener("DOMContentLoaded", () => {
    const courseManager = new CourseManager('courseContainer');
    const addCourseForm = document.getElementById('addCourseForm'); // Reference to the form

    // Modal functionality
    const modal = document.getElementById('modal');
    const showModalBtn = document.getElementById('showModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    showModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Add course event in modal
    document.getElementById('addCourseBtn').addEventListener('click', function (e) {

        e.preventDefault(); // Prevent the form from submitting and causing a page reload
       
        // Clear previous error messages
        document.querySelectorAll('.error').forEach(el => el.textContent = '');

        // Create a FormData object directly from the form
        const formData = new FormData(addCourseForm);

        // Add debug logs to check the collected values
        console.log('Collected Form Data:', Object.fromEntries(formData));
        
        // Get the selected days automatically
        let days = formData.getAll('daysOfWeek'); // Get the array of selected days

        // Ensure that days is an array, even if only one day is selected
        if (!Array.isArray(days)) {
            days = [days];
        }
        formData.set('daysOfWeek', JSON.stringify(days)); // Send it as a JSON string

        // Add default color if not selected
        if (!formData.has('courseColor') || !formData.get('courseColor')) {
            formData.append('courseColor', '#7DBC4B'); // Default color is green
        }

        // Send AJAX request to UTScoursehandler.php
        fetch('UTScoursehandler.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json(); // Parse the response as JSON if the status is OK
        })
        .then(data => {

            // Clear error messages before processing new response
            document.querySelectorAll('.error').forEach(el => el.textContent = '');

            if (data.status === 'success') {
                // Add course to the course manager
                const newCourse = new Course(
                    formData.get('courseName'),
                    formData.get('subject'),
                    formData.get('professorName'),
                    formData.get('startTime'),
                    formData.get('endTime'),
                    formData.get('startDate'),
                    formData.get('endDate'),
                    days,
                    formData.get('courseColor'),
                    formData.get('totalPoints')
                );
                courseManager.addCourse(newCourse);

                // Clear input fields and close modal
                addCourseForm.reset(); // Use the reset method to clear the form
                modal.style.display = 'none';

                alert('Course added successfully!');
            } else if (data.status === 'error') {
                // Display validation errors if present
                if (data.errors) {
                    console.log('Errors received:', data.errors); // Debugging log
                    // Loop through each error and display it in the corresponding span
                    for (const [key, message] of Object.entries(data.errors)) {
                        const errorSpan = document.getElementById(`${key}Error`);
                        if (errorSpan) {
                            errorSpan.textContent = message;
                        }
                    } 
                } else {
                    alert('Failed to add course. Please try again.');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
});
