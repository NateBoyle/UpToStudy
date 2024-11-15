<?php

require 'UTSbootstrap.php';

global $conn;

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Validate action
    $action = $_POST['action'] ?? null;
    $validActions = ['fetch', 'save'];

    if (!in_array($action, $validActions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
        exit;
    }

    if ($action === 'fetch') {
        // Fetch existing semesters for the logged-in user
        $query = "SELECT semester_id, name, start_date, end_date 
                  FROM semesters 
                  WHERE user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);

        if (!$stmt->execute()) {
            error_log("SQL Error (fetch): " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch semesters.']);
            exit;
        }

        $result = $stmt->get_result();
        $semesters = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $semesters, 'user_id' => $user_id]); // Include user_id
        $stmt->close();

    } elseif ($action === 'save') {
        // Save a new semester or validate overlaps
        $semester_name = $_POST['semester_name'] ?? null;
        $start_date = $_POST['start_date'] ?? null;
        $end_date = $_POST['end_date'] ?? null;

        // Validate required fields
        if (!$semester_name || !$start_date || !$end_date) {
            echo json_encode(['success' => false, 'message' => 'All fields are required (name, start_date, end_date).']);
            exit;
        }

        // Check for overlapping semesters
        $query = "SELECT COUNT(*) AS overlap_count
                  FROM semesters
                  WHERE user_id = ?
                    AND NOT (end_date < ? OR start_date > ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("iss", $user_id, $start_date, $end_date);

        if (!$stmt->execute()) {
            error_log("SQL Error (overlap): " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Failed to check overlaps.']);
            exit;
        }

        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if ($row['overlap_count'] > 0) {
            echo json_encode(['success' => false, 'message' => 'The semester overlaps with an existing one.']);
            exit;
        } else {
            // Insert the new semester
            $insertQuery = "INSERT INTO semesters (user_id, name, start_date, end_date)
                            VALUES (?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertQuery);
            $insertStmt->bind_param("isss", $user_id, $semester_name, $start_date, $end_date);

            if ($insertStmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Semester saved successfully.']);
            } else {
                error_log("SQL Error (insert): " . $insertStmt->error);
                echo json_encode(['success' => false, 'message' => 'Failed to save semester.']);
            }
            $insertStmt->close();
        }
        $stmt->close();
    }
}

?>
