const { getDatabase } = require('../database/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Find all users (password excluded)
   * @returns {Array} List of users
   */
  static findAll() {
    const db = getDatabase();
    return db
      .prepare('SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC')
      .all();
  }

  /**
   * Find a user by ID (password excluded)
   * @param {string} id
   * @returns {Object|undefined}
   */
  static findById(id) {
    const db = getDatabase();
    return db
      .prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?')
      .get(id);
  }

  /**
   * Find a user by email (includes password for auth purposes)
   * @param {string} email
   * @returns {Object|undefined}
   */
  static findByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  /**
   * Create a new user
   * @param {Object} data - { name, email, password }
   * @returns {Object} Created user (password excluded)
   */
  static create({ name, email, password }) {
    const db = getDatabase();
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, hashedPassword, now, now);

    return this.findById(id);
  }

  /**
   * Update an existing user
   * @param {string} id
   * @param {Object} data - { name?, email?, password? }
   * @returns {Object|null} Updated user or null if not found
   */
  static update(id, { name, email, password }) {
    const db = getDatabase();
    const existing = this.findById(id);

    if (!existing) return null;

    const updatedName = name ?? existing.name;
    const updatedEmail = email ?? existing.email;
    const updatedPassword = password
      ? bcrypt.hashSync(password, 10)
      : db.prepare('SELECT password FROM users WHERE id = ?').get(id).password;
    const now = new Date().toISOString();

    db.prepare(
      'UPDATE users SET name = ?, email = ?, password = ?, updated_at = ? WHERE id = ?'
    ).run(updatedName, updatedEmail, updatedPassword, now, id);

    return this.findById(id);
  }

  /**
   * Delete a user by ID
   * @param {string} id
   * @returns {boolean} True if deleted, false if not found
   */
  static delete(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

module.exports = User;
