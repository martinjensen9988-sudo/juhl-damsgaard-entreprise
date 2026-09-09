<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$user = require_user($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(['error' => 'Unsupported upload operation'], 405);
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  respond(['error' => 'file mangler'], 400);
}

$file = $_FILES['file'];
if (($file['size'] ?? 0) > 20 * 1024 * 1024) {
  respond(['error' => 'Filen er for stor (max 20 MB)'], 400);
}

$safeName = preg_replace('/[^A-Za-z0-9._-]/', '-', (string)$file['name']);
$ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
$allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv'];
if (!in_array($ext, $allowed, true)) {
  respond(['error' => 'Filtypen er ikke tilladt'], 400);
}

$relativeDir = 'uploads/' . date('Y/m');
$targetDir = dirname(__DIR__) . '/' . $relativeDir;
if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
  respond(['error' => 'Kunne ikke oprette uploadmappe'], 500);
}

$targetName = uuidv4() . '-' . $safeName;
$targetPath = $targetDir . '/' . $targetName;
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
  respond(['error' => 'Upload fejlede'], 500);
}

respond([
  'file_url' => '/' . $relativeDir . '/' . $targetName,
  'name' => $safeName,
  'size' => (int)$file['size'],
  'uploaded_by' => $user['email'] ?? null,
]);
