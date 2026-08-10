<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$action = $_GET['action'] ?? '';
$body = json_body();

if ($action === 'me') {
  $user = current_user($pdo);
  respond($user ?: null);
}

if ($action === 'login') {
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');
  $stmt = $pdo->prepare('SELECT * FROM jd_users WHERE email = ? LIMIT 1');
  $stmt->execute([$email]);
  $user = $stmt->fetch();
  if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(['error' => 'Invalid email or password'], 401);
  }
  $token = bin2hex(random_bytes(32));
  $stmt = $pdo->prepare('INSERT INTO jd_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY))');
  $stmt->execute([hash('sha256', $token), $user['id']]);
  respond(['access_token' => $token, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']]]);
}

if ($action === 'register') {
  if (($config['allow_registration'] ?? false) !== true) {
    respond(['error' => 'Registration is disabled'], 403);
  }
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    respond(['error' => 'Valid email and at least 8 character password required'], 400);
  }
  $id = uuidv4();
  $stmt = $pdo->prepare('INSERT INTO jd_users (id, email, password_hash) VALUES (?, ?, ?)');
  $stmt->execute([$id, $email, password_hash($password, PASSWORD_DEFAULT)]);
  $token = bin2hex(random_bytes(32));
  $stmt = $pdo->prepare('INSERT INTO jd_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY))');
  $stmt->execute([hash('sha256', $token), $id]);
  respond(['ok' => true, 'id' => $id, 'access_token' => $token, 'user' => ['id' => $id, 'email' => $email, 'name' => null, 'role' => 'admin']], 201);
}

if ($action === 'logout') {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
    $stmt = $pdo->prepare('DELETE FROM jd_sessions WHERE token_hash = ?');
    $stmt->execute([hash('sha256', $m[1])]);
  }
  respond(['ok' => true]);
}

respond(['error' => 'Unknown auth action'], 404);
