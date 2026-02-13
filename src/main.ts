// Even Stars - Main entry point
// Sky chart application for Even Realities smart glasses

import { 
  waitForEvenAppBridge, 
  type EvenAppBridge,
  DeviceConnectType,
} from '@evenrealities/even_hub_sdk';

import type { 
  AppState, 
  HeadOrientation,
} from './types';
import { ViewMode } from './types';

import { 
  renderSkyToBuffer,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
} from './sky/renderer';

import { 
  createStartupPageConfig,
  CONTAINER_IDS,
} from './ui/containers';

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

// Application state
const appState: AppState = {
  isConnected: false,
  location: null,
  orientation: { ...DEFAULT_ORIENTATION },
  viewMode: ViewMode.Stars,
  selectedStar: null,
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
  console.log('Even Stars - Initializing...');

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
 * Initialize the browser debug display
 */
function initBrowserDisplay(): void {
  const debugEl = document.getElementById('debug-info');
  if (debugEl) {
    updateBrowserDisplay();
  }
  
  // Set up the preview canvas
  const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
  if (previewCanvas) {
    previewCanvas.width = CANVAS_WIDTH;   // 576
    previewCanvas.height = CANVAS_HEIGHT; // 220
  }
}

/**
 * Update the browser debug display
 */
function updateBrowserDisplay(): void {
  const debugEl = document.getElementById('debug-info');
  if (!debugEl) return;

  const status = appState.isConnected ? '✓ Connected' : '✗ Disconnected';
  const location = appState.location ? formatLocation(appState.location) : 'Unknown';
  const orientation = formatOrientation(appState.orientation);

  debugEl.innerHTML = `
    <div class="status ${appState.isConnected ? 'connected' : 'disconnected'}">
      Glasses: ${status}
    </div>
    <div class="location">Location: ${location}</div>
    <div class="orientation">Orientation: ${orientation}</div>
    <div class="mode">View Mode: ${appState.viewMode}</div>
    <div class="help">
      <p>Use arrow keys to simulate head movement</p>
      <p>Press R to reset orientation</p>
      <p>The sky chart is displayed on the glasses (576x288)</p>
    </div>
  `;
}

/**
 * Initialize the Even glasses UI
 */
async function initGlassesUI(): Promise<void> {
  if (!bridge) return;

  const config = createStartupPageConfig();
  console.log('Creating glasses UI with config:', JSON.stringify(config.toJson(), null, 2));
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
  evenHubEventUnsubscribe = bridge.onEvenHubEvent((event) => {
    if (event.listEvent) {
      handleListEvent(event.listEvent.currentSelectItemName);
    } else if (event.textEvent) {
      console.log('Text event:', event.textEvent);
    } else if (event.sysEvent) {
      console.log('System event:', event.sysEvent.eventType);
    }
  });
}

/**
 * Handle list selection events from glasses
 */
function handleListEvent(itemName: string | undefined): void {
  if (!itemName) return;

  console.log('Mode selected:', itemName);
  
  switch (itemName.toLowerCase()) {
    case 'stars':
      appState.viewMode = ViewMode.Stars;
      break;
    case 'constellations':
      appState.viewMode = ViewMode.Constellations;
      break;
    case 'planets':
      appState.viewMode = ViewMode.Planets;
      break;
  }

  updateBrowserDisplay();
  // Trigger immediate re-render to glasses
  render();
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
 * Render the sky to glasses (and preview to browser if needed)
 */
function render(): void {
  if (!skyCtx || !appState.location) return;

  // Render sky to offscreen canvas (for glasses)
  renderSkyToBuffer({
    ctx: skyCtx,
    location: appState.location,
    orientation: appState.orientation,
    viewMode: appState.viewMode,
    selectedStar: appState.selectedStar,
  });

  // Update browser preview
  updateBrowserPreview();

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
  console.log('Updating glasses display...');

  try {
    // Convert canvas to base64 PNG - the SDK/simulator expects an image format
    if (!skyCanvas) return;
    const dataUrl = skyCanvas.toDataURL('image/png');
    
    // Remove the data URL prefix to get just the base64 string
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    
    console.log(`Image: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}, base64 length: ${base64Data.length}`);

    // Update the sky view container on glasses
    const { ImageRawDataUpdate } = await import('@evenrealities/even_hub_sdk');
    const imageUpdate = ImageRawDataUpdate.fromJson({
      containerID: CONTAINER_IDS.SKY_VIEW,
      containerName: 'sky-view',
      imageData: base64Data,  // Send as base64 string
    });
    
    console.log('Sending PNG to glasses...');
    const result = await bridge.updateImageRawData(imageUpdate);
    console.log('Result:', result);



  } catch (error) {
    console.error('Error updating glasses display:', error);
  } finally {
    imageUpdatePending = false;
  }
}

/**
 * Update the browser preview canvas
 */
function updateBrowserPreview(): void {
  if (!skyCtx || !skyCanvas) return;
  
  const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
  if (!previewCanvas) return;
  
  const previewCtx = previewCanvas.getContext('2d');
  if (!previewCtx) return;
  
  // Copy from offscreen canvas to preview canvas
  previewCtx.drawImage(skyCanvas, 0, 0);
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

// Test button handler
window.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.getElementById('test-image');
  if (testBtn) {
    testBtn.addEventListener('click', sendTestPattern);
  }
});

/**
 * Send a simple test pattern to verify image display works
 */
async function sendTestPattern(): Promise<void> {
  if (!bridge || !appState.isConnected) {
    console.log('Not connected to glasses');
    return;
  }
  
  console.log('Sending test pattern...');
  
  // Create test pattern on canvas
  if (!skyCtx || !skyCanvas) return;
  
  // Clear to black
  skyCtx.fillStyle = '#000000';
  skyCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw white border
  skyCtx.strokeStyle = '#FFFFFF';
  skyCtx.lineWidth = 2;
  skyCtx.strokeRect(5, 5, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  // Draw X
  skyCtx.beginPath();
  skyCtx.moveTo(10, 10);
  skyCtx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  skyCtx.moveTo(CANVAS_WIDTH - 10, 10);
  skyCtx.lineTo(10, CANVAS_HEIGHT - 10);
  skyCtx.stroke();
  
  // Draw "TEST" text
  skyCtx.font = '16px sans-serif';
  skyCtx.fillStyle = '#FFFFFF';
  skyCtx.textAlign = 'center';
  skyCtx.fillText('TEST', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Update preview
  updateBrowserPreview();
  
  // Send as PNG
  const dataUrl = skyCanvas.toDataURL('image/png');
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  
  try {
    const { ImageRawDataUpdate } = await import('@evenrealities/even_hub_sdk');
    const imageUpdate = ImageRawDataUpdate.fromJson({
      containerID: CONTAINER_IDS.SKY_VIEW,
      containerName: 'sky-view',
      imageData: base64Data,
    });
    const result = await bridge.updateImageRawData(imageUpdate);
    console.log('Test pattern result:', result);
  } catch (error) {
    console.error('Test pattern failed:', error);
  }
}

// Start the application
init().catch((error) => {
  console.error('Initialization failed:', error);
});
