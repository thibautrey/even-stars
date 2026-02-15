// OpenAI Model Fetcher & Storage
// Fetches available chat models from the OpenAI API and persists the user's
// selection + cached model list in localStorage.

import { loadApiKey } from './apiKeyStorage';
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';

// ============================================================================
// Types
// ============================================================================

export interface OpenAIModel {
  id: string;
  owned_by: string;
}

// ============================================================================
// Storage keys
// ============================================================================

const MODELS_CACHE_KEY = 'openai_models_cache';
const SELECTED_MODEL_KEY = 'openai_selected_model';

/** Default fallback when no selection has been made yet */
const DEFAULT_MODEL = 'gpt-4o-mini';

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch chat/completion models from the OpenAI API.
 * Returns only models whose id contains "gpt" (chat-capable).
 * On success the list is persisted to localStorage for faster subsequent loads.
 */
export async function fetchModels(bridge?: EvenAppBridge | null): Promise<OpenAIModel[]> {
  const apiKey = await loadApiKey(bridge);
  if (!apiKey) return getCachedModels();

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn('OpenAI /v1/models responded with', res.status);
      return getCachedModels();
    }

    const json = await res.json() as { data: Array<{ id: string; owned_by: string }> };
    const chatModels: OpenAIModel[] = json.data
      .filter((m) => /gpt|o\d|claude/i.test(m.id))
      .map((m) => ({ id: m.id, owned_by: m.owned_by }))
      .sort((a, b) => a.id.localeCompare(b.id));

    // Persist cache
    try {
      localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(chatModels));
    } catch { /* quota exceeded — ignore */ }

    return chatModels;
  } catch (err) {
    console.warn('Failed to fetch OpenAI models:', err);
    return getCachedModels();
  }
}

/**
 * Return the cached model list (or an empty array).
 */
export function getCachedModels(): OpenAIModel[] {
  try {
    const raw = localStorage.getItem(MODELS_CACHE_KEY);
    if (raw) return JSON.parse(raw) as OpenAIModel[];
  } catch { /* corrupt data */ }
  return [];
}

/**
 * Save the user's selected model id.
 */
export function saveSelectedModel(modelId: string): void {
  try {
    localStorage.setItem(SELECTED_MODEL_KEY, modelId);
  } catch { /* ignore */ }
}

/**
 * Load the user's selected model id (falls back to DEFAULT_MODEL).
 */
export function getSelectedModel(): string {
  try {
    return localStorage.getItem(SELECTED_MODEL_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}
