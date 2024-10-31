<?php

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set the Content-Type header to application/json
header('Content-Type: application/json');

// Start the session to access the user_id
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User is not logged in.']);
    exit;
}

// Get the user_id from the session
$user_id = $_SESSION['user_id'];

// Database connection variables
$host = "localhost";
$username = "root";
$password = "";
$database = "utsdb"; // Replace with your actual database name

// Create a connection to the database
$conn = new mysqli($host, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

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
    
    $query = "SELECT course_id, course_name AS name, subject, professor, total_points, start_time, end_time, start_date, end_date, 
                     monday, tuesday, wednesday, thursday, friday, saturday, sunday, course_color AS color 
              FROM courses 
              WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
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
    $total_points = isset($_POST['totalPoints']) && $_POST['totalPoints'] !== '' ? (int) $_POST['totalPoints'] : null;
    $start_time = $_POST['startTime'] . ':00' ?? '';
    $end_time = $_POST['endTime'] . ':00' ?? '';
    error_log("End Time received in PHP: " . $_POST['endTime']);
    $start_date = $_POST['startDate'] ?? '';
    $end_date = $_POST['endDate'] ?? '';
    $grade = NULL;
    $days_selected = isset($_POST['daysOfWeek']) ? json_decode($_POST['daysOfWeek'], true) : []; // Decode JSON string to array
    $course_color = isset($_POST['courseColor']) && !empty(trim($_POST['courseColor'])) ? trim($_POST['courseColor']) : '#7DBC4B'; // Set default to green
    
    // Debugging statements
    error_log('Received POST data: ' . print_r($_POST, true)); // Log the entire POST array
    error_log('Decoded daysOfWeek: ' . print_r($days_selected, true)); // Log the decoded days array

    if (empty($course_name)) {
        $errors['courseName'] = "Course name is required.";
    }
    if (empty($start_time) || empty($end_time)) {
        $errors['time'] = "Start and end times are required.";
    }
    if (empty($start_date) || empty($end_date)) {
        $errors['date'] = "Start and end dates are required.";
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
        $query = "UPDATE courses SET course_name = ?, subject = ?, professor = ?, total_points = ?, 
                  start_time = ?, end_time = ?, start_date = ?, end_date = ?,
                  monday = ?, tuesday = ?, wednesday = ?, thursday = ?, friday = ?, saturday = ?, sunday = ?, course_color = ?
                  WHERE course_id = ? AND user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sssissssiiiiiiisii", $course_name, $subject, $professor_name, $total_points,
                            $start_time, $end_time, $start_date, $end_date, 
                            $mon, $tue, $wed, $thu, $fri, $sat, $sun, $course_color, $courseId, $user_id);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Course updated successfully!']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update course.']);
        }

        $stmt->close();
        exit;

    } else {


        // Prepare the SQL statement to insert the course into the database
        $stmt = $conn->prepare(
            "INSERT INTO courses (user_id, course_name, subject, professor, total_points, start_time, end_time, start_date, end_date, grade, monday, tuesday, wednesday, thursday, friday, saturday, sunday, course_color) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "isssissssdiiiiiiis", 
            $user_id, $course_name, $subject, $professor_name, $total_points, $start_time, $end_time, $start_date, $end_date, 
            $grade, $mon, $tue, $wed, $thu, $fri, $sat, $sun, $course_color
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

$conn->close();
?>
