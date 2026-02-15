// Explain Mode Manager for Even Stars
// Manages auto-identification with lock behavior and auto-scrolling sidebar content

import type {
  HeadOrientation,
  GeoLocation,
  IdentifiedObject,
  CompassState,
} from '../types';
import { AppMode } from '../types';
import { SearchObjectType } from '../types/search';
import {
  findNearestObject,
  type DetectionOptions,
  DEFAULT_DETECTION_OPTIONS,
} from '../identify/detector';
import {
  getObject,
  getDefaultDescription,
  type CelestialObject,
} from '../sky/objectCatalog';

// ============================================================================
// Types
// ============================================================================

/**
 * State of the explain mode
 */
export enum ExplainState {
  /** Scanning for objects */
  Scanning = 'scanning',
  /** Object found, showing info (auto-updating) */
  Explaining = 'explaining',
  /** User clicked to lock on current object */
  Locked = 'locked',
}

/**
 * Banner content (top strip, always visible)
 */
export interface ExplainBanner {
  /** Icon/symbol for the object type */
  symbol: string;
  /** Object name */
  name: string;
  /** Quick stats: "Mag -1.5 · A1V · 8.6 ly" */
  stats: string;
}

/**
 * Sidebar content (right panel, auto-scrolling)
 */
export interface ExplainSidebar {
  /** Full description text to scroll through */
  text: string;
  /** Current scroll offset in pixels */
  scrollOffset: number;
  /** Total text height in pixels (calculated at render time) */
  totalHeight: number;
  /** Whether the scroll has completed one full cycle */
  hasCompletedCycle: boolean;
}

/**
 * Complete explain mode display state
 */
export interface ExplainDisplay {
  /** Current explain state */
  state: ExplainState;
  /** Banner content (null if scanning) */
  banner: ExplainBanner | null;
  /** Sidebar content (null if scanning) */
  sidebar: ExplainSidebar | null;
  /** Whether the display is locked (click-to-lock active) */
  isLocked: boolean;
  /** The object being explained */
  currentObject: IdentifiedObject | null;
  /** Full object data with description */
  description: CelestialObject | null;
}

/**
 * Configuration for explain mode
 */
export interface ExplainModeConfig {
  /** Detection options */
  detectionOptions: DetectionOptions;
  /** Minimum confidence to show explanation */
  confidenceThreshold: number;
  /** Auto-scroll speed in pixels per second */
  scrollSpeed: number;
  /** Pause at top/bottom of scroll in ms */
  scrollPauseMs: number;
  /** Time between detection updates in ms */
  updateIntervalMs: number;
  /** Time to keep showing object after losing it (ms) */
  lostGraceMs: number;
  /** How many consecutive detections before showing */
  sustainedCount: number;
  /** Auto-unlock timeout (0 = no timeout) */
  lockTimeoutMs: number;
}

/** Default configuration */
export const DEFAULT_EXPLAIN_CONFIG: ExplainModeConfig = {
  detectionOptions: { ...DEFAULT_DETECTION_OPTIONS, maxMagnitude: 2.5 },
  confidenceThreshold: 0.5,
  scrollSpeed: 30, // pixels per second — readable pace
  scrollPauseMs: 2000, // 2s pause at top before scrolling starts
  updateIntervalMs: 300, // 300ms between detection updates
  lostGraceMs: 1500, // keep showing for 1.5s after losing
  sustainedCount: 2, // need 2 consecutive detections
  lockTimeoutMs: 0, // no auto-unlock by default
};

// ============================================================================
// Manager
// ============================================================================

/**
 * Internal state
 */
interface ExplainInternalState {
  state: ExplainState;
  currentObject: IdentifiedObject | null;
  description: CelestialObject | null;
  /** Scroll offset in pixels */
  scrollOffset: number;
  /** When scrolling started (or last reset) */
  scrollStartTime: number;
  /** Whether scroll is paused at top */
  scrollPaused: boolean;
  /** When the current object was first identified */
  identifiedAt: number;
  /** When the current object was last seen */
  lastSeenAt: number;
  /** Last detection update time */
  lastUpdateTime: number;
  /** Consecutive detection count for current candidate */
  streakCount: number;
  /** ID of the candidate being tracked for streak */
  streakId: string | null;
  /** When locked state was entered */
  lockedAt: number;
  /** Total rendered text height (set by renderer) */
  totalTextHeight: number;
  /** Whether one full scroll cycle completed */
  scrollCycleComplete: boolean;
}

/**
 * Explain Mode Manager
 * Handles object detection, lock/unlock, and scroll state
 */
export class ExplainModeManager {
  private config: ExplainModeConfig;
  private internal: ExplainInternalState;

  constructor(config: Partial<ExplainModeConfig> = {}) {
    this.config = { ...DEFAULT_EXPLAIN_CONFIG, ...config };
    this.internal = this.createInitialState();
  }

  private createInitialState(): ExplainInternalState {
    return {
      state: ExplainState.Scanning,
      currentObject: null,
      description: null,
      scrollOffset: 0,
      scrollStartTime: 0,
      scrollPaused: true,
      identifiedAt: 0,
      lastSeenAt: 0,
      lastUpdateTime: 0,
      streakCount: 0,
      streakId: null,
      lockedAt: 0,
      totalTextHeight: 200, // will be updated by renderer
      scrollCycleComplete: false,
    };
  }

  /**
   * Reset to scanning state
   */
  reset(): void {
    this.internal = this.createInitialState();
  }

  /**
   * Get current explain state
   */
  getState(): ExplainState {
    return this.internal.state;
  }

  /**
   * Check if locked
   */
  isLocked(): boolean {
    return this.internal.state === ExplainState.Locked;
  }

  /**
   * Get current object being explained
   */
  getCurrentObject(): IdentifiedObject | null {
    return this.internal.currentObject;
  }

  /**
   * Get current description
   */
  getDescription(): CelestialObject | null {
    return this.internal.description;
  }

  /**
   * Toggle lock state (called on user click)
   * If scanning/explaining → does nothing meaningful (no object to lock)
   * If explaining → locks the current object
   * If locked → unlocks and resumes scanning
   */
  toggleLock(): boolean {
    if (this.internal.state === ExplainState.Locked) {
      // Unlock: resume auto-detection
      this.internal.state = ExplainState.Explaining;
      this.internal.lockedAt = 0;
      return false; // no longer locked
    } else if (this.internal.state === ExplainState.Explaining && this.internal.currentObject) {
      // Lock: freeze on current object
      this.internal.state = ExplainState.Locked;
      this.internal.lockedAt = Date.now();
      return true; // now locked
    }
    return false;
  }

  /**
   * Set the total text height (called by renderer after measuring text)
   */
  setTotalTextHeight(height: number): void {
    this.internal.totalTextHeight = height;
  }

  /**
   * Main update loop — called every frame
   * Handles detection, state transitions, and scroll animation
   */
  update(
    orientation: HeadOrientation,
    location: GeoLocation,
  ): ExplainDisplay {
    const now = Date.now();

    // 1. Update auto-scroll (always, even when locked)
    this.updateScroll(now);

    // 2. If locked, skip detection (but check lock timeout)
    if (this.internal.state === ExplainState.Locked) {
      if (this.config.lockTimeoutMs > 0 &&
          now - this.internal.lockedAt > this.config.lockTimeoutMs) {
        // Auto-unlock after timeout
        this.internal.state = ExplainState.Explaining;
        this.internal.lockedAt = 0;
      } else {
        return this.buildDisplay();
      }
    }

    // 3. Throttle detection updates
    if (now - this.internal.lastUpdateTime < this.config.updateIntervalMs) {
      return this.buildDisplay();
    }
    this.internal.lastUpdateTime = now;

    // 4. Detect nearest object
    const detected = findNearestObject(
      orientation,
      location,
      this.config.detectionOptions,
    );

    // 5. State transitions
    this.transitionState(detected, now);

    return this.buildDisplay();
  }

  /**
   * Handle state transitions based on detection
   */
  private transitionState(detected: IdentifiedObject | null, now: number): void {
    const s = this.internal;

    if (s.state === ExplainState.Scanning) {
      if (detected && detected.confidence >= this.config.confidenceThreshold) {
        // Track streak
        if (s.streakId === detected.object.id) {
          s.streakCount++;
        } else {
          s.streakId = detected.object.id;
          s.streakCount = 1;
        }

        // Require sustained detections
        if (s.streakCount >= this.config.sustainedCount) {
          this.setCurrentObject(detected, now);
          s.state = ExplainState.Explaining;
        }
      } else {
        // Reset streak if nothing detected
        if (!detected) {
          s.streakCount = 0;
          s.streakId = null;
        }
      }
    } else if (s.state === ExplainState.Explaining) {
      if (detected && detected.confidence >= this.config.confidenceThreshold) {
        s.lastSeenAt = now;

        // If a different, more central object appears, switch to it
        if (detected.object.id !== s.currentObject?.object.id) {
          // Only switch if the new object has been consistently detected
          if (s.streakId === detected.object.id) {
            s.streakCount++;
          } else {
            s.streakId = detected.object.id;
            s.streakCount = 1;
          }

          if (s.streakCount >= this.config.sustainedCount) {
            this.setCurrentObject(detected, now);
          }
        } else {
          // Same object — update position info
          s.currentObject = detected;
          s.streakId = detected.object.id;
          s.streakCount = 1;
        }
      } else {
        // Object lost — check grace period
        if (now - s.lastSeenAt > this.config.lostGraceMs) {
          s.state = ExplainState.Scanning;
          s.currentObject = null;
          s.description = null;
          s.streakCount = 0;
          s.streakId = null;
          this.resetScroll();
        }
      }
    }
  }

  /**
   * Set a new current object and load its description
   */
  private setCurrentObject(detected: IdentifiedObject, now: number): void {
    const s = this.internal;
    const isNew = s.currentObject?.object.id !== detected.object.id;

    s.currentObject = detected;
    s.identifiedAt = now;
    s.lastSeenAt = now;
    s.streakCount = 1;
    s.streakId = detected.object.id;

    // Load complete object info from centralized catalog
    let obj = getObject(detected.object.name);
    if (!obj) {
      // Generate a default object for unknown items
      const desc = getDefaultDescription(
        detected.object.name,
        detected.object.type,
        detected.object.magnitude,
        detected.object.info ?? undefined,
      );
      obj = {
        id: detected.object.id,
        name: detected.object.name,
        type: detected.object.type as SearchObjectType,
        ra: detected.object.ra,
        dec: detected.object.dec,
        magnitude: detected.object.magnitude ?? 0,
        constellation: undefined,
        summary: desc.summary,
        description: desc.description,
        distance: desc.distance,
        season: desc.season,
        funFact: desc.funFact,
        isUserDiscovered: false,
      };
    }
    s.description = obj;

    // Reset scroll if showing a new object
    if (isNew) {
      this.resetScroll();
    }
  }

  /**
   * Update the auto-scroll animation
   */
  private updateScroll(now: number): void {
    const s = this.internal;
    if (!s.description || s.state === ExplainState.Scanning) return;

    // Don't scroll if all text fits in the visible area
    // Visible sidebar height ≈ 220px (SIDEBAR_BOTTOM - SIDEBAR_Y - padding)
    const visibleHeight = 220;
    if (s.totalTextHeight <= visibleHeight) {
      s.scrollOffset = 0;
      return;
    }

    // Pause at top before starting scroll
    if (s.scrollPaused) {
      if (now - s.scrollStartTime > this.config.scrollPauseMs) {
        s.scrollPaused = false;
        s.scrollStartTime = now;
      }
      return;
    }

    // Calculate scroll position
    const elapsed = (now - s.scrollStartTime) / 1000; // seconds
    const newOffset = elapsed * this.config.scrollSpeed;

    // Check if we've scrolled past the total text height + some padding
    const maxScroll = Math.max(0, s.totalTextHeight - visibleHeight);
    if (newOffset >= maxScroll && maxScroll > 0) {
      // Completed one cycle — reset to top with pause
      s.scrollOffset = 0;
      s.scrollPaused = true;
      s.scrollStartTime = now;
      s.scrollCycleComplete = true;
    } else {
      s.scrollOffset = newOffset;
    }
  }

  /**
   * Reset scroll to top with initial pause
   */
  private resetScroll(): void {
    this.internal.scrollOffset = 0;
    this.internal.scrollPaused = true;
    this.internal.scrollStartTime = Date.now();
    this.internal.scrollCycleComplete = false;
  }

  /**
   * Build the display output
   */
  private buildDisplay(): ExplainDisplay {
    const s = this.internal;

    if (s.state === ExplainState.Scanning || !s.currentObject) {
      return {
        state: ExplainState.Scanning,
        banner: null,
        sidebar: null,
        isLocked: false,
        currentObject: null,
        description: null,
      };
    }

    const obj = s.currentObject.object;
    const desc = s.description;

    // Build banner
    const symbol = this.getSymbol(obj.type);
    const statsParts: string[] = [];
    if (obj.magnitude !== undefined) statsParts.push(`Mag ${obj.magnitude.toFixed(1)}`);
    if (obj.info) statsParts.push(obj.info);
    if (desc?.distance) statsParts.push(desc.distance);

    const banner: ExplainBanner = {
      symbol,
      name: obj.name,
      stats: statsParts.join(' · '),
    };

    // Build sidebar
    const sidebarText = desc
      ? [desc.description, desc.funFact ? `\n${desc.funFact}` : ''].filter(Boolean).join('\n')
      : `${obj.name} — ${obj.type}`;

    const sidebar: ExplainSidebar = {
      text: sidebarText,
      scrollOffset: s.scrollOffset,
      totalHeight: s.totalTextHeight,
      hasCompletedCycle: s.scrollCycleComplete,
    };

    return {
      state: s.state,
      banner,
      sidebar,
      isLocked: s.state === ExplainState.Locked,
      currentObject: s.currentObject,
      description: desc,
    };
  }

  private getSymbol(type: string): string {
    switch (type) {
      case 'star': return '★';
      case 'planet': return '●';
      case 'constellation': return '◊';
      case 'deepsky': return '◇';
      default: return '·';
    }
  }
}

// ============================================================================
// Global singleton
// ============================================================================

let globalExplainManager: ExplainModeManager | null = null;

/**
 * Get or create the global Explain mode manager
 */
export function getExplainManager(
  config?: Partial<ExplainModeConfig>,
): ExplainModeManager {
  if (!globalExplainManager) {
    globalExplainManager = new ExplainModeManager(config);
  } else if (config) {
    globalExplainManager = new ExplainModeManager(config);
  }
  return globalExplainManager;
}

/**
 * Reset the global manager
 */
export function resetExplainManager(): void {
  if (globalExplainManager) {
    globalExplainManager.reset();
  }
}

/**
 * Dispose the global manager
 */
export function disposeExplainManager(): void {
  globalExplainManager = null;
}

/**
 * Main integration point: update explain mode from app state
 * Returns true if display state changed
 */
export function updateExplainMode(appState: CompassState): ExplainDisplay | null {
  if (appState.appMode !== AppMode.ConstellationHints) {
    return null;
  }

  if (!appState.location) {
    return null;
  }

  const manager = getExplainManager();
  return manager.update(appState.orientation, appState.location);
}

/**
 * Handle click in explain mode (toggle lock)
 */
export function handleExplainClick(): boolean {
  const manager = getExplainManager();
  return manager.toggleLock();
}
