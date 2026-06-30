<?php
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
$action = $method === 'GET' ? ($_GET['action'] ?? 'all') : ($_POST['action'] ?? '');

// POST operations are Admin-only
if ($method === 'POST') {
    require_admin();
}

// Route
switch (true) {
    case $method === 'GET' && $action === 'history':
        get_medical_history($pdo, (int)($_GET['rescue_id'] ?? 0));
        break;

    case $method === 'GET' && $action === 'all':
        get_all_records($pdo);
        break;

    case $method === 'GET' && $action === 'clinics':
        get_clinics($pdo);
        break;

    case $method === 'GET' && $action === 'animals':
        get_rescue_dropdown($pdo);
        break;

    case $method === 'POST' && $action === 'log':
        log_record($pdo);      // ← SPLIT-SCREEN core function
        break;

    case $method === 'POST' && $action === 'delete':
        delete_record($pdo);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        break;
}

function get_medical_history(PDO $pdo, int $rescue_id): void
{
    // Medical history is sensitive; restrict to admins (the 'all' action already is).
    require_admin();

    if ($rescue_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Rescue ID.']);
        return;
    }

    $stmt = $pdo->prepare('
        SELECT Rescue_ID, Name, Species, Breed, Status
        FROM   Rescues
        WHERE  Rescue_ID = ?
        LIMIT  1
    ');
    $stmt->execute([$rescue_id]);
    $rescue = $stmt->fetch();

    if (!$rescue) {
        echo json_encode(['success' => false, 'message' => 'Animal not found.']);
        return;
    }

    $records = fetch_joined_history($pdo, $rescue_id);

    echo json_encode([
        'success' => true,
        'rescue'  => $rescue,
        'records' => $records,
    ]);
}

function get_all_records(PDO $pdo): void
{
    require_admin();

    $sql = '
        SELECT
            mr.Record_ID,
            mr.Treatment_Date,
            mr.Diagnosis,
            r.Rescue_ID,
            r.Name         AS RescueName,
            r.Species,
            c.Clinic_ID,
            c.Clinic_Name,
            c.Veterinarian
        FROM  Medical_Records mr
        JOIN  Rescues          r ON r.Rescue_ID = mr.Rescue_ID
        LEFT JOIN Clinics      c ON c.Clinic_ID = mr.Clinic_ID
        ORDER BY mr.Treatment_Date DESC, r.Name ASC
    ';
    $records = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $records]);
}

function get_clinics(PDO $pdo): void
{
    $clinics = $pdo->query(
        'SELECT Clinic_ID, Clinic_Name, Veterinarian FROM Clinics ORDER BY Clinic_Name ASC'
    )->fetchAll();
    echo json_encode(['success' => true, 'data' => $clinics]);
}

function get_rescue_dropdown(PDO $pdo): void
{
    $rescues = $pdo->query(
        "SELECT Rescue_ID, Name, Species FROM Rescues
         WHERE  Status NOT IN ('Rainbow Bridge')
         ORDER BY Name ASC"
    )->fetchAll();
    echo json_encode(['success' => true, 'data' => $rescues]);
}

function log_record(PDO $pdo): void
{
    $rescue_id      = (int)trim($_POST['rescue_id']   ?? 0);
    $clinic_id      = (int)trim($_POST['clinic_id']   ?? 0);
    $treatment_date = trim($_POST['treatment_date']   ?? '');
    $diagnosis      = trim($_POST['diagnosis']        ?? '');

    $errors = [];

    if ($rescue_id <= 0)          $errors[] = 'Please select a rescue animal.';
    if (empty($treatment_date))   $errors[] = 'Treatment date is required.';
    if (empty($diagnosis))        $errors[] = 'Diagnosis / treatment notes are required.';

    if (!empty($treatment_date)) {
        $d = DateTime::createFromFormat('Y-m-d', $treatment_date);
        if (!$d || $d->format('Y-m-d') !== $treatment_date) {
            $errors[] = 'Treatment date must be in YYYY-MM-DD format.';
        }
    }

    // Verify the rescue actually exists
    if ($rescue_id > 0) {
        $chk = $pdo->prepare('SELECT Rescue_ID FROM Rescues WHERE Rescue_ID = ? LIMIT 1');
        $chk->execute([$rescue_id]);
        if (!$chk->fetch()) $errors[] = 'Selected animal does not exist.';
    }

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        return;
    }

    $stmt = $pdo->prepare('
        INSERT INTO Medical_Records (Rescue_ID, Clinic_ID, Treatment_Date, Diagnosis)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([
        $rescue_id,
        $clinic_id > 0 ? $clinic_id : null,
        $treatment_date,
        $diagnosis,
    ]);
    $new_record_id = (int) $pdo->lastInsertId();

    $records = fetch_joined_history($pdo, $rescue_id);

    echo json_encode([
        'success'       => true,
        'message'       => 'Veterinary record committed to the central database.',
        'new_record_id' => $new_record_id,
        'history'       => $records,   // ← drives the right-panel table update
    ]);
}

function delete_record(PDO $pdo): void
{
    $record_id = (int)($_POST['record_id'] ?? 0);

    if ($record_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Record ID.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM Medical_Records WHERE Record_ID = ?');
    $stmt->execute([$record_id]);

    echo json_encode([
        'success' => true,
        'message' => 'Medical record deleted.',
        'rows'    => $stmt->rowCount(),
    ]);
}

function fetch_joined_history(PDO $pdo, int $rescue_id): array
{
    $stmt = $pdo->prepare('
        SELECT
            mr.Record_ID,
            mr.Treatment_Date,
            mr.Diagnosis,
            c.Clinic_Name,
            c.Veterinarian,
            c.Contact_Details  AS ClinicContact
        FROM  Medical_Records mr
        LEFT JOIN Clinics c ON c.Clinic_ID = mr.Clinic_ID
        WHERE mr.Rescue_ID = ?
        ORDER BY mr.Treatment_Date DESC
    ');
    $stmt->execute([$rescue_id]);
    return $stmt->fetchAll();
}