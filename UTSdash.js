import { getCombinedEventsAndCourses, getCurrentSemester } from './UTScalendarHelper.js';
import { openFromCalendar } from './UTSevents.js';
import { callEditCourse } from './UTSmodals.js';
import { fetchGoalSets } from './UTSutils.js'; // Adjust the path to your utilities file if necessary.
import { openGoalSetModal } from './UTSgoalSets.js';


async function updateSemesterLabel(currentDate) {
    const semesterLabel = document.getElementById('semesterLabel');

    try {
        // Get the current semester
        const currentSemester = await getCurrentSemester(currentDate);

        // Update the semester label with the name of the current semester
        if (currentSemester) {
            semesterLabel.textContent = currentSemester.name;
        } else {
            semesterLabel.textContent = 'No Current Semester';
        }
    } catch (error) {
        console.error('Error updating semester label:', error);
        semesterLabel.textContent = 'Error Loading Semester';
    }
}

async function populateDashCalendar() {
    const currentDate = new Date();

    await updateSemesterLabel(currentDate);

    for (let i = 0; i < 5; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() + i);

        const dayName = targetDate.toLocaleDateString("en-US", { weekday: "short" });
        const dayNumber = targetDate.getDate();

        const dayHeader = document.getElementById(`day-header${i + 1}`);
        const dateNumber = document.getElementById(`date-number${i + 1}`);

        // Update the day name and number
        dayHeader.querySelector("h3").textContent = dayName;
        dateNumber.textContent = dayNumber;

        // Clear events container for future updates
        const eventContainer = document.getElementById(`event-container${i + 1}`);
        eventContainer.innerHTML = ""; // Clear any pre-existing events
    }

    await renderDashCalendar();
}

async function renderDashCalendar() {
    const currentDate = new Date(); // Today's date
    const daysToRender = 5; // Number of days to render in the dashboard calendar

    try {
        // Fetch combined courses and events for the current week
        const combinedData = await getCombinedEventsAndCourses(currentDate, false, true);
        //console.log('Combined Data:', combinedData); // Debugging: Check fetched data

        for (let i = 0; i < daysToRender; i++) {
            const targetDate = new Date(currentDate);
            targetDate.setDate(currentDate.getDate() + i);

            // Normalize targetDate to midnight local time
            targetDate.setHours(0, 0, 0, 0);
            
            // Format targetDate as YYYY-MM-DD for matching keys
            const targetKey = targetDate.toISOString().split('T')[0];

            const container = document.getElementById(`event-container${i + 1}`);
            container.innerHTML = ''; // Clear container

            // Find data for the current day based on the formatted date
            const dayData = combinedData.find(entry => entry.key === targetKey);
            //console.log(`Day ${i + 1} Data (Date ${targetKey}):`, dayData); // Debugging: Check day-specific data

            if (dayData && dayData.combined.length > 0) {
                dayData.combined.forEach(event => {
                    //console.log('Rendering Event:', event); // Debugging: Check each event
                    const eventElement = document.createElement('div');
                    eventElement.classList.add('event');
                    eventElement.textContent = event.title;
                    eventElement.style.backgroundColor = event.color || '#5DD970';

                    if (event.type === 'course') {
                        eventElement.addEventListener('click', () => {
                            callEditCourse(event.id);
                        });
                    } else {
                        eventElement.addEventListener('click', () => {
                            openFromCalendar(event.type, event.id);
                        });
                    }
                    

                    container.appendChild(eventElement);
                });
            } else {
                const noEventMessage = document.createElement('p');
                noEventMessage.textContent = 'No events';
                noEventMessage.classList.add('empty-message');
                container.appendChild(noEventMessage);
            }
        }
    } catch (error) {
        console.error('Error rendering dashboard calendar:', error);
    }
}

async function populateGoalSetsContainer() {
    const container = document.getElementById('goalContainer');
    container.innerHTML = ''; // Clear existing content

    try {
        const goalSets = await fetchGoalSets(); // Fetch goal sets for the user

        if (!goalSets || goalSets.length === 0) {
            container.innerHTML = `<p class="empty-message">No goal sets available.</p>`;
            return;
        }

        goalSets.forEach((goalSet) => {
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.setAttribute('data-id', goalSet.id); // Store the goal set ID

            // Apply the color if the goal set has one
            if (goalSet.color) {
                listItem.style.backgroundColor = goalSet.color;
            }

            // Create inner content with goal set title and goals completed fraction
            const title = document.createElement('span');
            title.className = 'text';
            title.textContent = goalSet.title;

            const goalsFraction = document.createElement('span');
            goalsFraction.className = 'details';
            goalsFraction.textContent = `${goalSet.goals_completed}/${goalSet.number_of_goals} Goals Completed`;

            // Add event listener to open the Goal Set modal on click
            listItem.addEventListener('click', () => {
                openGoalSetModal(goalSet); // Pass the goal set object to the modal
            });

            // Append title and fraction to the list item
            listItem.appendChild(title);
            listItem.appendChild(goalsFraction);

            // Append the list item to the container
            container.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error populating goal sets container:', error);
        container.innerHTML = `<p class="error-message">Failed to load goal sets. Please try again later.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Call the function to populate the dashboard calendar
    populateDashCalendar();

    // Call the function to populate the goal sets container
    populateGoalSetsContainer()
});