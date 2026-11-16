# Puck API (Cloudflare Worker)

The chat half of Puck, the jester on thcostello.com. The page script (`/js/puck.js`) posts
visitor messages here; the worker adds Puck's prompt and the site facts and forwards the
conversation to OpenRouter.

- `src/index.js`: the persona prompt, request handling, rate limiting.
- `src/knowledge.js`: what Puck knows about Tom and the site. Hand-maintained; the CV is the
  source of truth. Update it (and `FACTS` at the top of `/js/puck.js`) whenever the CV changes.
- `wrangler.toml`: worker name, allowed origins, the KV namespace used for rate limits.

## Deploying

```bash
cd puck-worker
npx wrangler@4 deploy
```

If wrangler asks which Cloudflare account to use (there are two on this login), set
`CLOUDFLARE_ACCOUNT_ID` to the one that owns `puck-api` before deploying. wrangler 4 runs on
Node 20; newer majors want Node 22.

## The API key

The worker reads one secret, `OPENROUTER_API_KEY`. Create a key at
<https://openrouter.ai/keys>, then:

```bash
npx wrangler@4 secret put OPENROUTER_API_KEY
```

Setting a secret takes effect immediately; no redeploy needed. Give the key a monthly credit
limit on OpenRouter so a bad day cannot run up a bill.

**If Puck answers every message with "nothing came back" or similar**, the upstream call is
failing. Watch the log while sending him a message:

```bash
npx wrangler@4 tail puck-api
```

`OpenRouter error: 401 ... User not found` means the key was deleted or the OpenRouter account
is gone: make a new key and run `secret put` again. `402` means the account is out of credit.

## Model

`MODELS` at the top of `src/index.js` lists the primary model and its fallbacks, as OpenRouter
slugs (currently `anthropic/claude-fable-5.2`, falling back to `anthropic/claude-sonnet-5.5`).
Check <https://openrouter.ai/models?q=anthropic> for current slugs before changing it.

The persona prompt and facts come to roughly 5,400 tokens and are sent as a cacheable block, so
within a conversation every turn after the first reads them at the cached rate. At Fable 5.2
prices a first message costs about seven cents and each follow-up within five minutes about one
cent; the Sonnet fallback is roughly a quarter of that. To make Puck cheaper, put the Sonnet slug
first.

## Limits

30 messages per visitor per day and 1,000 per day overall, counted in the `PUCK_KV` namespace
(`RATE_LIMIT` in `src/index.js`). Replies are capped at 600 tokens and the last ten turns of
history are sent.

## Local testing

```bash
npx wrangler@4 dev
```

needs the key in `puck-worker/.dev.vars` (`OPENROUTER_API_KEY=...`, gitignored). The page script
only talks to the production URL, so point `apiEndpoint` in `/js/puck.js` at
`http://localhost:8787` while testing and put it back afterwards.
