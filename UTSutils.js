// Fetch Assignments
export async function fetchAssignments(id = null, startDate = null, endDate = null) {
    const params = new URLSearchParams({ action: 'fetchAssignments' });
    
    params.append('id', id || ''); // Explicitly pass id, even if null

    // Append parameters conditionally
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

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
export async function fetchToDos(id = null, startDate = null, endDate = null) {
    
    const params = new URLSearchParams({ action: 'fetchToDos' });
    console.log(`Id: ${id}`);
    params.append('id', id || ''); // Explicitly pass id, even if null

    // Append parameters conditionally
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

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

        console.log(currentDate);

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
