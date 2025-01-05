<?php

require 'UTSbootstrap.php';


global $conn; // Explicitly use the global $conn

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User is not logged in.']);
    exit;
}

// Get the user_id from the session
$user_id = $_SESSION['user_id'];


// Handle DELETE request for course deletion
if ($_SERVER["REQUEST_METHOD"] == "DELETE") {

    // Read and decode JSON input
    $requestData = json_decode(file_get_contents("php://input"), true);
    error_log("Request Data: " . print_r($requestData, true)); // Log full request data

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg()); // Log JSON decoding errors
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input.']);
        exit;
    }

    $courseId = $requestData['courseId'];

    // Check if course ID is provided
    if (!$courseId) {
        echo json_encode(['status' => 'error', 'message' => 'Course ID is required for deletion.']);
        exit;
    }

    // Prepare and execute deletion query
    $query = "DELETE FROM courses WHERE course_id = ? AND user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $courseId, $user_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Course deleted successfully!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete course.']);
    }

    $stmt->close();
    exit;
}

// Handle GET request to retrieve courses
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    
    // Get semester_id from the request, if provided
    $semester_id = isset($_GET['semester_id']) ? $_GET['semester_id'] : null;

    $query = "SELECT c.course_id, c.course_name AS name, c.subject, c.professor, c.total_points, c.start_time, c.end_time, 
                     c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday, c.course_color AS color, 
                     c.prefix, c.course_number, s.semester_id, s.name AS semester_name
              FROM courses c
              LEFT JOIN semesters s ON c.semester_id = s.semester_id
              WHERE c.user_id = ?";

    // Add semester filter if semester_id is provided
    if ($semester_id !== null) {
        $query .= " AND c.semester_id = ?";
    }

    $stmt = $conn->prepare($query);
    
    // Bind parameters based on whether semester_id is provided
    if ($semester_id !== null) {
        $stmt->bind_param("ii", $user_id, $semester_id);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();

    $courses = [];
    while ($row = $result->fetch_assoc()) {
        // Convert days from boolean values to an array of days
        $days = [];
        if ($row['monday']) $days[] = "Mon";
        if ($row['tuesday']) $days[] = "Tue";
        if ($row['wednesday']) $days[] = "Wed";
        if ($row['thursday']) $days[] = "Thu";
        if ($row['friday']) $days[] = "Fri";
        if ($row['saturday']) $days[] = "Sat";
        if ($row['sunday']) $days[] = "Sun";

        $row['days'] = $days; // Add days array to the course details
        $courses[] = $row;     // Append each course to the list
    }

    echo json_encode($courses); // Return the courses as JSON
    $stmt->close();
    exit;
}

// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Initialize the error array
    $errors = [];

    // Retrieve trim and validate form inputs
    $course_name = isset($_POST['courseName']) ? trim($_POST['courseName']) : '';
    $subject = isset($_POST['subject']) && trim($_POST['subject']) !== '' ? trim($_POST['subject']) : null;
    $professor_name = isset($_POST['professorName']) && trim($_POST['professorName']) !== '' ? trim($_POST['professorName']) : null;
    $prefix = isset($_POST['prefix']) && trim($_POST['prefix']) !== '' ? trim($_POST['prefix']) : null;
    $course_number = isset($_POST['courseNumber']) && trim($_POST['courseNumber']) !== '' ? trim($_POST['courseNumber']) : null;
    $total_points = isset($_POST['totalPoints']) && $_POST['totalPoints'] !== '' ? (int) $_POST['totalPoints'] : null;
    $start_time = isset($_POST['startTime']) ? date('H:i:s', strtotime($_POST['startTime'])) : '';
    $end_time = isset($_POST['endTime']) ? date('H:i:s', strtotime($_POST['endTime'])) : '';
    error_log("End Time received in PHP: " . $_POST['endTime']);
    $semester_id = isset($_POST['semester']) ? intval($_POST['semester']) : null;
    $grade = NULL;
    error_log('daysOfWeek raw: ' . $_POST['daysOfWeek']);
    $days_selected = isset($_POST['daysOfWeek']) ? json_decode($_POST['daysOfWeek'], true) : []; // Decode JSON string to array
    error_log('daysOfWeek decoded: ' . print_r($days_selected, true));
    $course_color = isset($_POST['courseColor']) && !empty(trim($_POST['courseColor'])) ? trim($_POST['courseColor']) : '#7DBC4B'; // Set default to green
    
    // Debugging statements
    //error_log('Received POST data: ' . print_r($_POST, true)); // Log the entire POST array
    //error_log('Decoded daysOfWeek: ' . print_r($days_selected, true)); // Log the decoded days array

    if (empty($course_name)) {
        $errors['courseName'] = "Course name is required.";
    }
    if (empty($prefix)) {
        $errors['prefix'] = "Course prefix is required.";
    }
    if (empty($course_number)) {
        $errors['courseNumber'] = "Course number is required.";
    }
    if (empty($start_time) || empty($end_time)) {
        $errors['time'] = "Start and end times are required.";
    }
    if (empty($semester_id)) {
        $errors['semester'] = "Semester is required.";
    }
    if (empty($days_selected)) {
        $errors['days'] = "At least one day of the week must be selected.";
    }


    // If there are validation errors, return them as a JSON response
    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        exit;
    }


    // Initialize boolean values for each day of the week
    $mon = in_array("Mon", $days_selected) ? 1 : 0;
    $tue = in_array("Tue", $days_selected) ? 1 : 0;
    $wed = in_array("Wed", $days_selected) ? 1 : 0;
    $thu = in_array("Thu", $days_selected) ? 1 : 0;
    $fri = in_array("Fri", $days_selected) ? 1 : 0;
    $sat = in_array("Sat", $days_selected) ? 1 : 0;
    $sun = in_array("Sun", $days_selected) ? 1 : 0;

    // Check if this is an edit request with a course ID
    $courseId = isset($_POST['courseId']) ? intval($_POST['courseId']) : null;

    // If course ID is present, we're updating an existing course
    if ($courseId) {

        // Edit the existing course
        error_log("Course Color before update: " . $course_color);

        // Prepare the SQL statement to update the course
        $query = "UPDATE courses SET course_name = ?, subject = ?, professor = ?, prefix = ?, course_number = ?, 
                  start_time = ?, end_time = ?, monday = ?, tuesday = ?, wednesday = ?, 
                  thursday = ?, friday = ?, saturday = ?, sunday = ?, course_color = ?, semester_id = ?
                  WHERE course_id = ? AND user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sssssssiiiiiiisiii", $course_name, $subject, $professor_name, $prefix, $course_number, 
                            $start_time, $end_time, $mon, $tue, $wed, $thu, $fri, $sat, $sun, 
                            $course_color, $semester_id, $courseId, $user_id);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Course updated successfully!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update course.']);
        }

        $stmt->close();
        exit;

    } else {


        // Prepare the SQL statement to insert the course into the database
        // Prepare the SQL statement to insert the course into the database (without grade)
        $stmt = $conn->prepare(
            "INSERT INTO courses (user_id, course_name, subject, professor, prefix, course_number, start_time, end_time, monday, tuesday, wednesday, thursday, friday, saturday, sunday, course_color, semester_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "isssssssiiiiiiisi", 
            $user_id, $course_name, $subject, $professor_name, $prefix, $course_number, $start_time, $end_time, 
            $mon, $tue, $wed, $thu, $fri, $sat, $sun, $course_color, $semester_id
        );

        // Execute the statement and check if it was successful
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Course added successfully!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add course. Please try again.' . $stmt->error]);
        }

        // Close the statement and the connection
        $stmt->close();
        exit;
        
    }

}

?>
