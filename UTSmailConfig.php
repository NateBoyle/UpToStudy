<?php
// UTSmailConfig.php

return [
    // Amazon SES SMTP server settings
    'host' => 'email-smtp.us-west-2.amazonaws.com', // Replace with your SES region's SMTP endpoint
    'port' => 587,                                 // Port for TLS encryption
    'username' => 'AKIA2UC3DMMOR2EW62PE',           // Your Amazon SES SMTP username
    'password' => 'BLKy/h1iJjZi+L6EDbYXqURM/Q4NzFmVzwTy5IG8LGQY',           // Your Amazon SES SMTP password

    // Default "From" email settings
    'from_email' => 'uptostudyhelp@gmail.com', // Your verified email address in SES
    'from_name' => 'UpToStudy Support',               // Sender's name displayed in the email
];
?>
