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
  createSimplifiedRebuildConfig,
  CONTAINER_IDS,
} from './ui/containers';

import {
  getMenuItemNames,
  handleMenuSelect,
  cycleMode,
} from './ui/simpleMenu';

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
      const newMode = cycleMode(appState);
      console.log('Mode cycled to:', newMode);
      updateMenuDisplay();
      updateBrowserDisplay();
      render();
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
  console.log('Creating glasses UI with simplified config:', JSON.stringify(config.toJson(), null, 2));
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
    // Handle list events - SDK returns protobuf objects that need special handling
    if (event.listEvent) {
      const listEvent = event.listEvent;
      
      // Try to extract selection data from the SDK event
      let itemName = listEvent.currentSelectItemName;
      let itemIndex = listEvent.currentSelectItemIndex;
      const containerID = listEvent.containerID;
      
      // Try toJson() conversion if direct access didn't work
      if ((!itemName || itemIndex === undefined) && typeof listEvent.toJson === 'function') {
        try {
          const jsonData = listEvent.toJson();
          itemName = itemName || jsonData?.currentSelectItemName;
          itemIndex = itemIndex !== undefined ? itemIndex : jsonData?.currentSelectItemIndex;
        } catch (e) {
          // Ignore conversion error
        }
      }
      
      // Log what we received from the SDK
      const hasName = itemName !== undefined && itemName !== null;
      const hasIndex = itemIndex !== undefined && itemIndex !== null;
      
      if (hasName) {
        console.log('✓ SDK event: received itemName =', itemName);
      } else if (hasIndex) {
        console.log('✓ SDK event: received itemIndex =', itemIndex);
      } else {
        console.log('⚠️  SDK event: missing both itemName and itemIndex');
      }
      
      // If we have an index but no name, resolve the name from our menu items
      if (itemIndex !== undefined && !itemName && containerID === CONTAINER_IDS.MENU) {
        if (itemIndex >= 0 && itemIndex < appState.menuItems.length) {
          itemName = appState.menuItems[itemIndex];
          console.log('→ Resolved: index', itemIndex, '=', itemName);
        }
      }
      
      handleMenuEvent(itemName, containerID);
    } else if (event.textEvent) {
      console.log('Text event:', event.textEvent);
    } else if (event.sysEvent) {
      console.log('System event:', event.sysEvent);
    }
  });

  // Setup keyboard controls for menu navigation (for testing/simulator)
  // This is a temporary solution while SDK event data is being debugged
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      console.log('→ Key pressed - cycling to next mode');
      cycleMode(appState);
      updateBrowserDisplay();
      render();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      console.log('← Key pressed - cycling to previous mode');
      const currentIndex = appState.selectedMenuIndex;
      const newIndex = (currentIndex - 1 + appState.menuItems.length) % appState.menuItems.length;
      const itemName = appState.menuItems[newIndex];
      handleMenuEvent(itemName, CONTAINER_IDS.MENU);
    } else if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < appState.menuItems.length) {
        e.preventDefault();
        const itemName = appState.menuItems[index];
        console.log(`Keyboard: Selecting menu item ${index + 1}: "${itemName}"`);
        handleMenuEvent(itemName, CONTAINER_IDS.MENU);
      }
    }
  });

  console.log('✓ Keyboard controls enabled (for testing):');
  console.log('  → (right arrow) = next mode');
  console.log('  ← (left arrow) = previous mode');
  console.log('  1/2/3 = select by number');
}

/**
 * Handle menu selection events from glasses
 * Simplified single-menu system
 */
function handleMenuEvent(itemName: string | undefined, containerID?: number): void {
  console.log('handleMenuEvent called:', { itemName, containerID, menuItems: appState.menuItems });
  
  if (!itemName) {
    console.warn('⚠️  Menu event received but itemName is undefined', { containerID });
    console.warn('📋 Available menu items:', appState.menuItems);
    console.log('💡 Tip: Use keyboard controls to test menu (→ ← 1 2 3 keys)');
    console.log('    Or call handleMenuByIndex(0/1/2) from console');
    return;
  }

  // Validate that the item name is in our menu
  if (!appState.menuItems.includes(itemName)) {
    console.warn('❌ Menu item not recognized:', itemName, 'from items:', appState.menuItems);
    return;
  }

  console.log('✓ Menu selected:', itemName);

  const newMode = handleMenuSelect(appState, itemName);
  if (newMode !== null) {
    console.log('✓ Switched to mode:', newMode);
    updateBrowserDisplay();
    render();
  } else {
    console.warn('❌ Unknown menu item:', itemName);
  }
}

/**
 * Update the glasses menu display
 * Simplified single-menu layout
 */
async function updateMenuDisplay(): Promise<void> {
  if (!bridge || !appState.isConnected) return;
  
  console.log('Rebuilding menu with items:', appState.menuItems, 'Current mode:', appState.appMode);
  
  try {
    const config = createSimplifiedRebuildConfig(appState.menuItems);
    
    const success = await bridge.rebuildPageContainer(config);
    
    if (success) {
      console.log('Menu rebuilt successfully');
    } else {
      console.error('Failed to rebuild menu');
    }
  } catch (error) {
    console.error('Error updating menu display:', error);
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

/**
 * Render the sky to glasses
 */
function render(): void {
  if (!skyCtx || !appState.location) return;

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

  // Update glasses display
  updateGlassesDisplay();
}

/**
 * Update the glasses display with current sky view
 */
async function updateGlassesDisplay(): Promise<void> {
  if (!bridge || !appState.isConnected || imageUpdatePending || !skyCtx) {
    if (!bridge) console.log('No bridge');
    if (!appState.isConnected) console.log('Not connected');
    if (imageUpdatePending) console.log('Update pending');
    if (!skyCtx) console.log('No sky context');
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

// Expose menu functions to window for console testing
(window as unknown as Record<string, unknown>).handleMenuEvent = handleMenuEvent;
(window as unknown as Record<string, unknown>).handleMenuByIndex = (index: number) => {
  if (index >= 0 && index < appState.menuItems.length) {
    const itemName = appState.menuItems[index];
    console.log(`Testing menu selection: index ${index} → "${itemName}"`);
    handleMenuEvent(itemName, CONTAINER_IDS.MENU);
  } else {
    console.error(`Invalid menu index: ${index}, valid range: 0-${appState.menuItems.length - 1}`);
    console.log('Available items:', appState.menuItems);
  }
};
(window as unknown as Record<string, unknown>).cycleMode = () => {
  const newMode = cycleMode(appState);
  console.log('Mode cycled to:', newMode);
  updateBrowserDisplay();
  render();
};
(window as unknown as Record<string, unknown>).appState = appState;
(window as unknown as Record<string, unknown>).menuDebug = () => {
  console.log('=== Menu Debug Info ===');
  console.log('Current app mode:', appState.appMode);
  console.log('Menu items:', appState.menuItems);
  console.log('Selected index:', appState.selectedMenuIndex);
  console.log('Container IDs:', CONTAINER_IDS);
  console.log('To test menu selection by index, call: handleMenuByIndex(0), handleMenuByIndex(1), handleMenuByIndex(2)');
};

// Start the application
init().catch((error) => {
  console.error('Initialization failed:', error);
});
