const { cleanEnv, str, port, num } = require('envalid');

/**
 * Validates and exposes all environment variables.
 * The process exits immediately if any required variable is missing or invalid.
 */
const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  JWT_SECRET: str({
    default: 'dev_secret_change_in_production',
    docs: 'Must be a strong random string in production',
  }),
  JWT_EXPIRES_IN: str({ default: '1d' }),
  CACHE_TTL: num({ default: 60 }),
  RATE_LIMIT_WINDOW_MS: num({ default: 60_000 }),       // 1 minute
  RATE_LIMIT_MAX: num({ default: 100 }),                 // general limit
  RATE_LIMIT_LOGIN_MAX: num({ default: 10 }),            // stricter for login
  CORS_ORIGIN: str({ default: '*' }),
});

module.exports = env;
