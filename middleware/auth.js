/**
 * API key authentication middleware
 */
const ApiKey = require('../models/ApiKey');
const logger = require('../utils/logger');

const apiKeyAuth = (req, res, next) => {
  // Get API key from request header
  const apiKey = req.header('x-api-key');
  
  // Check if API key is present
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API key is required' 
    });
  }
  
  // Validate API key with our key management system
  if (!ApiKey.validate(apiKey)) {
    logger.warn(`Authentication failed with API key: ${apiKey.substring(0, 8)}...`);
    
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired API key' 
    });
  }
  
  // API key is valid, proceed
  next();
};

module.exports = apiKeyAuth; 