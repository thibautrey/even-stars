// Even Stars - Main entry point
// Astronomical Compass for Even Realities smart glasses

import { 
  waitForEvenAppBridge, 
  type EvenAppBridge,
  DeviceConnectType,
} from '@evenrealities/even_hub_sdk';

import type { 
  CompassState, 
  HeadOrientation,
} from './types';
import { AppMode } from './types';

import { 
  renderSkyToBuffer,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
} from './sky/renderer';

import { 
  createSimplifiedStartupConfig,
  CONTAINER_IDS,
  getMenuItemNames,
  handleMenuSelect,
  updateInfoPanel,
  formatForSDK,
  type InfoPanelContent,
  // Horizontal menu
  renderHorizontalMenu,
  createMenuState,
  selectNextItem,
  selectPreviousItem,
  getSelectedLabel,
  type HorizontalMenuState,
} from './ui';

import {
  getCurrentPosition,
  loadSavedLocation,
  saveLocation,
  DEFAULT_LOCATION,
  formatLocation,
} from './location/geolocation';

import {
  startOrientationTracking,
  stopOrientationTracking,
  DEFAULT_ORIENTATION,
  formatOrientation,
} from './sensors/gyroscope';

import {
  updateIdentifyMode,
} from './identify';

// Application state - Simplified for Astronomical Compass
const appState: CompassState = {
  isConnected: false,
  location: null,
  orientation: { ...DEFAULT_ORIENTATION },
  appMode: AppMode.Identify,
  identifiedObject: null,
  focusTarget: null,
  menuItems: getMenuItemNames(),
  selectedMenuIndex: 0,
};

// Horizontal menu state
let menuState: HorizontalMenuState = createMenuState(getMenuItemNames());

// SDK bridge instance
let bridge: EvenAppBridge | null = null;

// Offscreen canvas for rendering sky (for glasses display)
let skyCanvas: HTMLCanvasElement | null = null;
let skyCtx: CanvasRenderingContext2D | null = null;

// Event unsubscribers
let deviceStatusUnsubscribe: (() => void) | null = null;
let evenHubEventUnsubscribe: (() => void) | null = null;

// Render loop
let renderLoopId: number | null = null;
let lastRenderTime = 0;
const RENDER_INTERVAL = 100; // Render at 10 FPS to avoid overloading glasses

// Image update queue
let imageUpdatePending = false;

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  console.log('Even Stars - Astronomical Compass Initializing...');

  // Initialize offscreen canvas for glasses rendering
  initSkyCanvas();

  // Initialize browser debug display
  initBrowserDisplay();

  // Load saved location or use default
  const savedLocation = loadSavedLocation();
  appState.location = savedLocation || DEFAULT_LOCATION;

  // Try to get current location
  try {
    const position = await getCurrentPosition();
    appState.location = position;
    saveLocation(position);
    console.log('Location obtained:', formatLocation(position));
  } catch (error) {
    console.warn('Could not get location, using default:', error);
  }

  // Initialize Even App Bridge (primary display target)
  try {
    bridge = await waitForEvenAppBridge();
    console.log('Even App Bridge connected');
    await initGlassesUI();
    setupEventListeners();
    appState.isConnected = true;
    updateBrowserDisplay();
  } catch (error) {
    console.warn('Even App Bridge not available:', error);
    updateBrowserDisplay();
  }

  // Start orientation tracking
  await startOrientationTracking(handleOrientationChange);

  // Start render loop (renders to glasses)
  startRenderLoop();

  // Initial render
  render();
  
  console.log('Even Stars initialized. Current mode:', appState.appMode);
  console.log('Available modes:', appState.menuItems);
  console.log('Use → / ← arrow keys or scroll to navigate menu');
}

/**
 * Initialize the offscreen canvas for glasses rendering
 */
function initSkyCanvas(): void {
  // Create offscreen canvas - not attached to DOM
  skyCanvas = document.createElement('canvas');
  skyCanvas.width = CANVAS_WIDTH;
  skyCanvas.height = CANVAS_HEIGHT;

  skyCtx = skyCanvas.getContext('2d', { willReadFrequently: true });
  if (!skyCtx) {
    console.error('Could not get sky canvas context');
    return;
  }
  
  console.log(`Sky canvas initialized: ${skyCanvas.width}x${skyCanvas.height}`);
}

/**
 * Initialize the browser companion display
 */
function initBrowserDisplay(): void {
  // Bind basic user settings controls
  const modeCycleButton = document.getElementById('mode-cycle-btn');
  if (modeCycleButton) {
    modeCycleButton.addEventListener('click', () => {
      handleMenuNavigation('next');
    });
  }

  const refreshLocationButton = document.getElementById('setting-refresh-location');
  if (refreshLocationButton) {
    refreshLocationButton.addEventListener('click', async () => {
      const status = document.getElementById('setting-location-status');
      if (status) status.textContent = 'Updating location...';
      try {
        const position = await getCurrentPosition();
        appState.location = position;
        saveLocation(position);
        if (status) status.textContent = 'Location updated.';
        updateBrowserDisplay();
        render();
      } catch (error) {
        console.warn('Could not refresh location:', error);
        if (status) status.textContent = 'Location update failed.';
      }
    });
  }

  const resetOrientationButton = document.getElementById('setting-reset-orientation');
  if (resetOrientationButton) {
    resetOrientationButton.addEventListener('click', () => {
      appState.orientation = { ...DEFAULT_ORIENTATION };
      updateBrowserDisplay();
      render();
    });
  }

  updateBrowserDisplay();
}

// Menu handling is now simplified - single menu with mode selection

/**
 * Update the browser companion display
 */
function updateBrowserDisplay(): void {
  const statusEl = document.getElementById('status-value');
  const locationEl = document.getElementById('location-value');
  const modeEl = document.getElementById('mode-value');
  const targetPill = document.getElementById('target-pill');
  const orientationEl = document.getElementById('orientation-value');
  const connectionBadge = document.getElementById('connection-badge');

  if (statusEl) {
    statusEl.textContent = appState.isConnected ? 'Connected' : 'Waiting';
  }
  if (connectionBadge) {
    connectionBadge.className = appState.isConnected ? 'connection-badge connected' : 'connection-badge disconnected';
    connectionBadge.textContent = appState.isConnected ? 'Connected' : 'Disconnected';
  }
  if (locationEl) {
    locationEl.textContent = appState.location ? formatLocation(appState.location) : 'Unknown';
  }
  if (modeEl) {
    modeEl.textContent = appState.appMode;
  }
  if (targetPill) {
    if (appState.focusTarget?.name) {
      targetPill.textContent = `★ ${appState.focusTarget.name}`;
      targetPill.style.display = 'inline-flex';
    } else if (appState.identifiedObject?.object.name) {
      targetPill.textContent = `★ ${appState.identifiedObject.object.name}`;
      targetPill.style.display = 'inline-flex';
    } else {
      targetPill.textContent = '';
      targetPill.style.display = 'none';
    }
  }
  if (orientationEl) {
    orientationEl.textContent = formatOrientation(appState.orientation);
  }
}

/**
 * Initialize the Even glasses UI
 */
async function initGlassesUI(): Promise<void> {
  if (!bridge) return;

  const config = createSimplifiedStartupConfig(appState.menuItems);
  console.log('Creating glasses UI with horizontal menu:', JSON.stringify(config.toJson(), null, 2));
  const result = await bridge.createStartUpPageContainer(config);

  switch (result) {
    case 0:
      console.log('Glasses UI created successfully');
      // Send initial image after a short delay to ensure container is ready
      setTimeout(() => {
        render();
      }, 500);
      break;
    case 1:
      console.error('Invalid container configuration');
      break;
    case 2:
      console.error('Container oversize');
      break;
    case 3:
      console.error('Out of memory');
      break;
    default:
      console.error('Unknown error creating UI:', result);
  }
}

/**
 * Set up event listeners for glasses
 */
function setupEventListeners(): void {
  if (!bridge) return;

  // Listen for device status changes
  deviceStatusUnsubscribe = bridge.onDeviceStatusChanged((status) => {
    const wasConnected = appState.isConnected;
    appState.isConnected = status.connectType === DeviceConnectType.Connected;
    
    if (appState.isConnected && !wasConnected) {
      console.log('Glasses connected');
    } else if (!appState.isConnected && wasConnected) {
      console.log('Glasses disconnected');
    }
    updateBrowserDisplay();
  });

  // Listen for UI events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evenHubEventUnsubscribe = bridge.onEvenHubEvent((event: any) => {
    // Handle list events from the menu container
    // This is the primary way to detect menu selection from glasses scroll
    if (event.listEvent) {
      const listEvent = event.listEvent;
      console.log('List event from menu container:', listEvent);
      
      // Convert to JSON if needed
      let eventData = listEvent;
      if (typeof listEvent.toJson === 'function') {
        try {
          eventData = listEvent.toJson();
        } catch (e) {
          // Use original
        }
      }
      
      // Get the selected item index from the SDK
      // This is sent when user scrolls to select a different item
      const selectedIndex = eventData.currentSelectItemIndex;
      
      if (selectedIndex !== undefined && selectedIndex !== null) {
        console.log('SDK selected menu index:', selectedIndex);
        // Sync our menu state with the SDK's selection
        if (selectedIndex >= 0 && selectedIndex < appState.menuItems.length) {
          if (selectedIndex !== menuState.selectedIndex) {
            selectMenuItem(selectedIndex);
          }
        }
      } else {
        // Fallback: handle direction-based events
        const eventType = eventData.eventType || eventData.type;
        const direction = eventData.direction;
        
        if (eventType === 'next' || direction === 'next' || direction === 'up') {
          handleMenuNavigation('next');
        } else if (eventType === 'prev' || direction === 'prev' || direction === 'down') {
          handleMenuNavigation('prev');
        }
      }
    }
    // Handle system events for scroll/navigation (fallback)
    else if (event.sysEvent) {
      const sysEvent = event.sysEvent;
      console.log('System event:', sysEvent);
      
      // Convert to JSON if needed
      let eventData = sysEvent;
      if (typeof sysEvent.toJson === 'function') {
        try {
          eventData = sysEvent.toJson();
        } catch (e) {
          // Use original
        }
      }
      
      // Check for scroll/navigation events - UP/DOWN for menu navigation
      const eventType = eventData.eventType || eventData.type;
      if (eventType === 'scroll' || eventType === 'navigate') {
        const direction = eventData.direction;
        // UP = next menu item, DOWN = previous menu item (scrolling up goes to next)
        if (direction === 'next' || direction === 'up') {
          handleMenuNavigation('next');
        } else if (direction === 'prev' || direction === 'down') {
          handleMenuNavigation('prev');
        }
      }
    } else if (event.textEvent) {
      console.log('Text event:', event.textEvent);
    }
  });

  // Setup keyboard controls for menu navigation
  // UP/DOWN arrows control the menu (matching glasses scroll gesture)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      console.log('↑ Key pressed - next menu item');
      handleMenuNavigation('next');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      console.log('↓ Key pressed - previous menu item');
      handleMenuNavigation('prev');
    } else if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < appState.menuItems.length) {
        e.preventDefault();
        console.log(`Keyboard: Selecting menu item ${index + 1}: "${appState.menuItems[index]}"`);
        selectMenuItem(index);
      }
    }
  });

  console.log('✓ Keyboard controls enabled:');
  console.log('  ↑ (up arrow) = next menu item');
  console.log('  ↓ (down arrow) = previous menu item');
  console.log('  1/2/3 = select by number');
}

/**
 * Handle menu navigation (next/prev)
 */
function handleMenuNavigation(direction: 'next' | 'prev'): void {
  if (direction === 'next') {
    selectNextItem(menuState);
  } else {
    selectPreviousItem(menuState);
  }
  
  // Update app state to match
  appState.selectedMenuIndex = menuState.selectedIndex;
  
  // Apply the selection (change mode)
  const selectedLabel = getSelectedLabel(menuState);
  if (selectedLabel) {
    const newMode = handleMenuSelect(appState, selectedLabel);
    if (newMode !== null) {
      console.log(`✓ Menu ${direction}: switched to mode:`, newMode);
      updateBrowserDisplay();
      render();
    }
  }
}

/**
 * Select a specific menu item by index
 */
function selectMenuItem(index: number): void {
  if (index >= 0 && index < menuState.items.length) {
    menuState.selectedIndex = index;
    appState.selectedMenuIndex = index;
    
    const selectedLabel = getSelectedLabel(menuState);
    if (selectedLabel) {
      const newMode = handleMenuSelect(appState, selectedLabel);
      if (newMode !== null) {
        console.log('✓ Menu item selected:', newMode);
        updateBrowserDisplay();
        render();
      }
    }
  }
}

/**
 * Handle orientation changes
 */
function handleOrientationChange(orientation: HeadOrientation): void {
  appState.orientation = orientation;
  updateBrowserDisplay();
  // Render is handled by the animation loop
}

/**
 * Start the render loop
 */
function startRenderLoop(): void {
  const loop = (timestamp: number) => {
    if (timestamp - lastRenderTime >= RENDER_INTERVAL) {
      render();
      lastRenderTime = timestamp;
    }
    renderLoopId = requestAnimationFrame(loop);
  };
  renderLoopId = requestAnimationFrame(loop);
}

/**
 * Stop the render loop
 */
function stopRenderLoop(): void {
  if (renderLoopId) {
    cancelAnimationFrame(renderLoopId);
    renderLoopId = null;
  }
}

// Current info panel content for display
let currentInfoContent: InfoPanelContent | null = null;

/**
 * Render the sky to glasses
 */
function render(): void {
  if (!skyCtx || !appState.location) return;

  // Update Identify mode logic when in Identify mode
  if (appState.appMode === AppMode.Identify) {
    const stateChanged = updateIdentifyMode(appState);
    if (stateChanged) {
      updateBrowserDisplay();
    }
  }

  // Update info panel content
  currentInfoContent = updateInfoPanel(appState);

  // Render sky to offscreen canvas (for glasses)
  // TODO: Update renderSkyToBuffer to accept CompassState
  renderSkyToBuffer({
    ctx: skyCtx,
    location: appState.location,
    orientation: appState.orientation,
    viewMode: 'Stars' as any, // Temporary - will be refactored in Task 3.3
    selectedStar: null,
    starFilter: 'all' as any,
    constellationFilter: 'all' as any,
    planetFilter: 'all' as any,
    deepSkyFilter: 'all' as any,
    finderTarget: appState.focusTarget as any,
  });

  // Render horizontal menu at the bottom
  renderHorizontalMenu(skyCtx, menuState);

  // Update glasses display (image + text)
  updateGlassesDisplay();
}

// Track last text content to avoid redundant updates
let lastTextContent: string = '';

/**
 * Update the glasses display with current sky view
 */
async function updateGlassesDisplay(): Promise<void> {
  if (!bridge || !appState.isConnected || !skyCtx) {
    return;
  }

  // Update text container first (lightweight)
  try {
    const textContent = formatForSDK(currentInfoContent);
    
    // Only send text update if content changed
    if (textContent !== lastTextContent) {
      const { TextContainerUpgrade } = await import('@evenrealities/even_hub_sdk');
      const textUpdate = TextContainerUpgrade.fromJson({
        containerID: CONTAINER_IDS.INFO_TEXT,
        content: textContent,
      });
      
      await bridge.textContainerUpgrade(textUpdate);
      lastTextContent = textContent;
    }
  } catch (error) {
    console.error('Error updating text display:', error);
  }

  // Skip image update if one is pending
  if (imageUpdatePending) {
    return;
  }

  // Queue image update to avoid concurrent transmissions
  imageUpdatePending = true;

  try {
    // Convert canvas to base64 PNG - the SDK/simulator expects an image format
    if (!skyCanvas) return;
    const dataUrl = skyCanvas.toDataURL('image/png');
    
    // Remove the data URL prefix to get just the base64 string
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    
    // Update the sky view container on glasses
    const { ImageRawDataUpdate } = await import('@evenrealities/even_hub_sdk');
    const imageUpdate = ImageRawDataUpdate.fromJson({
      containerID: CONTAINER_IDS.SKY_VIEW,
      containerName: 'sky-view',
      imageData: base64Data,  // Send as base64 string
    });
    
    // Send image to glasses
    await bridge.updateImageRawData(imageUpdate);

  } catch (error) {
    console.error('Error updating glasses display:', error);
  } finally {
    imageUpdatePending = false;
  }
}

/**
 * Cleanup and shutdown
 */
function cleanup(): void {
  console.log('Cleaning up...');

  // Stop render loop
  stopRenderLoop();

  // Stop orientation tracking
  stopOrientationTracking();

  // Unsubscribe from events
  if (deviceStatusUnsubscribe) {
    deviceStatusUnsubscribe();
    deviceStatusUnsubscribe = null;
  }
  if (evenHubEventUnsubscribe) {
    evenHubEventUnsubscribe();
    evenHubEventUnsubscribe = null;
  }

  // Shutdown glasses UI
  if (bridge) {
    bridge.shutDownPageContainer(0);
  }
}

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Expose functions to window for console testing
(window as unknown as Record<string, unknown>).selectMenuItem = selectMenuItem;
(window as unknown as Record<string, unknown>).handleMenuNavigation = handleMenuNavigation;
(window as unknown as Record<string, unknown>).cycleMode = () => {
  handleMenuNavigation('next');
};
(window as unknown as Record<string, unknown>).appState = appState;
(window as unknown as Record<string, unknown>).menuState = menuState;
(window as unknown as Record<string, unknown>).menuDebug = () => {
  console.log('=== Menu Debug Info ===');
  console.log('Current app mode:', appState.appMode);
  console.log('Menu items:', appState.menuItems);
  console.log('Selected index:', appState.selectedMenuIndex);
  console.log('Menu state:', menuState);
  console.log('Container IDs:', CONTAINER_IDS);
  console.log('To test menu selection by index, call: selectMenuItem(0), selectMenuItem(1), selectMenuItem(2)');
  console.log('To navigate menu, call: handleMenuNavigation("next") or handleMenuNavigation("prev")');
};

// Start the application
init().catch((error) => {
  console.error('Initialization failed:', error);
});
