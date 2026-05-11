process.env.NODE_ENV = 'test';

const { createUserSchema, updateUserSchema } = require('../../src/schemas/userSchemas');

describe('createUserSchema', () => {
  test('accepts valid data', () => {
    const result = createUserSchema.safeParse({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  test('trims name whitespace', () => {
    const result = createUserSchema.safeParse({ name: '  Alice  ', email: 'a@test.com', password: 'pass123' });
    expect(result.data.name).toBe('Alice');
  });

  test('lowercases email', () => {
    const result = createUserSchema.safeParse({ name: 'Alice', email: 'ALICE@TEST.COM', password: 'pass123' });
    expect(result.data.email).toBe('alice@test.com');
  });

  test('rejects missing name', () => {
    const result = createUserSchema.safeParse({ email: 'a@test.com', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid email', () => {
    const result = createUserSchema.safeParse({ name: 'A', email: 'not-email', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  test('rejects password shorter than 6 chars', () => {
    const result = createUserSchema.safeParse({ name: 'A', email: 'a@test.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  test('accepts partial data — name only', () => {
    const result = updateUserSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
  });

  test('accepts partial data — email only', () => {
    const result = updateUserSchema.safeParse({ email: 'new@test.com' });
    expect(result.success).toBe(true);
  });

  test('accepts partial data — password only', () => {
    const result = updateUserSchema.safeParse({ password: 'newpass123' });
    expect(result.success).toBe(true);
  });

  test('rejects empty object', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects invalid email', () => {
    const result = updateUserSchema.safeParse({ email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  test('rejects password shorter than 6 chars', () => {
    const result = updateUserSchema.safeParse({ password: '123' });
    expect(result.success).toBe(false);
  });
});
