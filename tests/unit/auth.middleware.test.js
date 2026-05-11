process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middlewares/auth');

/**
 * Builds a minimal mock for Express req/res/next.
 */
function buildMocks(authHeader) {
  const req = { headers: {} };
  if (authHeader !== undefined) req.headers['authorization'] = authHeader;

  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };

  const next = jest.fn();
  return { req, res, next };
}

describe('authenticate middleware', () => {
  const validToken = jwt.sign({ id: 'user-1', email: 'a@a.com' }, 'test_secret', { expiresIn: '1h' });

  test('calls next() and sets req.user when token is valid', () => {
    const { req, res, next } = buildMocks(`Bearer ${validToken}`);
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 'user-1', email: 'a@a.com' });
  });

  test('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = buildMocks(undefined);
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.success).toBe(false);
  });

  test('returns 401 when Authorization header does not start with Bearer', () => {
    const { req, res, next } = buildMocks('Basic sometoken');
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  test('returns 401 with "Invalid token" for a malformed token', () => {
    const { req, res, next } = buildMocks('Bearer not.a.valid.token');
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.message).toBe('Invalid token');
  });

  test('returns 401 with "Token expired" for an expired token', () => {
    const expiredToken = jwt.sign({ id: 'user-1' }, 'test_secret', { expiresIn: -1 });
    const { req, res, next } = buildMocks(`Bearer ${expiredToken}`);
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.message).toBe('Token expired');
  });

  test('returns 401 when token is signed with a different secret', () => {
    const wrongToken = jwt.sign({ id: 'user-1' }, 'wrong_secret');
    const { req, res, next } = buildMocks(`Bearer ${wrongToken}`);
    authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.message).toBe('Invalid token');
  });
});
