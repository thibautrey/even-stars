// OpenAI API Key Storage Module
// Stores and retrieves the OpenAI API key using the SDK's local storage
// Falls back to localStorage when the SDK bridge is not available

import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';

const STORAGE_KEY = 'openai_api_key';

/**
 * Save the OpenAI API key using the SDK bridge (persisted on the app side).
 * Falls back to browser localStorage if no bridge is available.
 */
export async function saveApiKey(key: string, bridge?: EvenAppBridge | null): Promise<boolean> {
  // Always mirror to browser localStorage for web-view access
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage not available (e.g. private mode)
  }

  if (bridge) {
    try {
      return await bridge.setLocalStorage(STORAGE_KEY, key);
    } catch (err) {
      console.warn('Failed to save API key via SDK storage:', err);
    }
  }
  return true; // saved to localStorage at least
}

/**
 * Load the OpenAI API key.
 * Tries SDK storage first, then browser localStorage.
 */
export async function loadApiKey(bridge?: EvenAppBridge | null): Promise<string> {
  // Try SDK storage first
  if (bridge) {
    try {
      const value = await bridge.getLocalStorage(STORAGE_KEY);
      if (value) return value;
    } catch (err) {
      console.warn('Failed to load API key via SDK storage:', err);
    }
  }

  // Fall back to browser localStorage
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Check whether an API key is configured.
 */
export async function hasApiKey(bridge?: EvenAppBridge | null): Promise<boolean> {
  const key = await loadApiKey(bridge);
  return key.length > 0;
}
