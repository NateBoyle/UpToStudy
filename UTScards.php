<?php

// Enable error reporting for debugging (use only in development)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Secure Cookie Settings (configure before starting session)
ini_set('session.cookie_httponly', true);
ini_set('session.cookie_secure', true); // Ensure HTTPS in production
ini_set('session.use_strict_mode', true);

// Start session only if none is active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set Content-Type header to JSON (if returning JSON response)
header('Content-Type: application/json');

// HTTP Security Headers (for enhanced security)
header("Content-Security-Policy: default-src 'self';");
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User is not logged in.']);
    exit;
}

// Database connection variables
$host = "localhost";
$username = "root";
$password = "";
$database = "utsdb"; // Replace with your actual database name

// Create a connection to the database
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}


// Retrieve the user ID from the session
$userId = $_SESSION['user_id'];

// Check if the request is for retrieving courses or inserting a flashcard set
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (isset($_GET['type']) && $_GET['type'] === 'courses') {
        // Retrieve courses for the user

        // Prepare and execute the SQL statement
        $query = "SELECT course_id, course_name FROM courses WHERE user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $courses = [];
        while ($row = $result->fetch_assoc()) {
            $courses[] = $row;
        }

        // Output the courses as a JSON response
        echo json_encode(['status' => 'success', 'data' => $courses]);

    } elseif (isset($_GET['type']) && $_GET['type'] === 'flashcard_sets') {
        // Retrieve flashcard sets with associated course names
        $query = "SELECT fs.set_id, fs.set_name, fs.course_id, fs.num_cards, c.course_name 
                  FROM flashcard_sets AS fs
                  LEFT JOIN courses AS c ON fs.course_id = c.course_id
                  WHERE fs.user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $flashcardSets = [];
        while ($row = $result->fetch_assoc()) {
            $flashcardSets[] = $row;
        }

        // Output the flashcard sets as a JSON response
        echo json_encode(['status' => 'success', 'data' => $flashcardSets]);
    }


} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['type'])) {

    if ($_POST['type'] === 'add_set') {
    
        // Insert new flashcard set
        $courseId = empty($_POST['course_id']) ? NULL : $_POST['course_id']; // Capture course_id from form submission
        $setName = $_POST['set_name'];    // Capture set name from form submission

        // Validate required fields
        if (empty($setName)) {
            echo json_encode(['status' => 'error', 'message' => 'Set name is required.']);
            exit;
        }

        // Insert the new flashcard set
        $insertQuery = "INSERT INTO flashcard_sets (user_id, course_id, set_name, date_created) VALUES (?, ?, ?, NOW())";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param("iis", $userId, $courseId, $setName);

        if ($insertStmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Flashcard set created successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to create flashcard set: ' . $conn->error]);
        }

    } elseif ($_POST['type'] === 'add_flashcard') {

        // Insert a new flashcard
        $setId = $_POST['set_id'];
        $question = $_POST['question'];
        $answer = $_POST['answer'];

        // Validate required fields
        if (empty($setId) || empty($question) || empty($answer)) {
            echo json_encode(['status' => 'error', 'message' => 'All fields are required for a flashcard.']);
            exit;
        }

        // Insert the new flashcard into the database
        $insertQuery = "INSERT INTO flashcards (set_id, question, answer, date_created) VALUES (?, ?, ?, NOW())";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param("iss", $setId, $question, $answer);

        if ($insertStmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Flashcard added successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add flashcard: ' . $conn->error]);
        }
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    
    // Parse the DELETE request body for JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        echo json_encode(['status' => 'error', 'message' => 'User is not authenticated.']);
        exit;
    }

    if (isset($input['type']) && $input['type'] === 'delete_set') {
        $setId = $input['set_id'] ?? null;

        if ($setId) {
            
            // Delete the flashcard set itself
            $deleteSetQuery = "DELETE FROM flashcard_sets WHERE set_id = ? AND user_id = ?";
            $deleteSetStmt = $conn->prepare($deleteSetQuery);
            $deleteSetStmt->bind_param("ii", $setId, $userId);

            if ($deleteSetStmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Flashcard set and associated flashcards deleted successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete flashcard set: ' . $conn->error]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Set ID is missing.']);
        }

    } elseif (isset($input['type']) && $input['type'] === 'delete_flashcard') {
        $flashcardId = $input['flashcard_id'] ?? null;

        if ($flashcardId) {
            // Delete the individual flashcard
            $deleteFlashcardQuery = "DELETE FROM flashcards WHERE flashcard_id = ? AND user_id = ?";
            $deleteFlashcardStmt = $conn->prepare($deleteFlashcardQuery);
            $deleteFlashcardStmt->bind_param("ii", $flashcardId, $userId);

            if ($deleteFlashcardStmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Flashcard deleted successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete flashcard: ' . $conn->error]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Flashcard ID is missing.']);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid delete action type.']);
    }
}

$conn->close();

?>