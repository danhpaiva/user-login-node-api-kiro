process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
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

async function createUsers(count) {
  for (let i = 0; i < count; i++) {
    await request(app).post('/api/users').send({
      name: `User ${i}`,
      email: `user${i}@test.com`,
      password: 'pass123',
    });
  }
}

describe('GET /api/users — pagination', () => {
  test('returns default page=1 limit=20 metadata', async () => {
    await createUsers(5);
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.data).toHaveLength(5);
  });

  test('respects custom page and limit query params', async () => {
    await createUsers(10);
    const res = await request(app).get('/api/users?page=2&limit=3');
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(3);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(10);
    expect(res.body.totalPages).toBe(4);
  });

  test('returns empty data array on out-of-range page', async () => {
    await createUsers(3);
    const res = await request(app).get('/api/users?page=99&limit=10');
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(3);
  });

  test('caps limit at 100', async () => {
    const res = await request(app).get('/api/users?limit=999');
    expect(res.body.limit).toBe(100);
  });
});
