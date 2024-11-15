<?php

// Start session if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include database connection
require 'UTSdb_connection.php';

register_shutdown_function(function() use ($conn) {
    // Close database connection
    if (isset($conn) && $conn) {
        $conn->close();
        error_log('Database connection closed by shutdown function.');
    }

    // Log fatal errors
    $error = error_get_last();
    if ($error) {
        error_log("Fatal error occurred: " . print_r($error, true));
    }
});

?>