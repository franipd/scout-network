// Browser-direct Anthropic API client for the BYOK pattern.
// The user's key is held in memory (optionally localStorage, opt-in) and is
// sent ONLY to api.anthropic.com — there is no backend in this app.
// CORS is enabled via Anthropic's explicit opt-in header for browser usage.

const API_URL = 'https://api.anthropic.com/v1/messages';
export const MODEL = 'claude-sonnet-4-6';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Make one Messages API call.
 * Returns { text, searchQueries, usage, latencyMs, stopReason }.
 * - text: all text blocks joined (search responses interleave tool blocks,
 *   so blocks are always filtered by type, never accessed by position).
 * - searchQueries: the actual web searches the model ran (server_tool_use blocks).
 */
export async function callClaude({
  apiKey,
  system,
  messages,
  useSearch = false,
  maxSearches = 3,
  maxTokens = 2500,
  signal,
}) {
  const started = performance.now();

  const body = { model: MODEL, max_tokens: maxTokens, messages };
  if (system) body.system = system;
  if (useSearch) {
    body.tools = [
      { type: 'web_search_20250305', name: 'web_search', max_uses: maxSearches },
    ];
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      'Network error reaching api.anthropic.com. Check your connection (or an ad-blocker may be interfering).',
      0,
    );
  }

  const latencyMs = Math.round(performance.now() - started);

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      /* keep the HTTP status message */
    }
    if (res.status === 401) {
      detail = 'Invalid API key — check it and try again. ' + detail;
    }
    throw new ApiError(detail, res.status);
  }

  const data = await res.json();
  const content = Array.isArray(data.content) ? data.content : [];

  const text = content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const searchQueries = content
    .filter((b) => b.type === 'server_tool_use' && b.name === 'web_search')
    .map((b) => b.input?.query)
    .filter(Boolean);

  return {
    text,
    searchQueries,
    usage: data.usage || {},
    latencyMs,
    stopReason: data.stop_reason,
  };
}

/**
 * Extract a JSON object from model output, tolerating markdown fences
 * and any stray prose before/after the object.
 */
export function parseAgentJson(text) {
  if (!text) throw new Error('Agent returned an empty response.');
  const cleaned = text.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Agent response contained no JSON object.');
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error('Agent response JSON could not be parsed.');
  }
}
