import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const entitiesDir = join(root, 'base44', 'entities');
const outDir = join(root, 'database');
const apiDir = join(root, 'public', 'api');

const stripJsonComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const toTableName = (name) =>
  `jd_${name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}`;

const entities = readdirSync(entitiesDir)
  .filter((file) => file.endsWith('.jsonc'))
  .map((file) => {
    const schema = JSON.parse(stripJsonComments(readFileSync(join(entitiesDir, file), 'utf8')));
    return {
      name: schema.name || basename(file, '.jsonc'),
      table: toTableName(schema.name || basename(file, '.jsonc')),
      required: schema.required || [],
      properties: Object.keys(schema.properties || {}),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const schemaSql = `-- Generated from base44/entities/*.jsonc.
-- This schema keeps entity data flexible during the Base44-to-Simply migration.
-- Run on the Simply MySQL database before switching VITE_API_MODE=simply.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS jd_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 1,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jd_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES jd_users(id) ON DELETE CASCADE,
  INDEX idx_jd_sessions_user_id (user_id),
  INDEX idx_jd_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

${entities.map(({ table }) => `CREATE TABLE IF NOT EXISTS ${table} (
  id VARCHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  created_by VARCHAR(255) NULL,
  created_by_id VARCHAR(36) NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_${table}_created_date (created_date),
  INDEX idx_${table}_updated_date (updated_date),
  INDEX idx_${table}_created_by_id (created_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`).join('\n\n')}
`;

const entityMapPhp = `<?php
return ${phpArray(Object.fromEntries(entities.map((entity) => [entity.name, {
  table: entity.table,
  required: entity.required,
  properties: entity.properties,
}])))};\n`;

mkdirSync(outDir, { recursive: true });
mkdirSync(apiDir, { recursive: true });
writeFileSync(join(outDir, 'mysql-schema.sql'), schemaSql);
writeFileSync(join(apiDir, 'entity-map.php'), entityMapPhp);

console.log(`Generated MySQL schema for ${entities.length} entities.`);

function phpArray(value, indent = 0) {
  const pad = ' '.repeat(indent);
  const next = ' '.repeat(indent + 2);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return "[\n" + value.map((item) => `${next}${phpArray(item, indent + 2)}`).join(",\n") + `\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '[]';
    return "[\n" + entries.map(([key, item]) => `${next}${JSON.stringify(key)} => ${phpArray(item, indent + 2)}`).join(",\n") + `\n${pad}]`;
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  return String(value);
}
