<?php

require 'UTSbootstrap.php';


global $conn; // Explicitly use the global $conn

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    error_log("Session missing during UTSmcqs.php access.");
    echo json_encode(['status' => 'error', 'message' => 'User is not logged in.']);
    exit;
}


// Retrieve the user ID from the session
$userId = $_SESSION['user_id'];


// Check if the request is for retrieving courses or inserting an MCQ set
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (isset($_GET['type']) && $_GET['type'] === 'mcq_sets') {

        // Capture the optional semester_id, course_id, and search parameters
        $semesterId = isset($_GET['semester_id']) ? (int) $_GET['semester_id'] : null;
        $courseId = isset($_GET['course_id']) ? (int) $_GET['course_id'] : null;
        $searchTerm = isset($_GET['search']) ? $_GET['search'] : null;

        // Retrieve MCQ sets with associated course names
        $query = "SELECT ms.set_id, ms.set_name, ms.course_id, ms.num_questions, ms.questions_mastered, c.course_color,
                 c.course_name, c.prefix, c.course_number, s.semester_id, s.name AS semester_name
                FROM mcq_sets AS ms
                LEFT JOIN courses AS c ON ms.course_id = c.course_id
                LEFT JOIN semesters AS s ON c.semester_id = s.semester_id
                WHERE ms.user_id = ?";

        // Add filtering logic
        if (!empty($semesterId)) {
            // Filter by semester_id
            $query .= " AND s.semester_id = ?";
            $params = ["ii", $userId, $semesterId];
        } elseif (!empty($courseId)) {
            // Filter by course_id
            $query .= " AND ms.course_id = ?";
            $params = ["ii", $userId, $courseId];
        } elseif (!empty($searchTerm)) {
            // Filter by set_name using a wildcard search
            $query .= " AND ms.set_name LIKE ?";
            $searchWildcard = "%" . $searchTerm . "%";
            $params = ["is", $userId, $searchWildcard];
        } else {
            // Default case: No additional filtering
            $params = ["i", $userId];
        }

        // Prepare and bind parameters dynamically
        $stmt = $conn->prepare($query);
        $stmt->bind_param(...$params);

        $stmt->execute();
        $result = $stmt->get_result();

        $mcqSets = [];
        while ($row = $result->fetch_assoc()) {
            $mcqSets[] = $row;
        }

        // Output the MCQ sets as a JSON response
        echo json_encode(['status' => 'success', 'data' => $mcqSets]);

        $stmt->close(); // Close the statement

    } elseif (isset($_GET['type']) && $_GET['type'] === 'mcqs') {
        $setId = $_GET['set_id'] ?? null;
    
        if ($setId) {
            // Prepare and execute the query to get MCQs in the set
            $query = "SELECT mcq_id, question, option_1, option_2, option_3, option_4, correct_option, is_mastered 
                      FROM mcqs 
                      WHERE set_id = ?";

            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $setId);
            $stmt->execute();
            $result = $stmt->get_result();
    
            $mcqs = [];
            while ($row = $result->fetch_assoc()) {
                $mcqs[] = $row;
            }

            // After executing the MCQ query
            if (empty($mcqs)) {
                error_log("No MCQs found for set_id: $setId");
            } else {
                error_log("MCQs found for set_id: $setId");
            }
    
            echo json_encode(['status' => 'success', 'data' => $mcqs]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Set ID is missing.']);
        }

        $stmt->close(); // Close the statement

    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['type'])) {

    if ($_POST['type'] === 'add_mcq_set') {
    
        // Insert new MCQ set
        $courseId = empty($_POST['course_id']) ? NULL : $_POST['course_id']; // Capture course_id from form submission
        $setName = $_POST['set_name'];    // Capture set name from form submission
    
        // Validate required fields
        if (empty($setName)) {
            echo json_encode(['status' => 'error', 'message' => 'Set name is required.']);
            exit;
        }
    
        // Insert the new MCQ set
        $insertQuery = "INSERT INTO mcq_sets (user_id, course_id, set_name, date_created) VALUES (?, ?, ?, NOW())";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param("iis", $userId, $courseId, $setName);
    
        if ($insertStmt->execute()) {
    
            // Get the ID of the newly inserted MCQ set
            $setId = $conn->insert_id;
    
            echo json_encode([
                'status' => 'success',
                'message' => 'MCQ set created successfully.',
                'set_id' => $setId // Include the set_id in the response
            ]);
    
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to create MCQ set: ' . $conn->error]);
        }
    
        $insertStmt->close(); // Close the statement

    } elseif ($_POST['type'] === 'edit_mcq_set') {
        // Update an existing MCQ set
        $setId = $_POST['set_id'];
        $courseId = empty($_POST['course_id']) ? NULL : $_POST['course_id']; // Capture course_id from form submission
        $setName = $_POST['set_name'];    // Capture new set name from form submission
    
        // Validate required fields
        if (empty($setId) || empty($setName)) {
            echo json_encode(['status' => 'error', 'message' => 'Set ID and set name are required.']);
            exit;
        }
    
        // Update the MCQ set with new values
        $updateQuery = "UPDATE mcq_sets SET course_id = ?, set_name = ? WHERE set_id = ? AND user_id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("isii", $courseId, $setName, $setId, $userId);
    
        if ($updateStmt->execute()) {
            echo json_encode(['status' => 'success', 'set_id' => $setId, 'message' => 'MCQ set updated successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update MCQ set: ' . $conn->error]);
        }
    
        $updateStmt->close(); // Close the statement
    } elseif ($_POST['type'] === 'add_mcq') {

        // Insert a new MCQ
        $setId = $_POST['set_id'];
        $question = $_POST['question'];
        $option1 = $_POST['option1'];
        $option2 = $_POST['option2'];
        $option3 = $_POST['option3'];
        $option4 = $_POST['option4'];
        $correctOption = $_POST['correct_option'];
    
        // Validate required fields
        if (empty($setId) || empty($question) || empty($option1) || empty($option2) || empty($option3) || empty($option4) || empty($correctOption)) {
            echo json_encode(['status' => 'error', 'message' => 'All fields are required for an MCQ.']);
            exit;
        }
    
        // Insert the new MCQ into the database
        $insertQuery = "INSERT INTO mcqs (set_id, question, option_1, option_2, option_3, option_4, correct_option, date_created) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param("isssssi", $setId, $question, $option1, $option2, $option3, $option4, $correctOption);
    
        if ($insertStmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'MCQ added successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add MCQ: ' . $conn->error]);
        }
    
        $insertStmt->close(); // Close the statement

    } elseif ($_POST['type'] === 'add_mcqs_bulk') {
        $setId = $_POST['set_id'];
        $mcqs = json_decode($_POST['mcqs'], true); // Decode JSON data for MCQs
    
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid JSON data received.']);
            exit;
        }
    
        if (empty($setId) || empty($mcqs) || !is_array($mcqs)) {
            echo json_encode(['status' => 'error', 'message' => 'Set ID and MCQs are required.']);
            exit;
        }
    
        $successCount = 0;
        $errorCount = 0;
    
        foreach ($mcqs as $mcq) {
            if (!isset($mcq['Question'], $mcq['Option1'], $mcq['Option2'], $mcq['Option3'], $mcq['Option4'], $mcq['CorrectOption'])) {
                error_log('Invalid row (missing keys): ' . print_r($mcq, true));
                $errorCount++;
                continue;
            }
    
            $question = trim($mcq['Question']);
            $option1 = trim($mcq['Option1']);
            $option2 = trim($mcq['Option2']);
            $option3 = trim($mcq['Option3']);
            $option4 = trim($mcq['Option4']);
            $correctOption = trim($mcq['CorrectOption']);
    
            // Validate required fields
            if (empty($question) || empty($option1) || empty($option2) || empty($option3) || empty($option4) || empty($correctOption)) {
                error_log('Empty question/options/correct option: ' . print_r($mcq, true));
                $errorCount++;
                continue;
            }
    
            // Prepare and execute query
            $insertStmt = $conn->prepare(
                "INSERT INTO mcqs (set_id, question, option_1, option_2, option_3, option_4, correct_option, date_created) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
            );
            $insertStmt->bind_param("issssss", $setId, $question, $option1, $option2, $option3, $option4, $correctOption);
    
            if ($insertStmt->execute()) {
                $successCount++;
            } else {
                error_log("Insert error for row: " . $insertStmt->error);
                $errorCount++;
            }
        }
    
        // Response
        if ($successCount > 0) {
            echo json_encode(['status' => 'success', 'message' => "$successCount MCQ(s) added successfully. $errorCount failed."]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No valid MCQs to add.']);
        }
    
        $insertStmt->close(); // Close the statement

    } elseif ($_POST['type'] === 'edit_mcq') {

    // Edit an existing MCQ
    $mcqId = $_POST['mcq_id'];
    $setId = $_POST['set_id'];
    $question = $_POST['question'];
    $option1 = $_POST['option1'];
    $option2 = $_POST['option2'];
    $option3 = $_POST['option3'];
    $option4 = $_POST['option4'];
    $correctOption = $_POST['correct_option'];

    // Validate required fields
    if (empty($mcqId) || empty($setId) || empty($question) || empty($option1) || empty($option2) || empty($option3) || empty($option4) || empty($correctOption)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required to update an MCQ.']);
        exit;
    }

    // Update the MCQ in the database
    $updateQuery = "UPDATE mcqs 
                    SET set_id = ?, question = ?, option_1 = ?, option_2 = ?, option_3 = ?, option_4 = ?, correct_option = ? 
                    WHERE mcq_id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("isssssii", $setId, $question, $option1, $option2, $option3, $option4, $correctOption, $mcqId);

    if ($updateStmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'MCQ updated successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update MCQ: ' . $conn->error]);
    }

    $updateStmt->close(); // Close the statement

    } elseif ($_POST['type'] === 'mark_mcq_mastered') {
    // Mark an MCQ as mastered
    $mcqId = $_POST['mcq_id'] ?? null;
    $mastered = $_POST['mastered'] ?? null;

    // Validate required fields
    if (empty($mcqId) || !isset($mastered)) {
        echo json_encode(['status' => 'error', 'message' => 'MCQ ID and mastered status are required.']);
        exit;
    }

    // Update the mastered status of the MCQ
    $updateQuery = "UPDATE mcqs SET is_mastered = ? WHERE mcq_id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("ii", $mastered, $mcqId);

    if ($updateStmt->execute()) {
        $statusMessage = $mastered ? 'MCQ marked as mastered successfully.' : 'MCQ marked as unmastered successfully.';
        echo json_encode(['status' => 'success', 'message' => $statusMessage]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update MCQ: ' . $conn->error]);
    }

    $updateStmt->close(); // Close the statement
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Parse the DELETE request body for JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        echo json_encode(['status' => 'error', 'message' => 'User is not authenticated.']);
        exit;
    }

    if (isset($input['type']) && $input['type'] === 'delete_mcq_set') {
        $setId = $input['set_id'] ?? null;

        if ($setId) {
            // Delete the MCQ set itself
            $deleteSetQuery = "DELETE FROM mcq_sets WHERE set_id = ? AND user_id = ?";
            $deleteSetStmt = $conn->prepare($deleteSetQuery);
            $deleteSetStmt->bind_param("ii", $setId, $userId);

            if ($deleteSetStmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'MCQ set and associated MCQs deleted successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete MCQ set: ' . $conn->error]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Set ID is missing.']);
        }

        $deleteSetStmt->close(); // Close the statement

    } elseif (isset($input['type']) && $input['type'] === 'delete_mcq') {
        $mcqId = $input['mcq_id'] ?? null;

        if ($mcqId) {
            // Delete the individual MCQ
            $deleteMCQQuery = "DELETE FROM mcqs WHERE mcq_id = ?";
            $deleteMCQStmt = $conn->prepare($deleteMCQQuery);
            $deleteMCQStmt->bind_param("i", $mcqId);

            if ($deleteMCQStmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'MCQ deleted successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete MCQ: ' . $conn->error]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'MCQ ID is missing.']);
        }

        $deleteMCQStmt->close(); // Close the statement

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid delete action type.']);
    }
}







?>