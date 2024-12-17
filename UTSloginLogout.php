<?php

require 'UTSconfig.php'; // Include global configurations
require 'UTSdb_connection.php';
applySecurityHeaders(true); // Apply security headers (JSON content type)

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Handle login
function handleLogin() {
    global $conn;

    // Sanitize and validate inputs
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    $errors = [];
    if (empty($username)) $errors['username'] = "Username is required.";
    if (empty($password)) $errors['password'] = "Password is required.";

    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        exit();
    }

    // Fetch user credentials from the database
    $query = "SELECT user_id, password FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);

    if (!$stmt->execute()) {
        error_log("SQL execution error: " . $stmt->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error.']);
        exit();
    }

    $result = $stmt->get_result();
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($password, $user['password'])) {
            // Check for an active session
            $query_active_session = "SELECT session_id, last_activity, logout_time 
                                    FROM login_logout_history 
                                    WHERE user_id = ? AND logout_time IS NULL 
                                    ORDER BY last_activity DESC LIMIT 1";
            $stmt_active_session = $conn->prepare($query_active_session);
            $stmt_active_session->bind_param("i", $user['user_id']);
            $stmt_active_session->execute();
            $result_active_session = $stmt_active_session->get_result();

            $timeout_duration = 45; // Timeout in seconds
            $current_time = time();

            if ($result_active_session->num_rows > 0) {
                
                $session = $result_active_session->fetch_assoc();
                $last_activity = strtotime($session['last_activity']);

                // Check if the session has timed out
                if (($current_time - $last_activity) > $timeout_duration) {
                    // Perform automatic logout by updating logout_time
                    $session_id = $session['session_id'];
                    $query_auto_logout = "UPDATE login_logout_history 
                                          SET logout_time = FROM_UNIXTIME(?), manual_logout = 0 
                                          WHERE session_id = ?";
                    $stmt_auto_logout = $conn->prepare($query_auto_logout);
                    $stmt_auto_logout->bind_param("is", $last_activity, $session_id);
                    $stmt_auto_logout->execute();
                } else {
                    // Deny login due to active session
                    echo json_encode(['status' => 'error', 'message' => 'User already logged in.']);
                    exit();
                }
                
            }

            // Start a new session
            session_regenerate_id(true); // Prevent session fixation
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $username;

            // Insert into login_logout_history
            $ip_address = $_SERVER['REMOTE_ADDR'];
            $session_id = session_id();
            $query_insert_session = "INSERT INTO login_logout_history (user_id, session_id, ip_address, login_time)
                                     VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
            $stmt_insert_session = $conn->prepare($query_insert_session);

            if ($stmt_insert_session === false) {
                error_log("SQL preparation error: " . $conn->error);
                echo json_encode(['status' => 'error', 'message' => 'Database error.']);
                exit();
            }

            $stmt_insert_session->bind_param("iss", $user['user_id'], $session_id, $ip_address);
            if (!$stmt_insert_session->execute()) {
                error_log("Failed to record login event: " . $stmt_insert_session->error);
                echo json_encode(['status' => 'error', 'message' => 'Failed to record login.']);
                exit();
            }

            echo json_encode(['status' => 'success', 'message' => 'Login successful.']);
            exit();
        }
    }

    // Default error if username or password is incorrect
    echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
    exit();
}

// Handle logout
function handleManualLogout() {
    global $conn;

    // Check if a session is active
    if (isset($_SESSION['user_id'])) {
        $session_id = session_id();

        // Check if the session exists and is still active
        $query_check_session = "SELECT logout_time FROM login_logout_history WHERE session_id = ?";
        $stmt_check_session = $conn->prepare($query_check_session);
        $stmt_check_session->bind_param("s", $session_id);
        $stmt_check_session->execute();
        $result_check_session = $stmt_check_session->get_result();

        if ($result_check_session->num_rows === 0) {
            // No session found in the database
            echo json_encode(['status' => 'error', 'message' => 'No active session found.']);
            exit();
        }

        $row = $result_check_session->fetch_assoc();
        if (!is_null($row['logout_time'])) {
            // Session already logged out
            echo json_encode(['status' => 'error', 'message' => 'Session already logged out.']);
            exit();
        }

        // Update the logout_time for the session
        $query_update_logout = "UPDATE login_logout_history SET logout_time = CURRENT_TIMESTAMP, manual_logout = 1 WHERE session_id = ?";
        $stmt_update_logout = $conn->prepare($query_update_logout);
        $stmt_update_logout->bind_param("s", $session_id);

        if (!$stmt_update_logout->execute()) {
            error_log("Failed to update logout_time for session_id {$session_id}: " . $stmt_update_logout->error);
            echo json_encode(['status' => 'error', 'message' => 'Failed to update logout.']);
            exit();
        }

        // Destroy the session
        session_unset();
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/'); // Clear the session cookie

        echo json_encode(['status' => 'success', 'message' => 'Logged out successfully.']);
        exit();
    }

    // No active session
    echo json_encode(['status' => 'error', 'message' => 'No active session to log out from.']);
    exit();
}


// Route the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'logout') {
        handleManualLogout();
    } else {
        handleLogin();
    }
}
