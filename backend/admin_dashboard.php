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

require_admin();

header('Content-Type: application/json');

$widget = $_GET['widget'] ?? 'all';

switch ($widget) {
    case 'rescue_counts':
        echo json_encode(['success' => true, 'data' => get_rescue_counts($pdo)]);
        break;
    case 'pending_apps':
        echo json_encode(['success' => true, 'data' => get_pending_apps($pdo)]);
        break;
    case 'pending_donations':
        echo json_encode(['success' => true, 'data' => get_pending_donations($pdo)]);
        break;
    case 'active_volunteers':
        echo json_encode(['success' => true, 'data' => get_active_volunteers($pdo)]);
        break;
    case 'all':
    default:
        echo json_encode([
            'success' => true,
            'data'    => [
                'rescue_counts'      => get_rescue_counts($pdo),
                'pending_apps'       => get_pending_apps($pdo),
                'pending_donations'  => get_pending_donations($pdo),
                'active_volunteers'  => get_active_volunteers($pdo),
            ],
        ]);
        break;
}

function get_rescue_counts(PDO $pdo): array
{
    $sql = '
        SELECT Status, COUNT(*) AS total
        FROM   Rescues
        GROUP  BY Status
        ORDER  BY FIELD(Status,
            "Newly Admitted","Under Treatment","Under Observation",
            "Special Needs","Looking for Foster","Adopted","Rainbow Bridge"
        )
    ';
    $rows = $pdo->query($sql)->fetchAll();

    // Format as {label, count} for charting libraries
    $counts = [];
    foreach ($rows as $row) {
        $counts[] = [
            'label' => $row['Status'],
            'count' => (int)$row['total'],
        ];
    }
    return $counts;
}

function get_pending_apps(PDO $pdo): array
{
    $sql = '
        SELECT
            aa.Application_ID,
            aa.Tracker_Code,
            aa.Applicant_Name,
            aa.Status,
            aa.Submitted_At,
            r.Name AS RescueName
        FROM  Adoption_Applications aa
        JOIN  Rescues r ON r.Rescue_ID = aa.Rescue_ID
        WHERE aa.Status = \'Under Review\'
        ORDER BY aa.Submitted_At ASC
        LIMIT 10
    ';
    return $pdo->query($sql)->fetchAll();
}

function get_pending_donations(PDO $pdo): array
{
    $sql = '
        SELECT
            d.Donation_ID,
            d.Sender_Name,
            d.Amount_PHP,
            d.Payment_Channel,
            d.Reference_Number,
            d.Verification_Status,
            d.Created_At
        FROM  Donations d
        WHERE d.Verification_Status = \'Pending\'
        ORDER BY d.Created_At ASC
        LIMIT 10
    ';
    return $pdo->query($sql)->fetchAll();
}

function get_active_volunteers(PDO $pdo): array
{
    $sql = '
        SELECT
            User_ID,
            Full_Name,
            Email,
            Contact_Number,
            Availability,
            Volunteer_Preference,
            Created_At
        FROM  Users
        WHERE Role = \'User\'
        ORDER BY Created_At DESC
        LIMIT 10
    ';
    return $pdo->query($sql)->fetchAll();
}