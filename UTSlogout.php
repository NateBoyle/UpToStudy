<?php


require 'UTSdb_connection.php';


if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


// Handle logout
function handleLogout() {
    global $conn;

    error_log("Hello! From Logout");

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
        $query_update_logout = "UPDATE login_logout_history SET logout_time = CURRENT_TIMESTAMP WHERE session_id = ?";
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
