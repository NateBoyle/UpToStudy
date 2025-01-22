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
        case 'complete': // New case for marking assignments complete
            completeAssignment();
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
        case 'complete': // New case for marking to-dos complete
            completeToDo();
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
    $pointsPossible = $_POST['points_possible'] ?? null; // Updated field
    $status = $_POST['status'] ?? 'Uncompleted'; // Default to 'Uncompleted' if not provided

    if (!$title || !$courseId || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        return;
    }

    $query = "INSERT INTO assignments (user_id, course_id, title, description, due_date, due_time, points_possible, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('iissssds', $userId, $courseId, $title, $description, $dueDate, $dueTime, $pointsPossible, $status);

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
    $pointsPossible = $_POST['points_possible'] ?? null; // Updated field
    $pointsEarned = $_POST['points_earned'] ?? null; // New field
    $status = $_POST['status'] ?? 'Uncompleted'; // Default to 'Uncompleted' if not provided

    if (!$assignmentId || !$title) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        return;
    }

    // Prepare and execute query
    $query = "UPDATE assignments 
              SET title = ?, 
                  course_id = ?, 
                  description = ?, 
                  due_date = ?, 
                  due_time = ?, 
                  points_possible = ?, 
                  points_earned = ?, 
                  status = ? 
              WHERE assignment_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sisssddsi', $title, $courseId, $description, $dueDate, $dueTime, $pointsPossible, $pointsEarned, $status, $assignmentId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Assignment updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating assignment.']);
    }
    $stmt->close();
}

function completeAssignment() {
    global $conn;

    $assignmentId = $_POST['id'] ?? null;

    if (!$assignmentId) {
        echo json_encode(['success' => false, 'message' => 'Assignment ID is required.']);
        return;
    }

    $query = "UPDATE assignments SET is_completed = 1 WHERE assignment_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $assignmentId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Assignment marked as complete.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error marking assignment as complete.']);
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
    $status = $_POST['status'] ?? 'Uncompleted'; // Default to 'Uncompleted'

    if (!$title || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'Title and due date are required.']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO to_do (user_id, course_id, title, due_date, due_time, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('iisssss', $userId, $courseId, $title, $dueDate, $dueTime, $description, $status);

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
    $status = $_POST['status'] ?? 'Uncompleted'; // Default to 'Uncompleted' if not provided

    if (!$toDoId || !$title || !$dueDate) {
        echo json_encode(['success' => false, 'message' => 'To-Do ID, title, and due date are required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE to_do 
                            SET title = ?, 
                                course_id = ?, 
                                due_date = ?, 
                                due_time = ?, 
                                description = ?, 
                                status = ? 
                            WHERE to_do_id = ?");
    $stmt->bind_param('sissssi', $title, $courseId, $dueDate, $dueTime, $description, $status, $toDoId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'To-Do updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating to-do.']);
    }

    $stmt->close();
}

function completeToDo() {
    global $conn;

    $toDoId = $_POST['id'] ?? null;

    if (!$toDoId) {
        echo json_encode(['success' => false, 'message' => 'To-Do ID is required.']);
        return;
    }

    $query = "UPDATE to_do SET is_completed = 1 WHERE to_do_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $toDoId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'To-Do marked as complete.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error marking to-do as complete.']);
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
    $noSchoolDay = $_POST['no_school_day'] ?? 0; // New field, defaults to 0 (false)
    $recurrence = $_POST['recurrence'] ?? 'None'; // New field, defaults to 'None'

    if (!$title || !$startDate) {
        echo json_encode(['success' => false, 'message' => 'Title and start date are required.']);
        return;
    }

    $stmt = $conn->prepare("INSERT INTO events (user_id, course_id, title, description, start_date, start_time, end_date, end_time, all_day, no_school_day, recurrence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('iissssssiis', $userId, $courseId, $title, $description, $startDate, $startTime, $endDate, $endTime, $allDay, $noSchoolDay, $recurrence);

    if ($stmt->execute()) {

        $eventId = $stmt->insert_id; // Capture the new event's ID

        // Handle recurring events
        if ($recurrence !== 'None') {
            generateOccurrences($eventId, $userId, $startDate, $endDate, $recurrence, $startTime, $endTime, $title, $description, $allDay, $noSchoolDay);
        } else {
            // Insert a single occurrence for non-recurring events
            insertOccurrence($conn, $eventId, $userId, $startDate, $startTime, $endTime, $title, $description, $allDay, $noSchoolDay);
        }

        echo json_encode(['success' => true, 'message' => 'Event added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding event.']);
    }

    $stmt->close();
}

// Helper function to generate occurrences for recurring events
function generateOccurrences($eventId, $userId, $startDate, $endDate, $recurrence, $startTime, $endTime, $title, $description, $allDay, $noSchoolDay) {
    global $conn;
    $occurrenceCount = 0;
    $currentDate = strtotime($startDate);

    switch ($recurrence) {
        case 'Daily':
            while ($currentDate <= strtotime($endDate) && $occurrenceCount < 52) {
                insertOccurrence($conn, $eventId, $userId, date('Y-m-d', $currentDate), $startTime, $endTime, $title, $description, $allDay, $noSchoolDay);
                $currentDate = strtotime('+1 day', $currentDate);
                $occurrenceCount++;
            }
            break;
        case 'Weekly':
            $dayOfWeek = date('w', $currentDate); // 0 (for Sunday) through 6 (for Saturday)
            while ($currentDate <= strtotime($endDate) && $occurrenceCount < 52) {
                if (date('w', $currentDate) == $dayOfWeek) {
                    insertOccurrence($conn, $eventId, $userId, date('Y-m-d', $currentDate), $startTime, $endTime, $title, $description, $allDay, $noSchoolDay);
                    $occurrenceCount++;
                }
                $currentDate = strtotime('+1 day', $currentDate);
            }
            break;
        case 'Monthly':
            $startDay = date('j', $currentDate); // Day of the month
            while ($currentDate <= strtotime($endDate) && $occurrenceCount < 52) {
                if (date('j', $currentDate) == $startDay) {
                    insertOccurrence($conn, $eventId, $userId, date('Y-m-d', $currentDate), $startTime, $endTime, $title, $description, $allDay, $noSchoolDay);
                    $occurrenceCount++;
                }
                $currentDate = strtotime('+1 day', $currentDate);
            }
            break;
    }
}

// Helper function to insert a single occurrence
function insertOccurrence($conn, $eventId, $userId, $occurrenceDate, $startTime, $endTime, $title, $description, $allDay, $noSchoolDay) {
    $stmt = $conn->prepare("INSERT INTO events_occurrences (event_id, user_id, start_date, start_time, end_time, title, description, all_day, no_school_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('iisssssii', $eventId, $userId, $occurrenceDate, $startTime, $endTime, $title, $description, $allDay, $noSchoolDay); // Changed to 'iii' for boolean fields
    $stmt->execute();
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
    $noSchoolDay = $_POST['no_school_day'] ?? 0; // New field, defaults to 0 (false)
    $recurrence = $_POST['recurrence'] ?? 'None'; // New field, defaults to 'None'

    if (!$eventId || !$title || !$startDate) {
        echo json_encode(['success' => false, 'message' => 'Event ID, title, and start date are required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE events SET title = ?, course_id = ?, description = ?, start_date = ?, start_time = ?, end_date = ?, end_time = ?, all_day = ?, no_school_day = ?, recurrence = ? WHERE event_id = ?");
    $stmt->bind_param('sisssssiisi', $title, $courseId, $description, $startDate, $startTime, $endDate, $endTime, $allDay, $noSchoolDay, $recurrence, $eventId);
    
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
