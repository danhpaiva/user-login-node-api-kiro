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
      updated_at TEXT NOT NULL
    );
  `);

  persist();
  console.log('✅ Migrations executed successfully');
}

module.exports = { runMigrations };
