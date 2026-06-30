<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// Start or resume the session exactly once
if (session_status() === PHP_SESSION_NONE) {
    // Harden the session cookie
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        // HTTPS-only in production. isset() alone is wrong: some setups send
        // $_SERVER['HTTPS'] = 'off' on plain HTTP, which would mark the cookie
        // Secure over HTTP and make the browser drop it (session never sticks).
        'secure'   => (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off')
                      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
        'httponly' => true,                        // Block JavaScript access
        'samesite' => 'Strict',
    ]);
    session_start();
}

function is_logged_in(): bool
{
    return isset($_SESSION['user_id'], $_SESSION['role']);
}

function redirect(string $url): void
{
    header('Location: ' . $url);
    exit;
}

function require_login(): void
{
    if (!is_logged_in()) {
        $_SESSION['flash_error'] = 'You must be logged in to access this page.';
        redirect('../auth.php');
    }
}

function require_admin(): void
{
    require_login();
    if ($_SESSION['role'] !== 'Admin') {
        $_SESSION['flash_error'] = 'Access denied. Admins only.';
        redirect('../index.php');
    }
}

function require_user_role(): void
{
    require_login();
}

function current_user_id(): ?int
{
    return $_SESSION['user_id'] ?? null;
}

function current_role(): ?string
{
    return $_SESSION['role'] ?? null;
}

function flash_error(): ?string
{
    $msg = $_SESSION['flash_error'] ?? null;
    unset($_SESSION['flash_error']);
    return $msg;
}

function flash_success(): ?string
{
    $msg = $_SESSION['flash_success'] ?? null;
    unset($_SESSION['flash_success']);
    return $msg;
}