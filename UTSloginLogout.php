<?php

require 'UTSconfig.php'; // Include global configurations
require 'UTSdb_connection.php';
// Apply security headers (JSON content type)
applySecurityHeaders(true);

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


// Handle login
function handleLogin() {

    global $conn; // Explicitly use the global $conn
    
    // Sanitize inputs to prevent potential security risks
    $username = trim($_POST['username']); // Just trim for input
    $password = trim($_POST['password']); // No sanitization since it's hashed

    // Validate inputs
    $errors = [];
    if (empty($username)) $errors['username'] = "Username is required.";
    if (empty($password)) $errors['password'] = "Password is required.";

    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        exit(); // Stop further execution
    }

    // Prepare SQL query to fetch user data
    $query = "SELECT user_id, password FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);


    // Bind parameters and execute the query
    $stmt->bind_param("s", $username);
    if (!$stmt->execute()) { // Handle execution errors
        error_log("SQL execution error: " . $stmt->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error.']);
        exit();
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 1) {

        $row = $result->fetch_assoc();

        if (password_verify($password, $row['password'])) {

            session_regenerate_id(true); // Prevent session fixation

            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['username'] = $username;
            $_SESSION['last_activity'] = time();

            // Record login event
            $ip_address = $_SERVER['REMOTE_ADDR'];
            $session_id = session_id();
            $query_login_event = "INSERT INTO login_history (user_id, event_type, ip_address, session_id) VALUES (?, 'login', ?, ?)";
            $stmt_login_event = $conn->prepare($query_login_event);

            if ($stmt_login_event !== false) {
                $stmt_login_event->bind_param("iss", $row['user_id'], $ip_address, $session_id);
                if ($stmt_login_event->execute()) {
                    error_log("Login event recorded for user: " . $username);
                } else {
                    error_log("Failed to record login event: " . $stmt_login_event->error);
                }
                $stmt_login_event->close(); // Close the prepared statement
            }

            echo json_encode(['status' => 'success', 'message' => 'Login successful.']);
            exit();
        } else {
            // Invalid password
            echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
            exit();
        }
    } else {
        // Invalid username
        echo json_encode(['status' => 'error', 'message' => 'Invalid username or password.']);
        exit();
    }

    $stmt->close();
    
}

// Handle logout
function handleLogout() {
    global $conn; // Explicitly use the global $conn

    if (isset($_SESSION['user_id'])) {

        $user_id = $_SESSION['user_id'];
        $ip_address = $_SERVER['REMOTE_ADDR'];
        $session_id = session_id();

        // Log logout event
        $query_logout_event = "INSERT INTO login_history (user_id, event_type, ip_address, session_id, event_time) VALUES (?, 'logout', ?, ?, CURRENT_TIMESTAMP)";
        $stmt_logout_event = $conn->prepare($query_logout_event);

        if ($stmt_logout_event === false) { // Check for SQL preparation errors
            error_log("SQL preparation error: " . $conn->error);
        } else {
            $stmt_logout_event->bind_param("iss", $user_id, $ip_address, $session_id);
            if (!$stmt_logout_event->execute()) { // Check for execution errors
                error_log("SQL execution error: " . $stmt_logout_event->error);
            }
            $stmt_logout_event->close(); // Close the prepared statement
        }

        // Clear session
        session_unset();
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/'); // Clear session cookie

        echo json_encode(['status' => 'success', 'message' => 'Logged out successfully.']);
        exit();

    } else {
        echo json_encode(['status' => 'error', 'message' => 'No active session to log out from.']);
        exit();
    }

}

// Route the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'logout') {
        handleLogout();
    } else {
        handleLogin();
    }
}
