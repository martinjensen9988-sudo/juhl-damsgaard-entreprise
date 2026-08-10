<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$user = require_user($pdo);
$entity = (string)($_GET['entity'] ?? '');
$id = $_GET['id'] ?? null;
$sort = $_GET['sort'] ?? null;
$limit = min(1000, max(1, (int)($_GET['limit'] ?? 200)));
$definition = entity_config($entityMap, $entity);
$table = $definition['table'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && $id) {
  $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  respond($row ? flatten_row($row) : null);
}

if ($method === 'GET') {
  $filter = json_decode((string)($_GET['filter'] ?? '{}'), true);
  if (!is_array($filter)) $filter = [];
  $where = [];
  $params = [];
  foreach ($filter as $key => $value) {
    $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"$key\"')) = ?";
    $params[] = (string)$value;
  }
  $sql = "SELECT * FROM $table";
  if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
  $sql .= ' ORDER BY ' . sort_sql($sort) . ' LIMIT ' . $limit;
  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  respond(array_map('flatten_row', $stmt->fetchAll()));
}

if ($method === 'POST') {
  $body = json_body();
  $rows = isset($body[0]) && is_array($body[0]) ? $body : [$body];
  $created = [];
  foreach ($rows as $data) {
    $newId = (string)($data['id'] ?? uuidv4());
    unset($data['id'], $data['created_date'], $data['updated_date']);
    $stmt = $pdo->prepare("INSERT INTO $table (id, data, created_by, created_by_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$newId, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $user['email'], $user['id']]);
    $created[] = array_merge($data, ['id' => $newId, 'created_by' => $user['email'], 'created_by_id' => $user['id']]);
  }
  respond(count($created) === 1 ? $created[0] : $created, 201);
}

if ($method === 'PATCH' && $id) {
  $body = json_body();
  $stmt = $pdo->prepare("SELECT data FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) respond(['error' => 'Not found'], 404);
  $data = json_decode($row['data'], true) ?: [];
  $data = array_merge($data, $body);
  $stmt = $pdo->prepare("UPDATE $table SET data = ? WHERE id = ?");
  $stmt->execute([json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $id]);
  respond(array_merge($data, ['id' => $id]));
}

if ($method === 'DELETE' && $id) {
  $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  respond(['ok' => true]);
}

respond(['error' => 'Unsupported entity operation'], 405);
