<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configPath = dirname(__DIR__, 2) . '/private/simply-config.php';
if (!is_file($configPath)) {
  http_response_code(500);
  echo json_encode(['error' => 'Missing Simply API config']);
  exit;
}

$config = require $configPath;
$entityMap = require __DIR__ . '/entity-map.php';

function json_body(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') return [];
  $decoded = json_decode($raw, true);
  if (!is_array($decoded)) {
    respond(['error' => 'Invalid JSON body'], 400);
  }
  return $decoded;
}

function respond($payload, int $status = 200): never {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function db(array $config): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $db = $config['db'];
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'] ?? 3306, $db['name']);
  $pdo = new PDO($dsn, $db['user'], $db['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function ensure_user_auth_columns(PDO $pdo): void {
  static $checked = false;
  if ($checked) return;
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_users' AND COLUMN_NAME = 'permissions'");
  $stmt->execute();
  if ((int)$stmt->fetchColumn() === 0) {
    $pdo->exec("ALTER TABLE jd_users ADD COLUMN permissions JSON NULL AFTER role");
  }
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jd_users' AND COLUMN_NAME = 'must_change_password'");
  $stmt->execute();
  if ((int)$stmt->fetchColumn() === 0) {
    $pdo->exec("ALTER TABLE jd_users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash");
  }
  $checked = true;
}

function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function auth_cookie_options(): array {
  return [
    'expires' => time() + 60 * 60 * 24 * 30,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Lax',
  ];
}

function set_auth_cookie(string $token): void {
  setcookie('jd_session', $token, auth_cookie_options());
}

function clear_auth_cookie(): void {
  $options = auth_cookie_options();
  $options['expires'] = time() - 3600;
  setcookie('jd_session', '', $options);
}

function request_auth_token(): ?string {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(.+)/i', $header, $m)) return $m[1];
  $cookieToken = $_COOKIE['jd_session'] ?? '';
  return is_string($cookieToken) && $cookieToken !== '' ? $cookieToken : null;
}

function current_user(PDO $pdo): ?array {
  $token = request_auth_token();
  if (!$token) return null;
  ensure_user_auth_columns($pdo);
  $hash = hash('sha256', $token);
  $stmt = $pdo->prepare('SELECT u.id, u.email, u.name, u.role, u.permissions, u.must_change_password FROM jd_sessions s JOIN jd_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()');
  $stmt->execute([$hash]);
  return $stmt->fetch() ?: null;
}

function require_user(PDO $pdo): array {
  $user = current_user($pdo);
  if (!$user) respond(['error' => 'Unauthorized'], 401);
  return $user;
}

function flatten_row(array $row): array {
  $data = json_decode($row['data'] ?? '{}', true);
  if (!is_array($data)) $data = [];
  return array_merge($data, [
    'id' => $row['id'],
    'created_by' => $row['created_by'] ?? null,
    'created_by_id' => $row['created_by_id'] ?? null,
    'created_date' => $row['created_date'] ?? null,
    'updated_date' => $row['updated_date'] ?? null,
  ]);
}

function entity_config(array $entityMap, string $entity): array {
  if (!isset($entityMap[$entity])) respond(['error' => 'Unknown entity'], 404);
  return $entityMap[$entity];
}

function sort_sql(?string $sort): string {
  if (!$sort) return 'created_date DESC';
  $direction = str_starts_with($sort, '-') ? 'DESC' : 'ASC';
  $field = ltrim($sort, '-');
  if (in_array($field, ['created_date', 'updated_date', 'id'], true)) {
    return "$field $direction";
  }
  return "JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$field\"')) $direction";
}

function entity_table(array $entityMap, string $entity): string {
  return entity_config($entityMap, $entity)['table'];
}

function ensure_entity_table(PDO $pdo, string $table): void {
  if (!preg_match('/^jd_[a-z0-9_]+$/', $table)) {
    respond(['error' => 'Invalid entity table'], 500);
  }
  $pdo->exec("CREATE TABLE IF NOT EXISTS $table (
    id VARCHAR(36) PRIMARY KEY,
    data JSON NOT NULL,
    created_by VARCHAR(255) NULL,
    created_by_id VARCHAR(36) NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_{$table}_created_date (created_date),
    INDEX idx_{$table}_updated_date (updated_date),
    INDEX idx_{$table}_created_by_id (created_by_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function entity_get(PDO $pdo, array $entityMap, string $entity, string $id): ?array {
  $table = entity_table($entityMap, $entity);
  ensure_entity_table($pdo, $table);
  $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  return $row ? flatten_row($row) : null;
}

function entity_filter(PDO $pdo, array $entityMap, string $entity, array $filter = [], ?string $sort = null, int $limit = 200): array {
  $table = entity_table($entityMap, $entity);
  ensure_entity_table($pdo, $table);
  $where = [];
  $params = [];
  foreach ($filter as $key => $value) {
    if (is_array($value) && isset($value['$in']) && is_array($value['$in'])) {
      $placeholders = implode(',', array_fill(0, count($value['$in']), '?'));
      $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$key\"')) IN ($placeholders)";
      foreach ($value['$in'] as $entry) $params[] = (string)$entry;
      continue;
    }
    if (is_array($value) && array_key_exists('$ne', $value)) {
      $where[] = "(JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$key\"')) IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$key\"')) <> ?)";
      $params[] = (string)$value['$ne'];
      continue;
    }
    $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$key\"')) = ?";
    $params[] = (string)$value;
  }
  $sql = "SELECT * FROM $table";
  if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
  $sql .= ' ORDER BY ' . sort_sql($sort) . ' LIMIT ' . max(1, min(1000, $limit));
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  return array_map('flatten_row', $stmt->fetchAll());
}

function entity_create(PDO $pdo, array $entityMap, string $entity, array $data, array $user): array {
  $table = entity_table($entityMap, $entity);
  ensure_entity_table($pdo, $table);
  $id = (string)($data['id'] ?? uuidv4());
  unset($data['id'], $data['created_date'], $data['updated_date']);
  $stmt = $pdo->prepare("INSERT INTO $table (id, data, created_by, created_by_id) VALUES (?, ?, ?, ?)");
  $stmt->execute([$id, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $user['email'] ?? null, $user['id'] ?? null]);
  return array_merge($data, ['id' => $id, 'created_by' => $user['email'] ?? null, 'created_by_id' => $user['id'] ?? null]);
}

function entity_update(PDO $pdo, array $entityMap, string $entity, string $id, array $patch): array {
  $current = entity_get($pdo, $entityMap, $entity, $id);
  if (!$current) respond(['error' => "$entity not found"], 404);
  $data = $current;
  unset($data['id'], $data['created_by'], $data['created_by_id'], $data['created_date'], $data['updated_date']);
  $data = array_merge($data, $patch);
  $table = entity_table($entityMap, $entity);
  $stmt = $pdo->prepare("UPDATE $table SET data = ? WHERE id = ?");
  $stmt->execute([json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $id]);
  return array_merge($data, ['id' => $id]);
}

function next_invoice_number(PDO $pdo, array $entityMap): string {
  $year = date('Y');
  $prefix = "FAK-$year-";
  $invoices = entity_filter($pdo, $entityMap, 'Invoice', [], '-created_date', 1000);
  $max = 0;
  foreach ($invoices as $invoice) {
    $num = (string)($invoice['invoice_number'] ?? '');
    if (str_starts_with($num, $prefix)) {
      $parsed = (int)preg_replace('/\D/', '', substr($num, strlen($prefix)));
      if ($parsed > $max) $max = $parsed;
    }
  }
  return $prefix . str_pad((string)($max + 1), 4, '0', STR_PAD_LEFT);
}

function create_activity(PDO $pdo, array $entityMap, array $user, array $entry): void {
  try {
    entity_create($pdo, $entityMap, 'ActivityLog', array_merge([
      'user_email' => $user['email'] ?? '',
      'user_name' => $user['name'] ?: ($user['email'] ?? 'System'),
    ], $entry), $user);
  } catch (Throwable $e) {
  }
}

function money_total(array $items): float {
  $sum = 0.0;
  foreach ($items as $item) {
    $sum += ((float)($item['quantity'] ?? 0)) * ((float)($item['unit_price'] ?? 0));
  }
  return $sum;
}

function require_admin(array $user): void {
  if (($user['role'] ?? '') !== 'admin') respond(['error' => 'Kun admin'], 403);
}

function smtp_configured(array $config): bool {
  return !empty($config['smtp']['username']) && !empty($config['smtp']['password']);
}

function smtp_read($socket): string {
  $data = '';
  while (($line = fgets($socket, 515)) !== false) {
    $data .= $line;
    if (strlen($line) >= 4 && $line[3] === ' ') break;
  }
  return $data;
}

function smtp_expect($socket, array $codes): string {
  $response = smtp_read($socket);
  $code = (int)substr($response, 0, 3);
  if (!in_array($code, $codes, true)) {
    throw new RuntimeException('SMTP error: ' . trim($response));
  }
  return $response;
}

function smtp_command($socket, string $command, array $codes): string {
  fwrite($socket, $command . "\r\n");
  return smtp_expect($socket, $codes);
}

function mail_header_value(string $value): string {
  return trim(str_replace(["\r", "\n"], ' ', $value));
}

function send_smtp_mail(array $config, string $to, string $subject, string $body, ?string $fromName = null): array {
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('Invalid recipient email');
  }
  if (!smtp_configured($config)) {
    return ['sent' => false, 'pending' => true, 'reason' => 'SMTP is not configured'];
  }
  $smtp = $config['smtp'];
  $host = (string)($smtp['host'] ?? 'websmtp.simply.com');
  $port = (int)($smtp['port'] ?? 587);
  $username = (string)$smtp['username'];
  $password = (string)$smtp['password'];
  $from = (string)($smtp['from'] ?? $username);
  $fromName = mail_header_value($fromName ?: (string)($smtp['from_name'] ?? 'Juhl & Damsgaard'));
  if (!filter_var($from, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('Invalid sender email');
  }

  $socket = fsockopen($host, $port, $errno, $errstr, 20);
  if (!$socket) throw new RuntimeException("Could not connect to SMTP server: $errstr");
  stream_set_timeout($socket, 30);
  try {
    smtp_expect($socket, [220]);
    smtp_command($socket, 'EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), [250]);
    smtp_command($socket, 'STARTTLS', [220]);
    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
      throw new RuntimeException('Could not enable SMTP TLS');
    }
    smtp_command($socket, 'EHLO ' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), [250]);
    smtp_command($socket, 'AUTH LOGIN', [334]);
    smtp_command($socket, base64_encode($username), [334]);
    smtp_command($socket, base64_encode($password), [235]);
    smtp_command($socket, 'MAIL FROM:<' . $from . '>', [250]);
    smtp_command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
    smtp_command($socket, 'DATA', [354]);

    $headers = [
      'From: ' . sprintf('"%s" <%s>', addcslashes($fromName, '"\\'), $from),
      'To: <' . $to . '>',
      'Subject: ' . mail_header_value($subject),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
    ];
    $message = implode("\r\n", $headers) . "\r\n\r\n" . str_replace(["\r\n", "\r"], "\n", $body);
    $message = str_replace("\n.", "\n..", $message);
    fwrite($socket, str_replace("\n", "\r\n", $message) . "\r\n.\r\n");
    smtp_expect($socket, [250]);
    smtp_command($socket, 'QUIT', [221]);
  } finally {
    fclose($socket);
  }
  return ['sent' => true, 'pending' => false];
}
