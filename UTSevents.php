<?php

require 'UTSbootstrap.php';


if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in.']);
    exit;
}

$action = $_POST['action'] ?? null;


function handleAssignmentAction($action) {
    switch ($action) {
        case 'add':
            addAssignment();
            break;
        case 'edit':
            editAssignment();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action for assignment.']);
            break;
    }
}

function handleToDoAction($action) {
    switch ($action) {
        case 'add':
            addToDo();
            break;
        case 'edit':
            editToDo();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action for to-do.']);
            break;
    }
}

function handleEventAction($action) {
    switch ($action) {
        case 'add':
            addEvent();
            break;
        case 'edit':
            editEvent();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action for event.']);
            break;
    }
}

// ASSIGNMENT FUNCTIONS
function addAssignment() {
    global $conn;

    $userId = $_SESSION['user_id']; // Assume user_id is stored in the session
    $title = $_POST['title'];
    $courseId = $_POST['course_id'];
    $dueDate = $_POST['due_date'];
    $dueTime = $_POST['due_time'];
    $description = $_POST['description'] ?? null;
    $points = $_POST['points'] ?? null;

    if (!$title || !$courseId || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        return;
    }

    $query = "INSERT INTO assignments (user_id, course_id, title, description, due_date, due_time, points)
              VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iissssd', $userId, $courseId, $title, $description, $dueDate, $dueTime, $points);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Assignment added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding assignment.']);
    }
    $stmt->close();
}

function editAssignment() {
    global $conn;

    $assignmentId = $_POST['id'];
    $title = $_POST['title'];
    $courseId = $_POST['course_id'];
    $dueDate = $_POST['due_date'];
    $dueTime = $_POST['due_time'];
    $description = $_POST['description'] ?? null;
    $points = $_POST['points'] ?? null;

    if (!$assignmentId || !$title) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        return;
    }

    $query = "UPDATE assignments SET title = ?, course_id = ?, description = ?, due_date = ?, due_time = ?, points = ? WHERE assignment_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sisssdi', $title, $courseId, $description, $dueDate, $dueTime, $points, $assignmentId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Assignment updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating assignment.']);
    }
    $stmt->close();
}

// TO DO FUNCTIONS
function addToDo() {
    global $conn;

    $userId = $_SESSION['user_id']; // Assuming user_id is in the session
    $title = $_POST['title'];
    $courseId = !empty($_POST['course_id']) ? $_POST['course_id'] : null;
    $dueDate = $_POST['due_date'];
    $dueTime = $_POST['due_time'];
    $description = $_POST['description'] ?? null; // Optional

    if (!$title || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'Title and due date are required.']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO to_do (user_id, course_id, title, due_date, due_time, description) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('iissss', $userId, $courseId, $title, $dueDate, $dueTime, $description);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'To-Do added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding to-do.']);
    }

    $stmt->close();
}

function editToDo() {
    global $conn;

    $toDoId = $_POST['id'];
    $title = $_POST['title'];
    $courseId = !empty($_POST['course_id']) ? $_POST['course_id'] : null;
    $dueDate = $_POST['due_date'];
    $dueTime = $_POST['due_time'];
    $description = $_POST['description'] ?? null; // Optional

    if (!$toDoId || !$title || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'To-Do ID, title, and due date are required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE to_do SET title = ?, course_id = ?, due_date = ?, due_time = ?, description = ? WHERE to_do_id = ?");
    $stmt->bind_param('sisssi', $title, $courseId, $dueDate, $dueTime, $description, $toDoId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'To-Do updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating to-do.']);
    }

    $stmt->close();
}

// EVENT FUNCTIONS
function addEvent() {
    global $conn;

    $userId = $_SESSION['user_id']; // Assuming user_id is in the session
    $title = $_POST['title'];
    $courseId = !empty($_POST['course_id']) ? $_POST['course_id'] : null;
    $startDate = $_POST['start_date'];
    $endDate = $_POST['end_date'] ?? $startDate; // Default to start_date if not provided
    $startTime = $_POST['start_time'] ?? null; // Optional
    $endTime = $_POST['end_time'] ?? null; // Optional
    $description = $_POST['description'] ?? null; // Optional
    $allDay = $_POST['all_day'] ?? 0; // Defaults to 0 (false)

    if (!$title || !$startDate) {
        echo json_encode(['success' => false, 'message' => 'Title and start date are required.']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO events (user_id, course_id, title, description, start_date, start_time, end_date, end_time, all_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('iissssssi', $userId, $courseId, $title, $description, $startDate, $startTime, $endDate, $endTime, $allDay);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Event added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding event.']);
    }

    $stmt->close();
}

function editEvent() {
    global $conn;

    $eventId = $_POST['id'];
    $title = $_POST['title'];
    $courseId = !empty($_POST['course_id']) ? $_POST['course_id'] : null;
    $startDate = $_POST['start_date'];
    $endDate = $_POST['end_date'] ?? $startDate; // Default to start_date if not provided
    $startTime = $_POST['start_time'] ?? null; // Optional
    $endTime = $_POST['end_time'] ?? null; // Optional
    $description = $_POST['description'] ?? null; // Optional
    $allDay = $_POST['all_day'] ?? 0; // Defaults to 0 (false)

    if (!$eventId || !$title || !$startDate) {
        echo json_encode(['success' => false, 'message' => 'Event ID, title, and start date are required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE events SET title = ?, course_id = ?, description = ?, start_date = ?, start_time = ?, end_date = ?, end_time = ?, all_day = ? WHERE event_id = ?");
    $stmt->bind_param('sisssssii', $title, $courseId, $description, $startDate, $startTime, $endDate, $endTime, $allDay, $eventId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Event updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating event.']);
    }

    $stmt->close();
}


// UNIFORM DELETE FUNCTIONs
function getTableFromEntity($entity) {
    $map = [
        'assignment' => 'assignments',
        'toDo' => 'to_do',
        'event' => 'events',
    ];
    return $map[$entity] ?? null;
}

function getPrimaryKeyFromEntity($entity) {
    $map = [
        'assignment' => 'assignment_id',
        'toDo' => 'to_do_id',
        'event' => 'event_id',
    ];
    return $map[$entity] ?? null;
}

function deleteEntity($entity, $id) {
    global $conn;

    $table = getTableFromEntity($entity);
    $primaryKey = getPrimaryKeyFromEntity($entity);

    if (!$table || !$primaryKey) {
        echo json_encode(['success' => false, 'message' => 'Invalid entity.']);
        return;
    }

    $stmt = $conn->prepare("DELETE FROM $table WHERE $primaryKey = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => ucfirst($entity) . ' deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting entity.']);
    }

    $stmt->close();
}

// CODE TO GUIDE BACKEND OPERATION

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $entity = $_POST['entity'] ?? ''; // 'assignment', 'toDo', or 'event'

    switch ($entity) {
        case 'assignment':
            handleAssignmentAction($action);
            break;
        case 'toDo':
            handleToDoAction($action);
            break;
        case 'event':
            handleEventAction($action);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid entity specified.']);
            break;
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents('php://input'), $requestData); // Parse DELETE request body

    $entity = $requestData['entity'] ?? null;
    $id = $requestData['id'] ?? null;

    if (!$entity || !$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid delete request.']);
        exit;
    }

    deleteEntity($entity, $id);
}

?>
