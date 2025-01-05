<?php
// Database connection variables
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'utsdb'; // Replace with your database name

// Create a connection to the database
$conn = new mysqli($host, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}

return $conn;

?>
