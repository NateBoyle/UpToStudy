<?php

// Define the environment: 'development' or 'production'
define('ENVIRONMENT', 'development'); // Change to 'production' for live sites

// Set the default timezone
date_default_timezone_set('America/Los_Angeles');

// Enable error reporting (switch based on environment)
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Secure session settings
ini_set('session.cookie_httponly', true);
ini_set('session.use_strict_mode', true);
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', true);
}

// Function to apply security headers
function applySecurityHeaders($isJson = false) {
    if ($isJson) {
        header('Content-Type: application/json');
    }
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self';");
    header("X-Frame-Options: DENY"); // Prevent clickjacking
    header("X-Content-Type-Options: nosniff"); // Prevent MIME-type confusion
    header("X-XSS-Protection: 1; mode=block"); // Enable XSS protection (legacy browsers)

}
?>
