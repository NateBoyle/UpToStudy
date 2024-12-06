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
        // Retrieve MCQ sets with associated course names
        $query = "SELECT ms.set_id, ms.set_name, ms.course_id, ms.num_questions, ms.questions_mastered, c.course_name 
                  FROM mcq_sets AS ms
                  LEFT JOIN courses AS c ON ms.course_id = c.course_id
                  WHERE ms.user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $userId);
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
        $insertStmt->bind_param("issssss", $setId, $question, $option1, $option2, $option3, $option4, $correctOption);
    
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
    } elseif ($_POST['type'] === 'edit_flashcard') {
        // Edit an existing flashcard
        $flashcardId = $_POST['flashcard_id'] ?? null;
        $question = $_POST['question'] ?? null;
        $answer = $_POST['answer'] ?? null;
    
        // Validate required fields
        if (empty($flashcardId) || empty($question) || empty($answer)) {
            echo json_encode(['status' => 'error', 'message' => 'Flashcard ID, question, and answer are required.']);
            exit;
        }
    
        // Update the flashcard in the database
        $updateQuery = "UPDATE flashcards SET question = ?, answer = ? WHERE flashcard_id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("ssi", $question, $answer, $flashcardId);
    
        if ($updateStmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Flashcard updated successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update flashcard: ' . $conn->error]);
        }

        $updateStmt->close(); // Close the statement

    } elseif ($_POST['type'] === 'mark_mastered') {
        // Mark a flashcard as mastered
        $flashcardId = $_POST['flashcard_id'] ?? null;
        $mastered = $_POST['mastered'] ?? null;

        // Validate required fields
        if (empty($flashcardId) || !isset($mastered)) {
            echo json_encode(['status' => 'error', 'message' => 'Flashcard ID and mastered status are required.']);
            exit;
        }

        // Update the mastered status of the flashcard
        $updateQuery = "UPDATE flashcards SET is_mastered = ? WHERE flashcard_id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bind_param("ii", $mastered, $flashcardId);

        if ($updateStmt->execute()) {
            $statusMessage = $mastered ? 'Flashcard marked as mastered successfully.' : 'Flashcard marked as unmastered successfully.';
            echo json_encode(['status' => 'success', 'message' => $statusMessage]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update flashcard: ' . $conn->error]);
        }

        $updateStmt->close(); // Close the statement
    }

} 






?>