<?php

require 'UTSbootstrap.php';


if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? null;


/**
 * Fetch semesters for a specific user.
 * 
 * @param int $userId The ID of the user.
 * @return array|false An array of semesters on success, or false on failure.
 */
function fetchSemesters($userId) {
    global $conn;

    $query = "SELECT semester_id, name, start_date, end_date 
              FROM semesters 
              WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);

    if (!$stmt->execute()) {
        error_log("SQL Error (fetchSemesters): " . $stmt->error);
        return false;
    }

    $result = $stmt->get_result();
    $semesters = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    return $semesters;
}

/**
 * Fetch courses for a specific user and optionally filter by semester.
 * 
 * @param int $userId The ID of the user.
 * @param int|null $semesterId The ID of the semester (optional).
 * @return array|false An array of courses on success, or false on failure.
 */
function fetchCourses($userId, $semesterId = null) {
    global $conn;

    // Log the semesterId for debugging
    error_log("fetchCourses called with userId: $userId, semesterId: " . var_export($semesterId, true));

    $query = "SELECT c.course_id, c.course_name AS name, c.subject, c.professor, c.total_points, c.start_time, c.end_time, 
                     c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday, c.course_color AS color, 
                     c.prefix, c.course_number, s.semester_id, s.name AS semester_name
              FROM courses c
              LEFT JOIN semesters s ON c.semester_id = s.semester_id
              WHERE c.user_id = ?";

    // Append conditionally for semester_id
    if ($semesterId === null || $semesterId === '') {
        $query .= ""; // No additional filter
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
    } else {
        $query .= " AND c.semester_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $userId, $semesterId);
    }


    if (!$stmt->execute()) {
        error_log("SQL Error (fetchCourses): " . $stmt->error);
        return false;
    }

    $result = $stmt->get_result();
    $courses = [];
    while ($row = $result->fetch_assoc()) {
        $days = [];
        if ($row['monday']) $days[] = 'Monday';
        if ($row['tuesday']) $days[] = 'Tuesday';
        if ($row['wednesday']) $days[] = 'Wednesday';
        if ($row['thursday']) $days[] = 'Thursday';
        if ($row['friday']) $days[] = 'Friday';
        if ($row['saturday']) $days[] = 'Saturday';
        if ($row['sunday']) $days[] = 'Sunday';
        $row['days'] = $days; // Add days array to each course
        $courses[] = $row;
    }

    error_log("Fetched courses: " . print_r($courses, true));

    $stmt->close();

    return $courses;
}

if ($action === 'fetchSemesters') {
    $semesters = fetchSemesters($user_id);
    if ($semesters === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch semesters.']);
    } else {
        echo json_encode(['success' => true, 'data' => $semesters]);
    }
} elseif ($action === 'fetchCourses') {
    $semesterId = $_POST['semester_id'] ?? null;
    $courses = fetchCourses($user_id, $semesterId);
    if ($courses === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch courses.']);
    } else {
        echo json_encode(['success' => true, 'data' => $courses]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
}

?>
