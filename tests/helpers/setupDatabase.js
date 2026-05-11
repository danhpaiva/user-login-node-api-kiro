/**
 * Test database helper.
 * Initializes an in-memory SQLite database (never touches disk)
 * and resets it between test suites.
 */
const initSqlJs = require('sql.js');
const dbModule = require('../../src/database/database');

/**
 * Boots an isolated in-memory database and injects it into the db module.
 * Call this in beforeAll().
 */
async function setupTestDatabase() {
  const SQL = await initSqlJs();
  const memDb = new SQL.Database(); // pure in-memory, no file

  // Patch the module internals so getDatabase() returns our test instance
  // and persist() becomes a no-op (no disk writes during tests)
  dbModule.__setTestDatabase(memDb);

  // Create tables
  memDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

/**
 * Clears all rows from every table. Call this in beforeEach() for isolation.
 */
function clearDatabase() {
  const db = dbModule.getDatabase();
  db.run('DELETE FROM users');
}

module.exports = { setupTestDatabase, clearDatabase };
