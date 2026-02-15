// Find Target Mode Manager
// Orchestrates the voice search flow: mic → speech-to-text → object matching → target lock

import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';
import type { FocusTarget } from '../types';
import {
  startListening,
  stopListening,
  feedAudio,
  resetTranscription,
  getSpeechState,
  hasApiKey,
  type SpeechToTextCallbacks,
} from './index';
import {
  FindTargetOverlayState,
  type FindTargetOverlayData,
} from './findTargetOverlay';
import { getAllSearchableObjects } from '../sky/searchCatalog';
import type { SearchableObject } from '../types/search';

// ============================================================================
// Types
// ============================================================================

export interface FindTargetModeState {
  /** Current overlay display data */
  overlay: FindTargetOverlayData;
  /** Whether the mode is active (user is in Find Target mode) */
  isActive: boolean;
  /** The matched search object (before converting to FocusTarget) */
  matchedObject: SearchableObject | null;
}

// ============================================================================
// State
// ============================================================================

let modeState: FindTargetModeState = createInitialModeState();
let onTargetFound: ((target: FocusTarget) => void) | null = null;

function createInitialModeState(): FindTargetModeState {
  return {
    overlay: {
      state: FindTargetOverlayState.Idle,
      transcription: '',
      matchedName: null,
      errorMessage: null,
    },
    isActive: false,
    matchedObject: null,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Activate Find Target mode.
 * Shows the overlay in idle state until user clicks to start voice search.
 */
export async function activateFindTargetMode(
  bridge: EvenAppBridge,
  targetFoundCallback: (target: FocusTarget) => void,
): Promise<void> {
  modeState = createInitialModeState();
  modeState.isActive = true;
  onTargetFound = targetFoundCallback;

  // Check if API key is available
  const hasKey = await hasApiKey(bridge);
  if (!hasKey) {
    modeState.overlay.state = FindTargetOverlayState.NoApiKey;
  }
}

/**
 * Deactivate Find Target mode.
 * Stops listening if active and clears state.
 */
export async function deactivateFindTargetMode(): Promise<void> {
  if (getSpeechState().isListening) {
    await stopListening();
  }
  modeState.isActive = false;
  modeState.overlay.state = FindTargetOverlayState.Idle;
  onTargetFound = null;
}

/**
 * Handle a ring click in Find Target mode.
 * - Idle → start listening
 * - Listening → stop and process
 * - Matched/NoMatch/Error → start new search
 */
export async function handleFindTargetClick(bridge: EvenAppBridge): Promise<void> {
  if (!modeState.isActive) return;

  const currentState = modeState.overlay.state;

  switch (currentState) {
    case FindTargetOverlayState.NoApiKey:
      // Check again in case user just set it
      const hasKey = await hasApiKey(bridge);
      if (hasKey) {
        modeState.overlay.state = FindTargetOverlayState.Idle;
      }
      break;

    case FindTargetOverlayState.Idle:
    case FindTargetOverlayState.Matched:
    case FindTargetOverlayState.NoMatch:
    case FindTargetOverlayState.Error:
      // Start a new voice search
      await startVoiceSearch(bridge);
      break;

    case FindTargetOverlayState.Listening:
      // Stop listening and process the result
      await finishListening();
      break;

    case FindTargetOverlayState.Processing:
      // Wait for processing to complete — ignore click
      break;
  }
}

/**
 * Handle a ring double-click in Find Target mode.
 * Cancels current operation and returns to idle.
 */
export async function handleFindTargetDoubleClick(): Promise<void> {
  if (!modeState.isActive) return;

  if (getSpeechState().isListening) {
    await stopListening();
  }
  resetTranscription();
  modeState.overlay = {
    state: FindTargetOverlayState.Idle,
    transcription: '',
    matchedName: null,
    errorMessage: null,
  };
  modeState.matchedObject = null;
}

/**
 * Feed audio data from the SDK event handler.
 */
export function handleAudioData(pcmData: Uint8Array): void {
  if (modeState.isActive && modeState.overlay.state === FindTargetOverlayState.Listening) {
    feedAudio(pcmData);
  }
}

/**
 * Get current overlay data for rendering.
 */
export function getFindTargetOverlay(): FindTargetOverlayData {
  // Sync transcription from speech state
  if (modeState.overlay.state === FindTargetOverlayState.Listening ||
      modeState.overlay.state === FindTargetOverlayState.Processing) {
    modeState.overlay.transcription = getSpeechState().transcription;
  }
  return modeState.overlay;
}

/**
 * Check if Find Target mode is currently active.
 */
export function isFindTargetActive(): boolean {
  return modeState.isActive;
}

// ============================================================================
// Internal helpers
// ============================================================================

async function startVoiceSearch(bridge: EvenAppBridge): Promise<void> {
  resetTranscription();
  modeState.overlay = {
    state: FindTargetOverlayState.Listening,
    transcription: '',
    matchedName: null,
    errorMessage: null,
  };
  modeState.matchedObject = null;

  const cbs: SpeechToTextCallbacks = {
    onTranscription: (text: string) => {
      modeState.overlay.transcription = text;
      // Try to match in real-time as text comes in
      tryMatchObject(text);
    },
    onError: (error: string) => {
      console.error('Speech error:', error);
      // Don't immediately show error — let the user keep talking
      // Only show error if we're not currently listening
      if (!getSpeechState().isListening) {
        modeState.overlay.state = FindTargetOverlayState.Error;
        modeState.overlay.errorMessage = error;
      }
    },
    onStateChange: (_isListening: boolean) => {
      // state changes handled elsewhere
    },
  };

  const started = await startListening(bridge, cbs);
  if (!started) {
    modeState.overlay.state = FindTargetOverlayState.Error;
    modeState.overlay.errorMessage = 'Could not start listening';
  }
}

async function finishListening(): Promise<void> {
  modeState.overlay.state = FindTargetOverlayState.Processing;
  
  const finalText = await stopListening();
  modeState.overlay.transcription = finalText;

  if (!finalText) {
    modeState.overlay.state = FindTargetOverlayState.Idle;
    return;
  }

  // Final match attempt
  const matched = matchObjectFromText(finalText);
  if (matched) {
    modeState.matchedObject = matched;
    modeState.overlay.state = FindTargetOverlayState.Matched;
    modeState.overlay.matchedName = matched.name;

    // Convert to FocusTarget and notify
    const target = searchObjectToFocusTarget(matched);
    onTargetFound?.(target);
  } else {
    modeState.overlay.state = FindTargetOverlayState.NoMatch;
  }
}

/**
 * Try to match an object from partial transcription text.
 * If matched, update overlay state immediately.
 */
function tryMatchObject(text: string): void {
  if (!text || modeState.overlay.state !== FindTargetOverlayState.Listening) return;

  const matched = matchObjectFromText(text);
  if (matched) {
    // Don't stop listening yet — let the user confirm with a click
    // But update the overlay to show what we found
    modeState.matchedObject = matched;
    modeState.overlay.matchedName = matched.name;
  }
}

/**
 * Fuzzy match transcription text against the catalog of celestial objects.
 */
function matchObjectFromText(text: string): SearchableObject | null {
  const normalizedInput = text.toLowerCase().trim();
  if (!normalizedInput) return null;

  const allObjects = getAllSearchableObjects();

  // 1. Exact name match
  const exact = allObjects.find(
    obj => obj.name.toLowerCase() === normalizedInput,
  );
  if (exact) return exact;

  // 2. Name contained in input (e.g., "find sirius" → matches "Sirius")
  const contained = allObjects.find(
    obj => normalizedInput.includes(obj.name.toLowerCase()),
  );
  if (contained) return contained;

  // 3. Input contained in name (e.g., "orion" → matches "Orion Nebula")
  const partial = allObjects.find(
    obj => obj.name.toLowerCase().includes(normalizedInput),
  );
  if (partial) return partial;

  // 4. Word-level matching: any word in input matches any word in object name
  const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 2);
  for (const obj of allObjects) {
    const nameWords = obj.name.toLowerCase().split(/\s+/);
    for (const iw of inputWords) {
      for (const nw of nameWords) {
        // Check if words are similar (case-insensitive, allowing minor differences)
        if (nw === iw || nw.startsWith(iw) || iw.startsWith(nw)) {
          return obj;
        }
        // Levenshtein-like: allow 1-2 character difference for words > 4 chars
        if (iw.length > 4 && nw.length > 4 && levenshteinDistance(iw, nw) <= 2) {
          return obj;
        }
      }
    }
  }

  // 5. Check info field and constellation field
  const infoMatch = allObjects.find(obj => {
    const info = (obj.info || '').toLowerCase();
    const constellation = (obj.constellation || '').toLowerCase();
    return normalizedInput.includes(info) || normalizedInput.includes(constellation) ||
           info.includes(normalizedInput) || constellation.includes(normalizedInput);
  });
  if (infoMatch) return infoMatch;

  return null;
}

/**
 * Simple Levenshtein distance for fuzzy matching.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Convert a SearchableObject to a FocusTarget for the compass renderer.
 */
function searchObjectToFocusTarget(obj: SearchableObject): FocusTarget {
  return {
    id: obj.id,
    name: obj.name,
    type: obj.type as 'star' | 'planet' | 'constellation' | 'deepsky',
    ra: obj.ra,
    dec: obj.dec,
    magnitude: obj.magnitude,
    info: obj.info,
  };
}
