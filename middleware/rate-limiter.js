const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiting middleware configuration
 * Limits the number of requests based on IP address
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the 'RateLimit-*' headers
  legacyHeaders: false, // Disable the 'X-RateLimit-*' headers
  
  // Handler for when a client reaches the rate limit
  handler: (req, res, next, options) => {
    const ip = req.ip || req.connection.remoteAddress;
    logger.warn(`Rate limit exceeded by IP: ${ip}`);
    
    // Respond with JSON indicating the limit was hit
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
    });
  },
  
  // Skip rate limiting for routes that don't need it (optional)
  // Uncomment if needed
  // skip: (req, res) => {
  //   return req.path === '/health'; // Skip rate limiting for health check endpoint
  // },
  
  // Use API key as identifier if available, otherwise IP
  keyGenerator: (req) => {
    return req.header('x-api-key') || req.ip;
  }
});

module.exports = rateLimiter; 