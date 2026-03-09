/**
 * Maddern's Place — Claude Chat Proxy (Cloudflare Worker)
 *
 * DEPLOYMENT STEPS:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file into the editor and click "Deploy"
 * 3. Go to Settings → Variables → Add variable:
 *      Name:  ANTHROPIC_API_KEY
 *      Value: your Anthropic API key (sk-ant-...)
 *      ✓ Encrypt
 * 4. Copy your Worker URL (e.g. https://madderns-chat.yourname.workers.dev)
 * 5. Paste that URL into Site Content Admin → Chat Settings → Worker URL
 *
 * COST: Cloudflare Workers free tier = 100,000 requests/day (more than enough)
 * Claude Haiku pricing: ~$0.001 per conversation (very cheap)
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { messages, system } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Missing messages', { status: 400 });
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: system || '',
          messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
