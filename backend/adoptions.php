<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/session_guard.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $method === 'GET' ? ($_GET['action'] ?? 'list') : ($_POST['action'] ?? '');

$admin_get  = ['list', 'pending', 'single'];
$admin_post = ['update_status', 'delete'];

if ($method === 'GET'  && in_array($action, $admin_get,  true)) require_admin();
if ($method === 'POST' && in_array($action, $admin_post, true)) require_admin();

switch (true) {
    case $method === 'GET'  && $action === 'list':          app_list($pdo);          break;
    case $method === 'GET'  && $action === 'pending':       app_pending($pdo);       break;
    case $method === 'GET'  && $action === 'single':        app_single($pdo);        break;
    case $method === 'GET'  && $action === 'track':         app_track($pdo);         break;
    case $method === 'POST' && $action === 'submit':        app_submit($pdo);        break;
    case $method === 'POST' && $action === 'update_status': app_update_status($pdo); break;
    case $method === 'POST' && $action === 'delete':        app_delete($pdo);        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        break;
}

function app_list(PDO $pdo): void
{
    $sql = '
        SELECT
            aa.Application_ID,
            aa.Tracker_Code,
            aa.Applicant_Name,
            aa.Applicant_Email,
            aa.Status,
            aa.Motivation,
            aa.Submitted_At,
            r.Rescue_ID,
            r.Name   AS RescueName,
            r.Species
        FROM  Adoption_Applications aa
        JOIN  Rescues r ON r.Rescue_ID = aa.Rescue_ID
        ORDER BY aa.Submitted_At DESC
    ';
    $data = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $data, 'count' => count($data)]);
}

function app_pending(PDO $pdo): void
{
    $sql = '
        SELECT
            aa.Application_ID,
            aa.Tracker_Code,
            aa.Applicant_Name,
            aa.Applicant_Email,
            aa.Status,
            aa.Submitted_At,
            r.Name AS RescueName
        FROM  Adoption_Applications aa
        JOIN  Rescues r ON r.Rescue_ID = aa.Rescue_ID
        WHERE aa.Status = \'Under Review\'
        ORDER BY aa.Submitted_At ASC
    ';
    $data = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $data, 'count' => count($data)]);
}

function app_single(PDO $pdo): void
{
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Application ID.']);
        return;
    }

    $stmt = $pdo->prepare('
        SELECT
            aa.*,
            r.Name AS RescueName, r.Species, r.Breed, r.Photo_Path
        FROM  Adoption_Applications aa
        JOIN  Rescues r ON r.Rescue_ID = aa.Rescue_ID
        WHERE aa.Application_ID = ?
        LIMIT 1
    ');
    $stmt->execute([$id]);
    $app = $stmt->fetch();

    if (!$app) {
        echo json_encode(['success' => false, 'message' => 'Application not found.']);
        return;
    }

    echo json_encode(['success' => true, 'data' => $app]);
}

function app_track(PDO $pdo): void
{
    $email = trim($_GET['email'] ?? '');
    $code  = strtoupper(trim($_GET['code'] ?? ''));

    if (empty($email) || empty($code)) {
        echo json_encode(['success' => false, 'message' => 'Email and Tracker Code are required.']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        return;
    }

    $stmt = $pdo->prepare('
        SELECT
            aa.Application_ID,
            aa.Tracker_Code,
            aa.Applicant_Name,
            aa.Status,
            aa.Submitted_At,
            r.Name   AS RescueName,
            r.Species
        FROM  Adoption_Applications aa
        JOIN  Rescues r ON r.Rescue_ID = aa.Rescue_ID
        WHERE aa.Applicant_Email = ?
          AND aa.Tracker_Code    = ?
        LIMIT 1
    ');
    $stmt->execute([$email, $code]);
    $app = $stmt->fetch();

    if (!$app) {
        echo json_encode([
            'success' => false,
            'message' => 'No application found for that email and tracker code combination.',
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'data'    => $app,
    ]);
}

function app_submit(PDO $pdo): void
{
    $rescue_id = (int)trim($_POST['rescue_id']      ?? 0);
    $name      = trim($_POST['applicant_name']       ?? '');
    $email     = trim($_POST['applicant_email']      ?? '');
    $motivation= trim($_POST['motivation']           ?? '');

    $errors = [];

    if ($rescue_id <= 0)                               $errors[] = 'Please specify the animal you wish to adopt.';
    if (empty($name))                                  $errors[] = 'Your full name is required.';
    if (empty($email))                                 $errors[] = 'Email address is required.';
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL))
                                                        $errors[] = 'Invalid email format.';
    if (empty($motivation))                            $errors[] = 'Please share your motivation for adopting.';

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        return;
    }

    $stmt = $pdo->prepare("
        SELECT Rescue_ID, Name FROM Rescues
        WHERE  Rescue_ID = ?
          AND  Status NOT IN ('Adopted', 'Rainbow Bridge')
        LIMIT 1
    ");
    $stmt->execute([$rescue_id]);
    $rescue = $stmt->fetch();

    if (!$rescue) {
        echo json_encode([
            'success' => false,
            'message' => 'The selected animal is not currently available for adoption.',
        ]);
        return;
    }

    $dup = $pdo->prepare('
        SELECT Application_ID FROM Adoption_Applications
        WHERE  Rescue_ID = ? AND Applicant_Email = ?
        LIMIT  1
    ');
    $dup->execute([$rescue_id, $email]);
    if ($dup->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'You already have a pending application for this animal.',
        ]);
        return;
    }

    $tracker_code = generate_tracker_code($pdo);

    $stmt = $pdo->prepare('
        INSERT INTO Adoption_Applications
            (Rescue_ID, Tracker_Code, Applicant_Name, Applicant_Email, Status, Motivation)
        VALUES
            (?, ?, ?, ?, \'Under Review\', ?)
    ');
    $stmt->execute([$rescue_id, $tracker_code, $name, $email, $motivation]);

    echo json_encode([
        'success'        => true,
        'message'        => "Application submitted for {$rescue['Name']}! Save your Tracker Code.",
        'tracker_code'   => $tracker_code,
        'application_id' => (int)$pdo->lastInsertId(),
        'rescue_name'    => $rescue['Name'],
        'note'           => 'A copy of this code has been noted. Use it with your email to check your status.',
    ]);
}

function app_update_status(PDO $pdo): void
{
    $app_id    = (int)trim($_POST['application_id'] ?? 0);
    $new_status= trim($_POST['status']              ?? '');

    $allowed_statuses = ['Under Review', 'For Interview', 'Approved', 'On Hold'];

    if ($app_id <= 0 || !in_array($new_status, $allowed_statuses, true)) {
        echo json_encode(['success' => false, 'message' => 'Invalid Application ID or status.']);
        return;
    }

    $stmt = $pdo->prepare(
        'UPDATE Adoption_Applications SET Status = ? WHERE Application_ID = ?'
    );
    $stmt->execute([$new_status, $app_id]);

    // If approved, optionally update the rescue status to 'Adopted'
    if ($new_status === 'Approved') {
        // Fetch the rescue_id from this application
        $r = $pdo->prepare(
            'SELECT Rescue_ID FROM Adoption_Applications WHERE Application_ID = ? LIMIT 1'
        );
        $r->execute([$app_id]);
        $app_row = $r->fetch();
        if ($app_row) {
            $upd = $pdo->prepare(
                "UPDATE Rescues SET Status = 'Adopted' WHERE Rescue_ID = ?"
            );
            $upd->execute([$app_row['Rescue_ID']]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Application #{$app_id} status updated to '{$new_status}'.",
        'status'  => $new_status,
    ]);
}

function app_delete(PDO $pdo): void
{
    $app_id = (int)($_POST['application_id'] ?? 0);

    if ($app_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Application ID.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM Adoption_Applications WHERE Application_ID = ?');
    $stmt->execute([$app_id]);

    echo json_encode([
        'success' => true,
        'message' => "Application #{$app_id} deleted.",
        'rows'    => $stmt->rowCount(),
    ]);
}

function generate_tracker_code(PDO $pdo): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
    $check = $pdo->prepare(
        'SELECT Application_ID FROM Adoption_Applications WHERE Tracker_Code = ? LIMIT 1'
    );

    do {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $check->execute([$code]);
    } while ($check->fetch()); // Retry on the extremely unlikely collision

    return $code;
}