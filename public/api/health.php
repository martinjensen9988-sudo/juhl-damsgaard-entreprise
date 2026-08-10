<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

try {
  db($config)->query('SELECT 1');
  $openaiConfigured = !empty($config['openai']['api_key']) || (bool)getenv('OPENAI_API_KEY');
  respond(['ok' => true, 'database' => true, 'openai' => $openaiConfigured]);
} catch (Throwable $e) {
  respond(['ok' => false, 'database' => false, 'error' => $e->getMessage()], 500);
}
