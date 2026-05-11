/**
 * Mock for @scalar/express-api-reference.
 * The Scalar UI is ESM-only and cannot be loaded by Jest's CommonJS runtime.
 * In tests we replace it with a no-op middleware so app.js loads cleanly.
 */
const apiReference = () => (req, res, next) => next();

module.exports = { apiReference };
