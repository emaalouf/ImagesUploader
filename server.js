const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Custom middleware and utilities
const requestLogger = require('./middleware/request-logger');
const rateLimiter = require('./middleware/rate-limiter');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Add SETUP_SECRET if not in .env
if (!process.env.SETUP_SECRET) {
  process.env.SETUP_SECRET = 'changeme'; // Default, should be changed
  logger.warn('SETUP_SECRET not set in .env, using default');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Log all requests
app.use(rateLimiter);   // Apply rate limiting

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
app.use('/api/images', require('./routes/images'));
app.use('/api/keys', require('./routes/api-keys'));

// Serve a simple frontend for testing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 