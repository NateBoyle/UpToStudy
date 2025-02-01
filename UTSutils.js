
// Fetch Flashcard Sets
export async function fetchFlashcardSets(semesterId = null, courseId = null, searchTerm = '', isRecent = false) {
    const params = new URLSearchParams({ action: 'fetchFlashcardSets' }); // Explicitly pass the action

    // Append parameters conditionally
    if (semesterId) params.append('semester_id', semesterId);
    if (courseId) params.append('course_id', courseId);
    if (searchTerm) params.append('search', searchTerm); // Add search term if provided
    params.append('is_recent', isRecent ? '1' : '0'); // Pass boolean as 1 or 0

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (data.success) {
            return data.data; // Return the array of flashcard sets
        } else {
            console.error('Failed to fetch flashcard sets:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching flashcard sets:', error);
        return [];
    }
}

// Fetch goal sets
export async function fetchGoalSets(id = null, container = null) {
    const params = new URLSearchParams({ action: 'fetchGoalSets' });


    // Add parameters conditionally
    if (id) params.append("id", id);
    if (container) params.append('container', container);

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();
        

        if (data.success) {
            return data.data; // Return the array of goal sets
        } else {
            console.error('Failed to fetch goal sets:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching goal sets:', error);
        return [];
    }
}

// Fetch goals
export async function fetchGoals(id = null, goalSetId = null) {
    const params = new URLSearchParams({ action: 'fetchGoals' });

    // Add parameters conditionally
    if (id) params.append("id", id);
    if (goalSetId) params.append('goal_set_id', goalSetId);

    //console.log(`Goal id for goals: ${id}`);

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        //console.log("fetchGoals Response:", data); // Log the raw response

        if (data.success) {
            return data.data; // Return the array of goals
        } else {
            console.error('Failed to fetch goals:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

// Fetch Assignments
export async function fetchAssignments(id = null, startDate = null, endDate = null, status = null, courseId = null) {
    const params = new URLSearchParams({ action: 'fetchAssignments' });
    
    params.append('id', id || ''); // Explicitly pass id, even if null
    //console.log(`From fetch assignments, courseId: ${courseId}`)
    // Append parameters conditionally
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (courseId) params.append('courseId', courseId);
    if (status) params.append('status', status);

    // Log parameters for debugging
    //console.log(`Fetching Assignments - ID: ${id}, Start Date: ${startDate}, End Date: ${endDate}`);

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();
        if (data.success) {
            return data.data; // Return the array of assignments or a single assignment
        } else {
            console.error('Failed to fetch assignments:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
}

// Fetch To-Dos
export async function fetchToDos(id = null, startDate = null, endDate = null, status = null) {
    
    const params = new URLSearchParams({ action: 'fetchToDos' });
    //console.log(`Id: ${id}`);
    params.append('id', id || ''); // Explicitly pass id, even if null

    // Append parameters conditionally
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (status) params.append('status', status);

    //console.log(`Fetching To-Dos - ID: ${id}, Start Date: ${startDate}, End Date: ${endDate}`);

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();
        if (data.success) {
            return data.data; // Return the array of to-dos or a single to-do
        } else {
            console.error('Failed to fetch to-dos:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching to-dos:', error);
        return [];
    }
}

// Fetch Events
export async function fetchEvents(id = null, startDate = null, endDate = null) {
    const params = new URLSearchParams({ action: 'fetchEvents' });

    params.append('id', id || ''); // Explicitly pass id, even if null
    
    // Append parameters conditionally
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    //console.log(`Fetching Events - ID: ${id}, Start Date: ${startDate}, End Date: ${endDate}`);

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();
        if (data.success) {
            return data.data; // Return the array of events or a single event
        } else {
            console.error('Failed to fetch events:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// Fetch Semesters
export async function fetchSemesters(currentDate = null) {
    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'fetchSemesters',
                current_date: currentDate ? currentDate.toISOString().split('T')[0] : '', // Format: yyyy-mm-dd
                
            }),
        });

        //console.log(currentDate);

        const data = await response.json();
        if (data.success) {
            return data.data; // Return the array of semesters
        } else {
            console.error('Failed to fetch semesters:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching semesters:', error);
        return [];
    }
}

// Fetch Courses (Optionally filtered by semesterId or courseId)
export async function fetchCourses(semesterId = null, courseId = null) {

    //console.log(courseId)

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'fetchCourses',
                semester_id: semesterId || '', // Include semester_id if provided
                course_id: courseId || '', // Include course_id if provided
            }),
        });

        const data = await response.json();
        if (data.success) {
            return data.data; // Return the array of courses
        } else {
            console.error('Failed to fetch courses:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}
