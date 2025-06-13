const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const apiKeyAuth = require('../middleware/auth');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Apply API key authentication to all routes
router.use(apiKeyAuth);

// Helper function to upload to Cloudflare Images
async function uploadToCloudflare(filePath, fileName) {
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error('Cloudflare credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        ...formData.getHeaders()
      },
      data: formData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error.response?.data || error.message);
    throw error;
  }
}

// Route to upload a single image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    
    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    // Upload to Cloudflare Images
    const cloudflareResponse = await uploadToCloudflare(filePath, fileName);
    
    // Clean up local file after successful upload
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: cloudflareResponse.result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading image'
    });
  }
});

// Route to get information about an uploaded image
router.get('/:imageId', async (req, res) => {
  try {
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const imageId = req.params.imageId;
    
    const response = await axios({
      method: 'get',
      url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return res.status(200).json({
      success: true,
      data: response.data.result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.response?.data?.errors[0]?.message || 'Error retrieving image'
    });
  }
});

// Route to delete an image
router.delete('/:imageId', async (req, res) => {
  try {
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const imageId = req.params.imageId;
    
    await axios({
      method: 'delete',
      url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1/${imageId}`,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.response?.data?.errors[0]?.message || 'Error deleting image'
    });
  }
});

module.exports = router; 