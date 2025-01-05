<?php

require 'UTSdb_connection.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    global $conn;

    // Initialize error array
    $errors = [];

    // Trim input fields
    $full_name = trim($_POST['full_name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $username1 = trim($_POST['username']);
    $password1 = trim($_POST['password']);

    /*// Database connection variables
    $host = "localhost";
    $username2 = "root";
    $password2 = "";
    $database_name = "utsdb";

    $conn = mysqli_connect($host, $username2, $password2, $database_name);*/

    if (!$conn) {
        // Return connection error
        echo json_encode(['status' => 'error', 'message' => "Unable to connect to the database. Please try again later."]);
        exit; // Stop the script execution
    }

    // Validate full name
    if (empty($full_name)) {
        $errors['fullName'] = "Full name is required.";
    }

    // Validate email
    if (empty($email)) {
        $errors['email'] = "Email is required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = "Invalid email format.";
    } else {
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    }

    // Validate phone number (e.g., must be 10 digits)
    if (empty($phone)) {
        $errors['phone'] = "Phone number is required.";
    } elseif (!preg_match('/^[0-9]{10}$/', $phone)) {
        $errors['phone'] = "Phone number must be 10 digits.";
    }

    // Validate username
    if (empty($username1)) {
        $errors['username'] = "Username is required.";
    } elseif (strlen($username1) < 8) {
        $errors['username'] = "Username must be at least 8 characters long.";
    }

    // Validate password (e.g., must be at least 8 characters)
    if (empty($password1)) {
        $errors['password'] = "Password is required.";
    } elseif (strlen($password1) < 8) {
        $errors['password'] = "Password must be at least 8 characters long.";
    } elseif (!preg_match('/[A-Z]/', $password1)) {
        $errors['password'] = "Password must contain at least one uppercase letter.";
    } elseif (!preg_match('/[a-z]/', $password1)) {
        $errors['password'] = "Password must contain at least one lowercase letter.";
    } elseif (!preg_match('/[0-9]/', $password1)) {
        $errors['password'] = "Password must contain at least one number.";
    } elseif (!preg_match('/[~!@#$%^&*<>?]/', $password1)) {
        $errors['password'] = "Password must contain at least one special character (!@#$%^&*<>?).";
    }

    // Check for duplicate username or email in the database
    if (empty($errors)) {
        $check_query = "SELECT username, email FROM users WHERE username = ? OR email = ?";
        $stmt = $conn->prepare($check_query);

        if ($stmt) {
            $stmt->bind_param("ss", $username1, $email);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $stmt->bind_result($existing_username, $existing_email);
                while ($stmt->fetch()) {
                    if ($existing_username === $username1) {
                        $errors['username'] = "Username already exists.";
                    }
                    if ($existing_email === $email) {
                        $errors['email'] = "Email already exists.";
                    }
                }
            }

            $stmt->close();
        } else {
            error_log("Failed to prepare duplicate check query: " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'An error occurred while checking for duplicate entries.']);
            mysqli_close($conn);
            exit;
        }
    }

    // If there are errors, return them to the user
    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        mysqli_close($conn);
        exit;
    }

    // If no errors, proceed with user registration
    $password1 = password_hash($password1, PASSWORD_BCRYPT); // Hash the password

    // Generate a unique verification token
    $verification_token = bin2hex(random_bytes(16)); // Generates a 32-character token


    mysqli_begin_transaction($conn);

    try {
        $insert_query = "INSERT INTO users (full_name, username, password, email, phone_number, verification_token) 
                     VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($insert_query);

        if ($stmt === false) {
            error_log("Failed to prepare insert query: " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'An error occurred while preparing the insert query.']);
            mysqli_rollback($conn);
            mysqli_close($conn);
            exit;
        }

        $stmt->bind_param("ssssss", $full_name, $username1, $password1, $email, $phone, $verification_token);

        if ($stmt->execute()) {
            mysqli_commit($conn);
            echo json_encode(['status' => 'success', 'message' => 'New user added successfully!']);
        } else {
            mysqli_rollback($conn);
            echo json_encode(['status' => 'error', 'message' => 'An error occurred while executing the insert query.']);
        }

        $stmt->close();

    } catch (Exception $e) {
        mysqli_rollback($conn);
        error_log("Error during registration: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'An unexpected error occurred.']);
    }

    // Close the database connection
    mysqli_close($conn);
}
?>
