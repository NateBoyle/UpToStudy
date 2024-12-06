<?php

require 'UTSbootstrap.php';

global $conn;

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Validate action
    $action = $_POST['action'] ?? null;
    $validActions = ['save', 'update', 'delete'];

    if (!in_array($action, $validActions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
        exit;
    }

    if ($action === 'save') {
        // Save a new semester
        $semester_name = $_POST['semester_name'] ?? null;
        $start_date = $_POST['start_date'] ?? null;
        $end_date = $_POST['end_date'] ?? null;

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
        }

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

    } elseif ($action === 'update') {
        // Update an existing semester
        $semester_id = $_POST['semester_id'] ?? null;
        $semester_name = $_POST['semester_name'] ?? null;
        $start_date = $_POST['start_date'] ?? null;
        $end_date = $_POST['end_date'] ?? null;

        if (!$semester_id || !$semester_name || !$start_date || !$end_date) {
            echo json_encode(['success' => false, 'message' => 'All fields are required (semester_id, name, start_date, end_date).']);
            exit;
        }

        $updateQuery = "UPDATE semesters
                        SET name = ?, start_date = ?, end_date = ?
                        WHERE semester_id = ? AND user_id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("sssii", $semester_name, $start_date, $end_date, $semester_id, $user_id);

        if ($updateStmt->execute() && $updateStmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Semester updated successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update semester or no changes made.']);
        }
        $updateStmt->close();

    } elseif ($action === 'delete') {
        // Delete an existing semester
        $semester_id = $_POST['semester_id'] ?? null;

        if (!$semester_id) {
            echo json_encode(['success' => false, 'message' => 'Semester ID is required for deletion.']);
            exit;
        }

        $deleteQuery = "DELETE FROM semesters WHERE semester_id = ? AND user_id = ?";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bind_param("ii", $semester_id, $user_id);

        if ($deleteStmt->execute() && $deleteStmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Semester deleted successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete semester or semester not found.']);
        }
        $deleteStmt->close();
    }
}

?>
