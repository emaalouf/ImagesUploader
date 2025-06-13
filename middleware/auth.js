/**
 * API key authentication middleware
 */

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
  
  // Verify API key
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid API key' 
    });
  }
  
  // API key is valid, proceed
  next();
};

module.exports = apiKeyAuth; 