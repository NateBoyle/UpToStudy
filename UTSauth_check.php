<?php
require 'UTSconfig.php'; // Include global configurations
require 'UTSlogout.php';
applySecurityHeaders(true); // Apply security headers, including JSON response type

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function updateLastActivity() {
    global $conn;

    $sessionId = session_id(); // Retrieve current session ID

    $updateQuery = "UPDATE login_logout_history 
                    SET last_activity = CURRENT_TIMESTAMP 
                    WHERE session_id = ? AND logout_time IS NULL";

    // Execute the query
    if ($stmt = $conn->prepare($updateQuery)) {
        // Bind the parameters
        $stmt->bind_param('s', $sessionId);

        // Execute the statement
        if (!$stmt->execute()) {
            error_log("Failed to update last_activity: " . $stmt->error);
            return ['status' => 'error', 'message' => 'Database update failed'];
        }

        // Close the statement
        $stmt->close();
        return ['status' => 'success', 'message' => 'Last activity updated'];
    } else {
        error_log("Failed to prepare statement for updating last_activity: " . $conn->error);
        return ['status' => 'error', 'message' => 'Database query preparation failed'];
    }
}

// Define a function to check authentication and session validity
function checkAuthentication($updateLastActivity) {
    $response = [];

    // Check if the user is logged in
    if (isset($_SESSION['user_id'])) {

        global $conn;

        // Check for session expiration (optional)
        $timeout_duration = 1800; // Session timeout in seconds 

        // Assuming you already have the user's session ID
        $sessionId = session_id(); // Retrieve the current session ID

        // Query to get the last_activity field
        $query = "SELECT last_activity FROM login_logout_history WHERE session_id = ? AND logout_time IS NULL LIMIT 1";
        $stmt = $conn->prepare($query);

        if ($stmt) {
            $stmt->bind_param("s", $sessionId); // Bind the session ID parameter
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $_SESSION['last_activity'] = $row['last_activity']; // Store last_activity in session
                error_log("Last activity time stored in session: " . $_SESSION['last_activity']); // Log the information
            } else {
                error_log("No last activity found for the current session."); // Log no results found
            }

            $stmt->close(); // Close the statement
        } else {
            error_log("Failed to prepare statement: " . $conn->error); // Log statement preparation failure
        }

        // Get the current time
        $current_time = time(); // Unix timestamp
        $readable_time = date('Y-m-d H:i:s', $current_time); // Human-readable format

        $lastActivityUnix = strtotime($_SESSION['last_activity']);

        error_log("Hello! From auth check. Time (readable): {$readable_time} | UNIX: {$current_time}, Last Activity: {$_SESSION['last_activity']} | {$lastActivityUnix}. ");

        if (isset($_SESSION['last_activity']) && ($current_time - strtotime($_SESSION['last_activity']) > $timeout_duration)) {

            error_log("Session timeout for user_id {$_SESSION['user_id']}:
                last_activity: ".strtotime($_SESSION['last_activity']).",
                current_time: " . time() . ",
                timeout_duration: {$timeout_duration} seconds.");

            handleLogout();

            $response['authenticated'] = false;
            $response['message'] = 'Session expired. Please log in again.';

        } else {

            if ($updateLastActivity) {
                updateLastActivity();
            }

            $response['authenticated'] = true;
            $response['user_id'] = $_SESSION['user_id'];
            $response['username'] = $_SESSION['username'] ?? null; // Include additional user data

        }
    } else {
        $response['authenticated'] = false;
        $response['message'] = 'User not logged in.';
    }

    return $response;
}

// Handle POST requests
$response = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? null;

    if ($action === 'updateLastActivity') {
        // Call updateLastActivity directly
        $response = updateLastActivity();
    } else {
        // Default to authentication check
        $updateLastActivity = isset($input['updateLastActivity']) 
            ? filter_var($input['updateLastActivity'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) 
            : true;
        $response = checkAuthentication($updateLastActivity);
    }
}

// Return the response as JSON
header('Content-Type: application/json');
echo json_encode($response);
exit;
