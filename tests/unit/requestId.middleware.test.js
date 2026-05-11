process.env.NODE_ENV = 'test';

const { requestId } = require('../../src/middlewares/requestId');

function buildMocks(incomingId) {
  const req = { headers: {} };
  if (incomingId) req.headers['x-request-id'] = incomingId;

  const headers = {};
  const res = {
    setHeader(key, val) { headers[key] = val; },
    _headers: headers,
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('requestId middleware', () => {
  test('generates a UUID and attaches it to req.id', () => {
    const { req, res, next } = buildMocks();
    requestId(req, res, next);
    expect(req.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('sets X-Request-Id response header', () => {
    const { req, res, next } = buildMocks();
    requestId(req, res, next);
    expect(res._headers['X-Request-Id']).toBe(req.id);
  });

  test('reuses incoming X-Request-Id when present', () => {
    const { req, res, next } = buildMocks('my-trace-id-123');
    requestId(req, res, next);
    expect(req.id).toBe('my-trace-id-123');
    expect(res._headers['X-Request-Id']).toBe('my-trace-id-123');
  });

  test('calls next()', () => {
    const { req, res, next } = buildMocks();
    requestId(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
