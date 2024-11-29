import { fetchSemesters } from './UTSdefineSemester.js';

const todaysDate = new Date(); // Always represents today's date
let currentDate = new Date(); // Tracks the currently displayed month
let currentSemesterId = null;
let isWeekView = false; // Tracks whether the calendar is in week view
let intervalId;

function goToToday() {
    currentDate = new Date(todaysDate); // Reset currentDate to today's date

    if (isWeekView) {
        populateWeekView(); // Populate the week view grid
        populateWeekHeader(); // Update the week header
    } else {
        populateCalendar(); // Populate the month view grid
    }

    console.log("Navigated to Today:", currentDate);
}

function toggleWeekMonthView() {
    const calendarGrid = document.querySelector(".calendar-grid");
    const daysHeader = document.querySelector(".days-header");
    const toggleButton = document.getElementById("weekMonthBtn"); // The 'Week' button

    if (isWeekView) {
        // Switch to Month view
        calendarGrid.classList.remove("week-view");
        daysHeader.classList.remove("week-view");
        toggleButton.textContent = "Week";
        populateCalendar(); // Rebuild the calendar grid for month view
        clearInterval(intervalId); // Stop the interval for week view updates
        renderEvents(); // Render events after fetching semester info

    } else {
        // Switch to Week view
        calendarGrid.classList.add("week-view");
        daysHeader.classList.add("week-view");
        toggleButton.textContent = "Month";

        populateWeekView(); // Build the calendar grid for week view
        populateWeekHeader(); // Add day numbers to the header

        intervalId = setInterval(() => {
            if (isWeekView) {
                populateWeekView();
            }
        }, 60000); // Re-run every minute

        renderEvents(); // Render events after fetching semester info

    }

    isWeekView = !isWeekView; // Toggle the state
}

function populateWeekHeader() {
    const days = document.querySelectorAll(".days-header .day");

    // Start from the first day of the current week (Sunday)
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // For display purposes
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const displayMonth = monthNames[currentMonth]; // Convert the numeric month to a string

    // Update calendar header
    document.getElementById("year").textContent = currentYear;
    document.getElementById("month").textContent = displayMonth;

    const currentDay = currentDate.getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, currentDay - currentDate.getDay());
    

    // Loop through each day in the header and update its number
    days.forEach((day, index) => {
        const date = new Date(firstDayOfWeek); // Clone the start date
        date.setDate(firstDayOfWeek.getDate() + index); // Add the day offset

        const dayNumber = day.querySelector(".day-number");
        dayNumber.textContent = date.getDate(); // Set the day number
    });
}

async function populateWeekView() {
    const calendarGrid = document.querySelector(".calendar-grid");
    calendarGrid.innerHTML = ""; // Clear the existing grid

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();


    // Get the first day of the week (Sunday) and the last day of the week (Saturday)
    const firstDayOfWeek = new Date(currentYear, currentMonth, currentDay - currentDate.getDay());
    const lastDayOfWeek = new Date(currentYear, currentMonth, currentDay + (6 - currentDate.getDay()));


    const todayDate = todaysDate.getDate();
    const todayMonth = todaysDate.getMonth();
    const todayYear = todaysDate.getFullYear();
    const currentHour = todaysDate.getHours(); // For current time slot

    

    // Populate the week grid
    for (let date = new Date(firstDayOfWeek); date <= lastDayOfWeek; date.setDate(date.getDate() + 1)) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell");

        // Check if the day is outside the current month
        if (date.getMonth() !== currentMonth) {
            cell.classList.add("inactive-cell"); // Add the inactive-cell class
        }

        // Add the 'today' class only if this date matches today's full date
        if (
            date.getDate() === todayDate &&
            date.getMonth() === todayMonth &&
            date.getFullYear() === todayYear
        ) {
            cell.classList.add("today");
        }

        let nextHourSlot = null; // Variable to hold the next hour's slot
        
        // Add 24 time slots for each day
        for (let hour = 0; hour < 24; hour++) {
            const slot = document.createElement("div");
            slot.classList.add("time-slot");
            slot.dataset.hour = hour; // Store the hour as a data attribute
            //console.log(slot);  Check the created time slot elements

            // Remove top border for the first time slot
            if (hour === 0) {
                slot.style.borderTop = "none";
            }

            // Highlight the current time slot
            if (
                date.getDate() === todayDate &&
                date.getMonth() === todayMonth &&
                date.getFullYear() === todayYear &&
                hour === currentHour
            ) {
                slot.classList.add("current"); // Add the 'current' class

                /// Assign the next hour's slot
                nextHourSlot = hour + 1;
            }

            cell.appendChild(slot);
        }

        // Remove the top border of the next slot after the loop finishes
        if (nextHourSlot !== null) {
            const nextSlot = cell.querySelector(`.time-slot[data-hour="${nextHourSlot}"]`);
            if (nextSlot) {
                nextSlot.style.borderTop = "transparent";
            }
        }

        calendarGrid.appendChild(cell);

    }

    // Update the current semester label
    await updateSemesterLabel();

}

// Function to populate the calendar
async function populateCalendar() {
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
    const todayDate = todaysDate.getDate();
    const todayMonth = todaysDate.getMonth();
    const todayYear = todaysDate.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.classList.add("calendar-cell");
        cell.textContent = day; // Display the day number
        calendarGrid.appendChild(cell);

        // Highlight today's date
        if (
            day === todayDate &&
            currentMonth === todayMonth &&
            currentYear === todayYear
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
    await updateSemesterLabel();

}

// Function to fetch and update the semester label
async function updateSemesterLabel() {
    const semesterLabel = document.getElementById("currentSemesterLabel");

    try {
        const semesters = await fetchSemesters();

        if (!semesters || semesters.length === 0) {
            semesterLabel.textContent = "No semesters available.";
            currentSemesterId = null; // Clear the global variable
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
            semesterLabel.textContent = `Semester: ${currentSemester.name}`;
            currentSemesterId = currentSemester.semester_id; // Update the global variable
            console.log(currentSemester.semester_id,currentSemester.name);
        } else {
            semesterLabel.textContent = "Semester: None";
            currentSemesterId = null; // Clear the global variable
        }
    } catch (error) {
        console.error("Error fetching semesters:", error);
        semesterLabel.textContent = "Error loading semester data.";
        currentSemesterId = null; // Clear the global variable in case of error
    }
}

// Function to navigate to the previous time period
function goToPreviousPeriod() {
    console.log("Previous button clicked, isWeekView:", isWeekView);
    if (isWeekView) {
        // Navigate one week back
        currentDate.setDate(currentDate.getDate() - 7); // Move back 7 days
        console.log("Week updated to:", currentDate);
        populateWeekView(); // Rebuild the week view
        populateWeekHeader();
    } else {
        // Navigate one month back
        currentDate.setMonth(currentDate.getMonth() - 1); // Move back 1 month
        console.log("Month updated to:", currentDate);
        populateCalendar(); // Rebuild the month view
    }
}

// Function to navigate to the next time period
function goToNextPeriod() {
    console.log("Next button clicked, isWeekView:", isWeekView);
    if (isWeekView) {
        // Navigate one week forward
        currentDate.setDate(currentDate.getDate() + 7); // Move forward 7 days
        console.log("Week updated to:", currentDate);
        populateWeekView(); // Rebuild the week view
        populateWeekHeader();
    } else {
        // Navigate one month forward
        currentDate.setMonth(currentDate.getMonth() + 1); // Move forward 1 month
        console.log("Month updated to:", currentDate);
        populateCalendar(); // Rebuild the month view
    }
}

// Functions for putting items on the calendar
function mapDayToColumn(day) {
    const daysMap = {
        "Sunday": 1,
        "Monday": 2,
        "Tuesday": 3,
        "Wednesday": 4,
        "Thursday": 5,
        "Friday": 6,
        "Saturday": 7
    };
    return daysMap[day];
}

// Functions for rendering events

function calculateTimeSlot(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const slot = hours + (minutes >= 30 ? 0.5 : 0); // Half-hour increments
    return Math.floor(slot) + 1; // Row starts from 1
}

function findMonthCell(day) {
    const calendarGrid = document.querySelector(".calendar-grid");
    const cells = calendarGrid.querySelectorAll(".calendar-cell");
    
    // Loop through cells to find the one matching the day
    for (let cell of cells) {
        if (parseInt(cell.textContent, 10) === day && !cell.classList.contains("inactive-cell")) {
            return cell; // Return the cell if it matches the day and is not inactive
        }
    }

    return null; // Return null if no matching cell is found
}

async function fetchCourses() {

    if (!currentSemesterId) {
        console.warn("No current semester ID available.");
        return [];
    }

    try {
        const response = await fetch(`UTScoursehandler.php?semester_id=${currentSemesterId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch courses for semester ID: ${currentSemesterId}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

async function renderEvents() {
    try {
        // Fetch courses (we'll focus on courses for now)
        const courses = await fetchCourses();

        // Clear existing event blocks before rendering
        document.querySelectorAll(".event-block").forEach(block => block.remove());

        // Check the current view mode and render accordingly
        if (isWeekView) {
            // Render courses for Week View
            courses.forEach(course => {
                const { name, color, days, start_time, end_time } = course;

                days.forEach(day => {
                    const column = mapDayToColumn(day); // Maps day (e.g., "Monday") to column
                    const startSlot = calculateTimeSlot(start_time);
                    const endSlot = calculateTimeSlot(end_time);

                    // Create event block
                    const eventBlock = document.createElement("div");
                    eventBlock.classList.add("event-block");
                    eventBlock.dataset.type = "course";
                    eventBlock.textContent = name;
                    eventBlock.style.backgroundColor = color;
                    eventBlock.style.gridColumn = column;
                    eventBlock.style.gridRow = `${startSlot} / ${endSlot}`;

                    // Append to the calendar grid
                    document.querySelector(".calendar-grid").appendChild(eventBlock);
                });
            });
        } else {
            // Render courses for Month View
            courses.forEach(course => {
                const { name, color, days } = course;

                days.forEach(day => {
                    const dayCell = findMonthCell(day); // Logic to find the corresponding cell in month view

                    if (dayCell) {
                        // Create event block
                        const eventBlock = document.createElement("div");
                        eventBlock.classList.add("event-block");
                        eventBlock.dataset.type = "course";
                        eventBlock.textContent = name;
                        eventBlock.style.backgroundColor = color;

                        // Append to the day cell
                        dayCell.appendChild(eventBlock);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error rendering events:", error);
    }
}


// Event listener to populate the calendar on page load
document.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("prevMonthBtn").addEventListener("click", goToPreviousPeriod);
    document.getElementById("nextMonthBtn").addEventListener("click", goToNextPeriod);

    // Add the event listener for the Week/Month toggle button
    document.getElementById("weekMonthBtn").addEventListener("click", toggleWeekMonthView);

    // Add the Today button listener
    document.getElementById("todayBtn").addEventListener("click", goToToday);

    await populateCalendar();

    renderEvents(); // Render events after fetching semester info

    // Periodically refresh the week view to update the highlighted time slot
    setInterval(() => {
        if (isWeekView) {
            populateWeekView();
        }
    }, 60000); // Re-run every minute

});
