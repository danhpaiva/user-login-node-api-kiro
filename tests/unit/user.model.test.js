process.env.NODE_ENV = 'test';

const { setupTestDatabase, clearDatabase } = require('../helpers/setupDatabase');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(() => {
  clearDatabase();
});

describe('User.create()', () => {
  test('creates a user and returns it without the password field', () => {
    const user = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    expect(user).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(user.id).toBeDefined();
    expect(user.password).toBeUndefined();
  });

  test('stores the password as a bcrypt hash', () => {
    User.create({ name: 'Bob', email: 'bob@test.com', password: 'pass123' });
    const raw = User.findByEmail('bob@test.com');
    expect(raw.password).not.toBe('pass123');
    expect(bcrypt.compareSync('pass123', raw.password)).toBe(true);
  });

  test('generates a unique UUID for each user', () => {
    const u1 = User.create({ name: 'U1', email: 'u1@test.com', password: 'pass123' });
    const u2 = User.create({ name: 'U2', email: 'u2@test.com', password: 'pass123' });
    expect(u1.id).not.toBe(u2.id);
  });
});

describe('User.findAll()', () => {
  test('returns empty data array when no users exist', () => {
    const result = User.findAll();
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test('returns all created users inside data array', () => {
    User.create({ name: 'A', email: 'a@test.com', password: 'pass123' });
    User.create({ name: 'B', email: 'b@test.com', password: 'pass123' });
    const result = User.findAll();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  test('never includes the password field', () => {
    User.create({ name: 'A', email: 'a@test.com', password: 'pass123' });
    const result = User.findAll();
    result.data.forEach((u) => expect(u.password).toBeUndefined());
  });
});

describe('User.findById()', () => {
  test('returns the user when found', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    const found = User.findById(created.id);
    expect(found).toMatchObject({ id: created.id, name: 'Alice' });
  });

  test('returns undefined for a non-existent ID', () => {
    expect(User.findById('non-existent-id')).toBeUndefined();
  });
});

describe('User.findByEmail()', () => {
  test('returns the user including the password hash', () => {
    User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    const found = User.findByEmail('alice@test.com');
    expect(found).toBeDefined();
    expect(found.password).toBeDefined();
  });

  test('returns undefined for an unknown email', () => {
    expect(User.findByEmail('nobody@test.com')).toBeUndefined();
  });
});

describe('User.update()', () => {
  test('updates the name and returns the updated user', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    const updated = User.update(created.id, { name: 'Alice Updated' });
    expect(updated.name).toBe('Alice Updated');
    expect(updated.email).toBe('alice@test.com');
  });

  test('updates the email', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    const updated = User.update(created.id, { email: 'new@test.com' });
    expect(updated.email).toBe('new@test.com');
  });

  test('hashes the new password when updated', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    User.update(created.id, { password: 'newpass456' });
    const raw = User.findByEmail('alice@test.com');
    expect(bcrypt.compareSync('newpass456', raw.password)).toBe(true);
  });

  test('keeps unchanged fields when only one field is provided', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    const updated = User.update(created.id, { name: 'Alice New' });
    expect(updated.email).toBe('alice@test.com');
  });

  test('returns null for a non-existent ID', () => {
    expect(User.update('non-existent', { name: 'X' })).toBeNull();
  });
});

describe('User.delete()', () => {
  test('deletes an existing user and returns true', () => {
    const created = User.create({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    expect(User.delete(created.id)).toBe(true);
    expect(User.findById(created.id)).toBeUndefined();
  });

  test('returns false for a non-existent ID', () => {
    expect(User.delete('non-existent-id')).toBe(false);
  });
});
