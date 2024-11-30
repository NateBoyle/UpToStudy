import { fetchSemesters } from './UTSdefineSemester.js';

const todaysDate = new Date(); // Always represents today's date
let currentDate = new Date(); // Tracks the currently displayed month

let currentSemesterId = null;
let cachedCourses = []; 

let isWeekView = false; // Tracks whether the calendar is in week view
let intervalId;

function goToToday() {
    currentDate = new Date(todaysDate); // Reset currentDate to today's date

    if (isWeekView) {
        populateWeekView(); // Populate the week view grid
        //populateWeekHeader(); // Update the week header
    } else {
        populateMonthView(); // Populate the month view grid
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
        populateMonthView(); // Rebuild the calendar grid for month view
        clearInterval(intervalId); // Stop the interval for week view updates
        //renderEvents(); // Render events after fetching semester info

    } else {
        // Switch to Week view
        calendarGrid.classList.add("week-view");
        daysHeader.classList.add("week-view");
        toggleButton.textContent = "Month";

        populateWeekView(); // Build the calendar grid for week view

        // Start or restart the interval for periodic updates
        if (!intervalId) {
            intervalId = setInterval(() => {
                if (isWeekView) {
                    populateWeekView();
                }
            }, 600000); // Re-run every 10 minutes
        }


    }

    isWeekView = !isWeekView; // Toggle the state
}

function populateCalendarHeader() {
    const days = document.querySelectorAll(".days-header .day");

    // Get the current year and month
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Month names for display
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const displayMonth = monthNames[currentMonth];

    // Update the year and month in the header
    document.getElementById("year").textContent = currentYear;
    document.getElementById("month").textContent = displayMonth;

    if (isWeekView) {
        // For week view, add day numbers to the header
        const currentDay = currentDate.getDate();
        const firstDayOfWeek = new Date(currentYear, currentMonth, currentDay - currentDate.getDay());

        days.forEach((day, index) => {
            const date = new Date(firstDayOfWeek); // Clone the start date
            date.setDate(firstDayOfWeek.getDate() + index); // Add the day offset

            const dayNumber = day.querySelector(".day-number");
            if (dayNumber) dayNumber.textContent = date.getDate(); // Update the day number
        });
    }
}

async function populateWeekView() {
    const calendarGrid = document.querySelector(".calendar-grid");
    calendarGrid.innerHTML = ""; // Clear the existing grid
    document.querySelectorAll(".calendar-cell").forEach(cell => cell.remove()); // Ensure no leftover cells

    // Update the calendar header
    populateCalendarHeader();

    // Create the week grid
    const weekGrid = document.createElement("div");
    weekGrid.classList.add("week-grid");
    calendarGrid.appendChild(weekGrid);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const todayDate = todaysDate.getDate();
    const todayMonth = todaysDate.getMonth();
    const todayYear = todaysDate.getFullYear();
    const currentHour = todaysDate.getHours();

    // Get the first day of the week (Sunday)
    const firstDayOfWeek = new Date(currentYear, currentMonth, currentDate.getDate() - currentDate.getDay());

    let currentSlotElement = null; // Keep track of the current slot element for scrolling

    // Populate the week grid (7 columns for days, 24 rows for hours)
    for (let column = 0; column < 7; column++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + column);

        for (let row = 0; row < 24; row++) {
            const slot = document.createElement("div");
            slot.classList.add("time-slot");
            slot.dataset.day = column; // Map to the column (day of the week)
            slot.dataset.hour = row; // Map to the row (hour of the day)

            // Only display formatted time (AM/PM) for the first day of the week
            if (column === 0) { 
                const period = row < 12 ? "AM" : "PM";
                const formattedHour = row === 0 ? 12 : row > 12 ? row - 12 : row;
                slot.textContent = `${formattedHour} ${period}`;
            }

            // Highlight the current hour
            if (
                date.getDate() === todayDate &&
                date.getMonth() === todayMonth &&
                date.getFullYear() === todayYear &&
                row === currentHour
            ) {
                slot.classList.add("current");
                currentSlotElement = slot; // Save the reference to scroll later
            }

            weekGrid.appendChild(slot);
        }
    }

    // Scroll to the current time slot if it exists
    if (currentSlotElement) {
        currentSlotElement.scrollIntoView({
            behavior: "smooth", // Smooth scrolling effect
            block: "center", // Center the current slot vertically
        });
    }

    // Update the current semester label
    await updateSemester();

    // Render week view events with the updated course data
    await renderWeekViewEvents();

}

// Function to populate the calendar
async function populateMonthView() {
    const calendarGrid = document.querySelector(".calendar-grid");

    // Update the calendar header
    populateCalendarHeader();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // Keeps the month as a number for calculations


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
        cell.dataset.date = `${currentYear}-${currentMonth + 1}-${day}`; // Add ISO date for matching
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
    await updateSemester();

    // Render events on the month view
    await renderMonthViewEvents();

}

// Function to fetch and update the semester label
async function updateSemester() {
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

            const newSemesterId = currentSemester.semester_id; // Assign the semester ID to newSemesterId

            if (newSemesterId !== currentSemesterId) {
                // Only update and fetch courses if the semester ID changes
                currentSemesterId = newSemesterId; // Update the global variable
                cachedCourses = []; // Clear any cached courses
                await fetchCourses(); // Fetch new courses for the updated semester
            }

            currentSemesterId = currentSemester.semester_id; // Update the global variable
            console.log(currentSemester.semester_id,currentSemester.name);
        } else {
            semesterLabel.textContent = "Semester: None";
            currentSemesterId = null; // Clear the global variable
            cachedCourses = []; // Clear cache since no semester is active
        }
    } catch (error) {
        console.error("Error fetching semesters:", error);
        semesterLabel.textContent = "Error loading semester data.";
        currentSemesterId = null; // Clear the global variable in case of error
        cachedCourses = []; // Clear cache
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
        //populateWeekHeader();
    } else {
        // Navigate one month back
        currentDate.setMonth(currentDate.getMonth() - 1); // Move back 1 month
        console.log("Month updated to:", currentDate);
        populateMonthView(); // Rebuild the month view
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
        //populateWeekHeader();
    } else {
        // Navigate one month forward
        currentDate.setMonth(currentDate.getMonth() + 1); // Move forward 1 month
        console.log("Month updated to:", currentDate);
        populateMonthView(); // Rebuild the month view
    }
}


// Functions for putting items on the calendar
// Mapping event days to columns
function mapDayToColumn(day) {
    const daysMap = {
        Sun: 1,
        Mon: 2,
        Tue: 3,
        Wed: 4,
        Thu: 5,
        Fri: 6,
        Sat: 7
    };
    console.log(`Mapping day: ${day} -> column: ${daysMap[day]}`);
    return daysMap[day];
}

// Functions for rendering events

function calculateTimeSlot(time, rowOffset = 1) {
    try {
        const [hours, minutes] = time.split(":").map(Number);

        // Validate hours and minutes
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes >= 60) {
            throw new Error(`Invalid time: ${time}`);
        }

        const slot = hours + (minutes >= 30 ? 0.5 : 0); // Half-hour increments
        const row = Math.floor(slot) + rowOffset;

        console.log(`Calculating time slot for ${time}: Row ${row}`);
        return row;
    } catch (error) {
        console.error(error.message);
        return 0; // Default or fallback value for invalid input
    }
}

function calculateTimeSlotHeight(start_time, end_time, slotHeight) {
    const [startHours, startMinutes] = start_time.split(":").map(Number);
    const [endHours, endMinutes] = end_time.split(":").map(Number);

    // Calculate total time in minutes
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const durationMinutes = endTotalMinutes - startTotalMinutes;

    // Height in pixels based on duration
    return (durationMinutes / 60) * slotHeight;
}

function calculateTimeSlotOffset(start_time, slotHeight) {
    const [hours, minutes] = start_time.split(":").map(Number);

    // Calculate the fraction of the hour
    const minuteFraction = minutes / 60;

    // Offset in pixels based on minute fraction
    return minuteFraction * slotHeight;
}

async function fetchCourses() {
    if (!currentSemesterId) {
        console.warn("No current semester ID available.");
        return [];
    }

    // Check if courses are already cached for the current semester
    if (cachedCourses.length > 0) {
        console.log("Using cached courses for semester ID:", currentSemesterId);
        return cachedCourses;
    }

    try {
        const response = await fetch(`UTScoursehandler.php?semester_id=${currentSemesterId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch courses for semester ID: ${currentSemesterId}`);
        }

        const courses = await response.json();

        // Update the cache
        cachedCourses = courses;

        console.log("Fetched new courses for semester ID:", currentSemesterId);
        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);

        // Clear cache if fetching fails
        cachedCourses = [];

        return [];
    }
}

async function renderWeekViewEvents() {
    if (!currentSemesterId) {
        console.warn("No current semester ID available.");
    }

    if (!cachedCourses || cachedCourses.length === 0) {
        console.warn("No courses available to render.");
    }

    try {
        // Clear existing event blocks
        document.querySelectorAll(".event-block").forEach(block => block.remove());

        // Render courses if any are available
        if (cachedCourses && cachedCourses.length > 0) {

            const timeSlotHeight = 50; // Fixed height for each time slot (e.g., 50px)

            cachedCourses.forEach(course => {
                const { name, color, days, start_time, end_time } = course;

                days.forEach(day => {
                    const column = mapDayToColumn(day); // Map day to grid column
                    const startRow = calculateTimeSlot(start_time); // Map start time to grid row
                    const endRow = calculateTimeSlot(end_time); // Map end time to grid row
                    const eventHeight = calculateTimeSlotHeight(start_time, end_time, timeSlotHeight); // Fractional height
                    const startOffset = calculateTimeSlotOffset(start_time, timeSlotHeight); // Fractional offset

                    // Find the starting time-slot using column and startRow
                    const weekGrid = document.querySelector(".week-grid");
                    const timeSlot = weekGrid.querySelector(
                        `.time-slot[data-day="${column - 1}"][data-hour="${startRow - 1}"]`
                    );

                    if (timeSlot) {

                        //const eventHeight = (endRow - startRow) * timeSlotHeight;  Event height in pixels

                        // Create the event block
                        const eventBlock = document.createElement("div");
                        eventBlock.classList.add("event-block");
                        eventBlock.textContent = name;
                        eventBlock.style.backgroundColor = color || "#424FC6"; // Default color
                        eventBlock.style.height = `${eventHeight}px`; // Set height
                        eventBlock.style.top = `${startOffset}px`;

                        console.log(`Event Height: ${eventHeight}px, row: ${startRow}`);

                        // Append to the correct time-slot
                        timeSlot.appendChild(eventBlock);
                    } else {
                        console.warn(
                            `Time-slot not found for day ${day}, startRow: ${startRow}, endRow: ${endRow}`
                        );
                    }

                });
            });
        }

        // Future: Add logic for rendering other types of events (assignments, todos, etc.)
    } catch (error) {
        console.error("Error rendering week view events:", error);
    }
}

function formatTimeTo12Hour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert 0/24-hour to 12-hour format
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

async function renderMonthViewEvents() {
    if (!cachedCourses || cachedCourses.length === 0) {
        console.warn("No courses available to render.");
        return;
    }

    try {

        // Get the first day of the month
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-based index
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 6 = Saturday
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Map of day names to indices
        const dayNameToIndex = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6
        };

        // Loop through each course and place it in the correct day cell
        cachedCourses.forEach(course => {
            const { name, color, days, start_time, end_time } = course; // Adjust based on your course structure
            
            days.forEach(dayName => {
                const dayIndex = dayNameToIndex[dayName];

                // Find all dates in the current month that match this day
                for (let date = 1; date <= daysInMonth; date++) {
                    const currentDate = new Date(currentYear, currentMonth, date);

                    if (currentDate.getDay() === dayIndex) {

                        // Format the date to match the `data-date` attribute
                        const formattedDate = `${currentYear}-${currentMonth + 1}-${date}`;

                        // Find the matching cell
                        const targetCell = document.querySelector(`.calendar-cell[data-date="${formattedDate}"]`);

                        if (targetCell) {
                            // Create an event bar
                            const eventBar = document.createElement("div");
                            eventBar.classList.add("event-bar");
                            eventBar.textContent = name; // Display the event name
                            eventBar.style.backgroundColor = color || "#424FC6"; // Use event color or default
                            targetCell.appendChild(eventBar);

                            // Add a tooltip for more details
                            eventBar.title = `${name}\n: ${formatTimeTo12Hour(start_time)} - ${formatTimeTo12Hour(end_time)}`;
                        } else {
                            console.warn(`No cell found for event on ${formattedDate}`);
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error rendering month view events:", error);
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

    await populateMonthView();

    // Periodically refresh the week view to update the highlighted time slot
    setInterval(() => {
        if (isWeekView) {
            populateWeekView();
        }
    }, 600000); // Re-run every ten minutes


    document.querySelectorAll('.event-bar').forEach(eventBar => {
        // Add a child tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'event-tooltip';
        tooltip.textContent = eventBar.title; // Use the title content for the tooltip
        eventBar.appendChild(tooltip);
        eventBar.title = ''; // Remove the native title to prevent conflicts

        // Show the tooltip on hover
        eventBar.addEventListener('mouseenter', () => {
            tooltip.style.opacity = 1;
            tooltip.style.visibility = 'visible';

            // Inherit the background color of the event-bar
            const barStyle = getComputedStyle(eventBar);
            tooltip.style.backgroundColor = barStyle.backgroundColor;


        });

        // Hide the tooltip on mouse leave
        eventBar.addEventListener('mouseleave', () => {
            tooltip.style.opacity = 0;
            tooltip.style.visibility = 'hidden';
        });
    });

});
