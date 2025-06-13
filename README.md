# Cloudflare Images Uploader API

A Node.js API for uploading, retrieving, and deleting images using Cloudflare Images.

## Features

- Upload images to Cloudflare Images
- Retrieve image information
- Delete images from your Cloudflare Images account
- Simple web interface for testing uploads

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Cloudflare account with Images enabled
- Cloudflare API token with Images permissions

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables by creating a `.env` file:
   ```
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   PORT=3000 # Optional, defaults to 3000
   ```

## How to Get Cloudflare Credentials

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to "Images" under "R2"
3. If not already enabled, follow the instructions to enable Cloudflare Images
4. Your Account ID can be found in the URL or in the top right corner of the dashboard
5. To create an API token:
   - Go to "My Profile" > "API Tokens"
   - Click "Create Token"
   - Use the "Edit Cloudflare Images" template or create a custom token with Images permissions
   - Copy the generated token to your `.env` file

## Running the Application

For development:
```
npm run dev
```

For production:
```
npm start
```

The server will run at http://localhost:3000 by default.

## API Endpoints

### Upload an Image
```
POST /api/images/upload
```
- Form data parameter: `image` (file)
- Returns: JSON with uploaded image information

### Get Image Details
```
GET /api/images/:imageId
```
- Returns: JSON with image details

### Delete an Image
```
DELETE /api/images/:imageId
```
- Returns: Success message

## Web Interface

The application includes a simple web interface for testing image uploads:
- Access at: http://localhost:3000
- Select an image to upload
- View response data after upload

## Error Handling

The API provides meaningful error messages for:
- Missing images
- File size limits (10MB max)
- Non-image file types
- Authentication issues
- Other API errors

## License

ISC 