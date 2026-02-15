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
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
      }),
    });

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
