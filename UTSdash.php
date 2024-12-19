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

// Prepare SQL query to fetch total_time
$query = "SELECT total_time FROM logged_time WHERE user_id = ?";
$stmt = $conn->prepare($query);

if ($stmt === false) {
    error_log("Failed to prepare statement: " . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'Database query failed.']);
    exit;
}

// Bind the user_id parameter
$stmt->bind_param("i", $user_id);

// Execute the query
if (!$stmt->execute()) {
    error_log("Execution failed: " . $stmt->error);
    echo json_encode(['status' => 'error', 'message' => 'Failed to retrieve usage time.']);
    exit;
}

// Fetch the result
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $total_time = $row['total_time'];

    // Return the total_time as JSON
    echo json_encode([
        'status' => 'success',
        'total_time' => $total_time
    ]);
} else {
    // No entry found for the user_id
    echo json_encode([
        'status' => 'success',
        'total_time' => 0, // Default to 0 if no data exists
        'message' => 'No usage time recorded.'
    ]);
}

// Close the statement and connection
$stmt->close();
exit;

?>