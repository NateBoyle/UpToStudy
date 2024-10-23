<?php

// Secure Cookie Settings and Start the Session
ini_set('session.cookie_httponly', true); // Prevent access to cookies via JavaScript
ini_set('session.cookie_secure', true);   // Ensure cookies are sent over HTTPS
ini_set('session.use_strict_mode', true); // Prevents session hijacking
session_start();

// HTTP Security Headers
header("Content-Security-Policy: default-src 'self';");
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

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
                if ($row['attempts'] >= $max_attempts && (time() - strtotime($row['last_attempt'])) < $lockout_time) {
                    echo json_encode(['status' => 'error', 'message' => 'Too many failed attempts. Try again later.']);
                    exit;
                }
            }

            // Prepare the SQL query to fetch the password for the given username
            $sql_query = "SELECT password FROM users WHERE username = ?";
              
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
                $hashed_password = $row['password'];

                // Verify the password
                if (password_verify($password1, $hashed_password)) {
                    // Regenerate session ID, and return success
                    session_regenerate_id(true); // Prevent session fixation
                    $_SESSION['username'] = $username1;
                    $_SESSION['last_activity'] = time(); // Record the login time
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