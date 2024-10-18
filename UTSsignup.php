<?php

if ($_SERVER["REQUEST_METHOD"] == "POST") {

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
        $errors['password'] = "Password must contain at least one special character (!@#$%^&*).";
    }else {
        $password1 = password_hash($password1, PASSWORD_BCRYPT); // Hash password
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

            die("Connection Failed:" . mysqli_connect_error());
        }
        else
        {
            //echo "Connection!";

            
            //$query = $conn->query("SELECT MAX(user_id) FROM users");
            //$userid = $query->fetch_array()[0]+1;
            

            $sql_query = "INSERT INTO users (full_name, username, password, email, phone_number) VALUES (?, ?, ?, ?, ?)";
               
            $stmt = $conn->prepare($sql_query);
            $stmt->bind_param("sssss", $full_name, $username1, $password1, $email, $phone);

            if($stmt->execute())
            {
                echo json_encode(['status' => 'success', 'message' => 'New user added successfully!']);
            }
            else
            {
                echo "Error executing query: " . $stmt->error;
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