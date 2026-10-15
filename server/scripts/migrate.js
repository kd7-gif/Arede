// Run with: npm run db:migrate
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { migrate } from './lib/migrate.js';

const conn = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
try {
  await migrate(conn);
  console.log('Database is up to date.');
} finally {
  await conn.end();
}
