import { fetchCourses, fetchSemesters } from './UTSutils.js'; // Ensure the fetchs utilities is available
import { populateGoalSets, fetchAndSetSemesterName } from './UTSgoalSets.js';



/*// Fetch Current Semester and update the page header
async function fetchAndSetSemesterName() {
    try {
        const currentDate = new Date(); // Format as YYYY-MM-DD
        const semesters = await fetchSemesters(currentDate); // Pass the current date

        // Retrieve the first (and only) semester in the returned list
        const currentSemester = semesters[0];

        const semesterNameElement = document.getElementById('semesterName');

        if (currentSemester) {
            semesterNameElement.textContent = currentSemester.name;
            currentSemesterId = currentSemester.semester_id; // Assign semester_id to global variable
        } else {
            semesterNameElement.textContent = "No Current Semester";
            currentSemesterId = null; // Reset if no current semester
        }

    } catch (error) {
        console.error("Error fetching semester:", error);
        document.getElementById('semesterName').textContent = "Error Loading Semester";
        currentSemesterId = null; // Reset on error
    }
}*/

/*// Populate Course Dropdown
export async function populateCourseDropdown() {
    const dropdown = document.getElementById('goalCourse');
    dropdown.innerHTML = '<option value="" disabled selected>Select Course (optional)</option>'; // Clear previous options

    try {
        const courses = await fetchCourses(currentSemesterId); // Fetch courses from the backend
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.prefix} ${course.course_number} - ${course.name}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}*/

// Function to fetch total_time from the PHP script
async function fetchTotalTime() {
    try {
        // Fetch data from your PHP script
        const response = await fetch('UTSgoalsPage.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=fetchTotalTime' // Specify the action
        });
        const data = await response.json();

        // Check if the response was successful
        if (data.status === 'success') {
            const totalTimeInSeconds = data.total_time; // Total time in seconds
            updateTimeDisplay(totalTimeInSeconds); // Update the HTML
        } else {
            console.error("Error:", data.message);
            updateTimeDisplay(0); // Default to 0 if something goes wrong
        }
    } catch (error) {
        console.error("Failed to fetch total time:", error);
        updateTimeDisplay(0); // Default to 0 on failure
    }
}

// Function to convert seconds into Days, Hours, and Minutes and update the HTML
function updateTimeDisplay(totalSeconds) {
    const totalHours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let displayText = '';
    let datetimeValue = '';

    if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        displayText = `${days} Day(s), ${hours} Hour(s)`;
        datetimeValue = `P${days}DT${hours}H`;
    } else {
        displayText = `${totalHours} Hours, ${minutes} Minutes`;
        datetimeValue = `PT${totalHours}H${minutes}M`;
    }

    // Update the <time> element
    const timeElement = document.getElementById('totalTime');
    timeElement.textContent = displayText;
    timeElement.setAttribute('datetime', datetimeValue);
}


async function fetchAndCalculateStreak() {
    try {
        // Fetch activity dates from the backend
        const response = await fetch('UTSgoalsPage.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetchActivityStreak' }),
        });

        const data = await response.json();

        // Check if the response was successful
        if (data.success && Array.isArray(data.dates)) {
            const dates = data.dates; // Array of activity dates
            calculateStreak(dates);  // Call calculateStreak with the fetched dates
        } else {
            console.error("Failed to fetch activity streak:", data.message);
            document.getElementById("streakNumber").textContent = 0;
        }
    } catch (error) {
        console.error("Error fetching activity streak:", error);
        document.getElementById("streakNumber").textContent = 0;
    }
}

function calculateStreak(dates) {
    let streak = 0;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD

    //console.log(`dates: ${dates}`);
    //console.log(`Today: ${todayString}`);
    
    for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - streak); // Expected consecutive date

        const expectedDateString = expectedDate.toISOString().split('T')[0]; // Expected date in YYYY-MM-DD

        //console.log(`expectedDateString: ${expectedDateString}, activityDate: ${dates[i]}`);

        // Compare strings directly
        if (dates[i] === expectedDateString) {
            streak++; // Increment streak if dates match
        } else {
            break; // Stop counting if there’s a gap
        }
    }

    //console.log(`Final streak: ${streak}`);

    document.getElementById("streakNumber").textContent = streak;
}

async function fetchQuoteOfTheDay() {
    try {
        const response = await fetch('UTSgoalsPage.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetchQuoteOfTheDay' }),
        });

        const data = await response.json();

        if (data.success) {
            document.querySelector('.quote').textContent = `${data.quote}`;
            document.querySelector('.quote-author').textContent = `- ${data.author}`;
        } else {
            console.error("Failed to fetch quote:", data.message);
        }
    } catch (error) {
        console.error("Error fetching quote:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {

    fetchAndSetSemesterName(); // Populate semester name on page load

    // Fetch and display the total time on page load
    fetchTotalTime();

    // Fetch and display the total activity streak on page load
    fetchAndCalculateStreak();

    // Fetch and display the quote of the day on page load
    fetchQuoteOfTheDay();

    populateGoalSets();

    
});