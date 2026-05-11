const app = require('./app');
const { runMigrations } = require('./database/migrations');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Run database migrations
runMigrations();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
