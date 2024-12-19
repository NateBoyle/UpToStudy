<?php

require 'UTSbootstrap.php';


global $conn; // Explicitly use the global $conn

// Function to fetch total_time for a user
function fetchTotalTime($conn, $user_id) {
    $response = [];

    $query = "SELECT total_time FROM logged_time WHERE user_id = ?";
    $stmt = $conn->prepare($query);

    if ($stmt === false) {
        error_log("Failed to prepare statement: " . $conn->error);
        $response = ['status' => 'error', 'message' => 'Database query failed.'];
    } else {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $response = ['status' => 'success', 'total_time' => $row['total_time']];
        } else {
            $response = ['status' => 'success', 'total_time' => 0, 'message' => 'No usage time recorded.'];
        }

        $stmt->close();
    }

    return $response;
}

// Function to fetch activity streak for a user
function fetchActivityStreak($conn, $user_id) {
    $response = [];

    $query = "
        SELECT DISTINCT DATE(last_activity) AS activity_date
        FROM login_logout_history
        WHERE user_id = ? AND last_activity IS NOT NULL
        ORDER BY activity_date DESC
    ";

    $stmt = $conn->prepare($query);

    if ($stmt === false) {
        error_log("Failed to prepare statement: " . $conn->error);
        $response = ['status' => 'error', 'message' => 'Database query failed.'];
    } else {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $dates = [];
        while ($row = $result->fetch_assoc()) {
            $dates[] = $row['activity_date'];
        }

        $stmt->close();

        if (!empty($dates)) {
            $response = ['success' => true, 'dates' => $dates];
        } else {
            $response = ['success' => true, 'dates' => [], 'message' => 'No activity recorded.'];
        }
    }

    return $response;
}

// Function to fetch the quote of the day
function fetchQuoteOfTheDay($conn) {
    $response = [];
    $currentDate = date('Y-m-d'); // Get the current UTC date

    // Check if there's a quote already used today
    $query = "
        SELECT id, quote, author, last_used
        FROM quotes
        WHERE DATE(last_used) = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($query);

    if ($stmt === false) {
        error_log("Failed to prepare statement: " . $conn->error);
        $response = ['status' => 'error', 'message' => 'Database query failed.'];
    } else {
        $stmt->bind_param("s", $currentDate); // Bind the current UTC date
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            // Quote already used today
            $row = $result->fetch_assoc();
            $response = [
                'success' => true,
                'quote' => $row['quote'],
                'author' => $row['author']
            ];
        } else {
            $stmt->close();

            // Fetch the least recently used quote
            $query = "
                SELECT id, quote, author
                FROM quotes
                ORDER BY last_used IS NULL DESC, last_used ASC
                LIMIT 1
            ";

            $stmt = $conn->prepare($query);

            if ($stmt === false) {
                error_log("Failed to prepare statement: " . $conn->error);
                $response = ['status' => 'error', 'message' => 'Database query failed.'];
            } else {
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();

                    // Update the last_used timestamp with the current UTC date
                    $updateQuery = "UPDATE quotes SET last_used = ? WHERE id = ?";
                    $updateStmt = $conn->prepare($updateQuery);

                    if ($updateStmt) {
                        $updateStmt->bind_param("si", $currentDate, $row['id']); // Use UTC date for last_used
                        $updateStmt->execute();
                        $updateStmt->close();

                        $response = [
                            'success' => true,
                            'quote' => $row['quote'],
                            'author' => $row['author']
                        ];
                    } else {
                        error_log("Failed to update last_used: " . $conn->error);
                        $response = ['success' => false, 'message' => 'Failed to update quote timestamp.'];
                    }
                } else {
                    $response = ['success' => false, 'message' => 'No quotes available.'];
                }

                $stmt->close();
            }
        }
    }

    return $response;
}


// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'User is not logged in.']);
    exit;
}

// Get the user_id from the session
$user_id = $_SESSION['user_id'];

// Handle specific actions
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'fetchTotalTime':
        $response = fetchTotalTime($conn, $user_id);
        echo json_encode($response);
        break;

    case 'fetchActivityStreak':
        $response = fetchActivityStreak($conn, $user_id);
        echo json_encode($response);
        break;

    case 'fetchQuoteOfTheDay':
        $response = fetchQuoteOfTheDay($conn);
        echo json_encode($response);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action specified.']);
        break;
}


exit;

?>