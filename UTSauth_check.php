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

    // Update last activity time
    $_SESSION['last_activity'] = time();

    // Update last_activity in the database for this session
    $sessionId = session_id(); // Get the current session ID
    $lastActivity = date('Y-m-d H:i:s', $_SESSION['last_activity']);

    $updateQuery = "UPDATE login_logout_history 
                    SET last_activity = '$lastActivity' 
                    WHERE session_id = '$sessionId' AND logout_time IS NULL";

    // Execute the query
    if (!$conn->query($updateQuery)) {
        error_log("Failed to update last_activity: " . $conn->error);
    }
}

// Define a function to check authentication and session validity
function checkAuthentication() {
    $response = [];

    // Check if the user is logged in
    if (isset($_SESSION['user_id'])) {

        global $conn;

        // Check for session expiration (optional)
        $timeout_duration = 30; // Session timeout in seconds (30)
        $sessionId = session_id(); // Retrieve current session ID

        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout_duration)) {
            

            // Check the database for the most recent session data
            $query = "SELECT logout_time, last_activity 
                    FROM login_logout_history 
                    WHERE user_id = ? 
                        AND logout_time = (
                            SELECT MAX(logout_time) 
                            FROM login_logout_history 
                            WHERE user_id = ? AND logout_time IS NOT NULL
                        ) 
                    LIMIT 1";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ii", $_SESSION['user_id'], $_SESSION['user_id']);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                error_log("No results");
            }
            


            if ($result->num_rows > 0) {
                $session = $result->fetch_assoc();
                $logoutTime = $session['logout_time'] ? strtotime($session['logout_time']. ' UTC') : null; // Convert to UTC
                $lastActivity = strtotime($session['last_activity']); // Convert last_activity to UNIX timestamp

                error_log("last_activity: {$lastActivity},
                    logout_time: {$logoutTime},
                    timeout_duration: {$timeout_duration} seconds.");
    
                // If logout_time matches last_activity, skip handleLogout
                if (!is_null($logoutTime) && $logoutTime <= $lastActivity) {
                    error_log("User_id {$_SESSION['user_id']}:
                        last_activity: {$lastActivity},
                        logout_time: {$logoutTime},
                        timeout_duration: {$timeout_duration} seconds.");

                    /*// Update last activity time
                    $_SESSION['last_activity'] = time();

                    // Update last_activity in the database for this session
                    $sessionId = session_id(); // Get the current session ID
                    $lastActivity = date('Y-m-d H:i:s', $_SESSION['last_activity']);

                    $updateQuery = "UPDATE login_logout_history 
                                    SET last_activity = '$lastActivity' 
                                    WHERE session_id = '$sessionId' AND logout_time IS NULL";

                    // Execute the query
                    if (!$conn->query($updateQuery)) {
                        error_log("Failed to update last_activity: " . $conn->error);
                    }*/

                    updateLastActivity();

                    $response['authenticated'] = true;
                    $response['user_id'] = $_SESSION['user_id'];
                    $response['username'] = $_SESSION['username'] ?? null; // Include additional user data
                    return $response;
                    //return false;
                }
            }

            error_log("Session timeout for user_id {$_SESSION['user_id']}:
                last_activity: {$_SESSION['last_activity']},
                current_time: " . time() . ",
                timeout_duration: {$timeout_duration} seconds.");

            handleLogout();

            $response['authenticated'] = false;
            $response['message'] = 'Session expired. Please log in again.';

        } else {


            /*// Update last activity time
            $_SESSION['last_activity'] = time();

            // Update last_activity in the database for this session
            $sessionId = session_id(); // Get the current session ID
            $lastActivity = date('Y-m-d H:i:s', $_SESSION['last_activity']);

            $updateQuery = "UPDATE login_logout_history 
                            SET last_activity = '$lastActivity' 
                            WHERE session_id = '$sessionId' AND logout_time IS NULL";

            // Execute the query
            if (!$conn->query($updateQuery)) {
                error_log("Failed to update last_activity: " . $conn->error);
            }*/

            updateLastActivity();

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

// Handle specific POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'logout') {
        handleLogout();
        echo json_encode([
            'status' => 'success',
            'message' => 'Logged out successfully.'
        ]);
        exit;
    }

    if ($action === 'window_closed') {
        handleLogout();
        echo json_encode([
            'status' => 'success',
            'message' => 'Logged out due to window closure.'
        ]);
        exit;
    }
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