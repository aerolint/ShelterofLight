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

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

header('Content-Type: application/json');

$action = trim($_POST['action'] ?? '');

switch ($action) {

    case 'register':
        handle_register($pdo);
        break;

    case 'login':
        handle_login($pdo);
        break;

    case 'logout':
        handle_logout();
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        break;
}

// register
function handle_register(PDO $pdo): void
{
    $username   = trim($_POST['username']   ?? '');
    $password   = trim($_POST['password']   ?? '');
    $confirm    = trim($_POST['confirm_password'] ?? '');
    $full_name  = trim($_POST['full_name']  ?? '');
    $email      = trim($_POST['email']      ?? '');
    $contact    = trim($_POST['contact_number']      ?? '');
    $emerg_name = trim($_POST['emergency_contact_name'] ?? '');
    $emerg_num  = trim($_POST['emergency_contact_num']  ?? '');
    $avail      = trim($_POST['availability']          ?? '');
    $vol_pref   = trim($_POST['volunteer_preference']  ?? '');

    $errors = [];

    if (empty($username)) {
        $errors[] = 'Username is required.';
    } elseif (strlen($username) < 4 || strlen($username) > 50) {
        $errors[] = 'Username must be 4–50 characters.';
    }

    if (empty($password)) {
        $errors[] = 'Password is required.';
    } elseif (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    }

    if ($password !== $confirm) {
        $errors[] = 'Passwords do not match.';
    }

    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format.';
    }

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        return;
    }

    $stmt = $pdo->prepare('SELECT User_ID FROM Users WHERE Username = ? LIMIT 1');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Username is already taken.']);
        return;
    }

    if (!empty($email)) {
        $stmt = $pdo->prepare('SELECT User_ID FROM Users WHERE Email = ? LIMIT 1');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email address is already registered.']);
            return;
        }
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $sql = '
        INSERT INTO Users
            (Username, Password, Role, Full_Name, Email, Contact_Number,
             Emergency_Contact_Name, Emergency_Contact_Num, Availability, Volunteer_Preference)
        VALUES
            (?, ?, \'User\', ?, ?, ?, ?, ?, ?, ?)
    ';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $username, $hashed,
        $full_name ?: null,
        $email     ?: null,
        $contact   ?: null,
        $emerg_name ?: null,
        $emerg_num  ?: null,
        $avail      ?: null,
        $vol_pref   ?: null,
    ]);

    $new_id = (int) $pdo->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['user_id']  = $new_id;
    $_SESSION['role']     = 'User';
    $_SESSION['username'] = $username;

    echo json_encode([
        'success'  => true,
        'message'  => 'Account created successfully! Welcome to Shelter of Light.',
        'redirect' => 'index.php',
    ]);
}

// login
function handle_login(PDO $pdo): void
{
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
        return;
    }

    $stmt = $pdo->prepare(
        'SELECT User_ID, Username, Password, Role FROM Users WHERE Username = ? LIMIT 1'
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['Password'])) {
        // Intentionally vague to prevent username enumeration
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        return;
    }

    session_regenerate_id(true);

    $_SESSION['user_id']  = (int) $user['User_ID'];
    $_SESSION['role']     = $user['Role'];
    $_SESSION['username'] = $user['Username'];

    $redirect = ($user['Role'] === 'Admin') ? 'admin/dashboard.php' : 'index.php';

    echo json_encode([
        'success'  => true,
        'message'  => 'Login successful.',
        'role'     => $user['Role'],
        'redirect' => $redirect,
    ]);
}

function handle_logout(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }

    session_destroy();

    echo json_encode([
        'success'  => true,
        'message'  => 'You have been logged out.',
        'redirect' => 'auth.php',
    ]);
}