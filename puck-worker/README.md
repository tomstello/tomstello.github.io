# Puck API - Cloudflare Worker

The backend for Puck, the mischievous AI assistant on thomascostello.com.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Set Your API Key

Get an API key from [OpenRouter](https://openrouter.ai/keys), then:

```bash
wrangler secret put OPENROUTER_API_KEY
# Paste your API key when prompted
```

### 4. Deploy

```bash
# Development (local testing)
wrangler dev

# Production deployment
wrangler deploy
```

## Configuration

Edit `wrangler.toml` to:

- Set your `account_id` (find it in Cloudflare dashboard)
- Update `ALLOWED_ORIGINS` with your domain(s)
- Optionally configure custom routes

## After Deployment

1. Copy the Worker URL (e.g., `https://puck-api.your-subdomain.workers.dev`)
2. Update the `apiEndpoint` in `/js/puck.js` on your website
3. Test by opening your website and chatting with Puck

## Changing the Model

Edit `src/index.js` and change the `model` parameter:

```javascript
model: 'anthropic/claude-3.5-sonnet',  // Current
model: 'anthropic/claude-3-haiku',     // Faster, cheaper
model: 'openai/gpt-4-turbo',           // Alternative
```

See [OpenRouter Models](https://openrouter.ai/models) for options.

## Costs

With Claude 3.5 Sonnet via OpenRouter:
- ~$0.003 per conversation turn (varies by length)
- Cloudflare Workers free tier: 100,000 requests/day

## Troubleshooting

**CORS errors?**
- Check `ALLOWED_ORIGINS` includes your domain
- Ensure you're using HTTPS in production

**API errors?**
- Verify `OPENROUTER_API_KEY` is set: `wrangler secret list`
- Check OpenRouter dashboard for API status

**Puck not responding?**
- Check browser console for errors
- Verify the Worker URL in `puck.js` is correct
