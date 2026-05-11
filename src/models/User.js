const { getDatabase, persist } = require('../database/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Executes a SELECT and returns all rows as an array of objects.
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
 * Executes a SELECT and returns the first row, or undefined.
 */
function queryOne(sql, params = []) {
  return queryAll(sql, params)[0];
}

/**
 * Executes an INSERT / UPDATE / DELETE statement.
 */
function execute(sql, params = []) {
  const db = getDatabase();
  db.run(sql, params);
  persist();
}

class User {
  /**
   * Find all active (non-deleted) users — password excluded.
   * Supports optional pagination via { page, limit }.
   *
   * @param {Object} options
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @returns {{ data: Array, total: number, page: number, limit: number, totalPages: number }}
   */
  static findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const countRow = queryOne(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    );
    const total = countRow ? countRow.count : 0;

    const data = queryAll(
      `SELECT id, name, email, created_at, updated_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find an active user by ID — password excluded.
   * @param {string} id
   * @returns {Object|undefined}
   */
  static findById(id) {
    return queryOne(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  /**
   * Find an active user by email — includes password for auth.
   * @param {string} email
   * @returns {Object|undefined}
   */
  static findByEmail(email) {
    return queryOne(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
  }

  /**
   * Create a new user.
   * @param {{ name: string, email: string, password: string }}
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
   * Update an existing active user.
   * @param {string} id
   * @param {{ name?: string, email?: string, password?: string }}
   * @returns {Object|null}
   */
  static update(id, { name, email, password }) {
    const existing = this.findById(id);
    if (!existing) return null;

    const existingFull = queryOne(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

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
   * Soft-delete a user by setting deleted_at.
   * @param {string} id
   * @returns {boolean}
   */
  static delete(id) {
    const existing = this.findById(id);
    if (!existing) return false;

    execute(
      'UPDATE users SET deleted_at = ? WHERE id = ?',
      [new Date().toISOString(), id]
    );
    return true;
  }
}

module.exports = User;
