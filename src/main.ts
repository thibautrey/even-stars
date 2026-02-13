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
import { ViewMode, StarFilter, ConstellationFilter, PlanetFilter, DeepSkyFilter, ActiveMenu } from './types';

import { 
  renderSkyToBuffer,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
} from './sky/renderer';

import { 
  createStartupPageConfig,
  createSkyViewContainer,
  createLeftMenuContainer,
  createRightMenuContainer,
  CONTAINER_IDS,
} from './ui/containers';

import {
  createInitialSecondaryMenuState,
  navigateInto,
  navigateBack,
  getCurrentMenuNames,
  findMenuItem,
  canGoBack,
  toStarFilter,
  toConstellationFilter,
  toPlanetFilter,
  toDeepSkyFilter,
  switchActiveMenu,
} from './ui/menu';



import {
  createInitialSearchMenuState,
  navigateToCategory,
  navigateSearchBack,
  getSearchMenuNames,
  canSearchGoBack,
  getSelectedObject,
} from './ui/searchMenu';

import { createInitialSearchState } from './types/search';

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
  menuState: createInitialSearchMenuState(), // Left menu is now the search menu
  secondaryMenuState: createInitialSecondaryMenuState(),
  activeMenu: ActiveMenu.Left,
  starFilter: StarFilter.All,
  constellationFilter: ConstellationFilter.All,
  planetFilter: PlanetFilter.All,
  deepSkyFilter: DeepSkyFilter.All,
  searchState: createInitialSearchState(),
  finderTarget: null,
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

const MENU_ACTION_BACK = '[Back]';
const MENU_SWITCH_DOUBLE_CLICK_THRESHOLD = 600;
let lastMenuSwitchClickTime = 0;
let lastMenuSwitchItem: string | null = null;

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
    void updateMenuDisplay();
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
  
  console.log('Even Stars initialized. Menu functions available in console:');
  console.log('  - handleListEvent(name): simulate menu click');
  console.log('  - switchMenuFocus(): switch active menu');
  console.log('  - appState: view current state');
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
  const viewModeSelect = document.getElementById('setting-view-mode') as HTMLSelectElement | null;
  if (viewModeSelect) {
    viewModeSelect.addEventListener('change', () => {
      appState.viewMode = viewModeSelect.value === ViewMode.DeepSky ? ViewMode.DeepSky : ViewMode.Stars;
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

function canMenuGoBack(menu: ActiveMenu): boolean {
  return menu === ActiveMenu.Left
    ? canSearchGoBack(appState.menuState)
    : canGoBack(appState.secondaryMenuState);
}

function getBaseMenuItems(menu: ActiveMenu): string[] {
  return menu === ActiveMenu.Left
    ? getSearchMenuNames(appState.menuState)
    : getCurrentMenuNames(appState.secondaryMenuState);
}

function getDisplayMenuItems(menu: ActiveMenu): string[] {
  const items: string[] = [];

  if (canMenuGoBack(menu)) {
    items.push(MENU_ACTION_BACK);
  }

  items.push(...getBaseMenuItems(menu));
  return items;
}

/**
 * Update the browser companion display
 */
function updateBrowserDisplay(): void {
  const statusEl = document.getElementById('status-value');
  const locationEl = document.getElementById('location-value');
  const modeEl = document.getElementById('mode-value');
  const targetEl = document.getElementById('target-value');
  const orientationEl = document.getElementById('orientation-value');
  const viewModeSelect = document.getElementById('setting-view-mode') as HTMLSelectElement | null;
  const statusBadge = document.getElementById('status-badge');

  if (statusEl) {
    statusEl.textContent = appState.isConnected ? 'Connected' : 'Waiting for glasses';
  }
  if (statusBadge) {
    statusBadge.className = appState.isConnected ? 'value-pill connected' : 'value-pill disconnected';
    statusBadge.textContent = appState.isConnected ? 'Connected' : 'Disconnected';
  }
  if (locationEl) {
    locationEl.textContent = appState.location ? formatLocation(appState.location) : 'Unknown';
  }
  if (modeEl) {
    modeEl.textContent = appState.viewMode;
  }
  if (targetEl) {
    targetEl.textContent = appState.finderTarget?.name ?? 'None selected';
  }
  if (orientationEl) {
    orientationEl.textContent = formatOrientation(appState.orientation);
  }
  if (viewModeSelect) {
    viewModeSelect.value = appState.viewMode;
  }
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
        void updateMenuDisplay();
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
      handleListEvent(event.listEvent.currentSelectItemName, event.listEvent.containerID);
    } else if (event.textEvent) {
      console.log('Text event:', event.textEvent);
    } else if (event.sysEvent) {
      console.log('System event:', event.sysEvent.eventType);
    }
  });
}

/**
 * Handle list selection events from glasses
 * Uses explicit single-click actions with menu control items.
 */
function handleListEvent(itemName: string | undefined, containerId?: number): void {
  if (!itemName) {
    return;
  }

  const sourceMenu = getSourceMenu(itemName, containerId);
  if (!sourceMenu) {
    console.warn('Menu event could not be mapped to a menu:', { itemName, containerId });
    return;
  }

  if (sourceMenu !== appState.activeMenu) {
    console.log('Ignoring selection from inactive menu:', { itemName, sourceMenu, active: appState.activeMenu });
    return;
  }

  if (
    appState.menuState.level === 0 &&
    appState.secondaryMenuState.level === 0 &&
    itemName !== MENU_ACTION_BACK
  ) {
    const now = Date.now();
    const isSameItem = lastMenuSwitchItem === itemName;
    const timeSinceLast = now - lastMenuSwitchClickTime;
    if (isSameItem && timeSinceLast < MENU_SWITCH_DOUBLE_CLICK_THRESHOLD) {
      switchMenuFocus();
      lastMenuSwitchClickTime = 0;
      lastMenuSwitchItem = null;
      return;
    }
    lastMenuSwitchClickTime = now;
    lastMenuSwitchItem = itemName;
  }

  const handled = handleMenuSingleClick(itemName, sourceMenu);
  if (!handled) {
    console.warn('Menu item not handled:', itemName);
    return;
  }

  void updateMenuDisplay();
  updateBrowserDisplay();
  render();
}

function getSourceMenu(itemName: string, containerId?: number): ActiveMenu | null {
  if (containerId === CONTAINER_IDS.LEFT_MENU) {
    return ActiveMenu.Left;
  }

  if (containerId === CONTAINER_IDS.RIGHT_MENU) {
    return ActiveMenu.Right;
  }

  if (getDisplayMenuItems(appState.activeMenu).includes(itemName)) {
    return appState.activeMenu;
  }

  const otherMenu = appState.activeMenu === ActiveMenu.Left ? ActiveMenu.Right : ActiveMenu.Left;
  if (getDisplayMenuItems(otherMenu).includes(itemName)) {
    return otherMenu;
  }

  return null;
}

/**
 * Switch focus between left and right menus
 */
function switchMenuFocus(): void {
  appState.activeMenu = switchActiveMenu(appState.activeMenu);
  console.log('Switched to menu:', appState.activeMenu);

  void updateMenuDisplay();
  updateBrowserDisplay();
}

/**
 * Handle single click on menu item
 * Returns true when the click changed application state.
 */
function handleMenuSingleClick(itemName: string, sourceMenu: ActiveMenu = appState.activeMenu): boolean {
  if (sourceMenu === ActiveMenu.Left) {
    return handleSearchMenuClick(itemName);
  }

  return handleViewMenuClick(itemName);
}

/**
 * Handle click on the search/finder menu (left menu).
 */
function handleSearchMenuClick(itemName: string): boolean {
  if (itemName === MENU_ACTION_BACK) {
    const wentBack = navigateSearchBack(appState.menuState);
    if (wentBack) {
      console.log('Search: Navigated back to categories');
    }
    return wentBack;
  }

  if (appState.menuState.level === 0) {
    const success = navigateToCategory(appState.menuState, itemName);
    if (success) {
      console.log('Search: Showing category:', itemName);
    }
    return success;
  }

  const selectedObject = getSelectedObject(itemName);
  if (!selectedObject) {
    return false;
  }

  if (appState.finderTarget?.id === selectedObject.id) {
    appState.finderTarget = null;
    console.log('Finder: Cleared target');
  } else {
    appState.finderTarget = selectedObject;
    console.log('Finder: Target set to', selectedObject.name, selectedObject);
  }

  return true;
}

/**
 * Handle click on the view/filter menu (right menu).
 */
function handleViewMenuClick(itemName: string): boolean {
  if (itemName === MENU_ACTION_BACK) {
    const wentBack = navigateBack(appState.secondaryMenuState);
    if (wentBack) {
      console.log('Navigated back in right menu');
    }
    return wentBack;
  }

  const rightMenuItem = findMenuItem(appState.secondaryMenuState, itemName);
  if (!rightMenuItem) {
    return false;
  }

  const enteredSubmenu = navigateInto(appState.secondaryMenuState, itemName);
  if (enteredSubmenu) {
    applyViewSelection(rightMenuItem);
    console.log('Navigated into right submenu:', itemName);
    return true;
  }

  applyViewSelection(rightMenuItem);
  return true;
}

function applyViewSelection(item: NonNullable<ReturnType<typeof findMenuItem>>): void {
  if (!item.viewMode) {
    return;
  }

  appState.viewMode = item.viewMode;

  switch (item.viewMode) {
    case ViewMode.Stars:
      if (item.value) {
        appState.starFilter = toStarFilter(item.value);
        console.log('Star filter changed to:', appState.starFilter);
      }
      break;
    case ViewMode.Constellations:
      if (item.value) {
        appState.constellationFilter = toConstellationFilter(item.value);
      }
      break;
    case ViewMode.Planets:
      if (item.value) {
        appState.planetFilter = toPlanetFilter(item.value);
      }
      break;
    case ViewMode.DeepSky:
      if (item.value) {
        appState.deepSkyFilter = toDeepSkyFilter(item.value);
        console.log('Deep sky filter changed to:', appState.deepSkyFilter);
      }
      break;
    default:
      break;
  }
}

/**
 * Update the glasses menu display with current menu items from both menus
 */
async function updateMenuDisplay(): Promise<void> {
  if (!bridge || !appState.isConnected) return;
  
  const leftMenuNames = getDisplayMenuItems(ActiveMenu.Left);
  const rightMenuNames = getDisplayMenuItems(ActiveMenu.Right);
  console.log('Rebuilding menus - Left (Search):', leftMenuNames, 'Right:', rightMenuNames, 'Active:', appState.activeMenu);
  
  try {
    // Create both menu containers with appropriate active state
    const isLeftActive = appState.activeMenu === ActiveMenu.Left;
    const leftMenuContainer = createLeftMenuContainer(leftMenuNames, isLeftActive);
    const rightMenuContainer = createRightMenuContainer(rightMenuNames, !isLeftActive);
    const skyViewContainer = createSkyViewContainer();
    
    const success = await bridge.rebuildPageContainer({
      containerTotalNum: 3,
      imageObject: [skyViewContainer],
      listObject: [leftMenuContainer, rightMenuContainer],
      toJson: function() {
        return {
          containerTotalNum: 3,
          imageObject: this.imageObject?.map(o => o.toJson()) || [],
          textObject: this.textObject?.map(o => o.toJson()) || [],
          listObject: this.listObject?.map(o => o.toJson()) || [],
        };
      },
    });
    
    if (success) {
      console.log('Menus rebuilt successfully');
    } else {
      console.error('Failed to rebuild menus');
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
  renderSkyToBuffer({
    ctx: skyCtx,
    location: appState.location,
    orientation: appState.orientation,
    viewMode: appState.viewMode,
    selectedStar: appState.selectedStar,
    starFilter: appState.starFilter,
    constellationFilter: appState.constellationFilter,
    planetFilter: appState.planetFilter,
    deepSkyFilter: appState.deepSkyFilter,
    finderTarget: appState.finderTarget,
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
(window as unknown as Record<string, unknown>).handleListEvent = handleListEvent;
(window as unknown as Record<string, unknown>).handleMenuSingleClick = handleMenuSingleClick;
(window as unknown as Record<string, unknown>).switchMenuFocus = switchMenuFocus;
(window as unknown as Record<string, unknown>).appState = appState;

// Start the application
init().catch((error) => {
  console.error('Initialization failed:', error);
});
