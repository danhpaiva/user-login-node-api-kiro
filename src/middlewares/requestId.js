const { v4: uuidv4 } = require('uuid');

/**
 * Assigns a unique request ID to every incoming request.
 * - Reads X-Request-Id from the incoming header if present (useful for tracing across services).
 * - Otherwise generates a new UUID v4.
 * - Attaches the ID to req.id and echoes it back in the X-Request-Id response header.
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = { requestId };
