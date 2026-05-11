process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const app = require('../../src/app');
const { setupTestDatabase, clearDatabase } = require('../helpers/setupDatabase');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(() => {
  clearDatabase();
});

async function createUser(data = {}) {
  await request(app).post('/api/users').send({
    name: 'John Doe',
    email: 'john@test.com',
    password: 'secret123',
    ...data,
  });
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('returns 200 with a token on valid credentials', async () => {
    await createUser();
    const res = await request(app).post('/api/auth/login').send({
      email: 'john@test.com',
      password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  test('returns user info (without password) alongside the token', async () => {
    await createUser();
    const res = await request(app).post('/api/auth/login').send({
      email: 'john@test.com',
      password: 'secret123',
    });
    expect(res.body.user).toMatchObject({ name: 'John Doe', email: 'john@test.com' });
    expect(res.body.user.password).toBeUndefined();
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'john@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 for a non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'secret123',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('returns 401 for a wrong password', async () => {
    await createUser();
    const res = await request(app).post('/api/auth/login').send({
      email: 'john@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('returned token can be used to authenticate the DELETE endpoint', async () => {
    await createUser();
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'john@test.com',
      password: 'secret123',
    });
    const { token, user } = loginRes.body;

    const deleteRes = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });
});
