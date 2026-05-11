process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cache } = require('../../src/cache/cache');
const { setupTestDatabase, clearDatabase } = require('../helpers/setupDatabase');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(() => {
  clearDatabase();
  cache.flushAll();
});

function validToken() {
  return jwt.sign({ id: 'any', email: 'test@test.com' }, 'test_secret', { expiresIn: '1h' });
}

async function createUser(overrides = {}) {
  const res = await request(app).post('/api/users').send({
    name: 'Alice',
    email: 'alice@test.com',
    password: 'pass123',
    ...overrides,
  });
  return res.body.data;
}

describe('Cache — GET /api/users', () => {
  test('primeira requisição retorna fromCache: false', async () => {
    await createUser();
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.fromCache).toBe(false);
  });

  test('segunda requisição retorna fromCache: true', async () => {
    await createUser();
    await request(app).get('/api/users');
    const res = await request(app).get('/api/users');
    expect(res.body.fromCache).toBe(true);
  });

  test('cache é invalidado após criar um novo usuário', async () => {
    await createUser();
    await request(app).get('/api/users'); // popula cache

    await createUser({ email: 'bob@test.com' }); // invalida

    const res = await request(app).get('/api/users');
    expect(res.body.fromCache).toBe(false);
    expect(res.body.total).toBe(2);
  });
});

describe('Cache — GET /api/users/:id', () => {
  test('primeira requisição retorna fromCache: false', async () => {
    const user = await createUser();
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.body.fromCache).toBe(false);
  });

  test('segunda requisição retorna fromCache: true', async () => {
    const user = await createUser();
    await request(app).get(`/api/users/${user.id}`);
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.body.fromCache).toBe(true);
  });

  test('cache é invalidado após atualizar o usuário', async () => {
    const user = await createUser();
    await request(app).get(`/api/users/${user.id}`); // popula cache

    await request(app)
      .put(`/api/users/${user.id}`)
      .send({ name: 'Alice Updated' }); // invalida

    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.body.fromCache).toBe(false);
    expect(res.body.data.name).toBe('Alice Updated');
  });

  test('cache é invalidado após deletar o usuário', async () => {
    const user = await createUser();
    await request(app).get(`/api/users/${user.id}`); // popula cache

    await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${validToken()}`); // invalida

    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(404); // não está mais no cache nem no banco
  });
});
