# Simply Backend Migration

The app now has a first Simply-compatible backend layer:

- `public/api/*.php` exposes auth, entity CRUD, health checks and selected function endpoints.
- `database/mysql-schema.sql` creates MySQL tables for all Base44 entities.
- `src/api/simplyClient.js` lets the frontend use the Simply API when built with `VITE_API_MODE=simply`.

## Server Layout

On Simply.com:

- Frontend and API files live in `public_html/`.
- Database config lives outside the web root at `private/simply-config.php`.

Do not commit real database credentials to the repository.

Example:

```php
<?php
return [
  'db' => [
    'host' => 'mysql45.unoeuro.com',
    'port' => 3306,
    'name' => 'your_database',
    'user' => 'your_user',
    'password' => 'your_password',
  ],
  'openai' => [
    'api_key' => 'sk-proj-...',
    'quote_model' => 'gpt-4.1-mini',
  ],
];
```

The OpenAI key must stay in `private/simply-config.php` or an `OPENAI_API_KEY` server environment variable. Never put it in a Vite `.env` file because that would expose it in the browser.

## Build For Simply API

```bash
$env:VITE_API_MODE='simply'
npm run build:simply
```

Upload the contents of `dist/` to `public_html/`.

## Database

Generate the schema after entity changes:

```bash
npm run generate:simply-schema
```

Apply `database/mysql-schema.sql` to the Simply MySQL database.

## Current Migration Coverage

Covered:

- Email/password auth
- Sessions
- Generic CRUD for all 67 Base44 entities
- File upload to `public_html/uploads`
- `getEmployeeProfile`
- `checkLowStock`
- `createInvoiceFromQuote`
- `createInvoiceFromHours`
- `quoteAction`
- `sendInvoiceReminders` as pending-mail marking
- `sendFeedbackRequest` as pending-mail marking
- `postSupplierInvoice`
- `skatRapport`
- `aiQuoteCalculator` through OpenAI Responses API with deterministic fallback

Still to migrate:

- Google login
- Mail sending through `websmtp.simply.com`
- OCR/AI document scanning for `scanSupplierInvoice`
- Server-side PDF generation for `generateAsbestCertificate`

## Simply WAF

During deployment testing, Simply returned HTTP 455 for `/api/*.php`. Check the Simply control panel webserver/WAF logs and allow the API paths before switching production traffic fully to the Simply backend.
