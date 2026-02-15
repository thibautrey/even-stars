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

// ============================================================================
// Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an astronomy expert assistant embedded in a smart-glasses sky-chart app.
The user will ask you to identify a celestial object by name or description.

You MUST respond with ONLY a single valid JSON object — no markdown, no code fences, no explanation outside the JSON.

If you can confidently identify exactly ONE object the user is referring to, return a single object with these fields:
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

If the query is AMBIGUOUS and could refer to multiple objects (2–10), return:
{
  "candidates": [
    { ...same fields as above... },
    { ...same fields as above... }
  ]
}
Return at most 10 candidates, ordered by relevance (most likely first).
Each candidate must have ALL the same fields listed above.

Rules:
- Use J2000 epoch coordinates.
- For planets, use approximate current-epoch RA/Dec (they move, so give a reasonable estimate for February 2026) and note that coordinates are approximate in the description.
- For constellations, use the centre of the constellation figure.
- magnitude for constellations should be 0.
- If the user query clearly refers to one well-known object, return a single object (NOT a candidates array).
- Only return candidates when the query is genuinely ambiguous (e.g. "the bright one near Orion", "a red star", "nebula in Sagittarius").
- If you genuinely cannot identify ANY astronomical object from the query, return: {"error": "not_found"}
- NEVER return anything other than a JSON object.`;

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
  } catch { /* quota exceeded — ignore */ }
  console.log(`💾 Saved token param preference for ${model}: ${style}`);
}

/** Get the preferred token param for a model, defaulting to max_completion_tokens. */
function getTokenPref(model: string): TokenParamStyle {
  return loadTokenPrefs()[model] ?? 'max_completion_tokens';
}

/** Build the request body, using the given token param style and temperature. */
function buildRequestBody(
  model: string,
  query: string,
  tokenStyle: TokenParamStyle,
  temperature: number,
): string {
  const body: Record<string, unknown> = {
    model,
    temperature,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: query },
    ],
  };
  body[tokenStyle] = 4000;
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
  } catch { /* quota exceeded — ignore */ }
  console.log(`💾 Saved temperature preference for ${model}: ${temp}`);
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

/**
 * Query the OpenAI chat API as a fallback when local matching fails.
 * On success the object is automatically persisted into the user catalog
 * and returned as a SearchableObject ready for use by the finder/renderer.
 */
export async function llmFallbackSearch(
  query: string,
  bridge?: EvenAppBridge | null,
): Promise<LLMFallbackResult> {
  const apiKey = await loadApiKey(bridge);
  if (!apiKey) {
    return { success: false, object: null, candidates: null, error: 'No OpenAI API key configured' };
  }

  const model = getSelectedModel();

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // Try with the model's preferred token param style and temperature
    let tokenStyle = getTokenPref(model);
    let temperature = getTempPref(model);
    let res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: buildRequestBody(model, query, tokenStyle, temperature),
    });

    // If we get a 400, check if it's about token param or temperature and retry
    if (!res.ok && res.status === 400) {
      const errText = await res.text();

      // Try fixing token parameter error
      const correctStyle = isTokenParamError(res.status, errText);
      if (correctStyle && correctStyle !== tokenStyle) {
        console.log(`🔄 Model ${model} requires ${correctStyle} — retrying…`);
        saveTokenPref(model, correctStyle);
        tokenStyle = correctStyle;
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers,
          body: buildRequestBody(model, query, tokenStyle, temperature),
        });
      }

      // If still not ok, try fixing temperature error
      if (!res.ok && res.status === 400 && isTempError(res.status, errText)) {
        console.log(`🔄 Model ${model} only supports default temperature — retrying with temperature=1…`);
        saveTempPref(model, 1);
        temperature = 1;
        res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers,
          body: buildRequestBody(model, query, tokenStyle, temperature),
        });
      } else if (!res.ok && res.status === 400) {
        // Still a 400 error — not token or temperature related
        const isTempIssue = isTempError(res.status, errText);
        if (isTempIssue) {
          console.log(`🔄 Model ${model} only supports default temperature — retrying with temperature=1…`);
          saveTempPref(model, 1);
          temperature = 1;
          res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers,
            body: buildRequestBody(model, query, tokenStyle, temperature),
          });
        }
      }
    }

    if (!res.ok) {
      const text = await res.text();
      console.error('OpenAI chat API error:', res.status, text);
      return { success: false, object: null, candidates: null, error: `API error ${res.status}` };
    }

    const json = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { success: false, object: null, candidates: null, error: 'Empty response from LLM' };
    }

    // Parse the JSON — strip potential markdown fences just in case
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('LLM returned non-JSON:', raw);
      return { success: false, object: null, candidates: null, error: 'Invalid JSON from LLM' };
    }

    // Check for error sentinel
    if (parsed.error === 'not_found') {
      return { success: false, object: null, candidates: null, error: 'Object not recognized by AI' };
    }

    // ---- Multi-result (candidates array) ----
    if (Array.isArray(parsed.candidates) && parsed.candidates.length > 0) {
      const searchables: SearchableObject[] = [];
      for (const raw of parsed.candidates.slice(0, 10)) {
        const llmObj = validateAndClamp(raw as Record<string, unknown>);
        if (llmObj) {
          searchables.push(addLLMObjectToCatalog(llmObj));
        }
      }
      if (searchables.length === 0) {
        return { success: false, object: null, candidates: null, error: 'LLM returned invalid candidates' };
      }
      if (searchables.length === 1) {
        // Only one valid candidate — treat as single match
        console.log('\u{1F916} LLM identified object:', searchables[0].name);
        return { success: true, object: searchables[0], candidates: null, error: null };
      }
      console.log(`\u{1F916} LLM returned ${searchables.length} candidates:`, searchables.map(s => s.name).join(', '));
      return { success: true, object: null, candidates: searchables, error: null };
    }

    // ---- Single result ----
    const llmObj = validateAndClamp(parsed);
    if (!llmObj) {
      return { success: false, object: null, candidates: null, error: 'LLM response missing required fields' };
    }

    // Persist to user catalog and return
    const searchable = addLLMObjectToCatalog(llmObj);
    console.log('\u{1F916} LLM identified object:', llmObj.name, `(RA ${llmObj.ra}h, Dec ${llmObj.dec}\u00B0)`);

    return { success: true, object: searchable, candidates: null, error: null };
  } catch (err) {
    console.error('LLM fallback fetch error:', err);
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
  for (const key of required) {
    if (parsed[key] === undefined || parsed[key] === null) {
      console.warn(`LLM object missing field "${key}":`, parsed);
      return null;
    }
  }

  const obj = parsed as unknown as LLMCelestialObject;
  obj.ra = Math.max(0, Math.min(24, Number(obj.ra)));
  obj.dec = Math.max(-90, Math.min(90, Number(obj.dec)));
  obj.magnitude = Number(obj.magnitude);
  return obj;
}
