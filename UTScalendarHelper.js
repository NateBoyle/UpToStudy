import { fetchCourses, fetchSemesters, fetchAssignments, fetchEvents, fetchToDos } from './UTSutils.js';

// Global Variables (Private to UTScalendarHelper)
let cachedDate = new Date(); 

// Store current semester information
let currentSemester = null;
let currentSemesterStartDate = null;
let currentSemesterEndDate = null;

// Cache courses
let cachedCourses = [];


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
            //console.log("Current date is within the cached semester range.");
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
export async function getCurrentCourses(currentDate, isWeekView = false, isDash = false) {
    
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

        if (isDash) {
            // Custom 5-day range for the dashboard
            rangeStart = new Date(Math.max(new Date(semesterStartDate), new Date(currentDate)));
            rangeEnd = new Date(rangeStart);
            rangeEnd.setDate(rangeStart.getDate() + 4);

            // Ensure rangeEnd does not exceed semesterEndDate
            if (rangeEnd > new Date(semesterEndDate)) {
                rangeEnd = new Date(semesterEndDate);
            }
            
        } else if (isWeekView) {
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

        //console.log(`Courses start date: ${rangeStart}`);
        //console.log(`Courses end date: ${rangeEnd}`);

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

                // Normalize currentDateIter to midnight ONLY for isDash
                if (isDash) {
                    currentDateIter.setHours(0, 0, 0, 0);
                }

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

        //console.log(result);
        return result;
    } catch (error) {
        console.error("Error in getCurrentCourses:", error);
        return [];
    }
}

export async function getCurrentEvents(currentDate, isWeekView = false, isDash = false) {
    if (!currentDate) {
        console.error("Current date is not defined.");
        return [];
    }

    if (cachedDate.toISOString().split("T")[0] !== currentDate.toISOString().split("T")[0]) {
        // Clear caches if dates are different
        cachedDate = currentDate;
    }

    // Determine the view range
    let viewStartDate, viewEndDate;
    if (isDash) {
        // Custom 5-day range
        const startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0); // Normalize to midnight local time
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4); // 5-day range
        endDate.setHours(23, 59, 59, 999); // Normalize end date to the end of the day
        viewStartDate = startDate.toISOString().split("T")[0];
        viewEndDate = endDate.toISOString().split("T")[0];
    } else if (isWeekView) {
        // Week view range
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Set to Sunday
        weekStart.setHours(0, 0, 0, 0); // Normalize to midnight local time
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Set to Saturday
        weekEnd.setHours(23, 59, 59, 999); // Normalize to the end of the day
        viewStartDate = weekStart.toISOString().split("T")[0];
        viewEndDate = weekEnd.toISOString().split("T")[0];
    } else {
        // Month view range
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day
        viewStartDate = monthStart.toISOString().split("T")[0];
        viewEndDate = monthEnd.toISOString().split("T")[0];
    }

    try {
        const result = [];

        // Fetch data
        const [assignments, toDos, events] = await Promise.all([
            fetchAssignments(null, viewStartDate, viewEndDate),
            fetchToDos(null, viewStartDate, viewEndDate),
            fetchEvents(null, viewStartDate, viewEndDate),
        ]);

        // Helper function to process events
        const processEvent = (event, type) => {
            let startDate = event.due_date || event.start_date;
            let startTime = event.due_time || event.start_time || "00:00:00";
            let endTime = event.end_time || (type === "assignment" || type === "toDo" ? new Date().toTimeString().split(" ")[0] : "23:59:59");
            let id = type === "assignment" ? event.assignment_id : type === "toDo" ? event.to_do_id : event.occurrence_id; // Changed to occurrence_id for events
            let color = event.color || "#5DD970";

            const dayOrDate = isWeekView
                ? new Date(`${startDate}T${startTime}`).getDay() // Day of the week
                : startDate; // Exact date

            if (result.some(entry => entry.key === dayOrDate)) {
                result.find(entry => entry.key === dayOrDate).events.push({
                    title: event.title,
                    id,
                    startTime,
                    endTime,
                    type,
                    color
                });
            } else {
                result.push({
                    key: dayOrDate,
                    events: [{
                        title: event.title,
                        id,
                        startTime,
                        endTime,
                        type,
                        color
                    }]
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

function addOverlapField(combined) {
    // If there's only one event, no need to check for overlap
    if (combined.length <= 1) {
        return combined.map(event => ({ ...event, overlap: 0 }));
    }

    // For multiple events, check for overlaps
    const eventsWithOverlap = combined.map((eventA, indexA) => {
        let hasOverlap = 0;
        for (let indexB = 0; indexB < combined.length; indexB++) {
            if (indexA !== indexB) {
                const eventB = combined[indexB];
                // Check if there's an overlap
                if (isOverlapping(eventA, eventB)) {
                    hasOverlap = 1;
                    break; // Once an overlap is found, no need to continue checking
                }
            }
        }
        // Return a new object with the overlap property
        return { ...eventA, overlap: hasOverlap };
    });

    return eventsWithOverlap;
}

function isOverlapping(eventA, eventB) {
    // Convert times to Date objects for comparison
    let startA = new Date(`1970-01-01T${eventA.startTime}Z`);
    let endA = new Date(`1970-01-01T${eventA.endTime}Z`);
    let startB = new Date(`1970-01-01T${eventB.startTime}Z`);
    let endB = new Date(`1970-01-01T${eventB.endTime}Z`);

    // Check for overlap
    return (startA < endB && endA > startB);
}

export async function getCombinedEventsAndCourses(currentDate, isWeekView = false, isDash = false) {

    //console.log('From get events: ' + currentDate);

    try {
        // Fetch current courses and events
        const coursesByDate = await getCurrentCourses(currentDate, isWeekView, isDash);
        const eventsByDate = await getCurrentEvents(currentDate, isWeekView, isDash);

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
            let combined = [...courses, ...events].sort((a, b) => a.startTime.localeCompare(b.startTime));

            // Check for overlap if it's week view and there's more than one item
            if (isWeekView && combined.length > 1) {
                combined = addOverlapField(combined);
            } 

            // Push to final results
            combinedResults.push({ key, combined });
        });

        //console.log(`Combined results: `, combinedResults);
        return combinedResults; // Array with keys (days/dates) and sorted combined data
    } catch (error) {
        console.error("Error combining courses and events:", error);
        return [];
    }
}

