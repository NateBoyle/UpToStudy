// Fetch Assignments
export async function fetchAssignments(id = null, startDate = null, endDate = null) {
    const params = new URLSearchParams({ action: 'fetchAssignments' });
    
    // Append parameters conditionally
    if (id) params.append('id', id);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

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
    
    // Append parameters conditionally
    if (id) params.append('id', id);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

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
    
    // Append parameters conditionally
    if (id) params.append('id', id);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

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
export async function fetchSemesters() {
    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'fetchSemesters' }),
        });

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
