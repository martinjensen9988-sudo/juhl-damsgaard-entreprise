<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$pdo = db($config);
$user = require_user($pdo);
$name = (string)($_GET['name'] ?? '');
$body = json_body();

function deterministic_quote_estimate(string $message): array {
  $lower = mb_strtolower($message);
  preg_match('/(\d+(?:[,.]\d+)?)\s*(m2|m²|kvm|kvadratmeter|m3|m³|meter|m|timer|time|stk)/u', $lower, $match);
  $qty = isset($match[1]) ? (float)str_replace(',', '.', $match[1]) : 1.0;
  $unitRaw = $match[2] ?? '';
  $unit = in_array($unitRaw, ['m2', 'm²', 'kvm', 'kvadratmeter'], true) ? 'm²' : (in_array($unitRaw, ['m3', 'm³'], true) ? 'm³' : (str_starts_with($unitRaw, 'time') ? 'time' : ($unitRaw === 'stk' ? 'stk' : 'm')));
  $desc = 'Entreprisearbejde';
  $price = 280;
  if (str_contains($lower, 'maling') || str_contains($lower, 'male')) { $desc = 'Malerarbejde'; $unit = 'm²'; $price = 75; }
  elseif (str_contains($lower, 'isolering') || str_contains($lower, 'indblæs')) { $desc = 'Teknisk isolering'; $unit = 'm²'; $price = str_contains($lower, '300') ? 152 : (str_contains($lower, '250') ? 140 : (str_contains($lower, '150') ? 96 : 120)); }
  elseif (str_contains($lower, 'grave')) { $desc = 'Gravearbejde'; $unit = 'm³'; $price = 580; }
  elseif (str_contains($lower, 'kloak')) { $desc = 'Kloakarbejde'; $unit = 'm'; $price = 850; }
  elseif (str_contains($lower, 'asfalt')) { $desc = 'Asfaltering'; $unit = 'm²'; $price = 395; }
  elseif (str_contains($lower, 'beton')) { $desc = 'Betonarbejde'; $unit = 'm³'; $price = 1150; }
  elseif (str_contains($lower, 'tømrer') || str_contains($lower, 'gips')) { $desc = 'Tømrerarbejde'; $unit = str_contains($lower, 'gips') ? 'm²' : 'time'; $price = str_contains($lower, 'gips') ? 245 : 495; }
  $lineItems = [
    ['description' => $desc, 'quantity' => $qty, 'unit' => $unit, 'unit_price' => $price, 'line_total' => $qty * $price],
    ['description' => 'Materialer og tilbehør', 'quantity' => $qty, 'unit' => $unit, 'unit_price' => round($price * 0.35, 2), 'line_total' => round($qty * $price * 0.35, 2)],
  ];
  $subtotal = money_total($lineItems);
  return ['message' => 'Vejledende Simply-beregning. OpenAI API er ikke aktiv, så fallback-beregneren blev brugt.', 'line_items' => $lineItems, 'subtotal' => $subtotal, 'vat' => round($subtotal * 0.25, 2), 'total' => round($subtotal * 1.25, 2), 'ai_provider' => 'fallback'];
}

function extract_openai_text(array $response): string {
  if (isset($response['output_text']) && is_string($response['output_text'])) return $response['output_text'];
  $chunks = [];
  foreach (($response['output'] ?? []) as $output) {
    foreach (($output['content'] ?? []) as $content) {
      if (isset($content['text']) && is_string($content['text'])) $chunks[] = $content['text'];
    }
  }
  return trim(implode("\n", $chunks));
}

function normalize_quote_payload(array $payload): array {
  $lineItems = [];
  foreach (($payload['line_items'] ?? []) as $item) {
    if (!is_array($item)) continue;
    $qty = (float)($item['quantity'] ?? 0);
    $unitPrice = (float)($item['unit_price'] ?? 0);
    if ($qty <= 0 || $unitPrice < 0) continue;
    $lineItems[] = [
      'description' => trim((string)($item['description'] ?? 'Arbejde')),
      'quantity' => $qty,
      'unit' => trim((string)($item['unit'] ?? 'stk')),
      'unit_price' => round($unitPrice, 2),
      'line_total' => round($qty * $unitPrice, 2),
    ];
  }
  if (!$lineItems) throw new RuntimeException('OpenAI returned no quote lines');
  $subtotal = money_total($lineItems);
  return [
    'message' => trim((string)($payload['message'] ?? 'Her er et vejledende AI-estimat baseret på din beskrivelse.')),
    'line_items' => $lineItems,
    'subtotal' => round($subtotal, 2),
    'vat' => round($subtotal * 0.25, 2),
    'total' => round($subtotal * 1.25, 2),
    'assumptions' => array_values(array_filter($payload['assumptions'] ?? [], 'is_string')),
    'ai_provider' => 'openai',
  ];
}

function openai_quote_estimate(array $config, string $message): ?array {
  $apiKey = (string)($config['openai']['api_key'] ?? getenv('OPENAI_API_KEY') ?: '');
  if ($apiKey === '') return null;
  if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL extension is not enabled');

  $model = (string)($config['openai']['quote_model'] ?? getenv('OPENAI_QUOTE_MODEL') ?: 'gpt-4.1-mini');
  $system = "Du er tilbudsberegner for en dansk entreprenørvirksomhed. Lav et realistisk vejledende tilbud på dansk. Returner KUN gyldig JSON med keys: message, line_items, assumptions. line_items skal være array af {description, quantity, unit, unit_price}. Brug DKK ekskl. moms i unit_price. Tilføj separate linjer for arbejde, materialer, maskiner/transport og risikotillæg når relevant. Moms beregnes af systemet bagefter.";
  $payload = [
    'model' => $model,
    'input' => [
      ['role' => 'system', 'content' => $system],
      ['role' => 'user', 'content' => $message],
    ],
    'temperature' => 0.2,
    'max_output_tokens' => 1200,
  ];

  $ch = curl_init('https://api.openai.com/v1/responses');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
  ]);
  $raw = curl_exec($ch);
  $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $error = curl_error($ch);
  curl_close($ch);
  if ($raw === false || $status < 200 || $status >= 300) {
    throw new RuntimeException($error ?: "OpenAI API returned HTTP $status");
  }
  $response = json_decode($raw, true);
  if (!is_array($response)) throw new RuntimeException('OpenAI returned invalid JSON');
  $text = extract_openai_text($response);
  $decoded = json_decode($text, true);
  if (!is_array($decoded)) throw new RuntimeException('OpenAI response was not valid quote JSON');
  return normalize_quote_payload($decoded);
}

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

if ($name === 'createInvoiceFromQuote') {
  require_admin($user);
  $quoteId = (string)($body['quote_id'] ?? '');
  if ($quoteId === '') respond(['error' => 'Manglende tilbud ID'], 400);
  $existing = entity_filter($pdo, $entityMap, 'Invoice', ['quote_id' => $quoteId], '-created_date', 1);
  if ($existing) respond(['success' => true, 'message' => 'Faktura eksisterer allerede', 'invoice_id' => $existing[0]['id']]);
  $quote = entity_get($pdo, $entityMap, 'Quote', $quoteId);
  if (!$quote) respond(['error' => 'Tilbud ikke fundet'], 404);
  $invoiceNumber = next_invoice_number($pdo, $entityMap);
  $invoice = entity_create($pdo, $entityMap, 'Invoice', [
    'invoice_number' => $invoiceNumber,
    'customer_id' => $quote['customer_id'] ?? '',
    'customer_name' => $quote['customer_name'] ?? '',
    'customer_email' => $quote['customer_email'] ?? '',
    'project_id' => $quote['project_id'] ?? '',
    'project_name' => $quote['project_name'] ?? '',
    'quote_id' => $quote['id'],
    'status' => 'Kladde',
    'date' => date('Y-m-d'),
    'due_date' => date('Y-m-d', time() + 15 * 86400),
    'line_items' => $quote['line_items'] ?? [],
    'paid_amount' => 0,
    'notes' => 'Oprettet fra tilbud ' . ($quote['quote_number'] ?? $quoteId),
  ], $user);
  create_activity($pdo, $entityMap, $user, [
    'entity_type' => 'Faktura',
    'entity_id' => $invoice['id'],
    'entity_name' => $invoiceNumber,
    'action' => 'Oprettet',
    'details' => 'Faktura oprettet fra tilbud ' . ($quote['quote_number'] ?? $quoteId),
  ]);
  respond(['success' => true, 'invoice_id' => $invoice['id'], 'invoice_number' => $invoiceNumber]);
}

if ($name === 'createInvoiceFromHours') {
  require_admin($user);
  $projectId = (string)($body['project_id'] ?? '');
  $send = (bool)($body['send'] ?? false);
  if ($projectId === '') respond(['error' => 'Manglende projekt ID'], 400);
  $project = entity_get($pdo, $entityMap, 'Project', $projectId);
  if (!$project) respond(['error' => 'Projekt ikke fundet'], 404);
  $times = entity_filter($pdo, $entityMap, 'TimeEntry', ['project_id' => $projectId], '-date', 1000);
  if (!$times) respond(['error' => 'Ingen registrerede timer på projektet'], 400);
  $byType = [];
  foreach ($times as $time) {
    $key = $time['task_type'] ?? 'Andet';
    if (!isset($byType[$key])) $byType[$key] = ['hours' => 0.0, 'lines' => []];
    $byType[$key]['hours'] += (float)($time['hours'] ?? 0);
    $byType[$key]['lines'][] = trim(($time['date'] ?? '') . ' ' . ($time['user_name'] ?? '') . ' - ' . ($time['hours'] ?? 0) . 't' . (!empty($time['description']) ? ' (' . $time['description'] . ')' : ''));
  }
  $lineItems = [];
  $docLines = [];
  foreach ($byType as $type => $entry) {
    $hours = round($entry['hours'], 2);
    $lineItems[] = ['description' => "$type - arbejdstimer", 'quantity' => $hours, 'unit' => 'time', 'unit_price' => 280];
    $docLines[] = "$type ({$hours}t):\n  " . implode("\n  ", $entry['lines']);
  }
  $invoiceNumber = next_invoice_number($pdo, $entityMap);
  $invoice = entity_create($pdo, $entityMap, 'Invoice', [
    'invoice_number' => $invoiceNumber,
    'customer_id' => $project['customer_id'] ?? '',
    'customer_name' => $project['customer_name'] ?? '',
    'customer_email' => $project['customer_email'] ?? '',
    'project_id' => $project['id'],
    'project_name' => $project['name'] ?? '',
    'status' => $send ? 'Sendt' : 'Kladde',
    'date' => date('Y-m-d'),
    'due_date' => date('Y-m-d', time() + 15 * 86400),
    'line_items' => $lineItems,
    'paid_amount' => 0,
    'notes' => 'Fakturakladde oprettet fra ' . count($times) . " tidsregistreringer.\n\n" . implode("\n\n", $docLines),
  ], $user);
  create_activity($pdo, $entityMap, $user, [
    'entity_type' => 'Faktura',
    'entity_id' => $invoice['id'],
    'entity_name' => $invoiceNumber,
    'action' => $send ? 'Oprettet og sendt' : 'Oprettet',
    'details' => 'Faktura oprettet fra ' . count($times) . ' tidsregistreringer på projekt ' . ($project['name'] ?? $projectId),
  ]);
  respond(['success' => true, 'invoice_id' => $invoice['id'], 'invoice_number' => $invoiceNumber, 'status' => $invoice['status'], 'hours' => array_sum(array_column($lineItems, 'quantity'))]);
}

if ($name === 'quoteAction') {
  $quoteId = (string)($body['quote_id'] ?? '');
  $action = (string)($body['action'] ?? '');
  if ($quoteId === '') respond(['error' => 'Manglende tilbud ID'], 400);
  $quote = entity_get($pdo, $entityMap, 'Quote', $quoteId);
  if (!$quote) respond(['error' => 'Tilbud ikke fundet'], 404);
  if (($quote['customer_email'] ?? '') !== ($user['email'] ?? '') && ($user['role'] ?? '') !== 'admin') {
    respond(['error' => 'Dette tilbud tilhører ikke din konto'], 403);
  }
  if ($action === 'view') {
    if (empty($quote['viewed_at'])) entity_update($pdo, $entityMap, 'Quote', $quoteId, ['viewed_at' => gmdate('c')]);
    respond(['success' => true, 'viewed' => true]);
  }
  if ($action === 'accept' || $action === 'reject') {
    $patch = ['status' => $action === 'accept' ? 'Accepteret' : 'Afvist'];
    if ($action === 'accept') {
      $signedName = trim((string)($body['customer_name'] ?? ''));
      if ($signedName === '') respond(['error' => 'Angiv venligst dit fulde navn for at godkende'], 400);
      $patch['accepted_at'] = gmdate('c');
      $patch['accepted_by'] = $signedName;
      $patch['accepted_ip'] = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    }
    entity_update($pdo, $entityMap, 'Quote', $quoteId, $patch);
    create_activity($pdo, $entityMap, $user, [
      'entity_type' => 'Tilbud',
      'entity_id' => $quoteId,
      'entity_name' => $quote['quote_number'] ?? $quoteId,
      'action' => $action === 'accept' ? 'Accepteret' : 'Afvist',
      'details' => $action === 'accept' ? 'Tilbud accepteret digitalt af ' . ($patch['accepted_by'] ?? $user['email']) : 'Tilbud afvist af kunde',
    ]);
    respond(array_merge(['success' => true], $patch));
  }
  respond(['error' => 'Ukendt handling'], 400);
}

if ($name === 'sendInvoiceReminders') {
  require_admin($user);
  $targetDate = date('Y-m-d', time() - 3 * 86400);
  $invoices = entity_filter($pdo, $entityMap, 'Invoice', ['status' => ['$in' => ['Sendt', 'Forfalden']], '-created_date', 1000);
  $checked = 0;
  $marked = 0;
  $sent = 0;
  $errors = [];
  foreach ($invoices as $invoice) {
    if (($invoice['due_date'] ?? '') !== $targetDate || !empty($invoice['reminder_sent'])) continue;
    $checked++;
    $email = (string)($invoice['customer_email'] ?? '');
    $mailResult = ['sent' => false, 'pending' => true];
    if ($email !== '') {
      try {
        $mailResult = send_smtp_mail(
          $config,
          $email,
          'Betalingspåmindelse - faktura ' . ($invoice['invoice_number'] ?? ''),
          "Hej " . ($invoice['customer_name'] ?? '') . "\n\nVi kan se, at faktura " . ($invoice['invoice_number'] ?? '') . " med forfaldsdato " . ($invoice['due_date'] ?? '') . " endnu ikke er registreret betalt.\n\nKontakt os endelig, hvis betalingen allerede er sendt eller hvis du har spørgsmål.\n\nMed venlig hilsen\nJuhl & Damsgaard"
        );
      } catch (Throwable $e) {
        $errors[] = ['invoice_id' => $invoice['id'], 'error' => $e->getMessage()];
      }
    }
    if (!empty($mailResult['sent'])) $sent++;
    else $marked++;
    entity_update($pdo, $entityMap, 'Invoice', $invoice['id'], ['reminder_sent' => true, 'reminder_pending_email' => empty($mailResult['sent'])]);
    create_activity($pdo, $entityMap, $user, [
      'entity_type' => 'Faktura',
      'entity_id' => $invoice['id'],
      'entity_name' => $invoice['invoice_number'] ?? $invoice['id'],
      'action' => 'Sendt',
      'details' => !empty($mailResult['sent']) ? 'Betalingspåmindelse sendt til ' . $email : 'Betalingspåmindelse markeret til afsendelse. SMTP-mail mangler eller fejlede.',
    ]);
  }
  respond(['success' => true, 'sent' => $sent, 'marked_pending_email' => $marked, 'checked' => $checked, 'errors' => $errors]);
}

if ($name === 'sendFeedbackRequest') {
  require_admin($user);
  $projectId = (string)($body['project_id'] ?? '');
  if ($projectId === '') respond(['error' => 'Manglende projekt ID'], 400);
  $project = entity_get($pdo, $entityMap, 'Project', $projectId);
  if (!$project) respond(['error' => 'Projekt ikke fundet'], 404);
  if (empty($project['customer_email'])) respond(['error' => 'Projektet har ingen kundeemail', 'skipped' => true]);
  try {
    $mailResult = send_smtp_mail(
      $config,
      (string)$project['customer_email'],
      'Hvordan gik projektet? - Juhl & Damsgaard',
      "Hej " . ($project['customer_name'] ?? '') . "\n\nTak for samarbejdet omkring " . ($project['name'] ?? 'projektet') . ".\n\nVi vil meget gerne høre din feedback, så vi kan følge op og forbedre vores arbejde.\n\nMed venlig hilsen\nJuhl & Damsgaard"
    );
  } catch (Throwable $e) {
    $mailResult = ['sent' => false, 'pending' => true, 'error' => $e->getMessage()];
  }
  create_activity($pdo, $entityMap, $user, [
    'entity_type' => 'Projekt',
    'entity_id' => $project['id'],
    'entity_name' => $project['name'] ?? $projectId,
    'action' => 'Feedback anmodning sendt',
    'details' => !empty($mailResult['sent']) ? 'Feedbackanmodning sendt til ' . $project['customer_email'] : 'Feedbackanmodning markeret til afsendelse til ' . $project['customer_email'] . '. SMTP-mail mangler eller fejlede.',
  ]);
  respond(['success' => true, 'sent_to' => $project['customer_email'], 'sent' => !empty($mailResult['sent']), 'pending_email' => empty($mailResult['sent']), 'mail' => $mailResult]);
}

if ($name === 'sendEmail') {
  require_admin($user);
  $to = trim((string)($body['to'] ?? ''));
  $subject = trim((string)($body['subject'] ?? ''));
  $message = trim((string)($body['body'] ?? $body['message'] ?? ''));
  if ($to === '' || $subject === '' || $message === '') respond(['error' => 'to, subject og body er påkrævet'], 400);
  respond(['success' => true, 'mail' => send_smtp_mail($config, $to, $subject, $message)]);
}

if ($name === 'skatRapport') {
  require_admin($user);
  $type = (string)($body['type'] ?? 'annual');
  $period = (string)($body['period'] ?? date('Y'));
  $accounts = entity_filter($pdo, $entityMap, 'Account', [], 'account_number', 1000);
  $entries = entity_filter($pdo, $entityMap, 'JournalEntry', [], '-date', 5000);
  $company = entity_filter($pdo, $entityMap, 'CompanySettings', [], '-created_date', 1)[0] ?? [];
  $accountMap = [];
  foreach ($accounts as $account) $accountMap[(string)($account['account_number'] ?? '')] = $account;
  $inPeriod = function (array $entry) use ($period): bool {
    $date = (string)($entry['date'] ?? '');
    if ($date === '') return false;
    if (preg_match('/^\d{4}-Q[1-4]$/', $period)) {
      $quarter = (int)floor(((int)substr($date, 5, 2) - 1) / 3) + 1;
      return $period === substr($date, 0, 4) . '-Q' . $quarter;
    }
    if (preg_match('/^\d{4}-\d{2}$/', $period)) return substr($date, 0, 7) === $period;
    if (preg_match('/^\d{4}$/', $period)) return substr($date, 0, 4) === $period;
    return false;
  };
  if ($type === 'vat') {
    $sales = $output = $purchase = $input = 0.0;
    $posted = 0;
    foreach ($entries as $entry) {
      if (($entry['status'] ?? '') !== 'Bogført' || !$inPeriod($entry)) continue;
      $posted++;
      foreach (($entry['lines'] ?? []) as $line) {
        $debit = (float)($line['debit'] ?? 0);
        $credit = (float)($line['credit'] ?? 0);
        if (($line['vat_code'] ?? '') === 'salg25') $sales += $credit ?: $debit;
        if (($line['vat_code'] ?? '') === 'kob25') $purchase += $debit ?: $credit;
        $acc = $accountMap[(string)($line['account_number'] ?? '')] ?? null;
        if (($acc['vat_type'] ?? '') === 'output') $output += $credit - $debit;
        if (($acc['vat_type'] ?? '') === 'input') $input += $debit - $credit;
      }
    }
    respond([
      'rapport_type' => 'momsangivelse',
      'periode' => $period,
      'genereret' => gmdate('c'),
      'virksomhed' => ['navn' => $company['company_name'] ?? null, 'cvr' => $company['cvr'] ?? null, 'moms_rate' => $company['vat_rate'] ?? 25],
      'salgsgrundlag_ekscl_moms' => $sales,
      'udgaaende_moms' => $output,
      'koebsgrundlag_ekscl_moms' => $purchase,
      'indgaaende_moms' => $input,
      'moms_at_betale' => $output - $input,
      'bogfoerte_posteringer' => $posted,
    ]);
  }
  $rows = [];
  foreach ($entries as $entry) {
    if (($entry['status'] ?? '') !== 'Bogført' || !$inPeriod($entry)) continue;
    foreach (($entry['lines'] ?? []) as $line) {
      $acc = $accountMap[(string)($line['account_number'] ?? '')] ?? null;
      if (!$acc) continue;
      $debit = (float)($line['debit'] ?? 0);
      $credit = (float)($line['credit'] ?? 0);
      $typeName = $acc['type'] ?? '';
      $amount = in_array($typeName, ['Indtægt', 'Finansiel indtægt'], true) ? $credit - $debit : (in_array($typeName, ['Omkostning', 'Finansiel omkostning'], true) ? $debit - $credit : 0);
      $num = (string)($line['account_number'] ?? '');
      if (!isset($rows[$num])) $rows[$num] = ['account_number' => $num, 'name' => $acc['name'] ?? $num, 'type' => $typeName, 'amount' => 0];
      $rows[$num]['amount'] += $amount;
    }
  }
  $resultRows = array_values(array_filter($rows, fn($row) => abs((float)$row['amount']) > 0.01));
  respond(['rapport_type' => 'aarsregnskab', 'regnskabsaar' => $period, 'genereret' => gmdate('c'), 'virksomhed' => ['navn' => $company['company_name'] ?? null, 'cvr' => $company['cvr'] ?? null], 'resultatopgoerelse' => ['linjer' => $resultRows]]);
}

if ($name === 'postSupplierInvoice') {
  require_admin($user);
  $invoiceId = (string)($body['invoice_id'] ?? '');
  if ($invoiceId === '') respond(['error' => 'invoice_id mangler'], 400);
  $invoice = entity_get($pdo, $entityMap, 'SupplierInvoice', $invoiceId);
  if (!$invoice) respond(['error' => 'Faktura ikke fundet'], 404);
  if (in_array($invoice['status'] ?? '', ['Godkendt', 'Betalt'], true)) respond(['error' => 'Faktura er allerede godkendt', 'invoice' => $invoice], 409);
  $amount = (float)($invoice['amount'] ?? 0);
  $vat = (float)($invoice['vat_amount'] ?? 0);
  $total = $amount + $vat;
  $date = $invoice['date'] ?? date('Y-m-d');
  $existing = entity_filter($pdo, $entityMap, 'JournalEntry', [], '-entry_number', 1);
  $next = 1;
  if ($existing && !empty($existing[0]['entry_number'])) $next = ((int)preg_replace('/\D/', '', (string)$existing[0]['entry_number'])) + 1;
  $entryNumber = str_pad((string)$next, 5, '0', STR_PAD_LEFT);
  $lines = [
    ['account_number' => '4100', 'account_name' => 'Vareforbrug / fremmed arbejde', 'debit' => $amount, 'credit' => 0, 'vat_code' => 'kob25', 'description' => ($invoice['invoice_number'] ?? '') . ' - ' . ($invoice['supplier_name'] ?? '')],
  ];
  if ($vat > 0) $lines[] = ['account_number' => '6610', 'account_name' => 'Indgående moms', 'debit' => $vat, 'credit' => 0, 'vat_code' => 'none', 'description' => 'Indgående moms'];
  $lines[] = ['account_number' => '6810', 'account_name' => 'Leverandørgæld', 'debit' => 0, 'credit' => $total, 'vat_code' => 'none', 'description' => ($invoice['supplier_name'] ?? '') . ' - ' . ($invoice['invoice_number'] ?? '')];
  $journal = entity_create($pdo, $entityMap, 'JournalEntry', [
    'entry_number' => $entryNumber,
    'date' => $date,
    'period' => substr($date, 0, 7),
    'description' => 'Leverandørfaktura ' . ($invoice['invoice_number'] ?? '') . ' - ' . ($invoice['supplier_name'] ?? ''),
    'status' => 'Bogført',
    'lines' => $lines,
    'attachment_url' => $invoice['file_url'] ?? '',
    'posted_date' => $date,
  ], $user);
  $updated = entity_update($pdo, $entityMap, 'SupplierInvoice', $invoiceId, ['status' => 'Godkendt', 'approved_by' => $user['name'] ?: $user['email'], 'approved_date' => date('Y-m-d'), 'journal_entry_id' => $journal['id']]);
  respond(['ok' => true, 'invoice' => $updated, 'journal_entry' => ['id' => $journal['id'], 'entry_number' => $entryNumber], 'posted' => ['amount' => $amount, 'vat' => $vat, 'total' => $total]]);
}

if ($name === 'aiQuoteCalculator') {
  $message = trim((string)($body['message'] ?? ''));
  if ($message === '') respond(['error' => 'Besked mangler'], 400);
  if (mb_strlen($message) > 2000) respond(['error' => 'Beskeden er for lang (max 2000 tegn)'], 400);
  try {
    $estimate = openai_quote_estimate($config, $message);
    if ($estimate) respond($estimate);
  } catch (Throwable $e) {
    $fallback = deterministic_quote_estimate($message);
    $fallback['openai_error'] = $e->getMessage();
    respond($fallback);
  }
  respond(deterministic_quote_estimate($message));
}

if (in_array($name, ['scanSupplierInvoice', 'generateAsbestCertificate'], true)) {
  respond(['error' => "Function '$name' kræver stadig separat OCR/PDF-service på Simply.", 'migrated' => false], 501);
}

respond(['error' => "Function '$name' is not migrated yet"], 501);
