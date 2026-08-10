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

function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function current_user(PDO $pdo): ?array {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.+)/i', $header, $m)) return null;
  $hash = hash('sha256', $m[1]);
  $stmt = $pdo->prepare('SELECT u.id, u.email, u.name, u.role FROM jd_sessions s JOIN jd_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()');
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
