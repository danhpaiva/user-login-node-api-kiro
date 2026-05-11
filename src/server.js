// Validate env vars before anything else — exits if invalid
require('./config/env');

const app = require('./app');
const { initDatabase } = require('./database/database');
const { runMigrations } = require('./database/migrations');
const { logger } = require('./middlewares/logger');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  // Ensure data directory exists
  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database (async — loads WASM binary)
  await initDatabase();

  // Run migrations
  runMigrations();

  // Start server
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📄 API Documentation: http://localhost:${PORT}/docs`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  logger.error(err, '❌ Failed to start server');
  process.exit(1);
});
