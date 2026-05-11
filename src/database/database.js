const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../../data/database.sqlite');

let db = null;

/**
 * Persists the in-memory database to disk.
 * No-op during tests (NODE_ENV=test).
 */
function persist() {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'test') return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/**
 * Returns the singleton database instance.
 * Must be called after initDatabase().
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Initializes the SQLite database (async because sql.js loads a WASM binary).
 * Loads from disk if the file exists, otherwise creates a new database.
 */
async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Wrap run/get/all to match the better-sqlite3 API used in models
  db.pragma = (pragma) => db.run(`PRAGMA ${pragma}`);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

module.exports = { initDatabase, getDatabase, persist };

/**
 * FOR TESTING ONLY.
 * Injects a pre-built in-memory database instance, bypassing file I/O.
 * @param {Object} testDb - sql.js Database instance
 */
/* istanbul ignore next */
function __setTestDatabase(testDb) {
  db = testDb;
  db.pragma = (pragma) => db.run(`PRAGMA ${pragma}`);
}

if (process.env.NODE_ENV === 'test') {
  module.exports.__setTestDatabase = __setTestDatabase;
}
