<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$action = $_GET['action'] ?? '';
$body = json_body();

function ensure_auth_tables(PDO $pdo): void {
  $pdo->exec("CREATE TABLE IF NOT EXISTS jd_password_resets (
    token_hash CHAR(64) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_jd_password_resets_user_id (user_id),
    INDEX idx_jd_password_resets_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES jd_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function public_user(array $user): array {
  return ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'role' => $user['role']];
}

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
  respond(['access_token' => $token, 'user' => public_user($user)]);
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

if ($action === 'forgot-password') {
  ensure_auth_tables($pdo);
  $email = strtolower(trim((string)($body['email'] ?? '')));
  if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $stmt = $pdo->prepare('SELECT id, email FROM jd_users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user) {
      $token = bin2hex(random_bytes(32));
      $stmt = $pdo->prepare('INSERT INTO jd_password_resets (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 HOUR))');
      $stmt->execute([hash('sha256', $token), $user['id']]);
      $origin = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
      $resetUrl = $origin . '/reset-password?token=' . urlencode($token);
      if (($config['expose_reset_links'] ?? false) === true) {
        respond(['ok' => true, 'reset_url' => $resetUrl]);
      }
    }
  }
  respond(['ok' => true]);
}

if ($action === 'reset-password') {
  ensure_auth_tables($pdo);
  $resetToken = (string)($body['resetToken'] ?? '');
  $password = (string)($body['newPassword'] ?? '');
  if ($resetToken === '' || strlen($password) < 8) {
    respond(['error' => 'Valid reset token and at least 8 character password required'], 400);
  }
  $stmt = $pdo->prepare('SELECT r.token_hash, r.user_id FROM jd_password_resets r WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > UTC_TIMESTAMP() LIMIT 1');
  $stmt->execute([hash('sha256', $resetToken)]);
  $reset = $stmt->fetch();
  if (!$reset) respond(['error' => 'Reset link is invalid or expired'], 400);
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare('UPDATE jd_users SET password_hash = ? WHERE id = ?');
    $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $reset['user_id']]);
    $stmt = $pdo->prepare('UPDATE jd_password_resets SET used_at = UTC_TIMESTAMP() WHERE token_hash = ?');
    $stmt->execute([$reset['token_hash']]);
    $stmt = $pdo->prepare('DELETE FROM jd_sessions WHERE user_id = ?');
    $stmt->execute([$reset['user_id']]);
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }
  respond(['ok' => true]);
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
