const { getDatabase, persist } = require('./database');

function runMigrations() {
  const db = getDatabase();

  db.run(`
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

  // Add deleted_at column to existing databases that don't have it yet
  try {
    db.run(`ALTER TABLE users ADD COLUMN deleted_at TEXT DEFAULT NULL`);
  } catch (_) {
    // Column already exists — safe to ignore
  }

  persist();
  console.log('✅ Migrations executed successfully');
}

module.exports = { runMigrations };
