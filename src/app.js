const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { apiReference } = require('@scalar/express-api-reference');

const routes = require('./routes');
const openApiSpec = require('./docs/openapi');
const { requestId } = require('./middlewares/requestId');
const { httpLogger, logger } = require('./middlewares/logger');
const env = require('./config/env');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request ID + structured logging ──────────────────────────────────────────
app.use(requestId);
app.use(httpLogger);

// ── General rate limiter ──────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Stricter limiter for login (brute-force protection) ───────────────────────
const loginLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// ── Scalar API Documentation ──────────────────────────────────────────────────
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

app.use(
  '/docs',
  apiReference({
    spec: { url: '/openapi.json' },
    theme: 'purple',
    layout: 'modern',
    defaultHttpClient: { targetKey: 'javascript', clientKey: 'fetch' },
  })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

module.exports = app;
