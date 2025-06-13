const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const moment = require('moment');
const logger = require('../utils/logger');

// File to store API keys
const API_KEYS_FILE = path.join(__dirname, '../data/api-keys.json');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize API keys file if it doesn't exist
if (!fs.existsSync(API_KEYS_FILE)) {
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify({
    keys: []
  }, null, 2));
}

/**
 * API Key Management Class
 */
class ApiKey {
  /**
   * Load all API keys
   */
  static loadKeys() {
    try {
      const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
      return JSON.parse(data).keys || [];
    } catch (error) {
      logger.error(`Failed to load API keys: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Save API keys to file
   */
  static saveKeys(keys) {
    try {
      fs.writeFileSync(API_KEYS_FILE, JSON.stringify({ keys }, null, 2));
      return true;
    } catch (error) {
      logger.error(`Failed to save API keys: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate a new API key
   * @param {Object} options - Options for key generation
   * @param {string} options.name - Name/description of the key
   * @param {number} options.expiresInDays - Days until key expires (default: 90)
   * @returns {Object} The generated key object
   */
  static generate(options = {}) {
    const { name = 'API Key', expiresInDays = 90 } = options;
    
    // Generate a secure random key
    const apiKey = crypto.randomBytes(36).toString('hex');
    
    // Create key object
    const keyObject = {
      id: uuidv4(),
      key: apiKey,
      name,
      createdAt: new Date().toISOString(),
      expiresAt: moment().add(expiresInDays, 'days').toISOString(),
      lastUsed: null,
      isActive: true
    };
    
    // Load existing keys
    const keys = this.loadKeys();
    
    // Add new key
    keys.push(keyObject);
    
    // Save keys
    this.saveKeys(keys);
    
    return keyObject;
  }
  
  /**
   * Validate an API key
   * @param {string} apiKey - The API key to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validate(apiKey) {
    if (!apiKey) return false;
    
    // Load keys
    const keys = this.loadKeys();
    
    // Find matching key
    const keyObj = keys.find(k => k.key === apiKey);
    
    // If key doesn't exist or is inactive
    if (!keyObj || !keyObj.isActive) {
      return false;
    }
    
    // Check if expired
    if (moment(keyObj.expiresAt).isBefore(moment())) {
      // Key is expired, update its status
      keyObj.isActive = false;
      this.saveKeys(keys);
      logger.warn(`API key expired: ${keyObj.id}`);
      return false;
    }
    
    // Update last used timestamp
    keyObj.lastUsed = new Date().toISOString();
    this.saveKeys(keys);
    
    return true;
  }
  
  /**
   * Revoke an API key
   * @param {string} keyId - The ID of the key to revoke
   * @returns {boolean} True if revoked successfully, false otherwise
   */
  static revoke(keyId) {
    const keys = this.loadKeys();
    const keyIndex = keys.findIndex(k => k.id === keyId);
    
    if (keyIndex === -1) {
      return false;
    }
    
    keys[keyIndex].isActive = false;
    return this.saveKeys(keys);
  }
  
  /**
   * List all API keys (excluding the actual key value for security)
   * @param {boolean} includeInactive - Whether to include inactive keys
   * @returns {Array} List of API keys (without the key value)
   */
  static list(includeInactive = false) {
    const keys = this.loadKeys();
    
    return keys
      .filter(k => includeInactive || k.isActive)
      .map(k => ({
        id: k.id,
        name: k.name,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        lastUsed: k.lastUsed,
        isActive: k.isActive,
        // Mask the actual key
        key: k.key ? `${k.key.substring(0, 8)}...` : null
      }));
  }
  
  /**
   * Count keys closing to expiration
   * @param {number} daysThreshold - Days threshold (default: 7)
   * @returns {Array} List of keys closing to expiration
   */
  static getExpiringKeys(daysThreshold = 7) {
    const keys = this.loadKeys();
    const thresholdDate = moment().add(daysThreshold, 'days');
    
    return keys.filter(k => {
      const expiresAt = moment(k.expiresAt);
      return k.isActive && 
             expiresAt.isAfter(moment()) && 
             expiresAt.isBefore(thresholdDate);
    });
  }
  
  /**
   * Rotate an API key
   * @param {string} keyId - ID of the key to rotate
   * @param {Object} options - Options for the new key
   * @returns {Object} The new key object
   */
  static rotate(keyId, options = {}) {
    // Find the existing key
    const keys = this.loadKeys();
    const existingKey = keys.find(k => k.id === keyId);
    
    if (!existingKey) {
      return null;
    }
    
    // Create new key with similar options
    const newKeyOptions = {
      name: `${existingKey.name} (Rotated)`,
      expiresInDays: options.expiresInDays || 90
    };
    
    // Generate new key
    const newKey = this.generate(newKeyOptions);
    
    // Revoke the old key
    existingKey.isActive = false;
    this.saveKeys(keys);
    
    return newKey;
  }
}

// Initialize with environment variable API key if specified
if (process.env.API_KEY) {
  setTimeout(() => {
    const keys = ApiKey.loadKeys();
    const envKeyExists = keys.some(k => k.key === process.env.API_KEY);
    
    if (!envKeyExists) {
      logger.info('Adding environment API key to the managed keys');
      ApiKey.saveKeys([...keys, {
        id: uuidv4(),
        key: process.env.API_KEY,
        name: 'Environment API Key',
        createdAt: new Date().toISOString(),
        expiresAt: moment().add(365, 'days').toISOString(),
        lastUsed: null,
        isActive: true
      }]);
    }
  }, 1000);
}

module.exports = ApiKey; 