// Even Stars - Main entry point
// Astronomical Compass for Even Realities smart glasses

import { 
  waitForEvenAppBridge, 
  type EvenAppBridge,
  DeviceConnectType,
  OsEventTypeList,
  type EvenHubEvent,
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
  updateExplainMode,
  handleExplainClick,
  renderExplainOverlay,
  resetExplainManager,
  type ExplainDisplay,
} from './explain';

import {
  startOrientationTracking,
  stopOrientationTracking,
  DEFAULT_ORIENTATION,
  formatOrientation,
} from './sensors/gyroscope';

import {
  activateFindTargetMode,
  deactivateFindTargetMode,
  handleFindTargetClick,
  handleFindTargetDoubleClick,
  handleAudioData,
  getFindTargetOverlay,
  isFindTargetActive,
  processManualText,
  renderFindTargetOverlay,
  saveApiKey,
  loadApiKey,
} from './speech';

// Application state - Simplified for Astronomical Compass
const appState: CompassState = {
  isConnected: false,
  location: null,
  orientation: { ...DEFAULT_ORIENTATION },
  appMode: AppMode.TargetFinder,
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

// Swipe/scroll throttle — prevents rapid-fire scroll events from double-triggering
const SWIPE_COOLDOWN_MS = 300;
let lastSwipeTime = 0;

/** Returns true if enough time has passed since the last swipe to process a new one. */
function swipeThrottleOk(): boolean {
  const now = Date.now();
  if (now - lastSwipeTime < SWIPE_COOLDOWN_MS) return false;
  lastSwipeTime = now;
  return true;
}

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

  // Activate Find Target mode if that's the default mode
  if (appState.appMode === AppMode.TargetFinder && bridge) {
    await activateFindTargetMode(bridge, (target) => {
      appState.focusTarget = target;
      console.log('🎯 Voice search found target:', target.name);
      updateBrowserDisplay();
      render();
    });
  }

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

  // --- OpenAI API Key setting ---
  const apiKeyInput = document.getElementById('setting-openai-key') as HTMLInputElement | null;
  const apiKeySaveBtn = document.getElementById('setting-openai-key-save');
  const apiKeyStatus = document.getElementById('setting-openai-key-status');

  // Load existing key and show masked version
  if (apiKeyInput) {
    loadApiKey(bridge).then((key) => {
      if (key) {
        apiKeyInput.value = key;
        apiKeyInput.type = 'password';
        if (apiKeyStatus) apiKeyStatus.textContent = 'Key configured ✓';
      }
    });
  }

  if (apiKeySaveBtn && apiKeyInput) {
    apiKeySaveBtn.addEventListener('click', async () => {
      const key = apiKeyInput.value.trim();
      if (!key) {
        if (apiKeyStatus) apiKeyStatus.textContent = 'Please enter a key';
        return;
      }
      if (apiKeyStatus) apiKeyStatus.textContent = 'Saving...';
      const ok = await saveApiKey(key, bridge);
      if (ok) {
        if (apiKeyStatus) apiKeyStatus.textContent = 'Key saved ✓';
        apiKeyInput.type = 'password';
        console.log('✓ OpenAI API key saved');
      } else {
        if (apiKeyStatus) apiKeyStatus.textContent = 'Failed to save';
      }
    });
  }

  // Toggle show/hide API key
  const apiKeyToggle = document.getElementById('setting-openai-key-toggle');
  if (apiKeyToggle && apiKeyInput) {
    apiKeyToggle.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        apiKeyToggle.textContent = 'Hide';
      } else {
        apiKeyInput.type = 'password';
        apiKeyToggle.textContent = 'Show';
      }
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

  // Listen for UI events from ring (scroll, click, double-click)
  // Pattern: check all 3 event channels independently (textEvent, sysEvent, listEvent)
  // because a single EvenHubEvent can carry data in multiple channels simultaneously.
  // Swipe/scroll events primarily arrive via textEvent, NOT listEvent.
  // See SDK_DOCUMENTATION.md § "Event Handling Best Practices" for details.
  evenHubEventUnsubscribe = bridge.onEvenHubEvent((event: EvenHubEvent) => {
    console.log('📨 EvenHub event received:', JSON.stringify(event, null, 0));

    // --- Channel 1: textEvent (swipes/scrolls arrive here) ---
    if (event?.textEvent) {
      const eventType = event.textEvent.eventType;
      console.log('📝 textEvent channel — eventType:', eventType);

      if (eventType === OsEventTypeList.SCROLL_TOP_EVENT) {
        console.log('⬆️ textEvent SCROLL_TOP → previous menu item');
        if (swipeThrottleOk()) handleMenuNavigation('prev');
      } else if (eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
        console.log('⬇️ textEvent SCROLL_BOTTOM → next menu item');
        if (swipeThrottleOk()) handleMenuNavigation('next');
      } else if (eventType === OsEventTypeList.CLICK_EVENT || eventType === undefined) {
        console.log('🔘 textEvent CLICK → select');
        handleRingClick();
      } else if (eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
        console.log('🔘🔘 textEvent DOUBLE_CLICK');
        handleRingDoubleClick();
      }
    }

    // --- Channel 2: sysEvent (taps/clicks also arrive here) ---
    if (event?.sysEvent) {
      const eventType = event.sysEvent.eventType;
      console.log('⚙️ sysEvent channel — eventType:', eventType);

      if (eventType === OsEventTypeList.CLICK_EVENT || eventType === undefined) {
        console.log('🔘 sysEvent CLICK → select');
        handleRingClick();
      } else if (eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
        console.log('🔘🔘 sysEvent DOUBLE_CLICK');
        handleRingDoubleClick();
      } else if (eventType === OsEventTypeList.SCROLL_TOP_EVENT) {
        console.log('⬆️ sysEvent SCROLL_TOP → previous menu item');
        if (swipeThrottleOk()) handleMenuNavigation('prev');
      } else if (eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
        console.log('⬇️ sysEvent SCROLL_BOTTOM → next menu item');
        if (swipeThrottleOk()) handleMenuNavigation('next');
      }
    }

    // --- Channel 3: listEvent (kept for safety, though we no longer use ListContainerProperty) ---
    if (event?.listEvent) {
      const le = event.listEvent;
      const eventType = le.eventType;
      console.log('📋 listEvent channel — eventType:', eventType,
        'selectIdx:', le.currentSelectItemIndex,
        'selectName:', le.currentSelectItemName);

      if (eventType === OsEventTypeList.CLICK_EVENT || eventType === undefined) {
        const idx = le.currentSelectItemIndex;
        if (typeof idx === 'number' && idx >= 0 && idx < appState.menuItems.length) {
          console.log(`🔘 listEvent CLICK → select menu item ${idx}: "${appState.menuItems[idx]}"`);
          selectMenuItem(idx);
        }
      }
      // Scroll events on lists are handled natively by the list widget
    }

    // --- Audio events (microphone PCM data for speech-to-text) ---
    if (event?.audioEvent) {
      const pcm = event.audioEvent.audioPcm;
      if (pcm && pcm.length > 0) {
        handleAudioData(pcm instanceof Uint8Array ? pcm : new Uint8Array(pcm));
      }
    }

    // --- Foreground events (neither text nor sys channel specific) ---
    const rawEventType = getRawEventType(event);
    const normalizedType = normalizeEventType(rawEventType);
    if (normalizedType === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
      console.log('📱 Foreground enter event');
    } else if (normalizedType === OsEventTypeList.FOREGROUND_EXIT_EVENT) {
      console.log('📱 Foreground exit event');
    }

    // Log unknown events if none of the channels matched
    if (!event?.textEvent && !event?.sysEvent && !event?.listEvent && !event?.audioEvent) {
      console.log('❓ Unknown event shape:', JSON.stringify(event, null, 2));
    }
  });

  // Setup keyboard controls for menu navigation
  // UP/DOWN arrows control the menu (matching glasses scroll gesture)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      console.log('⬆️ ArrowUp pressed - previous menu item');
      handleMenuNavigation('prev');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      console.log('⬇️ ArrowDown pressed - next menu item');
      handleMenuNavigation('next');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter pressed - ring click');
      handleRingClick();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      console.log('Escape pressed - ring double-click');
      handleRingDoubleClick();
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
  console.log('  W / K / ↑ (up arrow) = previous menu item (matches ring scroll up)');
  console.log('  S / J / ↓ (down arrow) = next menu item (matches ring scroll down)');
  console.log('  1/2/3 = select by number');
}

// ---------------------------------------------------------------------------
// Ring event helpers
// Adapted from the proven pattern in BxNxM/even-dev (demo, timer, restapi apps)
// ---------------------------------------------------------------------------

/**
 * Extract the raw eventType from an EvenHubEvent.
 * The SDK and simulator can deliver it in many different locations/formats,
 * so we check all known paths.
 */
function getRawEventType(event: EvenHubEvent): unknown {
  const raw = (event.jsonData ?? {}) as Record<string, unknown>;
  return (
    event.listEvent?.eventType ??
    event.textEvent?.eventType ??
    event.sysEvent?.eventType ??
    (event as Record<string, unknown>).eventType ??
    raw.eventType ??
    raw.event_type ??
    raw.Event_Type ??
    raw.type
  );
}

/**
 * Normalise a raw eventType value into the SDK's OsEventTypeList enum.
 * Handles numeric values (0-3), string enum names, and abbreviations.
 */
function normalizeEventType(rawEventType: unknown): OsEventTypeList | undefined {
  if (typeof rawEventType === 'number') {
    switch (rawEventType) {
      case 0: return OsEventTypeList.CLICK_EVENT;
      case 1: return OsEventTypeList.SCROLL_TOP_EVENT;
      case 2: return OsEventTypeList.SCROLL_BOTTOM_EVENT;
      case 3: return OsEventTypeList.DOUBLE_CLICK_EVENT;
      case 4: return OsEventTypeList.FOREGROUND_ENTER_EVENT;
      case 5: return OsEventTypeList.FOREGROUND_EXIT_EVENT;
      default: return undefined;
    }
  }

  if (typeof rawEventType === 'string') {
    const value = rawEventType.toUpperCase();
    if (value.includes('DOUBLE')) return OsEventTypeList.DOUBLE_CLICK_EVENT;
    if (value.includes('CLICK')) return OsEventTypeList.CLICK_EVENT;
    if (value.includes('SCROLL_TOP') || value.includes('UP')) return OsEventTypeList.SCROLL_TOP_EVENT;
    if (value.includes('SCROLL_BOTTOM') || value.includes('DOWN')) return OsEventTypeList.SCROLL_BOTTOM_EVENT;
    if (value.includes('FOREGROUND_ENTER')) return OsEventTypeList.FOREGROUND_ENTER_EVENT;
    if (value.includes('FOREGROUND_EXIT')) return OsEventTypeList.FOREGROUND_EXIT_EVENT;
  }

  // Try the SDK's own normalizer as last resort
  try {
    return OsEventTypeList.fromJson(rawEventType);
  } catch {
    return undefined;
  }
}

/**
 * Handle ring single-click.
 * In Find Target mode: starts/stops voice search.
 * In Explain mode: toggles lock on current object.
 * In other modes: confirms the active mode selection.
 */
function handleRingClick(): void {
  // Find Target mode: delegate to voice search handler
  if (appState.appMode === AppMode.TargetFinder && isFindTargetActive() && bridge) {
    handleFindTargetClick(bridge);
    updateBrowserDisplay();
    render();
    return;
  }

  // Explain mode: toggle lock on current object
  if (appState.appMode === AppMode.ConstellationHints) {
    const isNowLocked = handleExplainClick();
    console.log(`🔘 Click in Explain mode: ${isNowLocked ? 'LOCKED' : 'UNLOCKED'}`);
    updateBrowserDisplay();
    render();
    return;
  }

  const selectedLabel = getSelectedLabel(menuState);
  console.log(`🔘 Click: confirmed mode "${selectedLabel}" (index: ${menuState.selectedIndex})`);
  // Mode is already applied when scrolling; click is a confirmation.
  updateBrowserDisplay();
  render();
}

/**
 * Handle ring double-click.
 * In Find Target mode: cancels current voice search.
 * In other modes: no-op placeholder.
 */
function handleRingDoubleClick(): void {
  // Find Target mode: cancel voice search
  if (appState.appMode === AppMode.TargetFinder && isFindTargetActive()) {
    handleFindTargetDoubleClick();
    console.log('🔘🔘 Double-click: cancelled voice search');
    updateBrowserDisplay();
    render();
    return;
  }

  console.log('🔘🔘 Double-click: no action assigned yet');
}

/**
 * Handle menu navigation (next/prev)
 */
function handleMenuNavigation(direction: 'next' | 'prev'): void {
  // Navigate the mode selection menu
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
    const previousMode = appState.appMode;
    const newMode = handleMenuSelect(appState, selectedLabel);
    if (newMode !== null) {
      // Reset explain manager when leaving explain mode
      if (previousMode === AppMode.ConstellationHints && newMode !== AppMode.ConstellationHints) {
        resetExplainManager();
        currentExplainDisplay = null;
      }
      // Deactivate find target when leaving that mode
      if (previousMode === AppMode.TargetFinder && newMode !== AppMode.TargetFinder) {
        deactivateFindTargetMode();
      }
      // Activate find target when entering that mode
      if (newMode === AppMode.TargetFinder && previousMode !== AppMode.TargetFinder && bridge) {
        activateFindTargetMode(bridge, (target) => {
          appState.focusTarget = target;
          console.log('🎯 Voice search found target:', target.name);
          updateBrowserDisplay();
          render();
        });
      }
      console.log(`✓ Menu ${direction}: switched to mode:`, newMode, `(index: ${menuState.selectedIndex})`);
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

// Current explain mode display state
let currentExplainDisplay: ExplainDisplay | null = null;

/**
 * Render the sky to glasses
 */
function render(): void {
  if (!skyCtx || !appState.location) return;

  // Update explain mode if active
  if (appState.appMode === AppMode.ConstellationHints) {
    currentExplainDisplay = updateExplainMode(appState);
  } else {
    currentExplainDisplay = null;
  }

  // Update info panel content (explain mode overrides this below)
  currentInfoContent = updateInfoPanel(appState);

  // Override info panel content with explain banner when active
  if (currentExplainDisplay?.banner) {
    const banner = currentExplainDisplay.banner;
    currentInfoContent = {
      primary: `${banner.symbol} ${banner.name}`,
      secondary: banner.stats,
      tertiary: currentExplainDisplay.isLocked ? 'LOCKED — click to unlock' : undefined,
    };
  }

  // Render sky to offscreen canvas (for glasses)
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

  // Render explain mode overlay (banner + sidebar) on top of sky
  if (currentExplainDisplay && appState.appMode === AppMode.ConstellationHints) {
    renderExplainOverlay(skyCtx, currentExplainDisplay);
  }

  // Render find target voice overlay (bottom 1/3)
  if (appState.appMode === AppMode.TargetFinder && isFindTargetActive()) {
    renderFindTargetOverlay(skyCtx, getFindTargetOverlay());
  }

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

  // Deactivate find target mode (stops mic if active)
  deactivateFindTargetMode();

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
(window as unknown as Record<string, unknown>).handleRingClick = handleRingClick;
(window as unknown as Record<string, unknown>).handleRingDoubleClick = handleRingDoubleClick;
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
  console.log('Ring events: SCROLL_TOP=prev, SCROLL_BOTTOM=next, CLICK=select, DOUBLE_CLICK=back');
  console.log('Keyboard: W/K/↑=prev, S/J/↓=next, Enter=click, Escape=double-click, 1/2/3=select by number');
  console.log('Console: selectMenuItem(0), handleMenuNavigation("next"), handleRingClick(), handleRingDoubleClick()');
};

// Wire up Developer Panel "Find Target (Manual)" controls
function initDevPanelFindTarget(): void {
  const searchBtn = document.getElementById('find-target-search-btn');
  const textInput = document.getElementById('find-target-text-input') as HTMLInputElement | null;
  const resultDiv = document.getElementById('find-target-result');
  const resultName = document.getElementById('find-target-result-name');
  const statusDiv = document.getElementById('find-target-status');

  if (!searchBtn || !textInput) return;

  const doSearch = () => {
    const text = textInput.value.trim();
    if (!text) {
      if (statusDiv) statusDiv.textContent = 'Please enter text first';
      return;
    }

    // Ensure Find Target mode is active before processing
    if (!isFindTargetActive() && bridge) {
      activateFindTargetMode(bridge, (target) => {
        appState.focusTarget = target;
        console.log('🎯 Manual search found target:', target.name);
        updateBrowserDisplay();
        render();
      }).then(() => {
        processManualText(text);
        showResult();
      });
      return;
    }

    processManualText(text);
    showResult();
  };

  const showResult = () => {
    const overlay = getFindTargetOverlay();
    if (overlay.matchedName) {
      if (resultDiv) resultDiv.style.display = 'block';
      if (resultName) resultName.textContent = overlay.matchedName;
      if (statusDiv) statusDiv.textContent = `Matched from: "${textInput.value.trim()}"`;
    } else {
      if (resultDiv) resultDiv.style.display = 'none';
      if (statusDiv) statusDiv.textContent = `No match for: "${textInput.value.trim()}"`;
    }
  };

  searchBtn.addEventListener('click', doSearch);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}

// Start the application
init().then(() => {
  initDevPanelFindTarget();
}).catch((error) => {
  console.error('Initialization failed:', error);
});
