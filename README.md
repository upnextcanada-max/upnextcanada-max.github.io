# Video Screenshot Auto-Post Application

Automatically capture and post video screenshots to Instagram with OpenArt I2V integration.

## 🌟 Features

- **Video Processing**: Upload local video files (MP4, MOV, WebM, AVI) and automatically capture screenshots
- **Screenshot Capture**: Multiple capture methods including time intervals, manual selection, and key frames
- **Instagram Integration**: Auto-post screenshots to Instagram with customizable captions
- **OpenArt I2V Support**: Import and process videos generated from OpenArt I2V service
- **Post Queue**: Manage multiple screenshots before posting
- **Post History**: Track your posted content
- **Responsive UI**: Works on desktop and mobile devices

## 🚀 Quick Start

### Using the Application

1. **Access the App**: Visit [https://upnextcanada-max.github.io/app.html](https://upnextcanada-max.github.io/app.html)

2. **Upload a Video**:
   - Click the upload zone or drag & drop a video file
   - Supported formats: MP4, MOV, WebM, AVI

3. **Capture Screenshots**:
   - Configure capture settings (number of screenshots, method)
   - Click "Capture Screenshots"
   - Select the screenshots you want to post

4. **Add to Queue**:
   - Select screenshots by clicking on them
   - Add video title and caption
   - Click "Add Selected to Post Queue"

5. **Post to Instagram**:
   - Configure Instagram API settings (see below)
   - Click "Post All to Instagram"

## ⚙️ Configuration

### Instagram API Setup

Since Instagram's API has restrictions, this application requires a backend service to handle posting. You have two options:

#### Option 1: Serverless Backend (Recommended)

Deploy a serverless function to handle Instagram posting:

**Using Vercel Functions:**

1. Create a new Vercel project
2. Create `/api/instagram.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, caption, userId } = req.body;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: image, // Note: image must be publicly accessible URL
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerResponse.json();
    
    if (!containerData.id) {
      throw new Error('Failed to create media container');
    }

    // Step 2: Publish the container
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

    res.status(200).json({ success: true, data: publishData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

3. Deploy to Vercel: `vercel deploy`
4. Use the deployed URL in the app settings

**Using Netlify Functions:**

1. Create `netlify/functions/instagram.js`:

```javascript
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { image, caption, userId } = JSON.parse(event.body);
  const accessToken = event.headers.authorization?.replace('Bearer ', '');

  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: image,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerResponse.json();

    // Step 2: Publish
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

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: publishData })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

2. Deploy to Netlify
3. Use the function URL in app settings

#### Option 2: Local Backend Server

For local development or self-hosting:

1. Create a simple Node.js server:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/instagram', async (req, res) => {
  const { image, caption, userId } = req.body;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    // Upload image to your server or cloud storage first
    // Instagram requires a publicly accessible image URL
    
    // Then post to Instagram
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl, // Publicly accessible URL
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerResponse.json();

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

    res.json({ success: true, data: publishData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

2. Install dependencies: `npm install express cors node-fetch`
3. Run: `node server.js`
4. Use `http://localhost:3000/api/instagram` in app settings

### Getting Instagram Credentials

1. **Create a Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Instagram Basic Display or Instagram Graph API product

2. **Get Access Token**:
   - Follow [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started) setup
   - Or use [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/getting-started) for business accounts
   - Generate a long-lived access token

3. **Get User ID**:
   - Use Graph API Explorer: `https://graph.facebook.com/v18.0/me?fields=id&access_token=YOUR_TOKEN`
   - Or find it in your Instagram Business account settings

4. **Configure in App**:
   - Click "Settings & Configuration" in the app
   - Enter your backend endpoint URL
   - Enter your Instagram access token
   - Enter your Instagram user ID
   - Click "Save Settings"

### OpenArt I2V Integration

To use OpenArt I2V features:

1. **Get API Key**:
   - Sign up at [OpenArt.ai](https://openart.ai/)
   - Navigate to API settings
   - Generate an API key

2. **Configure in App**:
   - Open Settings & Configuration
   - Enter your OpenArt API key
   - Save settings

3. **Import Videos**:
   - Enter OpenArt video URL or generation ID
   - Click "Import from OpenArt"
   - The video will be loaded for screenshot processing

## 📖 Usage Guide

### Capture Methods

1. **Time Intervals**: Automatically captures screenshots at evenly spaced intervals
   - Recommended for general use
   - Configure number of screenshots (1-20)

2. **Manual Selection**: Pause video at desired moments and capture manually
   - Best for precise screenshot timing
   - Provides full control over screenshot selection

3. **Key Frames** (Coming Soon): Automatically detects scene changes and important moments
   - Ideal for dynamic videos
   - Uses computer vision to identify key frames

### Screenshot Selection

- Click on screenshots to select/deselect them
- Selected screenshots show a green border and checkmark
- You can select multiple screenshots to add to queue at once

### Queue Management

- Review all screenshots before posting
- Remove unwanted items from queue
- Posts are processed in order
- Track status: pending, processing, posted, or error

### Post History

- View your 5 most recent posts
- See when each post was published
- Review posted content

## 🔐 Security & Privacy

- **Local Storage**: Settings are stored in browser's localStorage
- **No Data Collection**: This app doesn't collect or store any user data on servers
- **API Keys**: Keep your API keys secure and never share them
- **HTTPS**: Always use HTTPS for backend endpoints
- **Access Tokens**: Use environment variables for tokens in production backends

## 🛠️ Development

### File Structure

```
.
├── index.html          # Main landing page
├── app.html           # Video screenshot application
└── README.md          # This file
```

### Customization

You can customize the app by editing `app.html`:

1. **Colors**: Modify CSS variables in `:root`
2. **Layout**: Adjust grid layouts and spacing
3. **Features**: Add/remove functionality in JavaScript section
4. **Styling**: Customize components to match your brand

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- HTML5 video and canvas support required

## 🐛 Troubleshooting

### Video Won't Load
- Check video format (MP4, WebM are most compatible)
- Try a different browser
- Ensure file isn't corrupted

### Screenshots Not Capturing
- Wait for video to fully load
- Check browser console for errors
- Try reducing number of screenshots

### Instagram Posting Fails
- Verify backend endpoint is correct and accessible
- Check access token is valid (they expire)
- Ensure user ID is correct
- Check backend server logs for errors
- Verify image URL is publicly accessible (for Instagram API)

### Settings Not Saving
- Check browser localStorage is enabled
- Try clearing cache and re-entering settings
- Check browser console for errors

## 📝 Important Notes

### Instagram API Limitations

- Instagram requires images to be hosted at publicly accessible URLs
- You cannot post base64 data directly to Instagram
- Consider using cloud storage (AWS S3, Cloudinary, etc.) to host images temporarily
- Instagram has rate limits on posting
- Business/Creator accounts required for Graph API

### Data URL to Public URL

The app currently generates screenshots as data URLs. For Instagram posting to work, you need to:

1. Convert data URL to blob
2. Upload blob to cloud storage
3. Get public URL
4. Use that URL for Instagram API

Example backend modification:

```javascript
// In your backend function
const { image, caption, userId } = req.body;

// Convert base64 to buffer
const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');

// Upload to S3/Cloudinary/etc and get public URL
const publicUrl = await uploadToCloudStorage(buffer);

// Use publicUrl for Instagram API
```

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🔗 Links

- **Live App**: [https://upnextcanada-max.github.io/app.html](https://upnextcanada-max.github.io/app.html)
- **Instagram API Docs**: [https://developers.facebook.com/docs/instagram-api](https://developers.facebook.com/docs/instagram-api)
- **OpenArt AI**: [https://openart.ai/](https://openart.ai/)

## 💡 Tips

1. **Optimize Screenshots**: Use higher quality settings for better Instagram posts
2. **Batch Processing**: Queue multiple screenshots and post them together
3. **Captions**: Use relevant hashtags and engaging captions
4. **Timing**: Schedule posts during peak engagement hours
5. **Testing**: Test with a few posts before bulk posting

## 🆘 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for content creators**
