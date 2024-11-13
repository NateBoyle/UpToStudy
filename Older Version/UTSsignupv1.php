<?php

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Initialize error array
    $errors = [];

    // Trim input fields
    $full_name = trim($_POST['full_name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $username1 = trim($_POST['username']);
    $password1 = trim($_POST['password']);

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
    }
    elseif (strlen($username1) < 8) {
        $errors['username'] = "Username must be at least 8 characters long.";
    }

    // Validate password (e.g., must be at least 8 characters)
    if (empty($password1)) {
        $errors['password'] = "Password is required.";
    } elseif (strlen($password1) < 8) {
        $errors['password'] = "Password must be at least 8 characters long.";
    }elseif (!preg_match('/[A-Z]/', $password1)) {
        $errors['password'] = "Password must contain at least one uppercase letter.";
    } elseif (!preg_match('/[a-z]/', $password1)) {
        $errors['password'] = "Password must contain at least one lowercase letter.";
    } elseif (!preg_match('/[0-9]/', $password1)) {
        $errors['password'] = "Password must contain at least one number.";
    } elseif (!preg_match('/[~!@#$%^&*<>?]/', $password1)) {
        $errors['password'] = "Password must contain at least one special character (!@#$%^&*<>?).";
    }else {
        $password1 = password_hash($password1, PASSWORD_BCRYPT); // Hash password
    }

    // Output the result
    // Proceed only if there are no validation errors
    if (empty($errors)) {

        // Database connection variables
        $host="localhost";
        $username2="root";
        $password2="";
        $database_name="utsdb";

        $conn=mysqli_connect($host,$username2,$password2,$database_name);

        if(!$conn){

            // Return connection error
            echo json_encode(['status' => 'error', 'message' => "Unable to connect to the database. Please try again later."]);
            exit; // Stop the script execution

        }
        else
        {
                        

            /*// Check if the username or email already exists
            $check_user_query = "SELECT username, email FROM users WHERE username = ? OR email = ?";
            $stmt = $conn->prepare($check_user_query);

            if ($stmt === false) {

                echo json_encode(['status' => 'error', 'message' => 'There was an issue checking your username and email. Please try again.']);
                exit;
            }

            $stmt->bind_param("ss", $username1, $email);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {

                // Bind the results
                $stmt->bind_result($existing_username, $existing_email);
                $stmt->fetch();

                // Check if the username already exists
                if ($existing_username === $username1) {
                    $errors['username'] = "Username already exists.";
                }

                // Check if the email already exists
                if ($existing_email === $email) {
                    $errors['email'] = "Email already exists.";
                }
                
            } 

            // Return errors if they exist
            if (!empty($errors)) {
                echo json_encode(['status' => 'error', 'errors' => $errors]);
                $stmt->close();
                mysqli_close($conn);
                exit;
            }


            // Close the existing check statement
            $stmt->close();*/

            mysqli_begin_transaction($conn);

            try {

                // Insert the new user into the database
                $sql_query = "INSERT INTO users (full_name, username, password, email, phone_number) VALUES (?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql_query);

                if ($stmt === false) {
                    error_log("Database query error: " . $conn->error);  // Log the error message
                    echo json_encode(['status' => 'error', 'message' => 'An error occurred while preparing the insert query.']);
                    exit;
                }

                $stmt->bind_param("sssss", $full_name, $username1, $password1, $email, $phone);

                if($stmt->execute())
                {
                    mysqli_commit($conn);  // Commit the transaction
                    echo json_encode(['status' => 'success', 'message' => 'New user added successfully!']);
                }
                else
                {
                    if ($conn->errno === 1062) { // Error code for duplicate entry
                        // Determine if the error is due to username or email
                        if (strpos($conn->error, 'username') !== false) {
                            $errors['username'] = "Username already exists.";
                        }
                        if (strpos($conn->error, 'email') !== false) {
                            $errors['email'] = "Email already exists.";
                        }
                        echo json_encode(['status' => 'error', 'errors' => $errors]);
                    } else {
                        mysqli_rollback($conn); // Roll back if something else goes wrong
                        echo json_encode(['status' => 'error', 'message' => 'An error occurred while executing the insert query.']);
                    }
                }

            } catch (Exception $e) {
                mysqli_rollback($conn); // Roll back on exception
                error_log("Error during signup: " . $e->getMessage());  // Log the actual error
                echo json_encode(['status' => 'error', 'message' => 'An unexpected error occurred.']);
            } finally {
                // Close the statement and the connection
                $stmt->close();
                mysqli_close($conn);
            }
            
            
        }


    } else {
        // Return the errors as JSON
        echo json_encode(['status' => 'error', 'errors' => $errors]);
    }

    
}
?>