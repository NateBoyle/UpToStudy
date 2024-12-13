import { fetchCourses, fetchSemesters, fetchAssignments, fetchEvents, fetchToDos } from './UTSutils.js';

// Global Variables (Private to UTScalendarHelper)
let cachedDate = new Date(); 

// Store current semester information
let currentSemester = null;
let currentSemesterStartDate = null;
let currentSemesterEndDate = null;

// Cache courses
let cachedCourses = [];

// Cache events
let cachedAssignments = [];
let cachedToDos = [];
let cachedEvents = [];

export async function getCurrentSemester(currentDate) {

    //console.log('From get semester: ' + currentDate);
    try {

        // Check if the currentDate is outside the current semester range
        if (
            currentSemester &&
            currentSemesterStartDate &&
            currentSemesterEndDate &&
            currentDate >= currentSemesterStartDate &&
            currentDate <= currentSemesterEndDate
        ) {
            console.log("Current date is within the cached semester range.");
            return currentSemester; // Return cached semester
        }

        cachedCourses = [];

        const semesters = await fetchSemesters(currentDate);

        if (!semesters || semesters.length === 0) {
            console.warn("No active semester found for the provided date.");
            return null; // No active semester
        }


        currentSemester = semesters[0];
        currentSemesterStartDate = currentSemester.start_date;
        currentSemesterEndDate = currentSemester.end_date;

        return semesters[0]; // Return the first (active) semester
    } catch (error) {
        console.error("Error fetching current semester:", error);
        throw error; // Let the calling function handle errors
    }
}


// Function to get course occurances within time range
export async function getCurrentCourses(currentDate, isWeekView) {
    
    try {
        
        const semesterStartDate = new Date(`${currentSemesterStartDate}T00:00:00`);
        const semesterEndDate = new Date(`${currentSemesterEndDate}T23:59:59`);


        // Step 3: Fetch courses for the current semester

        let courses = [];

        if (cachedCourses.length === 0) {
            courses = await fetchCourses(currentSemester.semester_id);
        } else {
            courses = cachedCourses;
        }
        

        if (!courses || courses.length === 0) {
            console.warn("No courses available for the active semester.");
            return []; // No courses to display
        }

        // Step 4: Determine the range based on isWeekView
        let rangeStart, rangeEnd;

        if (isWeekView) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Saturday

            rangeStart = new Date(Math.max(semesterStartDate, weekStart));
            rangeEnd = new Date(Math.min(semesterEndDate, weekEnd));
        } else {
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day

            rangeStart = new Date(Math.max(semesterStartDate, monthStart));
            rangeEnd = new Date(Math.min(semesterEndDate, monthEnd));
        }

        // Step 5: Map courses to days (0-6) or dates (yyyy-mm-dd)
        const dayMapping = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        };

        const result = [];
        courses.forEach(course => {
            const targetDays = course.days.map(day => dayMapping[day]); // Convert days to numbers

            let currentDateIter = new Date(rangeStart);
            while (currentDateIter <= rangeEnd) {
                const dayOrDate = isWeekView
                    ? currentDateIter.getDay() // Day of the week (0-6)
                    : currentDateIter.toISOString().split("T")[0]; // Date in yyyy-mm-dd

                if (targetDays.includes(currentDateIter.getDay())) {
                    const existingEntry = result.find(entry => entry.key === dayOrDate);
                    if (existingEntry) {
                        existingEntry.courses.push({
                            title: `${course.prefix} ${course.course_number}`, // Concatenate prefix and course_number
                            id: course.course_id,
                            startTime: course.start_time || "00:00:00",
                            endTime: course.end_time || "23:59:59",
                            type: "course", // Add a type property
                            color: course.color || "#424FC6", // Default color if none provided
                        });
                    } else {
                        result.push({
                            key: dayOrDate,
                            courses: [
                                {
                                    title: `${course.prefix} ${course.course_number}`, // Concatenate prefix and course_number
                                    id: course.course_id,
                                    startTime: course.start_time || "00:00:00",
                                    endTime: course.end_time || "23:59:59",
                                    type: "course", // Add a type property
                                    color: course.color || "#424FC6", // Default color if none provided
                                },
                            ],
                        });
                    }
                }

                currentDateIter.setDate(currentDateIter.getDate() + 1); // Move to the next day
            }
        });

        // Sort results for consistent output
        result.sort((a, b) => (isWeekView ? a.key - b.key : new Date(a.key) - new Date(b.key)));

        return result;
    } catch (error) {
        console.error("Error in getCurrentCourses:", error);
        return [];
    }
}

// Get events within time range
export async function getCurrentEvents(currentDate, isWeekView) {

    if (!currentDate) {
        console.error("Current date is not defined.");
        return [];
    }

    if (cachedDate.toISOString().split("T")[0] !== currentDate.toISOString().split("T")[0]) {
        // Clear caches if dates are different
        cachedDate = currentDate;
        cachedAssignments = [];
        cachedToDos = [];
        cachedEvents = [];
    }

    // Determine the view range
    let viewStartDate, viewEndDate;
    if (isWeekView) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday

        viewStartDate = weekStart.toISOString().split("T")[0];
        viewEndDate = weekEnd.toISOString().split("T")[0];
    } else {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day

        viewStartDate = monthStart.toISOString().split("T")[0];
        viewEndDate = monthEnd.toISOString().split("T")[0];
    }

    try {
        const result = [];

        // Initialize assignments, toDos, and events
        let assignments = [];
        let toDos = [];
        let events = [];

        // Fetch all event types
        if (
            cachedAssignments.length === 0
            && cachedToDos.length === 0
            && cachedEvents.length === 0
        ) {
            [assignments, toDos, events] = await Promise.all([
                fetchAssignments(null, viewStartDate, viewEndDate),
                fetchToDos(null, viewStartDate, viewEndDate),
                fetchEvents(null, viewStartDate, viewEndDate),
            ]);
            cachedAssignments = assignments;
            cachedToDos = toDos;
            cachedEvents = events;
        } else {
            assignments = cachedAssignments;
            toDos = cachedToDos;
            events = cachedEvents;
        }
        

        // Helper function to process events
        const processEvent = (event, type) => {
            let startDate = event.due_date || event.start_date;
            let startTime = event.due_time || event.start_time || "00:00:00";
            let endTime; 
            let id;

            // Adjust assignments/to-dos to mimic event start/end times
            if (type === "assignment" || type === "toDo") {
                // Parse startTime into hours and minutes
                const [hours, minutes, seconds] = startTime.split(":").map(Number);
                const startDateTime = new Date();
                startDateTime.setHours(hours, minutes + 30, seconds || 0, 0); // Add 30 minutes
                endTime = startDateTime.toTimeString().split(" ")[0]; // Extract time in hh:mm:ss format
                if (type === "assignment") {
                    id = event.assignment_id;
                } else {
                    id = event.to_do_id;
                }

            } else {
                endTime = event.end_time || "23:59:59"; // Default end time for all-day events
                id = event.event_id;
            }

            // Determine the color (use event.color if available, else default to #5DD970)
            const color = event.color || "#5DD970";

            const dayOrDate = isWeekView
                ? new Date(`${startDate}T${startTime}`).getDay() // Day of the week
                : startDate; // Exact date

            const existingEntry = result.find(entry => entry.key === dayOrDate);
            if (existingEntry) {
                existingEntry.events.push({
                    title: event.title,
                    id,
                    startTime,
                    endTime,
                    type,
                    color, // Add color to the event
                });
            } else {
                result.push({
                    key: dayOrDate,
                    events: [
                        {
                            title: event.title,
                            id,
                            startTime,
                            endTime,
                            type,
                            color, // Add color to the event
                        },
                    ],
                });
            }
        };

        // Process each type of event
        assignments.forEach(assignment => processEvent(assignment, "assignment"));
        toDos.forEach(toDo => processEvent(toDo, "toDo"));
        events.forEach(event => processEvent(event, "event"));

        // Sort results
        result.sort((a, b) => (isWeekView ? a.key - b.key : new Date(a.key) - new Date(b.key)));

        
        return result;
    } catch (error) {
        console.error("Error in getCurrentEvents:", error);
        return [];
    }
}

export async function getCombinedEventsAndCourses(currentDate, isWeekView) {

    //console.log('From get events: ' + currentDate);

    try {
        // Fetch current courses and events
        const coursesByDate = await getCurrentCourses(currentDate, isWeekView);
        const eventsByDate = await getCurrentEvents(currentDate, isWeekView);

        // Prepare the final combined results array
        const combinedResults = [];

        // Extract unique keys (dates or days) from both sources
        const uniqueKeys = new Set([
            ...coursesByDate.map(entry => entry.key),
            ...eventsByDate.map(entry => entry.key),
        ]);

        // Iterate over each unique key and combine results
        uniqueKeys.forEach(key => {
            // Gather all courses and events for the current key
            const courses = coursesByDate.find(entry => entry.key === key)?.courses || [];
            const events = eventsByDate.find(entry => entry.key === key)?.events || [];

            // Combine and sort by startTime
            const combined = [...courses, ...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

            // Push to final results
            combinedResults.push({ key, combined });
        });

        //console.log(combinedResults);
        return combinedResults; // Array with keys (days/dates) and sorted combined data
    } catch (error) {
        console.error("Error combining courses and events:", error);
        return [];
    }
}