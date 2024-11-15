<?php
require 'UTSconfig.php'; // Include global configurations
applySecurityHeaders(true); // Apply security headers, including JSON response type

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Define a function to check authentication and session validity
function checkAuthentication() {
    $response = [];

    // Check if the user is logged in
    if (isset($_SESSION['user_id'])) {
        // Check for session expiration (optional)
        $timeout_duration = 3600; // Session timeout in seconds (30 minutes)
        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout_duration)) {
            session_unset();
            session_destroy();
            $response['authenticated'] = false;
            $response['message'] = 'Session expired. Please log in again.';
        } else {
            // Update last activity time
            $_SESSION['last_activity'] = time();

            $response['authenticated'] = true;
            $response['user_id'] = $_SESSION['user_id'];
            $response['username'] = $_SESSION['username'] ?? null; // Include additional user data
            //$response['role'] = $_SESSION['role'] ?? null;  Include role if available
        }
    } else {
        $response['authenticated'] = false;
        $response['message'] = 'User not logged in.';
    }

    return $response;
}

// Run the session check
$response = checkAuthentication();

// Expose the user_id for use in other scripts
if ($response['authenticated']) {
    $user_id = $_SESSION['user_id'];
}

// If this script is accessed directly, return the JSON response
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}
?>
