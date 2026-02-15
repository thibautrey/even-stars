// Identify Mode Logic for Even Stars
// Manages the state machine for object identification

import type {
  HeadOrientation,
  GeoLocation,
  IdentifiedObject,
  CompassState,
} from '../types';
import { AppMode } from '../types';
import {
  findNearestObject,
  formatIdentificationText,
  isConfidentIdentification,
  type DetectionOptions,
  DEFAULT_DETECTION_OPTIONS,
} from './detector';

/**
 * State of the identification process
 */
export enum IdentifyState {
  /** Initial state, no identification attempted */
  Idle = 'idle',
  /** Scanning for objects */
  Scanning = 'scanning',
  /** Object identified with confidence */
  Identified = 'identified',
  /** Lost lock on previously identified object */
  Lost = 'lost',
}

/**
 * Configuration for Identify mode behavior
 */
export interface IdentifyModeConfig {
  /** Detection options for filtering candidates */
  detectionOptions: DetectionOptions;
  /** Confidence threshold to transition from scanning to identified */
  confidenceThreshold: number;
  /** Time in ms to maintain identification before switching to lost */
  lostTimeoutMs: number;
  /** Time in ms between identification updates (throttling) */
  updateIntervalMs: number;
  /** Whether to require sustained confidence before identifying */
  requireSustainedConfidence: boolean;
  /** Number of consecutive confident reads required */
  sustainedConfidenceCount: number;
}

/** Default Identify mode configuration */
export const DEFAULT_IDENTIFY_CONFIG: IdentifyModeConfig = {
  detectionOptions: DEFAULT_DETECTION_OPTIONS,
  confidenceThreshold: 0.7,
  lostTimeoutMs: 2000,
  updateIntervalMs: 250,
  requireSustainedConfidence: true,
  sustainedConfidenceCount: 3,
};

/**
 * Internal state for the Identify mode manager
 */
interface IdentifyManagerState {
  /** Current identification state */
  state: IdentifyState;
  /** Last identified object (if any) */
  identifiedObject: IdentifiedObject | null;
  /** Timestamp when identification was last updated */
  lastUpdateTime: number;
  /** Timestamp when object was first identified */
  identifiedAt: number;
  /** Consecutive confident readings counter */
  confidenceStreak: number;
  /** Object that is currently being tracked (for sustained confidence) */
  pendingObject: IdentifiedObject | null;
}

/**
 * Result of an identification update
 */
export interface IdentifyUpdateResult {
  /** Current identify state */
  state: IdentifyState;
  /** Identified object (if confident) */
  identifiedObject: IdentifiedObject | null;
  /** Text to display for identification */
  displayText: { primary: string; secondary?: string } | null;
  /** Whether this is a new identification */
  isNewIdentification: boolean;
  /** Whether the identification was lost */
  isLost: boolean;
}

/**
 * Identify Mode Manager
 * Handles the state machine for object identification
 */
export class IdentifyModeManager {
  private config: IdentifyModeConfig;
  private state: IdentifyManagerState;

  constructor(config: Partial<IdentifyModeConfig> = {}) {
    this.config = { ...DEFAULT_IDENTIFY_CONFIG, ...config };
    this.state = {
      state: IdentifyState.Idle,
      identifiedObject: null,
      lastUpdateTime: 0,
      identifiedAt: 0,
      confidenceStreak: 0,
      pendingObject: null,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): IdentifyModeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IdentifyModeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current identify state
   */
  getState(): IdentifyState {
    return this.state.state;
  }

  /**
   * Get currently identified object
   */
  getIdentifiedObject(): IdentifiedObject | null {
    return this.state.identifiedObject;
  }

  /**
   * Reset the identification state
   */
  reset(): void {
    this.state = {
      state: IdentifyState.Idle,
      identifiedObject: null,
      lastUpdateTime: 0,
      identifiedAt: 0,
      confidenceStreak: 0,
      pendingObject: null,
    };
  }

  /**
   * Update identification based on current orientation and location
   * This is the main entry point that should be called on each frame/update
   * 
   * @param orientation Current head orientation
   * @param location Observer's geographic location
   * @param forceUpdate Force update even if throttled
   * @returns IdentifyUpdateResult with current state and display info
   */
  update(
    orientation: HeadOrientation,
    location: GeoLocation,
    forceUpdate: boolean = false
  ): IdentifyUpdateResult {
    const now = Date.now();

    // Check throttling
    if (!forceUpdate && now - this.state.lastUpdateTime < this.config.updateIntervalMs) {
      return this.createResult(false);
    }

    this.state.lastUpdateTime = now;

    // Find the nearest object
    const detected = findNearestObject(orientation, location, this.config.detectionOptions);

    // Update state machine
    this.transitionState(detected);

    // Return result
    return this.createResult(true);
  }

  /**
   * State machine transition logic
   */
  private transitionState(detected: IdentifiedObject | null): void {
    const isConfident = isConfidentIdentification(detected, this.config.confidenceThreshold);

    switch (this.state.state) {
      case IdentifyState.Idle:
        if (detected) {
          this.state.state = IdentifyState.Scanning;
          this.handleScanning(detected, isConfident);
        }
        break;

      case IdentifyState.Scanning:
        if (!detected) {
          this.state.state = IdentifyState.Idle;
          this.resetConfidenceStreak();
        } else if (isConfident) {
          if (this.handleScanning(detected, isConfident)) {
            this.state.state = IdentifyState.Identified;
            this.state.identifiedObject = detected;
            this.state.identifiedAt = Date.now();
          }
        } else {
          // Object found but not confident yet
          this.handleScanning(detected, false);
        }
        break;

      case IdentifyState.Identified:
        if (!detected) {
          this.state.state = IdentifyState.Lost;
        } else if (!this.isSameObject(detected, this.state.identifiedObject)) {
          // Different object detected
          if (isConfident) {
            // Immediately switch to new object if confident
            this.state.identifiedObject = detected;
            this.state.identifiedAt = Date.now();
            this.resetConfidenceStreak();
          } else {
            this.state.state = IdentifyState.Scanning;
            this.handleScanning(detected, false);
          }
        } else {
          // Same object, update info
          this.state.identifiedObject = detected;
        }
        break;

      case IdentifyState.Lost:
        if (detected) {
          if (this.isSameObject(detected, this.state.identifiedObject)) {
            // Found the same object again
            this.state.state = IdentifyState.Identified;
          } else {
            // New object detected
            this.state.state = IdentifyState.Scanning;
            this.resetConfidenceStreak();
            this.handleScanning(detected, isConfident);
          }
        } else if (Date.now() - this.state.identifiedAt > this.config.lostTimeoutMs) {
          // Been lost for too long, go back to idle
          this.state.state = IdentifyState.Idle;
          this.state.identifiedObject = null;
          this.resetConfidenceStreak();
        }
        break;
    }
  }

  /**
   * Handle scanning state - track confidence streak
   * @returns true if should transition to Identified
   */
  private handleScanning(detected: IdentifiedObject, isConfident: boolean): boolean {
    if (!this.config.requireSustainedConfidence) {
      return isConfident;
    }

    if (isConfident) {
      // Check if it's the same object as pending
      if (this.state.pendingObject && this.isSameObject(detected, this.state.pendingObject)) {
        this.state.confidenceStreak++;
      } else {
        // New object, reset streak
        this.state.pendingObject = detected;
        this.state.confidenceStreak = 1;
      }

      return this.state.confidenceStreak >= this.config.sustainedConfidenceCount;
    } else {
      // Not confident, reset if object changed significantly
      if (this.state.pendingObject && 
          detected.object.id !== this.state.pendingObject.object.id) {
        this.state.pendingObject = null;
        this.state.confidenceStreak = 0;
      }
      return false;
    }
  }

  /**
   * Check if two identified objects are the same
   */
  private isSameObject(
    a: IdentifiedObject | null,
    b: IdentifiedObject | null
  ): boolean {
    if (!a || !b) return false;
    return a.object.id === b.object.id;
  }

  /**
   * Reset confidence streak
   */
  private resetConfidenceStreak(): void {
    this.state.confidenceStreak = 0;
    this.state.pendingObject = null;
  }

  /**
   * Create the result object
   */
  private createResult(isNewUpdate: boolean): IdentifyUpdateResult {
    const identifiedObject = this.state.identifiedObject;
    
    let displayText: { primary: string; secondary?: string } | null = null;
    
    if (this.state.state === IdentifyState.Identified && identifiedObject) {
      displayText = formatIdentificationText(identifiedObject, true);
    } else if (this.state.state === IdentifyState.Scanning) {
      displayText = { primary: 'Scanning...' };
    } else if (this.state.state === IdentifyState.Lost) {
      displayText = { primary: '...' };
    } else {
      displayText = { primary: 'Point at sky' };
    }

    return {
      state: this.state.state,
      identifiedObject,
      displayText,
      isNewIdentification: isNewUpdate && 
        this.state.state === IdentifyState.Identified &&
        identifiedObject !== null,
      isLost: this.state.state === IdentifyState.Lost,
    };
  }
}

/**
 * Simple wrapper function for quick identification updates
 * Maintains a singleton manager instance for the app
 */
let globalManager: IdentifyModeManager | null = null;

/**
 * Get or create the global Identify mode manager
 */
export function getIdentifyManager(config?: Partial<IdentifyModeConfig>): IdentifyModeManager {
  if (!globalManager) {
    globalManager = new IdentifyModeManager(config);
  } else if (config) {
    globalManager.updateConfig(config);
  }
  return globalManager;
}

/**
 * Reset the global Identify mode manager
 */
export function resetIdentifyManager(): void {
  if (globalManager) {
    globalManager.reset();
  }
}

/**
 * Dispose the global manager (for cleanup)
 */
export function disposeIdentifyManager(): void {
  globalManager = null;
}

/**
 * Update identification in the context of the app state
 * This is the main integration point with the app's CompassState
 * 
 * @param appState Current app state (will be modified)
 * @param forceUpdate Force update even if throttled
 * @returns true if state was modified
 */
export function updateIdentifyMode(
  appState: CompassState,
  forceUpdate: boolean = false
): boolean {
  // Only update when in Identify mode
  if (appState.appMode !== AppMode.Identify) {
    return false;
  }

  if (!appState.location) {
    return false;
  }

  const manager = getIdentifyManager();
  const result = manager.update(appState.orientation, appState.location, forceUpdate);

  // Update app state with identified object
  const hadObject = appState.identifiedObject !== null;
  appState.identifiedObject = result.identifiedObject;

  // Return true if identification state changed
  return hadObject !== (result.identifiedObject !== null) ||
         result.isNewIdentification ||
         result.isLost;
}

/**
 * Get display text for the current identification state
 */
export function getIdentifyDisplayText(): { primary: string; secondary?: string } | null {
  const manager = getIdentifyManager();
  const object = manager.getIdentifiedObject();
  
  if (!object) {
    const state = manager.getState();
    switch (state) {
      case IdentifyState.Scanning:
        return { primary: 'Scanning...' };
      case IdentifyState.Lost:
        return { primary: '...' };
      case IdentifyState.Idle:
      default:
        return { primary: 'Point at sky' };
    }
  }
  
  return formatIdentificationText(object, true);
}
