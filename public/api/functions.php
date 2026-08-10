<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$user = require_user($pdo);
$name = (string)($_GET['name'] ?? '');

if ($name === 'getEmployeeProfile') {
  $employee = entity_config($entityMap, 'Employee');
  $table = $employee['table'];
  $stmt = $pdo->prepare("SELECT * FROM $table WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"email\"')) = ? LIMIT 1");
  $stmt->execute([$user['email']]);
  $row = $stmt->fetch();
  respond(['user' => $user, 'employee' => $row ? flatten_row($row) : null]);
}

if ($name === 'checkLowStock') {
  $inventory = entity_config($entityMap, 'InventoryItem');
  $log = entity_config($entityMap, 'ActivityLog');
  $stmt = $pdo->query("SELECT * FROM {$inventory['table']} WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"current_stock\"')) AS DECIMAL(12,2)) <= CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.\"minimum_stock\"')) AS DECIMAL(12,2))");
  $items = array_map('flatten_row', $stmt->fetchAll());
  foreach ($items as $item) {
    $entry = [
      'entity_type' => 'Lager',
      'entity_id' => $item['id'],
      'action' => 'Lageradvarsel',
      'description' => 'Lav lagerbeholdning: ' . ($item['name'] ?? $item['item_name'] ?? $item['id']),
    ];
    $insert = $pdo->prepare("INSERT INTO {$log['table']} (id, data, created_by, created_by_id) VALUES (?, ?, ?, ?)");
    $insert->execute([uuidv4(), json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $user['email'], $user['id']]);
  }
  respond(['ok' => true, 'low_stock_count' => count($items), 'items' => $items]);
}

respond(['error' => "Function '$name' is not migrated yet"], 501);
