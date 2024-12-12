<?php

require 'UTSbootstrap.php';


if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? null;

/**
 * Fetch assignments within a date range for a user.
 */
function fetchAssignments($userId, $id = null, $startDate = null, $endDate = null) {
    global $conn;

    $query = "SELECT * FROM assignments WHERE user_id = ?";
    $params = [$userId];
    $types = "i";

    // Fetch by ID if provided
    if ($id) {
        $query .= " AND assignment_id = ?";
        $params[] = $id;
        $types .= "i";
    } elseif ($startDate && $endDate) {
        // Fetch by date range if start and end dates are provided
        $query .= " AND due_date BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
        $types .= "ss";
    }

    

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();
    $assignments = $result->fetch_all(MYSQLI_ASSOC);

    $stmt->close();

    return $assignments;
}

/**
 * Fetch to-dos within a date range for a user.
 */
function fetchToDos($userId, $id = null, $startDate = null, $endDate = null) {

    global $conn;

    $query = "SELECT * FROM to_do WHERE user_id = ?";
    $params = [$userId];
    $types = "i";

    // Fetch by ID if provided
    if ($id) {
        $query .= " AND to_do_id = ?";
        $params[] = $id;
        $types .= "i";
    } elseif ($startDate && $endDate) {
        // Fetch by date range if start and end dates are provided
        $query .= " AND due_date BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
        $types .= "ss";
    }

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        error_log("SQL Error (fetchToDoById): " . $stmt->error);
        return false;
    }

    $result = $stmt->get_result();
    $toDos = $result->fetch_all(MYSQLI_ASSOC);

    error_log("Response sent to frontend: " . json_encode(['success' => true, 'data' => $toDos]));

    $stmt->close();

    return $toDos;
}

/**
 * Fetch events within a date range for a user.
 */
function fetchEvents($userId, $id = null, $startDate = null, $endDate = null) {
    global $conn;

    $query = "SELECT * FROM events WHERE user_id = ?";
    $params = [$userId];
    $types = "i";

    // Fetch by ID if provided
    if ($id) {
        $query .= " AND event_id = ?";
        $params[] = $id;
        $types .= "i";
    } elseif ($startDate && $endDate) {
        // Fetch by date range if start and end dates are provided
        $query .= " AND (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)";
        $params[] = $startDate;
        $params[] = $endDate;
        $params[] = $startDate;
        $params[] = $endDate;
        $types .= "ssss";
    }

    //error_log("Received Parameters: ID: $id, Start Date: $startDate, End Date: $endDate");

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();

    $result = $stmt->get_result();
    $events = $result->fetch_all(MYSQLI_ASSOC);

    $stmt->close();

    return $events;
}

/**
 * Fetch semesters for a specific user.
 * 
 * @param int $userId The ID of the user.
 * @return array|false An array of semesters on success, or false on failure.
 */
function fetchSemesters($userId, $currentDate = null) {

    

    global $conn;

    $query = "SELECT * FROM semesters WHERE user_id = ?";
    $params = [$userId];
    $types = "i";

    if ($currentDate) {
        // Log the received POST data
        error_log("UTSutils.php Received Parameters: " . print_r($_POST, true));
        // Extract month and year for comparison
        $query .= " AND MONTH(start_date) <= MONTH(?) 
                    AND YEAR(start_date) <= YEAR(?) 
                    AND MONTH(end_date) >= MONTH(?) 
                    AND YEAR(end_date) >= YEAR(?)";
        $params[] = $currentDate;
        $params[] = $currentDate;
        $params[] = $currentDate;
        $params[] = $currentDate;
        $types .= "ssss";
    }

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);

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
function fetchCourses($userId, $semesterId = null, $courseId = null) {
    global $conn;

    // Log the semesterId for debugging
    //error_log("fetchCourses called with userId: $userId, semesterId: " . var_export($semesterId, true) . ", courseId: " . var_export($courseId, true));

    $query = "SELECT c.course_id, c.course_name AS name, c.subject, c.professor, c.total_points, c.start_time, c.end_time, 
                     c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday, c.course_color AS color, 
                     c.prefix, c.course_number, s.semester_id, s.name AS semester_name
              FROM courses c
              LEFT JOIN semesters s ON c.semester_id = s.semester_id
              WHERE c.user_id = ?";

    // Append conditionally for course or semester_id
    if ($courseId !== null && $courseId !== '') {
        // Add filter for course_id if provided
        $query .= " AND c.course_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $userId, $courseId);
    } elseif ($semesterId === null || $semesterId === '') {
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
        if ($row['monday']) $days[] = "Mon";
        if ($row['tuesday']) $days[] = "Tue";
        if ($row['wednesday']) $days[] = "Wed";
        if ($row['thursday']) $days[] = "Thu";
        if ($row['friday']) $days[] = "Fri";
        if ($row['saturday']) $days[] = "Sat";
        if ($row['sunday']) $days[] = "Sun";
    
        $row['days'] = $days; // Add days array to the course details
        $courses[] = $row;
    }

    //error_log("Fetched courses: " . print_r($courses, true));

    $stmt->close();

    return $courses;
}

if ($action === 'fetchSemesters') {
    $currentDate = $_POST['current_date'] ?? null;
    $semesters = fetchSemesters($user_id, $currentDate);
    if ($semesters === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch semesters.']);
    } else {
        echo json_encode(['success' => true, 'data' => $semesters]);
    }
} elseif ($action === 'fetchCourses') {
    $semesterId = $_POST['semester_id'] ?? null;
    $courseId = $_POST['course_id'] ?? null;
    $courses = fetchCourses($user_id, $semesterId, $courseId);
    if ($courses === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch courses.']);
    } else {
        echo json_encode(['success' => true, 'data' => $courses]);
    }
} elseif ($action === 'fetchAssignments') {
    $id = $_POST['id'] ?? null;
    $startDate = $_POST['start_date'] ?? null;
    $endDate = $_POST['end_date'] ?? null;
    $assignments = fetchAssignments($user_id, $id, $startDate, $endDate);
    echo json_encode(['success' => true, 'data' => $assignments]);
} elseif ($action === 'fetchToDos') {
    $id = $_POST['id'] ?? null;
    $startDate = $_POST['start_date'] ?? null;
    $endDate = $_POST['end_date'] ?? null;
    $toDos = fetchToDos($user_id, $id, $startDate, $endDate);
    echo json_encode(['success' => true, 'data' => $toDos]);
} elseif ($action === 'fetchEvents') {
    $id = $_POST['id'] ?? null;
    $startDate = $_POST['start_date'] ?? null;
    $endDate = $_POST['end_date'] ?? null;
    $events = fetchEvents($user_id, $id, $startDate, $endDate);
    echo json_encode(['success' => true, 'data' => $events]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
}

?>
