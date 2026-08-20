import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database migrations...');
    const schemaSqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaSqlPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('✅ Database migrations applied successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
