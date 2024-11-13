<?php

// Enable error reporting for debugging (use only in development)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Secure Cookie Settings (configure before starting session)
ini_set('session.cookie_httponly', true);
ini_set('session.cookie_secure', true); // Ensure HTTPS in production
ini_set('session.use_strict_mode', true);

// Start session only if none is active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set Content-Type header to JSON (if returning JSON response)
header('Content-Type: application/json');

// HTTP Security Headers (for enhanced security)
header("Content-Security-Policy: default-src 'self';");
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Log the incoming request method and parameters
error_log("Request received in UTSlogin.php");
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("GET parameters: " . json_encode($_GET));
error_log("POST parameters: " . json_encode($_POST));
error_log("Session state at request: " . json_encode($_SESSION));

// Check if the request is for logout
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'logout') {
    
    error_log("Logout request received with session ID: " . session_id());
    error_log("Logout triggered explicitly.");
    error_log("Session state before destruction: " . json_encode($_SESSION));

    // Database connection variables
    $host = "localhost";
    $username2 = "root";
    $password2 = "";
    $database_name = "utsdb";

    // Create a connection to the database
    $conn = mysqli_connect($host, $username2, $password2, $database_name);

    if (!$conn) {
        die("Database connection failed: " . mysqli_connect_error());
    }
    
    $user_id = $_SESSION['user_id'];
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $session_id = session_id();

    // Record logout event with automatic timestamp
    $query_logout_event = "INSERT INTO login_history (user_id, event_type, ip_address, session_id, event_time) VALUES (?, 'logout', ?, ?, CURRENT_TIMESTAMP)";
    $stmt_logout_event = $conn->prepare($query_logout_event);
    $stmt_logout_event->bind_param("iss", $user_id, $ip_address, $session_id);
    //$stmt_logout_event->execute();

    if ($stmt_logout_event->execute()) {
        error_log("Logout event successfully recorded"); // Success debug log
    } else {
        error_log("Failed to record logout event: " . $stmt_logout_event->error); // Error debug log
    }

    // Clear session
    session_unset();
    session_destroy();
    error_log("Session destroyed. Redirecting to welcome page.");
    header("Location: UTSwelcome.html");
    exit;
}


if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $errors = [];

    $username1 = trim($_POST['username']);
    $password1 = trim($_POST['password']);


    // Validate username
    if (empty($username1)) {
        $errors['username'] = "Username is required.";
    }

    // Validate password (e.g., must be at least 8 characters)
    if (empty($password1)) {
        $errors['password'] = "Password is required.";
    }
    

    // Output the result
    if (empty($errors)) {

        //echo json_encode(['status' => 'success', 'message' => 'Form submitted successfully!']);

        $host="localhost";
        $username2="root";
        $password2="";
        $database_name="utsdb";

        $conn=mysqli_connect($host,$username2,$password2,$database_name);

        if(!$conn){

            error_log("Database connection failed: " . mysqli_connect_error());
            echo json_encode(['status' => 'error', 'message' => "Unable to connect to the database. Please try again later."]);
            exit;
        }
        else
        {
            
            // Check for brute force attempts
            $max_attempts = 5;
            $lockout_time = 900; // 15 minutes

            // Query failed attempts for the user (track in a 'login_attempts' table or in session)
            $query_attempts = "SELECT attempts, last_attempt FROM login_attempts WHERE username = ?";
            $stmt_attempts = $conn->prepare($query_attempts);
            $stmt_attempts->bind_param("s", $username1);
            $stmt_attempts->execute();
            $result_attempts = $stmt_attempts->get_result();

            if ($result_attempts->num_rows > 0) {
                $row = $result_attempts->fetch_assoc();
                $attempts = $row['attempts'];
                $last_attempt = strtotime($row['last_attempt']);

                // Check if the user should be locked out
                if ($attempts >= $max_attempts && (time() - $last_attempt) < $lockout_time) {
                    // Log the lockout event in security_events table
                    $user_id_query = "SELECT user_id FROM users WHERE username = ?";
                    $stmt_user_id = $conn->prepare($user_id_query);
                    $stmt_user_id->bind_param("s", $username1);
                    $stmt_user_id->execute();
                    $user_id_result = $stmt_user_id->get_result();

                    if ($user_id_result->num_rows > 0) {
                        $user_row = $user_id_result->fetch_assoc();
                        $user_id = $user_row['user_id'];

                        $ip_address = $_SERVER['REMOTE_ADDR'];
                        $log_lockout_query = "INSERT INTO security_events (user_id, event_type, ip_address) VALUES (?, 'lockout', ?)";
                        $stmt_log_lockout = $conn->prepare($log_lockout_query);
                        $stmt_log_lockout->bind_param("is", $user_id, $ip_address);
                        $stmt_log_lockout->execute();
                    }

                    echo json_encode(['status' => 'error', 'message' => 'Too many failed attempts. Try again later.']);
                    exit;
                }
            }

            // Prepare the SQL query to fetch the password for the given username
            $sql_query = "SELECT user_id, password FROM users WHERE username = ?";
              
            // Use prepared statements to prevent SQL injection
            $stmt = $conn->prepare($sql_query);

            if ($stmt === false) {
                error_log("SQL error: " . $conn->error);
                echo json_encode(['status' => 'error', 'message' => "An unexpected error occurred. Please try again later."]);
                exit;
            }

            $stmt->bind_param("s", $username1);

            // Execute the query
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Check if username exists
            if ($result->num_rows > 0) {
                // Fetch the hashed password from the database
                $row = $result->fetch_assoc();
                $user_id_from_database = $row['user_id'];
                $hashed_password = $row['password'];

                // Verify the password
                if (password_verify($password1, $hashed_password)) {

                    // Regenerate session ID, and return success
                    session_regenerate_id(true); // Prevent session fixation

                    // **Set the user_id in the session**
                    $_SESSION['user_id'] = $user_id_from_database; // **This line is added**
                    $_SESSION['username'] = $username1;
                    $_SESSION['last_activity'] = time(); // Record the login time

                    // Record login event
                    $ip_address = $_SERVER['REMOTE_ADDR'];
                    $session_id = session_id();
                    $query_login_event = "INSERT INTO login_history (user_id, event_type, ip_address, session_id) VALUES (?, 'login', ?, ?)";
                    $stmt_login_event = $conn->prepare($query_login_event);
                    $stmt_login_event->bind_param("iss", $user_id_from_database, $ip_address, $session_id);
                    $stmt_login_event->execute();


                    // Password is correct
                    echo json_encode(['status' => 'success', 'message' => 'Login successful. Welcome, ' . htmlspecialchars($username1) . "!"]);
                    // Reset failed login attempts on successful login
                    $query_reset_attempts = "DELETE FROM login_attempts WHERE username = ?";
                    $stmt_reset_attempts = $conn->prepare($query_reset_attempts);
                    $stmt_reset_attempts->bind_param("s", $username1);
                    $stmt_reset_attempts->execute();


                } else {
                    
                    // Password is incorrect
                    error_log("Failed login attempt for username: $username1");

                    // Track failed login attempt
                    $query_update_attempts = "INSERT INTO login_attempts (username, attempts, last_attempt) VALUES (?, 1, NOW()) 
                    ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()";
                    $stmt_update_attempts = $conn->prepare($query_update_attempts);
                    $stmt_update_attempts->bind_param("s", $username1);
                    $stmt_update_attempts->execute();

                    // Return the errors as JSON
                    echo json_encode(['status' => 'error', 'message' => "Invalid username or password1."]);
                }

            } else {
                // Username not found, return error
                error_log("Failed login attempt for username: $username1");
                echo json_encode(['status' => 'error', 'message' => "Invalid username or password2."]);
            }

            $stmt->close();
            mysqli_close($conn);
            

        }

    } else {
        // Return the errors as JSON
        echo json_encode(['status' => 'error', 'errors' => $errors]);
    }

    
}
?>