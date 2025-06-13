const logger = require('../utils/logger');

/**
 * Middleware to log API requests
 */
const requestLogger = (req, res, next) => {
  // Original URL path
  const path = req.originalUrl || req.url;
  // Request method
  const method = req.method;
  // Client IP address
  const ip = req.ip || req.connection.remoteAddress;
  // Get API key (masked for security)
  const apiKey = req.header('x-api-key') ? 
    req.header('x-api-key').substring(0, 8) + '...' : 
    'none';
  
  // Log request
  logger.info(`[REQUEST] ${method} ${path} - IP: ${ip} - API Key: ${apiKey}`);

  // Track response time
  const startHrTime = process.hrtime();
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate response time
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;
    
    // Log response
    logger.info(
      `[RESPONSE] ${method} ${path} - Status: ${res.statusCode} - Duration: ${elapsedTimeInMs.toFixed(3)}ms`
    );
    
    // Call the original res.end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger; 