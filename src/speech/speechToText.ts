// Speech-to-Text Module using OpenAI Whisper API
// Captures PCM audio from the glasses microphone and transcribes it via OpenAI

import { loadApiKey } from './apiKeyStorage';
import type { EvenAppBridge } from '@evenrealities/even_hub_sdk';

// ============================================================================
// Types
// ============================================================================

export interface SpeechToTextState {
  /** Whether the mic is currently open */
  isListening: boolean;
  /** Accumulated PCM audio buffer (16-bit LE, 16 kHz, mono) */
  audioBuffer: Uint8Array[];
  /** Total bytes accumulated */
  totalBytes: number;
  /** Current live transcription text */
  transcription: string;
  /** Whether a transcription request is in flight */
  isTranscribing: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Timestamp of last audio chunk received */
  lastAudioTime: number;
}

export interface SpeechToTextCallbacks {
  /** Called when transcription text updates */
  onTranscription: (text: string) => void;
  /** Called on error */
  onError: (error: string) => void;
  /** Called when listening state changes */
  onStateChange: (isListening: boolean) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** OpenAI Whisper API endpoint */
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * How often (ms) to send accumulated audio for transcription.
 * Shorter = more responsive but more API calls.
 */
const TRANSCRIPTION_INTERVAL_MS = 2000;

/** Silence timeout: if no audio for this long, send what we have */
const SILENCE_TIMEOUT_MS = 1500;

/** Minimum bytes before we attempt transcription */
const MIN_AUDIO_BYTES = 3200; // ~100ms of 16kHz 16-bit mono

/**
 * PCM audio spec from SDK:
 * - 16 kHz sample rate
 * - 16-bit samples (2 bytes per sample)
 * - Little-endian
 * - 40 bytes per frame (dtUs = 10000 µs)
 */
const SAMPLE_RATE = 16000;

// ============================================================================
// WAV encoding helper
// ============================================================================

/**
 * Wrap raw PCM data in a WAV header so the Whisper API can consume it.
 * PCM format: 16-bit signed LE, mono, 16 kHz
 */
function pcmToWav(pcmChunks: Uint8Array[]): Blob {
  // Calculate total PCM length
  let totalLength = 0;
  for (const chunk of pcmChunks) {
    totalLength += chunk.length;
  }

  // WAV header is 44 bytes
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalLength, true); // file size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);       // sub-chunk size
  view.setUint16(20, 1, true);        // PCM format
  view.setUint16(22, 1, true);        // mono
  view.setUint32(24, SAMPLE_RATE, true);  // sample rate
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate (16-bit mono)
  view.setUint16(32, 2, true);        // block align
  view.setUint16(34, 16, true);       // bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, totalLength, true);

  // Combine header + PCM data
  const parts: BlobPart[] = [header, ...pcmChunks.map(c => c.buffer as ArrayBuffer)];
  return new Blob(parts, { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ============================================================================
// Speech-to-Text Manager
// ============================================================================

let state: SpeechToTextState = createInitialState();
let callbacks: SpeechToTextCallbacks | null = null;
let transcriptionTimer: ReturnType<typeof setInterval> | null = null;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;
let bridgeRef: EvenAppBridge | null = null;

function createInitialState(): SpeechToTextState {
  return {
    isListening: false,
    audioBuffer: [],
    totalBytes: 0,
    transcription: '',
    isTranscribing: false,
    error: null,
    lastAudioTime: 0,
  };
}

/**
 * Start listening: opens the microphone and begins accumulating audio.
 */
export async function startListening(
  bridge: EvenAppBridge,
  cbs: SpeechToTextCallbacks,
): Promise<boolean> {
  // Check API key first
  const apiKey = await loadApiKey(bridge);
  if (!apiKey) {
    cbs.onError('No OpenAI API key configured. Set it in Settings.');
    return false;
  }

  bridgeRef = bridge;
  callbacks = cbs;
  state = createInitialState();
  state.isListening = true;

  callbacks.onStateChange(true);

  // Open the microphone
  try {
    const ok = await bridge.audioControl(true);
    if (!ok) {
      state.error = 'Failed to open microphone';
      callbacks.onError(state.error);
      state.isListening = false;
      callbacks.onStateChange(false);
      return false;
    }
    console.log('🎤 Microphone opened for speech-to-text');
  } catch (err) {
    state.error = `Mic error: ${err}`;
    callbacks.onError(state.error);
    state.isListening = false;
    callbacks.onStateChange(false);
    return false;
  }

  // Start periodic transcription
  transcriptionTimer = setInterval(() => {
    if (state.audioBuffer.length > 0 && state.totalBytes >= MIN_AUDIO_BYTES) {
      sendForTranscription();
    }
  }, TRANSCRIPTION_INTERVAL_MS);

  return true;
}

/**
 * Feed audio data from the SDK's audioEvent.
 * Call this from the onEvenHubEvent handler when event.audioEvent is present.
 */
export function feedAudio(pcmData: Uint8Array): void {
  if (!state.isListening) return;

  state.audioBuffer.push(new Uint8Array(pcmData)); // copy
  state.totalBytes += pcmData.length;
  state.lastAudioTime = Date.now();

  // Reset silence timer
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    if (state.audioBuffer.length > 0 && state.totalBytes >= MIN_AUDIO_BYTES) {
      sendForTranscription();
    }
  }, SILENCE_TIMEOUT_MS);
}

/**
 * Stop listening: closes the microphone and performs a final transcription.
 */
export async function stopListening(): Promise<string> {
  if (!state.isListening) return state.transcription;

  state.isListening = false;

  // Stop timers
  if (transcriptionTimer) {
    clearInterval(transcriptionTimer);
    transcriptionTimer = null;
  }
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  // Close microphone
  if (bridgeRef) {
    try {
      await bridgeRef.audioControl(false);
      console.log('🎤 Microphone closed');
    } catch (err) {
      console.warn('Error closing microphone:', err);
    }
  }

  // Final transcription of remaining audio
  if (state.audioBuffer.length > 0 && state.totalBytes >= MIN_AUDIO_BYTES) {
    await sendForTranscription();
  }

  callbacks?.onStateChange(false);
  return state.transcription;
}

/**
 * Get current state (read-only snapshot).
 */
export function getSpeechState(): Readonly<SpeechToTextState> {
  return { ...state };
}

/**
 * Send accumulated audio to OpenAI Whisper for transcription.
 */
async function sendForTranscription(): Promise<void> {
  if (state.isTranscribing) return; // avoid concurrent requests
  if (state.audioBuffer.length === 0) return;

  state.isTranscribing = true;

  // Take a snapshot of current buffer and reset
  const chunks = state.audioBuffer;
  state.audioBuffer = [];
  state.totalBytes = 0;

  try {
    const apiKey = await loadApiKey(bridgeRef);
    if (!apiKey) {
      state.error = 'No API key';
      callbacks?.onError(state.error);
      state.isTranscribing = false;
      return;
    }

    // Convert PCM to WAV
    const wavBlob = pcmToWav(chunks);

    // Build form data for Whisper API
    const formData = new FormData();
    formData.append('file', wavBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    // prompt helps with domain-specific corrections
    formData.append('prompt', 'Celestial objects, stars, constellations, planets: Sirius, Orion, Polaris, Vega, Betelgeuse, Andromeda, Pleiades, Jupiter, Saturn, Mars, Venus, Mercury, Arcturus, Rigel, Aldebaran, Cassiopeia, Cygnus, Scorpius, Leo, Sagittarius, Ursa Major, Crux, Deneb, Altair, Spica, Antares, Capella, Procyon, Canopus');

    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error ${response.status}: ${errorText}`);
    }

    const result = await response.json() as { text: string };
    const newText = result.text.trim();

    if (newText) {
      // Append to existing transcription (accumulative)
      if (state.transcription) {
        state.transcription += ' ' + newText;
      } else {
        state.transcription = newText;
      }
      state.error = null;
      callbacks?.onTranscription(state.transcription);
      console.log('🎤 Transcription:', newText);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Transcription error:', msg);
    state.error = msg;
    callbacks?.onError(msg);
  } finally {
    state.isTranscribing = false;
  }
}

/**
 * Reset the transcription text (for starting a new query).
 */
export function resetTranscription(): void {
  state.transcription = '';
  state.audioBuffer = [];
  state.totalBytes = 0;
  state.error = null;
}
