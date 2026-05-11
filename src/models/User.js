const { getDatabase, persist } = require('../database/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Executes a SELECT and returns all rows as an array of objects.
 * @param {string} sql
 * @param {Array} params
 * @returns {Array<Object>}
 */
function queryAll(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Executes a SELECT and returns the first row as an object, or undefined.
 * @param {string} sql
 * @param {Array} params
 * @returns {Object|undefined}
 */
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0];
}

/**
 * Executes an INSERT / UPDATE / DELETE statement.
 * @param {string} sql
 * @param {Array} params
 */
function execute(sql, params = []) {
  const db = getDatabase();
  db.run(sql, params);
  persist();
}

class User {
  /**
   * Find all users (password excluded)
   * @returns {Array}
   */
  static findAll() {
    return queryAll(
      'SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
  }

  /**
   * Find a user by ID (password excluded)
   * @param {string} id
   * @returns {Object|undefined}
   */
  static findById(id) {
    return queryOne(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  }

  /**
   * Find a user by email (includes password for auth purposes)
   * @param {string} email
   * @returns {Object|undefined}
   */
  static findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  }

  /**
   * Create a new user
   * @param {Object} data - { name, email, password }
   * @returns {Object} Created user (password excluded)
   */
  static create({ name, email, password }) {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    execute(
      'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, now, now]
    );

    return this.findById(id);
  }

  /**
   * Update an existing user
   * @param {string} id
   * @param {Object} data - { name?, email?, password? }
   * @returns {Object|null}
   */
  static update(id, { name, email, password }) {
    const existing = this.findById(id);
    if (!existing) return null;

    const existingFull = queryOne('SELECT * FROM users WHERE id = ?', [id]);

    const updatedName = name ?? existingFull.name;
    const updatedEmail = email ?? existingFull.email;
    const updatedPassword = password
      ? bcrypt.hashSync(password, 10)
      : existingFull.password;
    const now = new Date().toISOString();

    execute(
      'UPDATE users SET name = ?, email = ?, password = ?, updated_at = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedPassword, now, id]
    );

    return this.findById(id);
  }

  /**
   * Delete a user by ID
   * @param {string} id
   * @returns {boolean}
   */
  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;

    execute('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
}

module.exports = User;
