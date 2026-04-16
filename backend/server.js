require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import database initialization
const { initializeDatabase } = require('./config/database');

// Import routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://www.keyswithog.com',
    'https://keyswithog.com',
  ],
  credentials: true,
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve static files (admin dashboard, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Keys with OG Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// ── Error Handling ──
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requested: req.method + ' ' + req.path,
  });
});

// ── Server Startup ──
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Keys with OG Backend running on http://localhost:${PORT}`);
      console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin/dashboard?password=${process.env.ADMIN_PASSWORD}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
