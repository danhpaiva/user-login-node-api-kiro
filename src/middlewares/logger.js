const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Structured logger using pino.
 * - In development: pretty-printed, colorized output.
 * - In production: JSON output for log aggregators.
 * - In test: silent (no output noise during test runs).
 */
const logger = pino({
  level: isTest ? 'silent' : 'info',
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

/**
 * Express middleware that logs every request and its response.
 * Attaches logger instance to req.log for use inside controllers.
 */
function httpLogger(req, res, next) {
  const start = Date.now();

  req.log = logger.child({ requestId: req.id });

  res.on('finish', () => {
    req.log.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      },
      'request completed'
    );
  });

  next();
}

module.exports = { logger, httpLogger };
