# AI Detector Worker

Cloudflare Worker API for AI content detection using OpenRouter.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml and add your OPENROUTER_API_KEY

# Run locally
npm run dev

# Deploy
npm run deploy
```

## API Endpoints

### POST /api/detect

Detect if text is AI-generated.

**Request:**
```json
{
  "text": "string (required, 100-5000 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isAI": boolean,
    "confidence": number,
    "score": number,
    "analysis": "string"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```
