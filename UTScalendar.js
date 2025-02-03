import { openFromCalendar } from './UTSevents.js';
import { getCombinedEventsAndCourses, getCurrentSemester } from './UTScalendarHelper.js';
import { openCourseFromCalendar } from './UTScourseManager.js';

const todaysDate = new Date(); // Always represents today's date
let currentDate = new Date(); // Tracks the currently displayed month

let semesterStartDate = null;
let semesterEndDate = null;

let currentSemesterId = null;

let isWeekView = false; // Tracks whether the calendar is in week view
let intervalId;



function goToToday() {
    currentDate = new Date(todaysDate); // Reset currentDate to today's date

    if (isWeekView) {
        populateWeekView(); // Populate the week view grid
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

function populateCalendarHeader(weekView = null) {
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

    if (weekView) {
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

    // Update the calendar header
    populateCalendarHeader(true);

    const calendarGrid = document.querySelector(".calendar-grid");
    calendarGrid.innerHTML = ""; // Clear the existing grid
    document.querySelectorAll(".calendar-cell").forEach(cell => cell.remove()); // Ensure no leftover cells


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
    await updateSemesterLabel();

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
        
        // Format date as YYYY-MM-DD with leading zeros
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = String(currentMonth + 1).padStart(2, '0');
        cell.dataset.date = `${currentYear}-${formattedMonth}-${formattedDay}`;
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

    // Render events on the month view
    await renderMonthViewEvents();

}

// Function to fetch and update the semester label
async function updateSemesterLabel() {
    const semesterLabel = document.getElementById("currentSemesterLabel");

    try {
        // Fetch the current semester using the helper function
        const currentSemester = await getCurrentSemester(currentDate);

        if (!currentSemester) {
            semesterLabel.textContent = "No semesters available.";
            currentSemesterId = null; // Clear the global variable
            semesterStartDate = null; // Clear global semester start date
            semesterEndDate = null; // Clear global semester end date
            return;
        }

        // Update the label
        semesterLabel.textContent = `${currentSemester.name}`;
      
    } catch (error) {
        console.error("Error updating semester label:", error);
        semesterLabel.textContent = "Error loading semester data.";
        
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


// Functions for putting items on the calendar / for rendering events

function calculateTimeSlot(time, rowOffset = 1) {
    try {
        const [hours, minutes] = time.split(":").map(Number);

        // Validate hours and minutes
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes >= 60) {
            throw new Error(`Invalid time: ${time}`);
        }

        const slot = hours + (minutes >= 30 ? 0.5 : 0); // Half-hour increments
        const row = Math.floor(slot) + rowOffset;

        //console.log(`Calculating time slot for ${time}: Row ${row}`);
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


async function renderWeekViewEvents() {
    try {
        // Fetch combined events and courses for the current week
        const combinedEvents = await getCombinedEventsAndCourses(currentDate, true);

        // Debugging: Log combinedEvents to inspect its structure
        console.log("Combined Events for Week View:", combinedEvents);

        // Validate combinedEvents
        if (!Array.isArray(combinedEvents) || combinedEvents.length === 0) {
            console.warn("No combined events or courses to render.");
            return;
        }

        // Clear existing event blocks
        document.querySelectorAll(".event-block").forEach(block => block.remove());

        const timeSlotHeight = 50; // Fixed height for each time slot (e.g., 50px)
        const eventWidth = 100; // Based on your updated CSS, events are now 100% wide of the time slot


        // Loop through the combined events grouped by day
        combinedEvents.forEach(({ key: day, combined }) => {
            if (!Array.isArray(combined)) {
                console.warn(`No events for day ${day}`);
                return;
            }

            // Map day to grid column (0 = Sunday)
            const column = parseInt(day, 10); // Use `day` as a numeric index for the column

            // Initialize an overlap counter for this day
            let overlapCounter = 0;

            // Iterate over the combined events for this day
            combined.forEach(event => {
                const { title, startTime, endTime, color, overlap } = event;

                // Map times to grid rows and calculate heights
                const startRow = calculateTimeSlot(startTime); // Map start time to grid row
                const endRow = calculateTimeSlot(endTime); // Map end time to grid row
                const eventHeight = calculateTimeSlotHeight(startTime, endTime, timeSlotHeight);
                const startOffset = calculateTimeSlotOffset(startTime, timeSlotHeight);

                // Find the starting time-slot using column and startRow
                const weekGrid = document.querySelector(".week-grid");
                const timeSlot = weekGrid.querySelector(
                    `.time-slot[data-day="${column}"][data-hour="${startRow - 1}"]`
                );

                if (timeSlot) {
                    // Create the event block
                    const eventBlock = document.createElement("div");
                    eventBlock.classList.add("event-block");
                    eventBlock.textContent = title;
                    eventBlock.style.backgroundColor = color || "#808080"; // Default color
                    eventBlock.style.height = `${eventHeight}px`; // Set height
                    eventBlock.style.top = `${startOffset}px`;

                    // Overlap handling
                    if (event.overlapInfo && event.overlapInfo.hasOverlap) {
                        // Use maxOverlaps to determine the width
                        const width = 100 / event.overlapInfo.maxOverlaps;
                        eventBlock.style.width = `${width}%`;
                        
                        // Use rank for positioning
                        const position = (event.overlapInfo.rank - 1) * width;
                        eventBlock.style.left = `${position}%`;
                    } else {
                        // Non-overlapping events take full width
                        eventBlock.style.width = `${eventWidth}%`;
                        eventBlock.style.left = '0%';
                    }

                    // Add an onclick event
                    eventBlock.addEventListener("click", () => {
                        if (event.type === 'course') {
                            console.log('This is a course!');
                            openCourseFromCalendar(event.id);
                        } else {
                            console.log(`This is a ${event.type}!`);
                            openFromCalendar(event.type, event.id);
                        }
                    
                    });

                    // Append to the correct time-slot
                    timeSlot.appendChild(eventBlock);
                } else {
                    console.warn(
                        `Time-slot not found for day ${day}, startRow: ${startRow}, endRow: ${endRow}`
                    );
                }
            });
        });
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
    console.log(`Render month events.`);
    try {
        // Fetch combined courses and events for the current month
        const combinedData = await getCombinedEventsAndCourses(currentDate, false); // `false` for Month View

        if (!combinedData || combinedData.length === 0) {
            console.warn("No courses or events available to render.");
            return;
        }

        // Clear previous event bars
        document.querySelectorAll(".event-bar").forEach(bar => bar.remove());

        // Loop through combined data and render events
        combinedData.forEach(({ key, combined }) => {
            const targetCell = document.querySelector(`.calendar-cell[data-date="${key}"]`);

            if (targetCell) {
                combined.forEach(item => {
                    // Create an event bar
                    const eventBar = document.createElement("div");
                    eventBar.classList.add("event-bar");
                    eventBar.textContent = item.title; // Display the title (e.g., course prefix + number or event name)
                    eventBar.style.backgroundColor = item.color || "#808080"; // Use item color or default

                    // Add an onclick event
                    eventBar.addEventListener("click", () => {
                        if (item.type === 'course') {
                            console.log('This is a course!');
                            openCourseFromCalendar(item.id);
                        } else {
                            console.log(`This is a ${item.type} with id: ${item.id}!`);
                            openFromCalendar(item.type, item.id);
                        }
                    
                    });

                    // Append the event bar to the target cell
                    targetCell.appendChild(eventBar);
                });
            } else {
                console.warn(`No cell found for date ${key}`);
            }
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



});
