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
  respond(entity_get($pdo, $entityMap, $entity, (string)$id));
}

if ($method === 'GET') {
  $filter = json_decode((string)($_GET['filter'] ?? '{}'), true);
  if (!is_array($filter)) $filter = [];
  respond(entity_filter($pdo, $entityMap, $entity, $filter, $sort, $limit));
}

if ($method === 'POST') {
  $body = json_body();
  $rows = isset($body[0]) && is_array($body[0]) ? $body : [$body];
  $created = [];
  foreach ($rows as $data) {
    $created[] = entity_create($pdo, $entityMap, $entity, $data, $user);
  }
  respond(count($created) === 1 ? $created[0] : $created, 201);
}

if ($method === 'PATCH' && $id) {
  respond(entity_update($pdo, $entityMap, $entity, (string)$id, json_body()));
}

if ($method === 'DELETE' && $id) {
  $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  respond(['ok' => true]);
}

respond(['error' => 'Unsupported entity operation'], 405);
