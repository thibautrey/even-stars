// Text Info Panel for Even Stars
// Displays identified object information as text overlay

import type { CompassState } from '../types';
import { AppMode } from '../types';

/**
 * Layout configuration for the info panel
 */
export interface InfoPanelLayout {
  /** X position on screen */
  x: number;
  /** Y position on screen */
  y: number;
  /** Width of the panel */
  width: number;
  /** Height of the panel */
  height: number;
  /** Text alignment */
  align: 'left' | 'center' | 'right';
  /** Padding inside the panel */
  padding: number;
}

/** Default layout for glasses display */
export const DEFAULT_INFO_PANEL_LAYOUT: InfoPanelLayout = {
  x: 20,
  y: 20,
  width: 536, // 576 - 20 - 20 (full width with margins)
  height: 60,
  align: 'left',
  padding: 8,
};

/**
 * Text content for the info panel
 */
export interface InfoPanelContent {
  /** Primary text (large, bold) - e.g., "★ Sirius" */
  primary: string;
  /** Secondary text (smaller) - e.g., "Mag -1.5 · A1V" */
  secondary?: string;
  /** Tertiary text (smallest) - e.g., direction hints */
  tertiary?: string;
}

/**
 * Visual style for the info panel
 */
export interface InfoPanelStyle {
  /** Background color (hex or rgba) */
  backgroundColor: string;
  /** Primary text color */
  primaryColor: string;
  /** Secondary text color */
  secondaryColor: string;
  /** Tertiary text color */
  tertiaryColor: string;
  /** Primary font size in pixels */
  primaryFontSize: number;
  /** Secondary font size in pixels */
  secondaryFontSize: number;
  /** Tertiary font size in pixels */
  tertiaryFontSize: number;
  /** Font family */
  fontFamily: string;
  /** Border radius for panel background */
  borderRadius: number;
  /** Background opacity (0-1) */
  backgroundOpacity: number;
}

/** Default style optimized for glasses display */
export const DEFAULT_INFO_PANEL_STYLE: InfoPanelStyle = {
  backgroundColor: '#000000',
  primaryColor: '#FFFFFF',
  secondaryColor: '#CCCCCC',
  tertiaryColor: '#999999',
  primaryFontSize: 24,
  secondaryFontSize: 16,
  tertiaryFontSize: 12,
  fontFamily: 'Arial, sans-serif',
  borderRadius: 4,
  backgroundOpacity: 0.7,
};

/**
 * Info panel state
 */
export enum InfoPanelState {
  /** Idle - showing hint text */
  Idle = 'idle',
  /** Scanning - looking for objects */
  Scanning = 'scanning',
  /** Object identified */
  Identified = 'identified',
  /** Lost - previously identified object no longer visible */
  Lost = 'lost',
  /** Target finder mode - showing target info */
  TargetFinder = 'targetFinder',
}

/**
 * Configuration for the info panel
 */
export interface InfoPanelConfig {
  /** Layout settings */
  layout: InfoPanelLayout;
  /** Visual style */
  style: InfoPanelStyle;
  /** Whether to show panel when idle */
  showWhenIdle: boolean;
  /** Duration to show "Lost" state in ms */
  lostDisplayDurationMs: number;
}

/** Default configuration */
export const DEFAULT_INFO_PANEL_CONFIG: InfoPanelConfig = {
  layout: DEFAULT_INFO_PANEL_LAYOUT,
  style: DEFAULT_INFO_PANEL_STYLE,
  showWhenIdle: true,
  lostDisplayDurationMs: 1500,
};

/**
 * Info Panel Manager
 * Manages the display of identified object information
 */
export class InfoPanelManager {
  private config: InfoPanelConfig;
  private currentState: InfoPanelState = InfoPanelState.Idle;

  constructor(config: Partial<InfoPanelConfig> = {}) {
    this.config = {
      ...DEFAULT_INFO_PANEL_CONFIG,
      ...config,
      layout: { ...DEFAULT_INFO_PANEL_CONFIG.layout, ...config.layout },
      style: { ...DEFAULT_INFO_PANEL_CONFIG.style, ...config.style },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InfoPanelConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): InfoPanelConfig {
    return { ...this.config };
  }

  /**
   * Get current panel state
   */
  getState(): InfoPanelState {
    return this.currentState;
  }

  /**
   * Get the content to display based on app state
   * This is the main entry point for updating the panel
   */
  updateFromAppState(appState: CompassState): InfoPanelContent | null {
    const now = Date.now();

    switch (appState.appMode) {
      case AppMode.TargetFinder:
        return this.updateForTargetFinderMode(appState, now);
      
      case AppMode.ConstellationHints:
        return this.updateForConstellationMode(appState, now);
      
      case AppMode.Time:
        return this.updateForTimeMode(appState, now);
      
      default:
        return this.getIdleContent();
    }
  }

  /**
   * Update for Target Finder mode
   */
  private updateForTargetFinderMode(
    appState: CompassState,
    _now: number
  ): InfoPanelContent | null {
    this.currentState = InfoPanelState.TargetFinder;
    
    const target = appState.focusTarget;
    if (!target) {
      return {
        primary: 'Select a target',
        secondary: 'Use menu to find objects',
      };
    }

    const direction = target.direction;
    if (!direction) {
      return {
        primary: `★ ${target.name}`,
        secondary: 'Calculating position...',
      };
    }

    // Format distance and direction
    const distance = direction.distance;
    const distanceText = distance > 5 
      ? `${distance.toFixed(0)}° away`
      : distance > 2 
        ? 'Nearby'
        : 'In view!';

    const directionText = this.formatDirection(
      direction.azimuth,
      direction.altitude
    );

    return {
      primary: `★ ${target.name}`,
      secondary: distanceText,
      tertiary: directionText,
    };
  }

  /**
   * Update for Constellation Hints mode (now "Explain" mode)
   * The actual content is overridden by the explain mode banner in main.ts.
   * This fallback is shown before explain mode detects anything.
   */
  private updateForConstellationMode(
    _appState: CompassState,
    _now: number
  ): InfoPanelContent | null {
    return {
      primary: 'Looking...',
      secondary: 'Point at a bright star or planet',
    };
  }

  /**
   * Update for Time mode
   */
  private updateForTimeMode(
    appState: CompassState,
    _now: number
  ): InfoPanelContent | null {
    // Show current time and astronomical information
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Add location info if available
    let secondary = 'Time-based astronomy';
    if (appState.location) {
      const lat = appState.location.latitude.toFixed(1);
      const lon = appState.location.longitude.toFixed(1);
      secondary = `${lat}°, ${lon}°`;
    }
    
    return {
      primary: timeStr,
      secondary: secondary,
      tertiary: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  }

  /**
   * Get idle state content
   */
  private getIdleContent(): InfoPanelContent {
    return {
      primary: 'Point at sky',
      secondary: 'Looking for bright stars...',
    };
  }

  /**
   * Format direction as human-readable text
   */
  private formatDirection(azimuth: number, altitude: number): string {
    const directions: { min: number; max: number; label: string }[] = [
      { min: 337.5, max: 22.5, label: 'North' },
      { min: 22.5, max: 67.5, label: 'NE' },
      { min: 67.5, max: 112.5, label: 'East' },
      { min: 112.5, max: 157.5, label: 'SE' },
      { min: 157.5, max: 202.5, label: 'South' },
      { min: 202.5, max: 247.5, label: 'SW' },
      { min: 247.5, max: 292.5, label: 'West' },
      { min: 292.5, max: 337.5, label: 'NW' },
    ];

    const normalized = (azimuth % 360 + 360) % 360;
    const dir = directions.find(d => {
      if (d.min > d.max) {
        // Wraps around 0 (North)
        return normalized >= d.min || normalized < d.max;
      }
      return normalized >= d.min && normalized < d.max;
    });

    const dirLabel = dir?.label || '';
    
    let altLabel = '';
    if (altitude > 60) altLabel = 'high';
    else if (altitude < 20) altLabel = 'low';

    if (altLabel) {
      return `Look ${dirLabel} ${altLabel}`;
    }
    return `Look ${dirLabel}`;
  }

  /**
   * Render the info panel to a canvas context
   * This is used for the browser companion display
   */
  renderToCanvas(
    ctx: CanvasRenderingContext2D,
    content: InfoPanelContent | null
  ): void {
    if (!content) return;

    const { layout, style } = this.config;

    // Clear background
    ctx.save();
    ctx.fillStyle = style.backgroundColor;
    ctx.globalAlpha = style.backgroundOpacity;
    ctx.beginPath();
    ctx.roundRect(
      layout.x,
      layout.y,
      layout.width,
      layout.height,
      style.borderRadius
    );
    ctx.fill();
    ctx.restore();

    // Draw text
    let currentY = layout.y + layout.padding + style.primaryFontSize;
    const textX = layout.align === 'center' 
      ? layout.x + layout.width / 2 
      : layout.align === 'right'
        ? layout.x + layout.width - layout.padding
        : layout.x + layout.padding;

    // Primary text
    ctx.font = `bold ${style.primaryFontSize}px ${style.fontFamily}`;
    ctx.fillStyle = style.primaryColor;
    ctx.textAlign = layout.align;
    ctx.fillText(content.primary, textX, currentY);

    // Secondary text
    if (content.secondary) {
      currentY += style.secondaryFontSize + 4;
      ctx.font = `${style.secondaryFontSize}px ${style.fontFamily}`;
      ctx.fillStyle = style.secondaryColor;
      ctx.fillText(content.secondary, textX, currentY);
    }

    // Tertiary text
    if (content.tertiary) {
      currentY += style.tertiaryFontSize + 4;
      ctx.font = `${style.tertiaryFontSize}px ${style.fontFamily}`;
      ctx.fillStyle = style.tertiaryColor;
      ctx.fillText(content.tertiary, textX, currentY);
    }
  }
}

// ============================================================================
// Global singleton instance
// ============================================================================

let globalInfoPanel: InfoPanelManager | null = null;

/**
 * Get or create the global info panel manager
 */
export function getInfoPanelManager(config?: Partial<InfoPanelConfig>): InfoPanelManager {
  if (!globalInfoPanel) {
    globalInfoPanel = new InfoPanelManager(config);
  } else if (config) {
    globalInfoPanel.updateConfig(config);
  }
  return globalInfoPanel;
}

/**
 * Dispose the global manager
 */
export function disposeInfoPanelManager(): void {
  globalInfoPanel = null;
}

/**
 * Update info panel from app state and return content
 * Convenience function for main render loop
 */
export function updateInfoPanel(appState: CompassState): InfoPanelContent | null {
  const panel = getInfoPanelManager();
  return panel.updateFromAppState(appState);
}

/**
 * Format content for SDK text container
 * Converts panel content to a simple string format for the glasses
 */
export function formatForSDK(content: InfoPanelContent | null): string {
  if (!content) return '';
  
  let result = content.primary;
  if (content.secondary) {
    result += `\n${content.secondary}`;
  }
  if (content.tertiary) {
    result += `\n${content.tertiary}`;
  }
  return result;
}
