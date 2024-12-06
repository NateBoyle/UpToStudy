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

// Fetch Courses (Optionally filtered by semesterId)
export async function fetchCourses(semesterId = null) {

    try {
        const response = await fetch('UTSutils.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'fetchCourses',
                semester_id: semesterId || '', // Include semester_id if provided
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
