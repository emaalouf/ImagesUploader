const express = require('express');
const router = express.Router();
const ApiKey = require('../models/ApiKey');
const apiKeyAuth = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all routes except key creation
router.use((req, res, next) => {
  // Skip auth for the create-master endpoint
  if (req.path === '/create-master' && req.method === 'POST') {
    return next();
  }
  
  // Require auth for all other endpoints
  apiKeyAuth(req, res, next);
});

// Create a master API key (only for initial setup, protected by secret)
router.post('/create-master', (req, res) => {
  // Simple setup password protection
  const { setupSecret } = req.body;
  
  if (!setupSecret || setupSecret !== process.env.SETUP_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Invalid setup secret'
    });
  }
  
  try {
    // Generate a master API key with long expiration
    const masterKey = ApiKey.generate({
      name: 'Master API Key',
      expiresInDays: 365
    });
    
    // Return the key (the only time it will be fully visible)
    logger.info('Master API key created');
    
    return res.json({
      success: true,
      message: 'Master API key created',
      key: masterKey
    });
  } catch (error) {
    logger.error(`Failed to create master key: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to create master API key'
    });
  }
});

// Generate a new API key
router.post('/generate', (req, res) => {
  try {
    const { name, expiresInDays } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Key name is required'
      });
    }
    
    const newKey = ApiKey.generate({
      name,
      expiresInDays: expiresInDays || 90
    });
    
    logger.info(`New API key generated: ${newKey.id}`);
    
    // Return the newly generated key (only time it's fully visible)
    return res.json({
      success: true,
      message: 'API key generated successfully',
      key: newKey
    });
  } catch (error) {
    logger.error(`Error generating API key: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate API key'
    });
  }
});

// List all API keys (masked)
router.get('/', (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const keys = ApiKey.list(includeInactive);
    
    return res.json({
      success: true,
      count: keys.length,
      keys
    });
  } catch (error) {
    logger.error(`Error listing API keys: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to list API keys'
    });
  }
});

// Revoke an API key
router.delete('/:keyId', (req, res) => {
  try {
    const { keyId } = req.params;
    
    if (!keyId) {
      return res.status(400).json({
        success: false,
        message: 'Key ID is required'
      });
    }
    
    const result = ApiKey.revoke(keyId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }
    
    logger.info(`API key revoked: ${keyId}`);
    
    return res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error(`Error revoking API key: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke API key'
    });
  }
});

// Get expiring keys
router.get('/expiring', (req, res) => {
  try {
    const daysThreshold = parseInt(req.query.days || '7', 10);
    const expiringKeys = ApiKey.getExpiringKeys(daysThreshold);
    
    return res.json({
      success: true,
      count: expiringKeys.length,
      keys: expiringKeys
    });
  } catch (error) {
    logger.error(`Error getting expiring keys: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get expiring keys'
    });
  }
});

// Rotate an API key
router.post('/rotate/:keyId', (req, res) => {
  try {
    const { keyId } = req.params;
    const { expiresInDays } = req.body;
    
    if (!keyId) {
      return res.status(400).json({
        success: false,
        message: 'Key ID is required'
      });
    }
    
    const newKey = ApiKey.rotate(keyId, { expiresInDays });
    
    if (!newKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }
    
    logger.info(`API key rotated: ${keyId} -> ${newKey.id}`);
    
    return res.json({
      success: true,
      message: 'API key rotated successfully',
      key: newKey
    });
  } catch (error) {
    logger.error(`Error rotating API key: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to rotate API key'
    });
  }
});

module.exports = router; 