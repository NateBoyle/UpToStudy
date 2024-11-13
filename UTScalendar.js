// Function to populate the calendar
function populateCalendar() {
    const calendarGrid = document.querySelector(".calendar-grid");

    const currentDate = new Date();
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
}

// Event listener to populate the calendar on page load
document.addEventListener("DOMContentLoaded", () => {

    

    // Get modal elements
    const defineSemesterModal = document.getElementById('defineSemesterModal');
    const closeDefineSemester = document.getElementById('closeDefineSemester');
    const defineSemesterBtn = document.getElementById('defineSemesterBtn'); // This is your "Define Semester" button

    // Show modal
    defineSemesterBtn.addEventListener('click', () => {
        defineSemesterModal.style.display = 'flex';
    });

    // Hide modal
    closeDefineSemester.addEventListener('click', () => {
        defineSemesterModal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === defineSemesterModal) {
        defineSemesterModal.style.display = 'none';
        }
    });

    populateCalendar();

});
