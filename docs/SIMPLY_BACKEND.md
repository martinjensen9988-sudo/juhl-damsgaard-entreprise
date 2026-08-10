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
- `getEmployeeProfile`
- `checkLowStock`

Still to migrate:

- File upload/storage
- Google login
- Mail sending through `websmtp.simply.com`
- Remaining Base44 functions:
  - `aiQuoteCalculator`
  - `createInvoiceFromHours`
  - `deleteMyAccount`
  - `postSupplierInvoice`
  - `quoteAction`
  - `scanSupplierInvoice`
  - `skatRapport`

## Simply WAF

During deployment testing, Simply returned HTTP 455 for `/api/*.php`. Check the Simply control panel webserver/WAF logs and allow the API paths before switching production traffic fully to the Simply backend.
