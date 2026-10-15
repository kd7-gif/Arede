// Creates the database, tables, sample data and the first admin account.
//   npm run db:setup   -> safe to re-run, never deletes data
//   npm run db:reset   -> drops the database first (development only)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { migrate } from './lib/migrate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '../../database');
const fresh = process.argv.includes('--fresh');
const { database, ...conn } = config.db;

const server = await mysql.createConnection({ ...conn, multipleStatements: true, charset: 'utf8mb4' });

try {
  if (fresh) {
    console.log(`Dropping database ${database}...`);
    await server.query(`DROP DATABASE IF EXISTS \`${database}\``);
  }
  await server.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await server.query(`USE \`${database}\``);

  await server.query(fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8'));
  await migrate(server);
  console.log('Tables ready.');

  const [[{ n }]] = await server.query('SELECT COUNT(*) AS n FROM categories');
  if (n === 0) {
    await server.query(fs.readFileSync(path.join(dbDir, 'seed.sql'), 'utf8'));
    console.log('Sample categories and products loaded (placeholder prices).');
  } else {
    console.log('Catalog already has data, skipping sample data.');
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@arede.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123';
  const name = process.env.ADMIN_NAME || 'Arede Admin';
  const [existing] = await server.query('SELECT id FROM users WHERE email = ?', [email]);
  if (!existing.length) {
    const hash = await bcrypt.hash(password, 12);
    await server.query(
      "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, '', ?, 'admin')",
      [name, email, hash]
    );
    console.log(`Admin account created: ${email}`);
  } else {
    console.log(`Admin account ${email} already exists.`);
  }
  console.log('Done.');
} finally {
  await server.end();
}
