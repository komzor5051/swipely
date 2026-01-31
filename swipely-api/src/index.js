require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const carouselRoutes = require('./routes/carousel');
const usageRoutes = require('./routes/usage');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://swipely.ai',
    'http://localhost:3000',
    'http://localhost:5173',
    // Telegram WebApp domains
    'https://web.telegram.org',
    'https://t.me'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/usage', usageRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Swipely API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
