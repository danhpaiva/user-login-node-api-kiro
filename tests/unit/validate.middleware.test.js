process.env.NODE_ENV = 'test';

const { z } = require('zod');
const { validate } = require('../../src/middlewares/validate');

function buildMocks(body) {
  const req = { body };
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

describe('validate middleware', () => {
  test('calls next() when body is valid', () => {
    const { req, res, next } = buildMocks({ name: 'Alice', email: 'alice@test.com' });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('replaces req.body with parsed data', () => {
    const { req, res, next } = buildMocks({ name: '  Alice  ', email: 'ALICE@TEST.COM' });
    const schemaWithTransform = z.object({
      name: z.string().trim(),
      email: z.string().email().toLowerCase(),
    });
    validate(schemaWithTransform)(req, res, next);
    expect(req.body.name).toBe('Alice');
    expect(req.body.email).toBe('alice@test.com');
  });

  test('returns 400 when required field is missing', () => {
    const { req, res, next } = buildMocks({ email: 'alice@test.com' });
    validate(schema)(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
    expect(res._body.errors.name).toBeDefined();
  });

  test('returns 400 for invalid email format', () => {
    const { req, res, next } = buildMocks({ name: 'Alice', email: 'not-an-email' });
    validate(schema)(req, res, next);
    expect(res._status).toBe(400);
    expect(res._body.errors.email).toBeDefined();
  });

  test('returns all field errors at once', () => {
    const { req, res, next } = buildMocks({});
    validate(schema)(req, res, next);
    expect(res._status).toBe(400);
    expect(Object.keys(res._body.errors).length).toBeGreaterThanOrEqual(2);
  });
});
