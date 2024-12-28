<?php

require 'UTSbootstrap.php';
require 'vendor/autoload.php'; // PHPMailer autoload
$mailConfig = require 'UTSmailConfig.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

global $conn;

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection error.']);
    exit;
}

// Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

// Input validation
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (empty($subject) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Subject and message are required.']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Retrieve the user's email address from the database
    $stmt = $conn->prepare("SELECT email FROM users WHERE user_id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows !== 1) {
        echo json_encode(['success' => false, 'message' => 'User email not found.']);
        exit;
    }

    $user = $result->fetch_assoc();
    $userEmail = $user['email'];

    // Insert the support ticket into the database
    $insertStmt = $conn->prepare("INSERT INTO support_tickets (user_id, subject, message) VALUES (?, ?, ?)");
    $insertStmt->bind_param('iss', $userId, $subject, $message);

    if (!$insertStmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Failed to store the support ticket.']);
        exit;
    }

    // Set up PHPMailer
    $mail = new PHPMailer(true);

    try {
        // Configure SMTP
        $mail->isSMTP();
        $mail->Host = $mailConfig['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $mailConfig['username'];
        $mail->Password = $mailConfig['password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $mailConfig['port'];

        // Set email headers
        $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
        $mail->addAddress('uptostudyhelp@gmail.com'); // Support email address
        $mail->addReplyTo($userEmail, 'User');

        // Email content
        $mail->Subject = $subject;
        $mail->Body = $message;

        // Send the email
        $mail->send();
        echo json_encode(['success' => true, 'message' => 'Support ticket submitted and email sent successfully.']);
    } catch (Exception $e) {
        error_log('Mailer Error: ' . $mail->ErrorInfo);
        echo json_encode(['success' => false, 'message' => 'Support ticket stored, but email sending failed.']);
    }

} catch (Exception $e) {
    error_log('Error processing support ticket: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred.']);
}

?>
