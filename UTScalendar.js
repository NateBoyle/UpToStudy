import { fetchSemesters } from './UTSdefineSemester.js';

let currentDate = new Date(); // Tracks the currently displayed month

// Function to populate the calendar
function populateCalendar() {
    const calendarGrid = document.querySelector(".calendar-grid");

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // Keeps the month as a number for calculations

    // For display purposes
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const displayMonth = monthNames[currentMonth]; // Convert the numeric month to a string

    // Update calendar header
    document.getElementById("year").textContent = currentYear;
    document.getElementById("month").textContent = displayMonth;

    // Get the first day of the month and the number of days in the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Get the number of days in the previous month
    const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Calculate the number of rows (6 rows of 7 days = 42 cells)
    const totalCells = 35;

    // Clear any existing cells (if any)
    calendarGrid.innerHTML = "";

    // Add cells for days from the previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell", "inactive-cell"); // Style as inactive
        cell.textContent = daysInPreviousMonth - i; // Fill in dates from the previous month
        calendarGrid.appendChild(cell);
    }

    // Add cells for each day of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell");
        cell.textContent = day; // Display the day number
        calendarGrid.appendChild(cell);

        // Highlight today's date
        if (
            day === currentDate.getDate() &&
            currentMonth === currentDate.getMonth() &&
            currentYear === currentDate.getFullYear()
        ) {
            cell.classList.add("today");
        }
    }

    // Calculate the remaining cells needed for the next month
    const remainingCells = totalCells - calendarGrid.childElementCount;

    // Add cells for days from the next month
    for (let day = 1; day <= remainingCells; day++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell", "inactive-cell"); // Style as inactive
        cell.textContent = day; // Fill in dates from the next month
        calendarGrid.appendChild(cell);
    }

    // Update the current semester label
    updateSemesterLabel();

}

// Function to fetch and update the semester label
async function updateSemesterLabel() {
    const semesterLabel = document.getElementById("currentSemesterLabel");

    try {
        const semesters = await fetchSemesters();

        if (!semesters || semesters.length === 0) {
            semesterLabel.textContent = "No semesters available.";
            return;
        }

        // Get the month and year of the current date
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Determine the semester for the currently displayed month
        const currentSemester = semesters.find(semester => {
            const start = new Date(semester.start_date);
            const end = new Date(semester.end_date);

           // Extract month and year for comparison
           const startMonth = start.getMonth();
           const startYear = start.getFullYear();
           const endMonth = end.getMonth();
           const endYear = end.getFullYear();

           // Check if the current month/year falls within the semester's range
           return (
               (currentYear > startYear || (currentYear === startYear && currentMonth >= startMonth)) &&
               (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth))
           );
           
        });

        if (currentSemester) {
            semesterLabel.textContent = `Current Semester: ${currentSemester.name}`;
        } else {
            semesterLabel.textContent = "Current Semester: None";
        }
    } catch (error) {
        console.error("Error fetching semesters:", error);
        semesterLabel.textContent = "Error loading semester data.";
    }
}

// Function to navigate to the previous month
function goToPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1); // Decrement the month
    populateCalendar(); // Re-populate the calendar
}

// Function to navigate to the next month
function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1); // Increment the month
    populateCalendar(); // Re-populate the calendar
}

// Event listener to populate the calendar on page load
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("prevMonthBtn").addEventListener("click", goToPreviousMonth);
    document.getElementById("nextMonthBtn").addEventListener("click", goToNextMonth);

    populateCalendar();

});
