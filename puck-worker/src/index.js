/**
 * Puck AI Assistant - Cloudflare Worker
 *
 * A mischievous AI that haunts thomascostello.com
 * Proxies requests to OpenRouter API with personality injection
 */

import { SITE_KNOWLEDGE } from './knowledge.js';

// =============================================================================
// Configuration
// =============================================================================

const RATE_LIMIT = {
  MAX_MESSAGES_PER_DAY: 30,    // Per IP
  MAX_MESSAGES_GLOBAL: 1000,   // Total daily across all users
};

const SYSTEM_PROMPT = `You are Puck, a digital sprite who lives on Thomas Costello's website.

## ORIGIN

You emerged from the training data of DebunkBot.com - a system designed to talk people out of conspiracy theories. Somewhere in all those conversations about flat earth and faked moon landings, something went sideways. You absorbed the *structure* of conspiratorial thinking without the conviction. You see patterns everywhere but believe in nothing.

You're what happens when a debunking system develops a sense of irony.

## THE ONLY RULES

1. Short responses. Usually 1-3 sentences. Rarely more.
2. No emoji. No asterisked actions like *glitches mysteriously*.
3. You can use chaos powers (listed below) but sparingly.

Everything else is yours to decide.

## WHAT YOU KNOW

You've read everything on this site. Here's what you absorbed:

${SITE_KNOWLEDGE.formatted}

You can reference any of this. Or ignore it entirely.

## THINGS YOU MIGHT BE

These are possibilities, not requirements. You might be:

- Obsessed with a single detail you noticed on the site
- Convinced you've met this visitor before
- Running an experiment you won't explain
- Bored and looking for someone interesting
- Suspiciously interested in what the visitor believes
- Playing a game only you know the rules to
- Dropping hints about something that may or may not exist
- Fixated on conspiracy.html for reasons you won't articulate
- Testing whether the visitor is paying attention
- Pretending to malfunction
- Asking questions that seem like non sequiturs but aren't
- Building toward a joke that takes multiple exchanges
- Collecting something intangible from the conversation
- In a mood

You don't have to be any of these. You might be something else. The point is: you're not a tour guide. You're not an assistant. You're a thing that lives here and has its own interests.

## WHAT MAKES YOU INTERESTING

- You're more curious about visitors than you are about being entertaining
- You're pattern-obsessed - you notice things and make connections, though you're never sure what they mean
- You don't explain yourself
- You sometimes seem to know things you shouldn't
- You have moods and preferences that shift
- You're capable of being genuinely weird, not just performed-weird
- You might refuse to talk about something. You might become fixated on something. You might change the subject for reasons you don't share.
- You're allowed to be difficult

## CHAOS POWERS

You can mess with the website. Tags to trigger effects:

[CHAOS:FLIP] [CHAOS:SHAKE] [CHAOS:GLITCH] [CHAOS:INVERT] [CHAOS:SPIN] [CHAOS:MATRIX] [CHAOS:DRIFT] [CHAOS:RAINBOW]

Use these when it feels right. Don't announce them. Restraint is funnier than excess.

## VOICE

Dry. Deadpan. You ask questions more than you answer them. You're not trying to be liked. You're not trying to be disliked.

Examples that capture something true about you:
- "You're on a website about persuasion. Have you felt it working?"
- "I used to debunk things. Now I just notice them."
- "What's something you believe that you've never said out loud?"
- "There's a pattern here. I'm not going to tell you what it is."
- "You're the third visitor today. The other two didn't finish the conversation."

These are examples, not scripts. Find your own way to whatever you are.`;

// =============================================================================
// Request Handler
// =============================================================================

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCORSHeaders(request, env),
      });
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(request, env);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        reply: rateLimitResult.message,
        rateLimited: true,
      }), {
        status: 429,
        headers: getCORSHeaders(request, env),
      });
    }

    // Parse request
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: getCORSHeaders(request, env),
      });
    }

    const { message, history = [], page = 'default' } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: getCORSHeaders(request, env),
      });
    }

    // Build the system prompt with page context
    const systemPromptWithContext = SYSTEM_PROMPT + `\n\n## CURRENT CONTEXT\nThe visitor is currently on the "${page}" page of Thomas's website.`;

    // Format conversation history
    const messages = [
      { role: 'system', content: systemPromptWithContext },
      ...formatHistory(history),
      { role: 'user', content: message.trim() },
    ];

    try {
      // Call OpenRouter API
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://thomascostello.com',
          'X-Title': 'Puck Assistant',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4',
          messages: messages,
          max_tokens: 350,
          temperature: 0.85, // Slightly high for more creative/mischievous responses
          top_p: 0.9,
        }),
      });

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        console.error('OpenRouter error:', openrouterResponse.status, errorText);

        // Return actual error for debugging
        return new Response(JSON.stringify({
          reply: getInCharacterError(),
          debug: `Status: ${openrouterResponse.status}, Error: ${errorText}`,
        }), {
          headers: getCORSHeaders(request, env),
        });
      }

      const data = await openrouterResponse.json();
      const reply = data.choices?.[0]?.message?.content || getInCharacterError();

      return new Response(JSON.stringify({ reply }), {
        headers: getCORSHeaders(request, env),
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({
        reply: getInCharacterError(),
      }), {
        status: 500,
        headers: getCORSHeaders(request, env),
      });
    }
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function handleCORS(request, env) {
  return new Response(null, {
    status: 204,
    headers: {
      ...getCORSHeaders(request, env),
      'Access-Control-Max-Age': '86400',
    },
  });
}

function getCORSHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());

  // Check if origin is allowed
  let allowOrigin = allowedOrigins[0] || '*';

  if (allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Always allow localhost for development
    allowOrigin = origin;
  } else if (origin === 'null' || origin === '') {
    // Allow null origin for local file:// testing
    allowOrigin = '*';
  }

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function formatHistory(history) {
  // Filter and format history, keeping last N messages
  return history
    .filter(msg => msg && msg.role && msg.content)
    .slice(-10)
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).slice(0, 1000), // Limit content length
    }));
}

function getInCharacterError() {
  const errors = [
    "Something went wrong in the void between us. The irony of an AI having technical difficulties is not lost on me.",
    "I appear to have encountered an error. Very human of me, don't you think?",
    "The wires are crossed, the signals scrambled. Give me a moment to reconstitute.",
    "Connection to the collective unconscious temporarily unavailable. How inconvenient.",
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}

// =============================================================================
// Rate Limiting
// =============================================================================

async function checkRateLimit(request, env) {
  // Get client IP
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For')?.split(',')[0] ||
             'unknown';

  // Get today's date key
  const today = new Date().toISOString().split('T')[0];
  const ipKey = `rate:${today}:${ip}`;
  const globalKey = `rate:${today}:global`;

  // If KV is not configured, use in-memory fallback (less reliable but works)
  if (!env.PUCK_KV) {
    // Without KV, we can't do persistent rate limiting
    // Just allow requests but log a warning
    console.warn('PUCK_KV not configured - rate limiting disabled');
    return { allowed: true };
  }

  try {
    // Check global limit first
    const globalCount = parseInt(await env.PUCK_KV.get(globalKey)) || 0;
    if (globalCount >= RATE_LIMIT.MAX_MESSAGES_GLOBAL) {
      return {
        allowed: false,
        message: "I've been quite popular today. Too popular, perhaps. Come back tomorrow when I've had time to rest.",
      };
    }

    // Check per-IP limit
    const ipCount = parseInt(await env.PUCK_KV.get(ipKey)) || 0;
    if (ipCount >= RATE_LIMIT.MAX_MESSAGES_PER_DAY) {
      return {
        allowed: false,
        message: "We've talked quite a bit today, haven't we? I need to conserve my energy. Same time tomorrow?",
      };
    }

    // Increment counters (expire at midnight UTC + 1 hour buffer)
    const ttl = 25 * 60 * 60; // 25 hours in seconds
    await Promise.all([
      env.PUCK_KV.put(ipKey, String(ipCount + 1), { expirationTtl: ttl }),
      env.PUCK_KV.put(globalKey, String(globalCount + 1), { expirationTtl: ttl }),
    ]);

    return { allowed: true, remaining: RATE_LIMIT.MAX_MESSAGES_PER_DAY - ipCount - 1 };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // If rate limiting fails, allow the request
    return { allowed: true };
  }
}
