/**
 * Test database helper.
 * Initializes an in-memory SQLite database (never touches disk)
 * and resets it between test suites.
 */
const initSqlJs = require('sql.js');
const dbModule = require('../../src/database/database');

async function setupTestDatabase() {
  const SQL = await initSqlJs();
  const memDb = new SQL.Database();

  dbModule.__setTestDatabase(memDb);

  memDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT DEFAULT NULL
    );
  `);
}

function clearDatabase() {
  const db = dbModule.getDatabase();
  db.run('DELETE FROM users');
}

module.exports = { setupTestDatabase, clearDatabase };
