<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$entity = (string)($_GET['entity'] ?? '');
$id = $_GET['id'] ?? null;
$sort = $_GET['sort'] ?? null;
$limit = min(1000, max(1, (int)($_GET['limit'] ?? 200)));
$definition = entity_config($entityMap, $entity);
$table = $definition['table'];
$method = $_SERVER['REQUEST_METHOD'];
$publicReadEntities = ['AppRelease'];
$user = current_user($pdo);

if (!$user && !($method === 'GET' && in_array($entity, $publicReadEntities, true))) {
  respond(['error' => 'Unauthorized'], 401);
}

if ($user && !empty($user['must_change_password'])) {
  respond(['error' => 'Adgangskoden skal ændres før systemet kan bruges', 'must_change_password' => true], 403);
}

function user_permissions(?array $user): ?array {
  if (!$user || !array_key_exists('permissions', $user) || $user['permissions'] === null || $user['permissions'] === '') return null;
  $decoded = json_decode((string)$user['permissions'], true);
  return is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
}

function entity_modules(string $entity): array {
  $map = [
    'ActivityLog' => ['company'],
    'AsbestFjernelse' => ['environment', 'quality'],
    'Assignment' => ['planning', 'tasks', 'projects'],
    'BudgetItem' => ['finance'],
    'Campaign' => ['sales', 'company'],
    'Certificate' => ['employees', 'service'],
    'CertificateLog' => ['employees'],
    'CompanyResource' => ['documents', 'company'],
    'CompanySettings' => ['company'],
    'Contact' => ['customers', 'suppliers'],
    'Customer' => ['customers'],
    'CustomerContactLog' => ['customers'],
    'CustomerFeedback' => ['customers'],
    'CustomerReference' => ['customers', 'documents'],
    'Deviation' => ['quality', 'projects'],
    'Employee' => ['employees'],
    'Equipment' => ['equipment'],
    'EquipmentBooking' => ['equipment', 'planning'],
    'EquipmentMaintenance' => ['equipment'],
    'Expense' => ['finance'],
    'Handover' => ['service', 'projects'],
    'InsuranceCase' => ['quality', 'environment'],
    'InternalMessage' => ['employees'],
    'InventoryItem' => ['materials'],
    'Invoice' => ['finance'],
    'JournalEntry' => ['finance'],
    'KnowledgeArticle' => ['documents'],
    'Lead' => ['sales'],
    'MarketingPost' => ['company', 'sales'],
    'Material' => ['materials', 'projects'],
    'MaterialNeed' => ['materials', 'projects'],
    'MeetingBooking' => ['planning', 'customers'],
    'Milestone' => ['projects'],
    'Newsletter' => ['company', 'sales'],
    'PhotoArchive' => ['documents', 'projects'],
    'PortalSetting' => ['company'],
    'Project' => ['projects'],
    'ProjectDocument' => ['documents', 'projects'],
    'ProjectImage' => ['documents', 'projects'],
    'ProjectNote' => ['projects'],
    'PurchaseOrder' => ['materials', 'finance'],
    'QualityCheck' => ['quality'],
    'Quote' => ['sales'],
    'QuoteTemplate' => ['sales'],
    'SafetyChecklist' => ['quality'],
    'SafetyLog' => ['quality'],
    'SafetyProtocol' => ['quality'],
    'Service' => ['service', 'sales'],
    'ServiceAgreement' => ['service'],
    'ServiceTask' => ['service', 'tasks'],
    'Shift' => ['planning', 'employees'],
    'SignatureRequest' => ['documents', 'sales'],
    'Subcontractor' => ['suppliers'],
    'Subscription' => ['service', 'finance'],
    'Supplier' => ['suppliers'],
    'SupplierInvoice' => ['finance', 'suppliers'],
    'SupportTicket' => ['customers'],
    'Task' => ['tasks'],
    'TimeEntry' => ['employees', 'finance'],
    'User' => ['employees'],
    'VacationRequest' => ['employees', 'planning'],
    'VatReport' => ['finance'],
    'Vehicle' => ['equipment'],
    'WasteLog' => ['environment'],
    'WebsiteInquiry' => ['sales'],
  ];
  return $map[$entity] ?? [];
}

function assert_user_entity_access(?array $user, string $entity): void {
  if (!$user || ($user['role'] ?? '') !== 'user') return;
  $permissions = user_permissions($user);
  if ($permissions === null) return;
  $modules = entity_modules($entity);
  if (!$modules) return;
  foreach ($modules as $module) {
    if (in_array($module, $permissions, true)) return;
  }
  respond(['error' => 'Forbidden'], 403);
}

assert_user_entity_access($user, $entity);

function customer_email(array $user): string {
  return strtolower(trim((string)($user['email'] ?? '')));
}

function customer_context(PDO $pdo, array $entityMap, array $user): array {
  $email = customer_email($user);
  $customerIds = [];
  $projectIds = [];

  if ($email !== '') {
    foreach (entity_filter($pdo, $entityMap, 'Customer', ['email' => $email], '-created_date', 1000) as $customer) {
      if (!empty($customer['id'])) $customerIds[(string)$customer['id']] = true;
    }
  }

  $projects = entity_filter($pdo, $entityMap, 'Project', [], '-created_date', 1000);
  foreach ($projects as $project) {
    $matchesEmail = strtolower(trim((string)($project['customer_email'] ?? ''))) === $email;
    $matchesCustomerId = !empty($project['customer_id']) && isset($customerIds[(string)$project['customer_id']]);
    if ($email !== '' && ($matchesEmail || $matchesCustomerId)) {
      $projectIds[(string)$project['id']] = true;
    }
  }

  return [
    'email' => $email,
    'customer_ids' => $customerIds,
    'project_ids' => $projectIds,
  ];
}

function item_matches_customer(array $item, array $ctx): bool {
  $email = $ctx['email'];
  if ($email !== '') {
    foreach (['customer_email', 'email', 'contact_email'] as $field) {
      if (strtolower(trim((string)($item[$field] ?? ''))) === $email) return true;
    }
  }

  if (!empty($item['customer_id']) && isset($ctx['customer_ids'][(string)$item['customer_id']])) return true;
  if (!empty($item['project_id']) && isset($ctx['project_ids'][(string)$item['project_id']])) return true;

  return false;
}

function customer_can_read_entity(string $entity): bool {
  return in_array($entity, [
    'CompanySettings',
    'Invoice',
    'PortalSetting',
    'Project',
    'ProjectDocument',
    'ProjectImage',
    'QualityCheck',
    'Quote',
    'SupportTicket',
  ], true);
}

function customer_filter_rows(PDO $pdo, array $entityMap, string $entity, array $rows, array $user): array {
  if (($user['role'] ?? '') !== 'customer') return $rows;
  if (!customer_can_read_entity($entity)) respond(['error' => 'Forbidden'], 403);
  if (in_array($entity, ['CompanySettings', 'PortalSetting'], true)) return $rows;

  $ctx = customer_context($pdo, $entityMap, $user);
  return array_values(array_filter($rows, fn($row) => item_matches_customer($row, $ctx)));
}

function customer_assert_can_read(PDO $pdo, array $entityMap, string $entity, ?array $row, array $user): void {
  if (($user['role'] ?? '') !== 'customer') return;
  if (!customer_can_read_entity($entity)) respond(['error' => 'Forbidden'], 403);
  if (!$row || in_array($entity, ['CompanySettings', 'PortalSetting'], true)) return;
  $ctx = customer_context($pdo, $entityMap, $user);
  if (!item_matches_customer($row, $ctx)) respond(['error' => "$entity not found"], 404);
}

function customer_assert_can_write(string $entity, array $user): void {
  if (($user['role'] ?? '') !== 'customer') return;
  if ($entity === 'SupportTicket' && $_SERVER['REQUEST_METHOD'] === 'POST') return;
  respond(['error' => 'Forbidden'], 403);
}

if ($method === 'GET' && $id) {
  $row = entity_get($pdo, $entityMap, $entity, (string)$id);
  if ($user) customer_assert_can_read($pdo, $entityMap, $entity, $row, $user);
  respond($row);
}

if ($method === 'GET') {
  $filter = json_decode((string)($_GET['filter'] ?? '{}'), true);
  if (!is_array($filter)) $filter = [];
  $rows = entity_filter($pdo, $entityMap, $entity, $filter, $sort, $limit);
  if ($user) $rows = customer_filter_rows($pdo, $entityMap, $entity, $rows, $user);
  respond($rows);
}

if ($method === 'POST') {
  customer_assert_can_write($entity, $user);
  $body = json_body();
  $rows = isset($body[0]) && is_array($body[0]) ? $body : [$body];
  $created = [];
  foreach ($rows as $data) {
    $created[] = entity_create($pdo, $entityMap, $entity, $data, $user);
  }
  respond(count($created) === 1 ? $created[0] : $created, 201);
}

if ($method === 'PATCH' && $id) {
  customer_assert_can_write($entity, $user);
  respond(entity_update($pdo, $entityMap, $entity, (string)$id, json_body()));
}

if ($method === 'DELETE' && $id) {
  customer_assert_can_write($entity, $user);
  $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
  $stmt->execute([$id]);
  respond(['ok' => true]);
}

respond(['error' => 'Unsupported entity operation'], 405);
