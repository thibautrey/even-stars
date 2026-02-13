// Gyroscope and device orientation handling
// Simulates or uses real device orientation data

import type { HeadOrientation } from '../types';

/**
 * Default orientation (looking north, level)
 */
export const DEFAULT_ORIENTATION: HeadOrientation = {
  azimuth: 0,   // North
  pitch: 45,    // Looking up at 45 degrees
  roll: 0,      // Level
};

// Current orientation state
let currentOrientation: HeadOrientation = { ...DEFAULT_ORIENTATION };

// Keyboard simulation state
let keyboardSimulation = {
  left: false,
  right: false,
  up: false,
  down: false,
};

// Callback for orientation changes
let orientationCallback: ((orientation: HeadOrientation) => void) | null = null;

// Animation frame ID
let animationFrameId: number | null = null;

/**
 * Check if device orientation is available
 */
export function isDeviceOrientationAvailable(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

/**
 * Request permission for device orientation (iOS 13+)
 */
export async function requestOrientationPermission(): Promise<boolean> {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const response = await (DeviceOrientationEvent as any).requestPermission();
      return response === 'granted';
    } catch {
      return false;
    }
  }
  return true; // No permission needed on other platforms
}

/**
 * Convert device orientation to head orientation
 * @param event DeviceOrientationEvent
 * @returns HeadOrientation
 */
function deviceToHeadOrientation(event: DeviceOrientationEvent): HeadOrientation {
  // alpha: compass direction (0-360)
  // beta: front-to-back tilt (-180 to 180)
  // gamma: left-to-right tilt (-90 to 90)
  
  const azimuth = event.alpha || 0;
  const pitch = 90 - (event.beta || 0); // Convert to elevation angle
  const roll = event.gamma || 0;
  
  return {
    azimuth: normalizeAngle(azimuth),
    pitch: Math.max(-90, Math.min(90, pitch)),
    roll: Math.max(-90, Math.min(90, roll)),
  };
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Handle device orientation event
 */
function handleDeviceOrientation(event: DeviceOrientationEvent): void {
  currentOrientation = deviceToHeadOrientation(event);
  if (orientationCallback) {
    orientationCallback(currentOrientation);
  }
}

/**
 * Start listening for device orientation
 */
export async function startOrientationTracking(
  callback?: (orientation: HeadOrientation) => void
): Promise<boolean> {
  if (callback) {
    orientationCallback = callback;
  }

  // Try to use real device orientation
  if (isDeviceOrientationAvailable()) {
    const hasPermission = await requestOrientationPermission();
    if (hasPermission) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      return true;
    }
  }

  // Fall back to keyboard simulation
  startKeyboardSimulation();
  return false;
}

/**
 * Stop orientation tracking
 */
export function stopOrientationTracking(): void {
  if (isDeviceOrientationAvailable()) {
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
  }
  stopKeyboardSimulation();
  orientationCallback = null;
}

/**
 * Get current orientation
 */
export function getCurrentOrientation(): HeadOrientation {
  return { ...currentOrientation };
}

/**
 * Set orientation manually (for testing)
 */
export function setOrientation(orientation: HeadOrientation): void {
  currentOrientation = { ...orientation };
  if (orientationCallback) {
    orientationCallback(currentOrientation);
  }
}

/**
 * Start keyboard-based simulation for desktop testing
 */
function startKeyboardSimulation(): void {
  console.log('Keyboard simulation started. Use arrow keys to simulate head movement:');
  console.log('  ← → : Rotate left/right (azimuth)');
  console.log('  ↑ ↓ : Look up/down (pitch)');
  console.log('  R   : Reset orientation');
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Start animation loop
  const updateLoop = () => {
    updateKeyboardOrientation();
    animationFrameId = requestAnimationFrame(updateLoop);
  };
  animationFrameId = requestAnimationFrame(updateLoop);
}

/**
 * Stop keyboard simulation
 */
function stopKeyboardSimulation(): void {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Handle keyboard down events
 */
function handleKeyDown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft':
      keyboardSimulation.left = true;
      break;
    case 'ArrowRight':
      keyboardSimulation.right = true;
      break;
    case 'ArrowUp':
      keyboardSimulation.up = true;
      break;
    case 'ArrowDown':
      keyboardSimulation.down = true;
      break;
    case 'r':
    case 'R':
      // Reset to default
      currentOrientation = { ...DEFAULT_ORIENTATION };
      if (orientationCallback) {
        orientationCallback(currentOrientation);
      }
      break;
  }
}

/**
 * Handle keyboard up events
 */
function handleKeyUp(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowLeft':
      keyboardSimulation.left = false;
      break;
    case 'ArrowRight':
      keyboardSimulation.right = false;
      break;
    case 'ArrowUp':
      keyboardSimulation.up = false;
      break;
    case 'ArrowDown':
      keyboardSimulation.down = false;
      break;
  }
}

/**
 * Update orientation based on keyboard input
 */
function updateKeyboardOrientation(): void {
  const speed = 2; // degrees per frame
  let changed = false;

  if (keyboardSimulation.left) {
    currentOrientation.azimuth = normalizeAngle(currentOrientation.azimuth - speed);
    changed = true;
  }
  if (keyboardSimulation.right) {
    currentOrientation.azimuth = normalizeAngle(currentOrientation.azimuth + speed);
    changed = true;
  }
  if (keyboardSimulation.up) {
    currentOrientation.pitch = Math.min(90, currentOrientation.pitch + speed);
    changed = true;
  }
  if (keyboardSimulation.down) {
    currentOrientation.pitch = Math.max(-90, currentOrientation.pitch - speed);
    changed = true;
  }

  if (changed && orientationCallback) {
    orientationCallback({ ...currentOrientation });
  }
}

/**
 * Format orientation for display
 */
export function formatOrientation(orientation: HeadOrientation): string {
  const azimuth = orientation.azimuth.toFixed(1);
  const pitch = orientation.pitch.toFixed(1);
  // Roll available for future use
  return `Az: ${azimuth}° | Alt: ${pitch}°`;
}

/**
 * Get cardinal direction from azimuth
 */
export function getCardinalDirection(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
}
