<?php
require 'UTSbootstrap.php';
require 'UTSmailConfig.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? null;

if (!$action) {
    echo json_encode(['success' => false, 'message' => 'No action specified.']);
    exit;
}

if ($action === 'sendEmail') {
    // Handle sending verification email
    $email = strtolower($input['email'] ?? null);

    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'Email is required for sending the verification email.']);
        exit;
    }

    // Query the database for the user's token
    $stmt = $conn->prepare("SELECT verification_token FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        $token = $user['verification_token'];

        // Send the email
        $emailResult = sendVerificationEmail($email, $token);
        echo json_encode($emailResult);
    } else {
        echo json_encode(['success' => false, 'message' => 'No user found with that email.']);
    }
} elseif ($action === 'verifyUser') {
    // Handle verifying the user
    $token = $input['token'] ?? null;

    if (!$token) {
        echo json_encode(['success' => false, 'message' => 'Token is required for verification.']);
        exit;
    }

    $stmt = $conn->prepare("SELECT user_id, verified FROM users WHERE verification_token = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if ($user['verified']) {
            echo json_encode(['success' => false, 'message' => 'Account is already verified.']);
        } else {
            $updateStmt = $conn->prepare("UPDATE users SET verified = 1, verification_token = NULL WHERE user_id = ?");
            $updateStmt->bind_param('i', $user['user_id']);
            $updateStmt->execute();

            echo json_encode(['success' => true, 'message' => 'Account verified successfully.']);
            $updateStmt->close();
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid or expired verification token.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

// Utility function for sending the verification email
function sendVerificationEmail($userEmail, $verificationToken) {
    $mailConfig = require 'UTSmailConfig.php';
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = $mailConfig['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $mailConfig['username'];
        $mail->Password = $mailConfig['password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $mailConfig['port'];

        $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
        $mail->addAddress($userEmail);

        $verificationLink = "http://localhost/UTScode/UTSverification.html?token=" . $verificationToken;
        $mail->Subject = 'Verify Your Email Address';
        $mail->Body = "Click the link to verify your email: $verificationLink";

        $mail->send();
        return ['success' => true, 'message' => 'Verification email sent successfully.'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Failed to send verification email.'. $mail->ErrorInfo];
    }
}
?>
