const app = require('./app');
const { initDatabase } = require('./database/database');
const { runMigrations } = require('./database/migrations');
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
