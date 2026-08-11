<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$action = $_GET['action'] ?? '';
$body = json_body();

function ensure_auth_tables(PDO $pdo): void {
  ensure_user_permissions_column($pdo);

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
  $permissions = null;
  if (isset($user['permissions']) && $user['permissions'] !== null && $user['permissions'] !== '') {
    $decoded = json_decode((string)$user['permissions'], true);
    if (is_array($decoded)) $permissions = array_values(array_filter($decoded, 'is_string'));
  }
  return [
    'id' => $user['id'],
    'email' => $user['email'],
    'name' => $user['name'] ?? null,
    'full_name' => $user['name'] ?? null,
    'role' => $user['role'],
    'permissions' => $permissions,
    'created_date' => $user['created_date'] ?? null,
  ];
}

function normalize_role(string $role): string {
  return in_array($role, ['admin', 'user', 'customer'], true) ? $role : 'user';
}

function normalize_permissions($permissions): array {
  $allowed = [
    'sales',
    'customers',
    'projects',
    'finance',
    'planning',
    'tasks',
    'materials',
    'equipment',
    'employees',
    'suppliers',
    'quality',
    'environment',
    'service',
    'documents',
    'company',
    'screens',
  ];
  if (!is_array($permissions)) return [];
  return array_values(array_intersect($allowed, array_values(array_unique(array_map('strval', $permissions)))));
}

ensure_auth_tables($pdo);

if ($action === 'me') {
  $user = current_user($pdo);
  respond($user ?: null);
}

if ($action === 'login') {
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = trim((string)($body['password'] ?? ''));
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
  respond(['error' => 'Medarbejderadgang oprettes af administrator'], 403);
}

if ($action === 'users') {
  $admin = require_user($pdo);
  require_admin($admin);
  $stmt = $pdo->query('SELECT id, email, name, role, permissions, created_date FROM jd_users ORDER BY created_date DESC');
  respond(array_map('public_user', $stmt->fetchAll()));
}

if ($action === 'create-user') {
  $admin = require_user($pdo);
  require_admin($admin);
  $email = strtolower(trim((string)($body['email'] ?? '')));
  $password = (string)($body['password'] ?? '');
  $name = trim((string)($body['name'] ?? ''));
  $role = normalize_role((string)($body['role'] ?? 'user'));
  $permissions = $role === 'user' ? normalize_permissions($body['permissions'] ?? []) : [];
  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    respond(['error' => 'Gyldig email og mindst 8 tegns adgangskode kræves'], 400);
  }
  $id = uuidv4();
  try {
    $stmt = $pdo->prepare('INSERT INTO jd_users (id, email, name, role, permissions, password_hash) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$id, $email, $name !== '' ? $name : null, $role, json_encode($permissions, JSON_UNESCAPED_SLASHES), password_hash($password, PASSWORD_DEFAULT)]);
  } catch (PDOException $e) {
    if ($e->getCode() === '23000') respond(['error' => 'Brugeren findes allerede'], 409);
    throw $e;
  }
  $stmt = $pdo->prepare('SELECT id, email, name, role, permissions, created_date FROM jd_users WHERE id = ?');
  $stmt->execute([$id]);
  respond(public_user($stmt->fetch()), 201);
}

if ($action === 'update-user') {
  $admin = require_user($pdo);
  require_admin($admin);
  $id = (string)($body['id'] ?? '');
  $role = normalize_role((string)($body['role'] ?? 'user'));
  $permissions = $role === 'user' ? normalize_permissions($body['permissions'] ?? []) : [];
  if ($id === '') respond(['error' => 'Bruger ID mangler'], 400);
  if ($role !== 'admin') {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM jd_users WHERE role = 'admin' AND id <> ?");
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() < 1) respond(['error' => 'Der skal være mindst én administrator'], 400);
  }
  $stmt = $pdo->prepare('UPDATE jd_users SET role = ?, permissions = ? WHERE id = ?');
  $stmt->execute([$role, json_encode($permissions, JSON_UNESCAPED_SLASHES), $id]);
  $stmt = $pdo->prepare('SELECT id, email, name, role, permissions, created_date FROM jd_users WHERE id = ?');
  $stmt->execute([$id]);
  $user = $stmt->fetch();
  if (!$user) respond(['error' => 'Bruger ikke fundet'], 404);
  respond(public_user($user));
}

if ($action === 'delete-user') {
  $admin = require_user($pdo);
  require_admin($admin);
  $id = (string)($body['id'] ?? '');
  if ($id === '') respond(['error' => 'Bruger ID mangler'], 400);
  if ($id === $admin['id']) respond(['error' => 'Du kan ikke slette din egen bruger'], 400);
  $stmt = $pdo->prepare('SELECT role FROM jd_users WHERE id = ?');
  $stmt->execute([$id]);
  $target = $stmt->fetch();
  if (!$target) respond(['error' => 'Bruger ikke fundet'], 404);
  if (($target['role'] ?? '') === 'admin') {
    $stmt = $pdo->query("SELECT COUNT(*) FROM jd_users WHERE role = 'admin'");
    if ((int)$stmt->fetchColumn() <= 1) respond(['error' => 'Der skal være mindst én administrator'], 400);
  }
  $stmt = $pdo->prepare('DELETE FROM jd_users WHERE id = ?');
  $stmt->execute([$id]);
  respond(['ok' => true]);
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
      $mail = send_smtp_mail(
        $config,
        $email,
        'Nulstil adgangskode - Juhl & Damsgaard',
        "Hej\n\nDu har bedt om at nulstille din adgangskode til Juhl & Damsgaard systemet.\n\nBrug linket her:\n$resetUrl\n\nLinket udløber om 2 timer.\n\nHvis du ikke har bedt om dette, kan du ignorere denne mail."
      );
      if (($config['expose_reset_links'] ?? false) === true) {
        respond(['ok' => true, 'reset_url' => $resetUrl, 'mail' => $mail]);
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
