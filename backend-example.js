// Example Backend Function for Instagram Posting
// This can be deployed to Vercel, Netlify, or run locally

// For Vercel (save as /api/instagram.js):
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, caption, userId } = req.body;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');

    if (!accessToken || !userId) {
      return res.status(401).json({ error: 'Missing credentials' });
    }

    // Step 1: Upload image to cloud storage (e.g., Cloudinary, AWS S3)
    // This is required because Instagram needs a publicly accessible URL
    const imageUrl = await uploadImageToCloud(image);

    // Step 2: Create Instagram media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(containerData.error.message);
    }

    // Step 3: Publish the media container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken
        })
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(publishData.error.message);
    }

    return res.status(200).json({
      success: true,
      data: publishData,
      message: 'Posted to Instagram successfully'
    });

  } catch (error) {
    console.error('Instagram posting error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to post to Instagram'
    });
  }
}

// Helper function to upload image to cloud storage
async function uploadImageToCloud(base64Image) {
  // Example using Cloudinary with signed upload (recommended for production)
  // You'll need to set up a Cloudinary account and get API credentials
  
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

  // Generate signature for secure upload
  const timestamp = Math.round(new Date().getTime() / 1000);
  const crypto = require('crypto');
  const signature = crypto
    .createHash('sha256')
    .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('timestamp', timestamp);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  const data = await response.json();
  return data.secure_url;
}

// Alternative: For Express.js local server
// Uncomment below for local development

/*
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/instagram', async (req, res) => {
  // Use the handler logic above
  await handler(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
*/

// For Netlify Functions (save as /netlify/functions/instagram.js):
/*
exports.handler = async (event, context) => {
  // Parse request
  const { image, caption, userId } = JSON.parse(event.body);
  const accessToken = event.headers.authorization?.replace('Bearer ', '');

  try {
    // Same logic as above
    // ...
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, data: publishData })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
*/
