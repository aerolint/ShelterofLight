<?php
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/session_guard.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $method === 'GET' ? ($_GET['action'] ?? 'list') : ($_POST['action'] ?? '');

if ($method === 'POST') {
    require_admin();
}

define('UPLOAD_DIR_RESCUES', __DIR__ . '/uploads/rescues/');
define('UPLOAD_URI_RESCUES', '/uploads/rescues/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5 MB
$allowed_mime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Single source of truth for valid Rescues.Status ENUM values.
const RESCUE_STATUSES = [
    'Newly Admitted', 'Under Treatment', 'Under Observation',
    'Special Needs', 'Looking for Foster', 'Adopted', 'Rainbow Bridge'
];

switch (true) {
    case $method === 'GET' && $action === 'list':
        rescue_list($pdo);
        break;

    case $method === 'GET' && $action === 'grouped':
        rescue_grouped($pdo);
        break;

    case $method === 'GET' && $action === 'single':
        rescue_single($pdo, (int)($_GET['id'] ?? 0));
        break;

    case $method === 'GET' && $action === 'rainbow':
        rescue_rainbow($pdo);
        break;

    case $method === 'POST' && $action === 'create':
        rescue_create($pdo);
        break;

    case $method === 'POST' && $action === 'update':
        rescue_update($pdo);
        break;

    case $method === 'POST' && $action === 'update_status':
        rescue_update_status($pdo);
        break;

    case $method === 'POST' && $action === 'delete':
        rescue_delete($pdo);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        break;
}

function rescue_list(PDO $pdo): void
{
    $sql = '
        SELECT r.Rescue_ID, r.Name, r.Species, r.Breed, r.Status,
               r.Photo_Path, r.Memorial_Note, r.Created_At,
               u.Full_Name AS AddedBy
        FROM   Rescues r
        LEFT JOIN Users u ON u.User_ID = r.AddedBy_UserID
        ORDER BY r.Created_At DESC
    ';
    $rescues = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $rescues]);
}

function rescue_grouped(PDO $pdo): void
{
    $sql = '
        SELECT Rescue_ID, Name, Species, Breed, Status, Photo_Path
        FROM   Rescues
        ORDER BY FIELD(Status,
            "Newly Admitted", "Under Treatment", "Under Observation",
            "Special Needs", "Looking for Foster", "Adopted", "Rainbow Bridge"
        ), Name ASC
    ';
    $rows = $pdo->query($sql)->fetchAll();

    // Group by Status key
    $grouped = [];
    foreach ($rows as $row) {
        $grouped[$row['Status']][] = $row;
    }

    echo json_encode(['success' => true, 'data' => $grouped]);
}

function rescue_single(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Rescue ID.']);
        return;
    }

    $stmt = $pdo->prepare('
        SELECT r.*, u.Full_Name AS AddedBy
        FROM   Rescues r
        LEFT JOIN Users u ON u.User_ID = r.AddedBy_UserID
        WHERE  r.Rescue_ID = ?
        LIMIT  1
    ');
    $stmt->execute([$id]);
    $rescue = $stmt->fetch();

    if (!$rescue) {
        echo json_encode(['success' => false, 'message' => 'Rescue not found.']);
        return;
    }

    echo json_encode(['success' => true, 'data' => $rescue]);
}

function rescue_rainbow(PDO $pdo): void
{
    $stmt = $pdo->prepare('
        SELECT Rescue_ID, Name, Species, Photo_Path, Memorial_Note, Created_At
        FROM   Rescues
        WHERE  Status = ?
        ORDER BY Name ASC
    ');
    $stmt->execute(['Rainbow Bridge']);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
}

function rescue_create(PDO $pdo): void
{
    $name          = trim($_POST['name']    ?? '');
    $species       = trim($_POST['species'] ?? '');
    $breed         = trim($_POST['breed']   ?? '');
    $status        = trim($_POST['status']  ?? 'Newly Admitted');
    $memorial_note = trim($_POST['memorial_note'] ?? '');

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Rescue name is required.']);
        return;
    }
    if (!in_array($status, RESCUE_STATUSES, true)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status value.']);
        return;
    }

    $photo_path = null;
    if (!empty($_FILES['photo']['name'])) {
        $upload = handle_photo_upload($_FILES['photo']);
        if (!$upload['success']) {
            echo json_encode(['success' => false, 'message' => $upload['message']]);
            return;
        }
        $photo_path = $upload['path'];
    }

    $stmt = $pdo->prepare('
        INSERT INTO Rescues
            (AddedBy_UserID, Name, Species, Breed, Status, Photo_Path, Memorial_Note)
        VALUES
            (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        current_user_id(),
        $name,
        $species       ?: null,
        $breed         ?: null,
        $status,
        $photo_path,
        $memorial_note ?: null,
    ]);

    echo json_encode([
        'success'    => true,
        'message'    => "Rescue profile for '{$name}' created successfully.",
        'rescue_id'  => (int) $pdo->lastInsertId(),
    ]);
}

function rescue_update(PDO $pdo): void
{
    $rescue_id     = (int)($_POST['rescue_id'] ?? 0);
    $name          = trim($_POST['name']    ?? '');
    $species       = trim($_POST['species'] ?? '');
    $breed         = trim($_POST['breed']   ?? '');
    $status        = trim($_POST['status']  ?? '');
    $memorial_note = trim($_POST['memorial_note'] ?? '');

    if ($rescue_id <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Rescue ID and name are required.']);
        return;
    }
    // Status is NOT NULL in the schema, so it must be a valid ENUM value —
    // never write NULL, which would raise an integrity-constraint error.
    if (!in_array($status, RESCUE_STATUSES, true)) {
        echo json_encode(['success' => false, 'message' => 'Invalid or missing status value.']);
        return;
    }

    $photo_path = null;
    if (!empty($_FILES['photo']['name'])) {
        $upload = handle_photo_upload($_FILES['photo']);
        if (!$upload['success']) {
            echo json_encode(['success' => false, 'message' => $upload['message']]);
            return;
        }
        $photo_path = $upload['path'];
    }

    $params = [
        'name'          => $name,
        'species'       => $species       ?: null,
        'breed'         => $breed         ?: null,
        'status'        => $status,
        'memorial_note' => $memorial_note ?: null,
    ];

    $setClauses = [
        'Name = :name',
        'Species = :species',
        'Breed = :breed',
        'Status = :status',
        'Memorial_Note = :memorial_note',
    ];

    if ($photo_path !== null) {
        $setClauses[] = 'Photo_Path = :photo_path';
        $params['photo_path'] = $photo_path;
    }

    $params['rescue_id'] = $rescue_id;

    $sql  = 'UPDATE Rescues SET ' . implode(', ', $setClauses) . ' WHERE Rescue_ID = :rescue_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Rescue profile updated successfully.',
        'rows'    => $stmt->rowCount(),
    ]);
}

function rescue_update_status(PDO $pdo): void
{
    $rescue_id     = (int)($_POST['rescue_id']     ?? 0);
    $status        = trim($_POST['status']          ?? '');
    $memorial_note = trim($_POST['memorial_note']   ?? '');

    if ($rescue_id <= 0 || !in_array($status, RESCUE_STATUSES, true)) {
        echo json_encode(['success' => false, 'message' => 'Invalid rescue ID or status.']);
        return;
    }

    $stmt = $pdo->prepare('
        UPDATE Rescues
        SET    Status = ?, Memorial_Note = ?
        WHERE  Rescue_ID = ?
    ');
    $stmt->execute([$status, $memorial_note ?: null, $rescue_id]);

    echo json_encode([
        'success' => true,
        'message' => "Status updated to '{$status}'.",
        'rows'    => $stmt->rowCount(),
    ]);
}

function rescue_delete(PDO $pdo): void
{
    $rescue_id = (int)($_POST['rescue_id'] ?? 0);

    if ($rescue_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Rescue ID.']);
        return;
    }

    $stmt = $pdo->prepare('SELECT Photo_Path FROM Rescues WHERE Rescue_ID = ? LIMIT 1');
    $stmt->execute([$rescue_id]);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Rescue not found.']);
        return;
    }

    // ── Delete the database record (cascades to Medical_Records & Applications) ─
    $stmt = $pdo->prepare('DELETE FROM Rescues WHERE Rescue_ID = ?');
    $stmt->execute([$rescue_id]);

    if (!empty($row['Photo_Path'])) {
        $full_path = __DIR__ . $row['Photo_Path'];
        if (is_file($full_path)) {
            unlink($full_path);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Rescue record and associated photo deleted.',
    ]);
}

function handle_photo_upload(array $file): array
{
    global $allowed_mime;

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File upload error: ' . $file['error']];
    }

    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'File exceeds 5 MB limit.'];
    }

    // ── Validate MIME type using finfo (server-side, not trusting the client) ─
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mime     = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed_mime, true)) {
        return ['success' => false, 'message' => 'Only JPEG, PNG, WEBP, and GIF images are allowed.'];
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
    $dest     = UPLOAD_DIR_RESCUES . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return ['success' => false, 'message' => 'Failed to save uploaded file. Check server permissions.'];
    }

    return ['success' => true, 'path' => UPLOAD_URI_RESCUES . $filename];
}