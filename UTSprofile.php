<?php

require 'UTSbootstrap.php';

global $conn;

//session_start();

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in.']);
    exit;
}

$action = $_POST['action'] ?? null;

switch ($action) {
    case 'fetchProfile':
        fetchUserProfile();
        break;

    case 'updateProfile':
        updateUserProfile();
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
        break;
}

// Fetch user profile data
function fetchUserProfile() {
    global $conn;

    $userId = $_SESSION['user_id'];

    try {
        $stmt = $conn->prepare("SELECT full_name, email, phone_number, username FROM users WHERE user_id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            echo json_encode(['status' => 'success', 'data' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User not found.']);
        }
    } catch (Exception $e) {
        error_log("Error fetching user profile: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'An unexpected error occurred.']);
    }
}

// Update user profile
function updateUserProfile() {
    global $conn;

    $userId = $_SESSION['user_id'];
    $fullName = trim($_POST['full_name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone']);
    $username = trim($_POST['username']);
    $password = trim($_POST['password'] ?? ''); // Optional for profile updates
    $errors = [];

    // Validate inputs (reuse logic from existing code)
    if (empty($fullName)) {
        $errors['full_name'] = "Full name is required.";
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = "Valid email is required.";
    }
    if (empty($phone) || !preg_match('/^[0-9]{10}$/', $phone)) {
        $errors['phone'] = "Valid phone number is required.";
    }
    if (empty($username) || strlen($username) < 8) {
        $errors['username'] = "Username must be at least 8 characters long.";
    }

    // Check for duplicate username or email
    if (empty($errors)) {
        // Check for duplicate username
        $username_query = "SELECT user_id FROM users WHERE username = ? AND user_id != ?";
        $stmt = $conn->prepare($username_query);

        if ($stmt) {
            $stmt->bind_param("si", $username, $userId);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $errors['username'] = "Username already exists.";
            }

            $stmt->close();
        } else {
            error_log("Failed to prepare username check query: " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'An error occurred while checking the username.']);
            mysqli_close($conn);
            exit;
        }

        // Check for duplicate email
        $email_query = "SELECT user_id FROM users WHERE email = ? AND user_id != ?";
        $stmt = $conn->prepare($email_query);

        if ($stmt) {
            $stmt->bind_param("si", $email, $userId);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $errors['email'] = "Email already exists.";
            }

            $stmt->close();
        } else {
            error_log("Failed to prepare duplicate check query: " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'An error occurred while checking for duplicate entries.']);
            mysqli_close($conn);
            exit;
        }
    }

    // Return errors if validation fails
    if (!empty($errors)) {
        echo json_encode(['status' => 'error', 'errors' => $errors]);
        return;
    }

    // Hash password if provided
    $hashedPassword = !empty($password) ? password_hash($password, PASSWORD_BCRYPT) : null;

    // Update user data
    mysqli_begin_transaction($conn);
    try {
        $query = "UPDATE users SET full_name = ?, email = ?, phone_number = ?, username = ?" .
                 ($hashedPassword ? ", password = ?" : "") .
                 " WHERE user_id = ?";
        $stmt = $conn->prepare($query);

        if ($hashedPassword) {
            $stmt->bind_param('sssssi', $fullName, $email, $phone, $username, $hashedPassword, $userId);
        } else {
            $stmt->bind_param('ssssi', $fullName, $email, $phone, $username, $userId);
        }

        if ($stmt->execute()) {
            mysqli_commit($conn);
            echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully.']);
        } else {
            throw new Exception('Failed to update profile.');
        }
    } catch (Exception $e) {
        mysqli_rollback($conn);
        error_log("Error updating profile: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'An unexpected error occurred.']);
    } finally {
        $stmt->close();
    }
}
