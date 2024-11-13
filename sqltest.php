<?php

$host="localhost";
$username="root";
$password="";
$database_name="UTSdb";


$conn=mysqli_connect($host,$username,$password,$database_name);

if (!$conn) {
    echo "Connection Error.";
} else {
    echo "Database Connection Successfully! <br>";

    $query = $conn->query("SELECT MAX(user_id) FROM users");
    $result = $query->fetch_array()[0]+1;

    echo "$result";
}
?>