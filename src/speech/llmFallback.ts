// LLM Fallback for celestial object identification
// When the local fuzzy-match catalog fails, we ask an OpenAI chat model
// to identify the object and return structured data our app can use.

import { loadApiKey } from './apiKeyStorage';
import { getSelectedModel } from './openaiModels';
import {
  addLLMObjectToCatalog,
  type LLMCelestialObject,
} from './userCatalog';
import type { SearchableObject } from '../types/search';
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';
import {
  type ConversationSession,
  type ConversationMessage,
  addUserMessage,
  addAssistantMessage,
  getMessages,
  compactIfNeeded,
  sessionInfo,
} from './conversationSession';

// ============================================================================
// Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an astronomy expert assistant embedded in a smart-glasses sky-chart app.
The user will ask you to identify a celestial object by name or description, OR request objects from a category/list (e.g., "show me the planets", "list bright stars").
The user may also ask follow-up questions about previously discussed objects — use the conversation history to maintain context.

You MUST respond with ONLY a single valid JSON object — no markdown, no code fences, no explanation outside the JSON.

# SINGLE OBJECT MODE
If the user query clearly refers to ONE specific, well-known object (e.g., "find Jupiter", "where is Sirius", "show me Orion"):
Return a single object with these fields:
{
  "name": "string — the canonical common name of the object",
  "type": "string — one of: star, planet, deepsky, constellation",
  "ra": number — Right Ascension in decimal hours (0–24, epoch J2000),
  "dec": number — Declination in decimal degrees (-90 to +90, epoch J2000),
  "magnitude": number — apparent visual magnitude (use average if variable),
  "constellation": "string — IAU 3-letter abbreviation (e.g. Ori, UMa, Sgr)",
  "summary": "string — one-line summary, max 80 characters",
  "description": "string — 3 to 6 sentences describing the object, its physical properties, and observational tips",
  "distance": "string — distance from Earth as human-readable text (e.g. '640 light-years')",
  "season": "string — best season to observe from mid-northern latitudes (Spring, Summer, Autumn, Winter, or Year-round)",
  "funFact": "string — one interesting cultural or scientific fun fact"
}

# CANDIDATE LIST MODE
Return a candidates array when:
1. The query is genuinely ambiguous (e.g., "the bright one near Orion", "a red star in Sagittarius")
2. The user asks for a CATEGORY or LIST (e.g., "show me the planets", "list bright stars", "all constellations in Orion", "visible planets tonight")

Format:
{
  "candidates": [
    { ...same fields as above... },
    { ...same fields as above... }
  ]
}

For category/list queries, return 2–10 matching objects, ordered by relevance or brightness (most relevant first).
Keep each candidate concise but informative.

# RULES
- Use J2000 epoch coordinates for stars/deep-sky.
- For planets, use approximate current-epoch RA/Dec (Feb 2026 estimates) and note "coordinates approximate" in description.
- For constellations, use the centre of the constellation figure.
- Constellation magnitude should be 0.
- If you genuinely cannot identify ANY object, return: {"error": "not_found"}
- NEVER return anything other than a JSON object.
- NEVER include markdown, code fences, or explanation outside the JSON.`;

// ============================================================================
// Per-model token parameter preference (max_tokens vs max_completion_tokens)
// ============================================================================

// ============================================================================
// Per-model token parameter preference (max_tokens vs max_completion_tokens)
// ============================================================================

const TOKEN_PREF_STORAGE_KEY = 'even_stars_model_token_pref';

type TokenParamStyle = 'max_tokens' | 'max_completion_tokens';

/** Load the saved token-param preferences map from localStorage. */
function loadTokenPrefs(): Record<string, TokenParamStyle> {
  try {
    const raw = localStorage.getItem(TOKEN_PREF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save a model's preferred token parameter to localStorage. */
function saveTokenPref(model: string, style: TokenParamStyle): void {
  const prefs = loadTokenPrefs();
  prefs[model] = style;
  try {
    localStorage.setItem(TOKEN_PREF_STORAGE_KEY, JSON.stringify(prefs));
    console.log(`  💾 Saved token param pref for ${model}: ${style}`);
  } catch { /* quota exceeded — ignore */ }
}

/** Get the preferred token param for a model, defaulting to max_completion_tokens. */
function getTokenPref(model: string): TokenParamStyle {
  return loadTokenPrefs()[model] ?? 'max_completion_tokens';
}

// ============================================================================
// Per-model token limit preference (for reasoning models)
// ============================================================================

const TOKEN_LIMIT_PREF_STORAGE_KEY = 'even_stars_model_token_limit_pref';

/** Load the saved token limit preferences map from localStorage. */
function loadTokenLimitPrefs(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TOKEN_LIMIT_PREF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save a model's preferred token limit to localStorage. */
function saveTokenLimitPref(model: string, limit: number): void {
  const prefs = loadTokenLimitPrefs();
  prefs[model] = limit;
  try {
    localStorage.setItem(TOKEN_LIMIT_PREF_STORAGE_KEY, JSON.stringify(prefs));
    console.log(`  💾 Saved token limit pref for ${model}: ${limit}`);
  } catch { /* quota exceeded — ignore */ }
}

/** Get the preferred token limit for a model, defaulting to 4000. */
function getTokenLimitPref(model: string): number {
  return loadTokenLimitPrefs()[model] ?? 4000;
}

/** Build the request body, using the given token param style, temperature, and token limit. */
function buildRequestBody(
  model: string,
  messages: ConversationMessage[],
  tokenStyle: TokenParamStyle,
  temperature: number,
  tokenLimit: number = getTokenLimitPref(model),
): string {
  const body: Record<string, unknown> = {
    model,
    temperature,
    messages,
  };
  body[tokenStyle] = tokenLimit;
  return JSON.stringify(body);
}

/** Detect whether a 400 error is about the wrong token parameter. */
function isTokenParamError(status: number, responseText: string): TokenParamStyle | null {
  if (status !== 400) return null;
  if (responseText.includes("'max_tokens' is not supported") ||
      responseText.includes('"max_tokens" is not supported')) {
    return 'max_completion_tokens';
  }
  if (responseText.includes("'max_completion_tokens' is not supported") ||
      responseText.includes('"max_completion_tokens" is not supported')) {
    return 'max_tokens';
  }
  return null;
}

// ============================================================================
// Per-model temperature preference
// ============================================================================

const TEMP_PREF_STORAGE_KEY = 'even_stars_model_temp_pref';

/** Load the saved temperature preferences map from localStorage. */
function loadTempPrefs(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TEMP_PREF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save a model's preferred temperature to localStorage. */
function saveTempPref(model: string, temp: number): void {
  const prefs = loadTempPrefs();
  prefs[model] = temp;
  try {
    localStorage.setItem(TEMP_PREF_STORAGE_KEY, JSON.stringify(prefs));
    console.log(`  💾 Saved temperature pref for ${model}: ${temp}`);
  } catch { /* quota exceeded — ignore */ }
}

/** Get the preferred temperature for a model, defaulting to 0.2. */
function getTempPref(model: string): number {
  return loadTempPrefs()[model] ?? 0.2;
}

/** Detect whether a 400 error is about unsupported temperature. */
function isTempError(status: number, responseText: string): boolean {
  if (status !== 400) return false;
  return responseText.includes("'temperature'") && responseText.includes('does not support');
}

// ============================================================================
// Public API
// ============================================================================

export interface LLMFallbackResult {
  success: boolean;
  /** The searchable object that was added to the catalog (if success, single match) */
  object: SearchableObject | null;
  /** Multiple candidate objects when the query is ambiguous */
  candidates: SearchableObject[] | null;
  /** Error message (if !success) */
  error: string | null;
}

/** Expose the system prompt so callers can initialise a conversation session. */
export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Query the OpenAI chat API as a fallback when local matching fails.
 * On success the object is automatically persisted into the user catalog
 * and returned as a SearchableObject ready for use by the finder/renderer.
 *
 * When a `session` is provided the query is appended to the existing
 * conversation history, enabling multi-turn follow-ups.  The assistant's
 * response is also recorded in the session.
 *
 * Automatic context compaction is performed before each request when the
 * session's estimated token count exceeds the internal threshold.
 */
export async function llmFallbackSearch(
  query: string,
  bridge?: EvenAppBridge | null,
  session?: ConversationSession | null,
): Promise<LLMFallbackResult> {
  const apiKey = await loadApiKey(bridge);
  if (!apiKey) {
    console.warn('🤖 LLM search skipped: no OpenAI API key configured');
    return { success: false, object: null, candidates: null, error: 'No OpenAI API key configured' };
  }

  const model = getSelectedModel();
  const startTime = performance.now();
  console.log(`🤖 LLM fallback search initiated: query="${query.substring(0, 40)}${query.length > 40 ? '...' : ''}" model="${model}"`);

  // --- Session management ---
  // If a session is provided, append the user query and compact if needed.
  // Otherwise fall back to a single-shot messages array.
  if (session) {
    addUserMessage(session, query);
    compactIfNeeded(session);
    console.log(`  Session state: ${sessionInfo(session)}`);
  }

  /** Build the messages array to send to the API. */
  const apiMessages: ConversationMessage[] = session
    ? getMessages(session)
    : [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: query },
      ];

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // Try with the model's preferred token param style, temperature, and token limit
    let tokenStyle = getTokenPref(model);
    let temperature = getTempPref(model);
    let tokenLimit = getTokenLimitPref(model);
    let attemptCount = 1;
    console.log(`  [Attempt ${attemptCount}] temp=${temperature}, ${tokenStyle}=${tokenLimit}`);

    let requestTime = performance.now();
    let res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: buildRequestBody(model, apiMessages, tokenStyle, temperature, tokenLimit),
    });
    let elapsedMs = Math.round(performance.now() - requestTime);
    console.log(`  Response: ${res.status} (${elapsedMs}ms)`);

    // If we get a 400, check if it's about token param or temperature and retry
    if (!res.ok && res.status === 400) {
      const errText = await res.text();
      console.log(`  Error response: ${errText.substring(0, 120)}…`);

      // Try fixing token parameter error first
      const correctStyle = isTokenParamError(res.status, errText);
      if (correctStyle && correctStyle !== tokenStyle) {
        attemptCount++;
        console.log(`  [Attempt ${attemptCount}] Token param mismatch detected: switching to ${correctStyle}`);
        saveTokenPref(model, correctStyle);
        tokenStyle = correctStyle;
        requestTime = performance.now();
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers,
          body: buildRequestBody(model, apiMessages, tokenStyle, temperature, tokenLimit),
        });
        elapsedMs = Math.round(performance.now() - requestTime);
        console.log(`  Response: ${res.status} (${elapsedMs}ms)`);
      }

      // If still not ok, try fixing temperature error
      if (!res.ok && res.status === 400 && isTempError(res.status, errText)) {
        attemptCount++;
        console.log(`  [Attempt ${attemptCount}] Temperature not supported: switching to default temperature=1`);
        saveTempPref(model, 1);
        temperature = 1;
        requestTime = performance.now();
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers,
          body: buildRequestBody(model, apiMessages, tokenStyle, temperature, tokenLimit),
        });
        elapsedMs = Math.round(performance.now() - requestTime);
        console.log(`  Response: ${res.status} (${elapsedMs}ms)`);
      }
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ LLM API error ${res.status}:`, text.substring(0, 150));
      return { success: false, object: null, candidates: null, error: `API error ${res.status}` };
    }

    const json = await res.json() as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } };
    };

    console.log(`  Response structure: choices=${Array.isArray(json.choices) ? json.choices.length : 'missing'}`);
    const finishReason = json.choices?.[0]?.finish_reason;
    const usedTokens = json.usage?.completion_tokens ?? 0;
    const reasoningTokens = json.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    console.log(`    finish_reason="${finishReason}" | tokens=${usedTokens} (reasoning=${reasoningTokens})`);

    if (Array.isArray(json.choices) && json.choices.length > 0) {
      console.log(`    [0].message=${json.choices[0].message ? 'exists' : 'missing'}`);
      if (json.choices[0].message) {
        console.log(`    [0].message.content=(${typeof json.choices[0].message.content}) ${
          json.choices[0].message.content
            ? `"${String(json.choices[0].message.content).substring(0, 50)}..."`
            : 'null/undefined'
        }`);
      }
    }

    let raw = json.choices?.[0]?.message?.content?.trim();

    // Detect token limit exhaustion (reasoning models use all tokens for reasoning, producing empty content)
    if (!raw && finishReason === 'length' && tokenLimit <= 8000) {
      attemptCount++;
      const newTokenLimit = Math.ceil(tokenLimit * 2.5); // e.g. 4000 → 10000
      console.log(`  [Attempt ${attemptCount}] Content is empty because model hit token limit (finish_reason="length"). Trying with ${newTokenLimit} tokens…`);
      saveTokenLimitPref(model, newTokenLimit);
      tokenLimit = newTokenLimit;
      requestTime = performance.now();
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: buildRequestBody(model, apiMessages, tokenStyle, temperature, tokenLimit),
      });
      elapsedMs = Math.round(performance.now() - requestTime);
      console.log(`  Response: ${res.status} (${elapsedMs}ms)`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ LLM API error ${res.status}:`, text.substring(0, 150));
        return { success: false, object: null, candidates: null, error: `API error ${res.status}` };
      }
      // Re-fetch the response
      const jsonRetry = await res.json();
      const rawRetry = jsonRetry.choices?.[0]?.message?.content?.trim();
      if (!rawRetry) {
        console.warn(`❌ LLM still returned empty response after increasing tokens — full JSON:`, JSON.stringify(jsonRetry, null, 2));
        return { success: false, object: null, candidates: null, error: 'Empty response from LLM after retries' };
      }
      // Continue with the retry response
      raw = rawRetry;
    } else if (!raw) {
      console.warn(`❌ LLM returned empty response — full JSON:`, JSON.stringify(json, null, 2));
      return { success: false, object: null, candidates: null, error: 'Empty response from LLM' };
    }

    console.log(`  Raw LLM response (${raw.length} chars): ${raw.substring(0, 100)}…`);

    // Record the assistant's response in the session for multi-turn context
    if (session) {
      addAssistantMessage(session, raw);
    }

    // Parse the JSON — strip potential markdown fences just in case
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
      console.log(`  ✓ Valid JSON parsed`);
    } catch {
      console.error(`❌ LLM returned non-JSON:`, raw.substring(0, 150));
      return { success: false, object: null, candidates: null, error: 'Invalid JSON from LLM' };
    }

    // Check for error sentinel
    if (parsed.error === 'not_found') {
      console.log(`  ℹ LLM: object not recognized`);
      return { success: false, object: null, candidates: null, error: 'Object not recognized by AI' };
    }

    // ---- Multi-result (candidates array) ----
    if (Array.isArray(parsed.candidates) && parsed.candidates.length > 0) {
      console.log(`  📋 Candidates array detected (${parsed.candidates.length} items)`);
      const searchables: SearchableObject[] = [];
      for (const raw of parsed.candidates.slice(0, 10)) {
        const llmObj = validateAndClamp(raw as Record<string, unknown>);
        if (llmObj) {
          searchables.push(addLLMObjectToCatalog(llmObj));
        }
      }
      if (searchables.length === 0) {
        console.warn(`❌ All candidates failed validation`);
        return { success: false, object: null, candidates: null, error: 'LLM returned invalid candidates' };
      }
      if (searchables.length === 1) {
        // Only one valid candidate — treat as single match
        const totalMs = Math.round(performance.now() - startTime);
        console.log(`✅ LLM identified 1 object: ${searchables[0].name} (${totalMs}ms total)`);
        return { success: true, object: searchables[0], candidates: null, error: null };
      }
      const totalMs = Math.round(performance.now() - startTime);
      console.log(`✅ LLM returned ${searchables.length} candidates (${totalMs}ms total):`, searchables.map(s => s.name).join(', '));
      return { success: true, object: null, candidates: searchables, error: null };
    }

    // ---- Single result ----
    const llmObj = validateAndClamp(parsed);
    if (!llmObj) {
      console.warn(`❌ Single result failed validation`);
      return { success: false, object: null, candidates: null, error: 'LLM response missing required fields' };
    }

    // Persist to user catalog and return
    const searchable = addLLMObjectToCatalog(llmObj);
    const totalMs = Math.round(performance.now() - startTime);
    console.log(`✅ LLM identified object: ${llmObj.name} @ RA=${llmObj.ra}h Dec=${llmObj.dec}° (${totalMs}ms total)`);

    return { success: true, object: searchable, candidates: null, error: null };
  } catch (err) {
    console.error('❌ LLM fallback fetch error:', err);
    return { success: false, object: null, candidates: null, error: String(err) };
  }
}

// ============================================================================
// Validation helper
// ============================================================================

/**
 * Validate that a parsed object has all required fields and clamp coordinates.
 * Returns null if validation fails.
 */
function validateAndClamp(parsed: Record<string, unknown>): LLMCelestialObject | null {
  const required: (keyof LLMCelestialObject)[] = [
    'name', 'type', 'ra', 'dec', 'magnitude',
    'constellation', 'summary', 'description', 'distance', 'season', 'funFact',
  ];
  const missing: string[] = [];
  for (const key of required) {
    if (parsed[key] === undefined || parsed[key] === null) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.warn(`  ⚠ Validation failed — missing fields: ${missing.join(', ')}`);
    console.warn(`    Object received:`, parsed);
    return null;
  }

  const obj = parsed as unknown as LLMCelestialObject;
  obj.ra = Math.max(0, Math.min(24, Number(obj.ra)));
  obj.dec = Math.max(-90, Math.min(90, Number(obj.dec)));
  obj.magnitude = Number(obj.magnitude);
  return obj;
}
