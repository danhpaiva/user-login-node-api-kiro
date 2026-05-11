process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { setupTestDatabase, clearDatabase } = require('../helpers/setupDatabase');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(() => {
  clearDatabase();
});

// ─── Helper ──────────────────────────────────────────────────────────────────

async function createUser(overrides = {}) {
  const payload = {
    name: 'John Doe',
    email: 'john@test.com',
    password: 'secret123',
    ...overrides,
  };
  const res = await request(app).post('/api/users').send(payload);
  return res.body.data;
}

function validToken(userId = 'any-id') {
  return jwt.sign({ id: userId, email: 'test@test.com' }, 'test_secret', { expiresIn: '1h' });
}

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  test('returns 200 with an empty list when no users exist', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('returns all created users', async () => {
    await createUser({ email: 'a@test.com' });
    await createUser({ email: 'b@test.com' });
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('never exposes the password field', async () => {
    await createUser();
    const res = await request(app).get('/api/users');
    res.body.data.forEach((u) => expect(u.password).toBeUndefined());
  });
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  test('returns 200 with the user when found', async () => {
    const user = await createUser();
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  test('returns 404 for a non-existent ID', async () => {
    const res = await request(app).get('/api/users/non-existent-id');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User not found');
  });
});

// ─── POST /api/users ──────────────────────────────────────────────────────────

describe('POST /api/users', () => {
  test('returns 201 and the created user', async () => {
    const res = await request(app).post('/api/users').send({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'pass123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.password).toBeUndefined();
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/users').send({ email: 'a@test.com', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.name).toBeDefined();
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/users').send({ name: 'A', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/users').send({ name: 'A', email: 'a@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });

  test('returns 400 for an invalid email format', async () => {
    const res = await request(app).post('/api/users').send({ name: 'A', email: 'not-an-email', password: 'pass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid email format');
  });

  test('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app).post('/api/users').send({ name: 'A', email: 'a@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at least 6 characters');
  });

  test('returns 409 when email is already in use', async () => {
    await createUser({ email: 'dup@test.com' });
    const res = await request(app).post('/api/users').send({ name: 'B', email: 'dup@test.com', password: 'pass123' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already in use');
  });
});

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────

describe('PUT /api/users/:id', () => {
  test('returns 200 and the updated user', async () => {
    const user = await createUser();
    const res = await request(app).put(`/api/users/${user.id}`).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  test('returns 400 when no fields are provided', async () => {
    const user = await createUser();
    const res = await request(app).put(`/api/users/${user.id}`).send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for an invalid email format', async () => {
    const user = await createUser();
    const res = await request(app).put(`/api/users/${user.id}`).send({ email: 'bad-email' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid email format');
  });

  test('returns 400 when new password is too short', async () => {
    const user = await createUser();
    const res = await request(app).put(`/api/users/${user.id}`).send({ password: '123' });
    expect(res.status).toBe(400);
  });

  test('returns 409 when new email belongs to another user', async () => {
    const u1 = await createUser({ email: 'u1@test.com' });
    await createUser({ email: 'u2@test.com' });
    const res = await request(app).put(`/api/users/${u1.id}`).send({ email: 'u2@test.com' });
    expect(res.status).toBe(409);
  });

  test('returns 404 for a non-existent ID', async () => {
    const res = await request(app).put('/api/users/non-existent').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────

describe('DELETE /api/users/:id', () => {
  test('returns 401 when no token is provided', async () => {
    const user = await createUser();
    const res = await request(app).delete(`/api/users/${user.id}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 for an invalid token', async () => {
    const user = await createUser();
    const res = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('returns 200 and deletes the user with a valid token', async () => {
    const user = await createUser();
    const res = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${validToken(user.id)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User deleted successfully');
  });

  test('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .delete('/api/users/non-existent-id')
      .set('Authorization', `Bearer ${validToken()}`);
    expect(res.status).toBe(404);
  });

  test('user is no longer found after deletion', async () => {
    const user = await createUser();
    await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${validToken(user.id)}`);
    const check = await request(app).get(`/api/users/${user.id}`);
    expect(check.status).toBe(404);
  });
});
