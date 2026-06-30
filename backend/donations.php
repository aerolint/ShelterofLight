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


define('UPLOAD_DIR_DONATIONS', __DIR__ . '/uploads/donations/');
define('UPLOAD_URI_DONATIONS', '/uploads/donations/');
define('MAX_DON_FILE_SIZE', 8 * 1024 * 1024); // 8 MB
$allowed_donation_mime = [
    'image/jpeg', 'image/png', 'image/webp',
    'image/gif',  'application/pdf',
];

$method = $_SERVER['REQUEST_METHOD'];
$action = $method === 'GET' ? ($_GET['action'] ?? 'pending') : ($_POST['action'] ?? '');


$admin_get_actions = ['list', 'pending'];
if ($method === 'GET' && in_array($action, $admin_get_actions, true)) {
    require_admin();
}


$admin_post_actions = ['verify', 'unverify', 'delete'];
if ($method === 'POST' && in_array($action, $admin_post_actions, true)) {
    require_admin();
}


switch (true) {
    case $method === 'GET'  && $action === 'list':    donation_list($pdo);     break;
    case $method === 'GET'  && $action === 'pending': donation_pending($pdo);  break;
    case $method === 'POST' && $action === 'submit':  donation_submit($pdo);   break;
    case $method === 'POST' && $action === 'verify':  donation_verify($pdo, 'Verified'); break;
    case $method === 'POST' && $action === 'unverify':donation_verify($pdo, 'Pending');  break;
    case $method === 'POST' && $action === 'delete':  donation_delete($pdo);   break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        break;
}

function donation_list(PDO $pdo): void
{
    $sql = '
        SELECT
            d.Donation_ID,
            d.Sender_Name,
            d.Transaction_Date,
            d.Amount_PHP,
            d.Payment_Channel,
            d.Reference_Number,
            d.Screenshot_Path,
            d.Optional_Message,
            d.Verification_Status,
            d.Created_At,
            r.Name AS RescueName
        FROM  Donations d
        LEFT JOIN Rescues r ON r.Rescue_ID = d.Rescue_ID
        ORDER BY d.Created_At DESC
    ';
    $data = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $data, 'count' => count($data)]);
}

function donation_pending(PDO $pdo): void
{
    $sql = '
        SELECT
            d.Donation_ID,
            d.Sender_Name,
            d.Transaction_Date,
            d.Amount_PHP,
            d.Payment_Channel,
            d.Reference_Number,
            d.Screenshot_Path,
            d.Optional_Message,
            d.Verification_Status,
            d.Created_At,
            r.Name AS RescueName
        FROM  Donations d
        LEFT JOIN Rescues r ON r.Rescue_ID = d.Rescue_ID
        WHERE d.Verification_Status = \'Pending\'
        ORDER BY d.Created_At ASC
    ';
    $data = $pdo->query($sql)->fetchAll();
    echo json_encode(['success' => true, 'data' => $data, 'count' => count($data)]);
}

function donation_submit(PDO $pdo): void
{
    global $allowed_donation_mime;

    $sender_name      = trim($_POST['sender_name']      ?? '');
    $transaction_date = trim($_POST['transaction_date'] ?? '');
    $amount           = trim($_POST['amount_php']       ?? '');
    $channel          = trim($_POST['payment_channel']  ?? '');
    $reference        = trim($_POST['reference_number'] ?? '');
    $message          = trim($_POST['optional_message'] ?? '');
    $rescue_id        = !empty($_POST['rescue_id']) ? (int)$_POST['rescue_id'] : null;

    $errors = [];

    if (empty($sender_name))                      $errors[] = 'Sender name is required.';
    if (empty($transaction_date))                 $errors[] = 'Transaction date is required.';
    if (empty($amount) || !is_numeric($amount))   $errors[] = 'A valid donation amount is required.';
    if ((float)$amount <= 0)                      $errors[] = 'Amount must be greater than zero.';
    if (empty($reference))                        $errors[] = 'Reference number is required.';

    if (!empty($transaction_date)) {
        $d = DateTime::createFromFormat('Y-m-d', $transaction_date);
        if (!$d || $d->format('Y-m-d') !== $transaction_date) {
            $errors[] = 'Transaction date must be YYYY-MM-DD format.';
        }
    }

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        return;
    }

    $screenshot_path = null;
    if (!empty($_FILES['screenshot']['name'])) {
        $upload = handle_donation_upload($_FILES['screenshot']);
        if (!$upload['success']) {
            echo json_encode(['success' => false, 'message' => $upload['message']]);
            return;
        }
        $screenshot_path = $upload['path'];
    }

    $stmt = $pdo->prepare('
        INSERT INTO Donations
            (Rescue_ID, Sender_Name, Transaction_Date, Amount_PHP,
             Payment_Channel, Reference_Number, Screenshot_Path,
             Optional_Message, Verification_Status)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, \'Pending\')
    ');
    $stmt->execute([
        $rescue_id,
        $sender_name,
        $transaction_date,
        (float)$amount,
        $channel   ?: null,
        $reference ?: null,
        $screenshot_path,
        $message   ?: null,
    ]);

    echo json_encode([
        'success'     => true,
        'message'     => 'Thank you! Your donation has been logged and is pending verification.',
        'donation_id' => (int)$pdo->lastInsertId(),
    ]);
}

function donation_verify(PDO $pdo, string $new_status): void
{
    $donation_id = (int)($_POST['donation_id'] ?? 0);

    if ($donation_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Donation ID.']);
        return;
    }

    $stmt = $pdo->prepare(
        'UPDATE Donations SET Verification_Status = ? WHERE Donation_ID = ?'
    );
    $stmt->execute([$new_status, $donation_id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Donation not found or status unchanged.']);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => "Donation #{$donation_id} marked as {$new_status}.",
        'status'  => $new_status,
    ]);
}

function donation_delete(PDO $pdo): void
{
    $donation_id = (int)($_POST['donation_id'] ?? 0);

    if ($donation_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid Donation ID.']);
        return;
    }

    $stmt = $pdo->prepare('SELECT Screenshot_Path FROM Donations WHERE Donation_ID = ? LIMIT 1');
    $stmt->execute([$donation_id]);
    $row = $stmt->fetch();

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Donation not found.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM Donations WHERE Donation_ID = ?');
    $stmt->execute([$donation_id]);

    // Remove the screenshot file from disk
    if (!empty($row['Screenshot_Path'])) {
        $full = __DIR__ . $row['Screenshot_Path'];
        if (is_file($full)) unlink($full);
    }

    echo json_encode(['success' => true, 'message' => 'Donation record deleted.']);
}

function handle_donation_upload(array $file): array
{
    global $allowed_donation_mime;

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Upload error code: ' . $file['error']];
    }

    if ($file['size'] > MAX_DON_FILE_SIZE) {
        return ['success' => false, 'message' => 'Screenshot exceeds the 8 MB limit.'];
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed_donation_mime, true)) {
        return ['success' => false, 'message' => 'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, PDF.'];
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'don_' . bin2hex(random_bytes(12)) . '.' . strtolower($ext);
    $dest     = UPLOAD_DIR_DONATIONS . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return ['success' => false, 'message' => 'Could not save file. Check /uploads/donations/ permissions.'];
    }

    return ['success' => true, 'path' => UPLOAD_URI_DONATIONS . $filename];
}