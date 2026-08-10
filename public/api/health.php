<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

try {
  db($config)->query('SELECT 1');
  respond(['ok' => true, 'database' => true]);
} catch (Throwable $e) {
  respond(['ok' => false, 'database' => false, 'error' => $e->getMessage()], 500);
}
