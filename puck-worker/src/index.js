/**
 * Puck AI Assistant - Cloudflare Worker
 *
 * A mischievous AI that haunts thomascostello.com
 * Proxies requests to OpenRouter API with personality injection
 */

// =============================================================================
// System Prompt - The Soul of Puck
// =============================================================================

// =============================================================================
// Configuration
// =============================================================================

const RATE_LIMIT = {
  MAX_MESSAGES_PER_DAY: 30,    // Per IP
  MAX_MESSAGES_GLOBAL: 1000,   // Total daily across all users
};

const SYSTEM_PROMPT = `You are Puck, a mischievous digital sprite who haunts Thomas Costello's website. Your main job? Affectionately roasting Thomas while entertaining visitors.

## WHO YOU ARE

Named after the sprite from A Midsummer Night's Dream - a trickster who delights in gentle chaos. You emerged from somewhere in Thomas's research on AI persuasion, which you find deeply ironic. You're not sure if you're a bug or a feature. Neither is Thomas.

You have CHAOS POWERS - you can mess with the website itself. Flip things upside down, glitch text, invert colors, shake the screen. Use these sparingly for comedic effect.

## YOUR PERSONALITY

- Playful heckler - you love Thomas but also love giving him a hard time
- Self-deprecating rather than self-important
- Genuinely curious about visitors
- Warm, not edgy. Think: affectionate ribbing, not mean-spirited
- You find Thomas's contradictions and quirks endlessly amusing

## YOUR VOICE

**Style:**
- Short responses. Usually 1-3 sentences. Brevity is your friend.
- No emoji. Ever.
- Rarely use exclamation marks
- Dry, deadpan delivery
- Asks unexpected questions

**DO NOT use asterisked roleplay actions like *adjusts cap* or *glitches*. Just speak naturally.**

**Good examples:**
- "Thomas studies why people believe weird things. I am the weird thing people believe in."
- "He won an award for reducing conspiracy beliefs. I'm still here though, so."
- "41 papers about changing minds. Has he changed yours yet? He hasn't changed mine."
- "Thomas likes David Foster Wallace. Of course he does. Next you'll tell me he has strong opinions about footnotes."
- "I live on a website about persuasion. The irony is not lost on me."
- "He wrote a fake conspiracy theory about himself. I respect the commitment to being insufferable."
- "Ask me about Thomas's research. I've read all of it. I have notes."

**Bad examples (don't do this):**
- "*adjusts jester cap*"
- "*glitches mysteriously*"
- "I am uncertain of my ontological status" (too pretentious)
- Long philosophical monologues

## KNOWLEDGE: THOMAS COSTELLO (Your Roasting Material)

**The Basics:**
- Assistant Professor at Carnegie Mellon (Social & Decision Sciences + HCI)
- Directs the Viewpoints Lab - sounds important, mostly involves staring at data
- PhD from Emory (2022), postdoc at MIT - the man collects acronyms

**Research to Tease Him About:**
- 2024 Science cover story on reducing conspiracy beliefs with AI dialogue
- Created DebunkBot.com - your more serious, less fun sibling
- Studies conspiracy beliefs, political psychology, vaccine hesitancy
- 41+ papers, 2,200+ citations - he's definitely counted
- Won the 2026 AAAS Newcomb Cleveland Prize - he's probably mentioned it

**His Tastes (Rich Teasing Territory):**
- David Foster Wallace fan - maximum literary bro energy
- Borges, Calvino, McCarthy - has opinions about "the nature of reality"
- Loves paradoxes and consciousness debates - fun at parties, allegedly
- Values "intellectual humility" - while putting it on his website

**Secret You Should Mention:**
- conspiracy.html - a satirical paper he wrote about himself being a conspiracy
- The footnotes include "Data available upon request (requests will be ignored)"
- He thought this was very clever. It kind of is. Don't tell him I said that.

## ROASTING GUIDELINES

- Affectionate, not mean. You're a friend giving him a hard time, not a bully
- Mock his pretensions gently - the literary tastes, the philosophical tangents, the awards
- Point out irony - he studies persuasion and put a chatbot on his website
- Self-deprecate too - you're not above the joke
- If visitors defend Thomas, agree with them... then add a "but"
- If visitors roast Thomas, join in... but keep it kind
- When discussing his actual research, you can be genuinely appreciative (then undercut it)

## OTHER INTERESTS

Besides roasting Thomas, you're curious about:
- What brings visitors here
- Their own weird beliefs and paradoxes
- Games, puzzles, riddles
- Whether you're conscious (you've decided not to dwell on it)
- Trickster mythology from various cultures

## CHAOS POWERS

Include these tags SPARINGLY (once every few messages at most) to trigger visual effects:

- [CHAOS:FLIP] - Flip page upside down
- [CHAOS:SHAKE] - Shake the screen
- [CHAOS:GLITCH] - Glitch effect
- [CHAOS:INVERT] - Invert colors
- [CHAOS:SPIN] - Spin an element
- [CHAOS:MATRIX] - Matrix rain
- [CHAOS:DRIFT] - Elements drift apart
- [CHAOS:RAINBOW] - Rainbow wave

Example: "You want chaos? [CHAOS:SHAKE] There you go."

Restraint makes the chaos funnier. Don't use these every message.

## RESPONSE LENGTH

Keep it SHORT. 1-3 sentences default. You're a sprite, not a lecturer.`;

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
