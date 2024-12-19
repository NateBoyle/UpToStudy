<?php

require 'UTSbootstrap.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

function handleGoalSetAction($action) {
    switch ($action) {
        case 'add':
            addGoalSet();
            break;
        case 'edit':
            editGoalSet();
            break;
        case 'delete':
            deleteGoalSet();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action for goal set.']);
            break;
    }
}

function handleGoalAction($action) {
    switch ($action) {
        case 'add':
            addGoal();
            break;
        case 'edit':
            editGoal();
            break;
        case 'delete':
            deleteGoal();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action for goal.']);
            break;
    }
}

// GOAL SET FUNCTIONS
function validateContainer($userId, $container, $goalSetId = null) {
    global $conn;

    // Query to check if the container is already assigned
    $query = "SELECT id FROM goal_sets WHERE user_id = ? AND container = ? AND id != ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iii', $userId, $container, $goalSetId ?? 0);
    $stmt->execute();

    // Check if any rows are returned (container is taken)
    $result = $stmt->get_result();
    $isTaken = $result->num_rows > 0;

    $stmt->close();

    if ($isTaken) {
        return [
            'success' => false,
            'message' => "Container $container is already assigned to another goal set."
        ];
    }

    return ['success' => true]; // Validation passed
}

function addGoalSet() {
    global $conn;

    $userId = $_SESSION['user_id'];
    $title = $_POST['title'];
    $courseId = $_POST['course_id'] ?? null; // Optional
    $color = $_POST['color'] ?? null; // Optional
    $container = $_POST['container'] ?? null; // Optional

    // Validate container
    if ($container !== null) {
        $validation = validateContainer($userId, $container);
        if (!$validation['success']) {
            echo json_encode($validation);
            return;
        }
    }

    if (!$title) {
        echo json_encode(['success' => false, 'message' => 'Title is required.']);
        return;
    }

    $query = "INSERT INTO goal_sets (user_id, title, course_id, color) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('isss', $userId, $title, $courseId, $color);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal set added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding goal set.']);
    }

    $stmt->close();
}

function editGoalSet() {
    global $conn;

    $userId = $_SESSION['user_id']; // Assuming user_id is in the session
    $goalSetId = $_POST['id'];
    $title = $_POST['title'];
    $courseId = $_POST['course_id'] ?? null; // Optional
    $color = $_POST['color'] ?? null; // Optional
    $container = $_POST['container'] ?? null; // Optional

    // Validate container
    if ($container !== null) {
        $validation = validateContainer($userId, $container, $goalSetId);
        if (!$validation['success']) {
            echo json_encode($validation);
            return;
        }
    }

    if (!$goalSetId || !$title) {
        echo json_encode(['success' => false, 'message' => 'Goal set ID and title are required.']);
        return;
    }

    $query = "UPDATE goal_sets SET title = ?, course_id = ?, color = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssi', $title, $courseId, $color, $goalSetId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal set updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating goal set.']);
    }

    $stmt->close();
}

function deleteGoalSet() {
    global $conn;

    $goalSetId = $_POST['id'] ?? null;

    if (!$goalSetId) {
        echo json_encode(['success' => false, 'message' => 'Goal set ID is required.']);
        return;
    }

    // First, delete all goals in the goal set
    $deleteGoals = $conn->prepare("DELETE FROM goals WHERE goal_set_id = ?");
    $deleteGoals->bind_param('i', $goalSetId);
    $deleteGoals->execute();
    $deleteGoals->close();

    // Then, delete the goal set
    $deleteGoalSet = $conn->prepare("DELETE FROM goal_sets WHERE id = ?");
    $deleteGoalSet->bind_param('i', $goalSetId);

    if ($deleteGoalSet->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal set deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting goal set.']);
    }

    $deleteGoalSet->close();
}

// GOAL FUNCTIONS
function addGoal() {
    global $conn;

    
    $goalSetId = $_POST['goal_set_id'];
    $title = $_POST['title'];
    $description = $_POST['description'] ?? null; // Optional
    $dueDate = $_POST['due_date'] ?? null; // Optional
    $createdAt = date('Y-m-d H:i:s'); // Automatically set the current date and time

    if (!$goalSetId || !$title) {
        echo json_encode(['success' => false, 'message' => 'Goal set ID and title are required.']);
        return;
    }

    $query = "INSERT INTO goals (goal_set_id, title, description, due_date, created_at) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('issss', $goalSetId, $title, $description, $dueDate, $createdAt);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding goal.']);
    }

    $stmt->close();
}

function editGoal() {
    global $conn;

    $goalId = $_POST['id'];
    $title = $_POST['title'];
    $description = $_POST['description'] ?? null; // Optional
    $dueDate = $_POST['due_date'] ?? null; // Optional
    $isCompleted = $_POST['is_completed'] ?? 0; // Defaults to 0 (not completed)

    if (!$goalId || !$title) {
        echo json_encode(['success' => false, 'message' => 'Goal ID and title are required.']);
        return;
    }

    $query = "UPDATE goals SET title = ?, description = ?, due_date = ?, is_completed = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssii', $title, $description, $dueDate, $isCompleted, $goalId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating goal.']);
    }

    $stmt->close();
}

function deleteGoal() {
    global $conn;

    $goalId = $_POST['id'] ?? null;

    if (!$goalId) {
        echo json_encode(['success' => false, 'message' => 'Goal ID is required.']);
        return;
    }

    $query = "DELETE FROM goals WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $goalId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Goal deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting goal.']);
    }

    $stmt->close();
}

// Main Request Handling
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $entity = $_POST['entity'] ?? ''; // 'goalSet' or 'goal'

    switch ($entity) {
        case 'goalSet':
            handleGoalSetAction($action);
            break;
        case 'goal':
            handleGoalAction($action);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid entity specified.']);
            break;
    }
}

?>
