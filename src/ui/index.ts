// UI Module - Public API
// Container management and info panel for Even glasses

// Container management
export {
  CONTAINER_IDS,
  GLASSES_WIDTH,
  GLASSES_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MENU_HEIGHT,
  MENU_Y_POSITION,
  SINGLE_MENU_WIDTH,
  createSkyViewContainer,
  createInfoTextContainer,
  createMenuEventContainer,
  createSimplifiedStartupConfig,
  createSimplifiedRebuildConfig,
  generateInfoText,
} from './containers';

// Simple menu
export {
  getMenuItemNames,
  handleMenuSelect,
  cycleMode,
  SIMPLE_MENU_ITEMS,
  type SimpleMenuItem,
} from './simpleMenu';

// Horizontal Menu (image-based)
export {
  renderHorizontalMenu,
  createMenuState,
  selectNextItem,
  selectPreviousItem,
  selectItemByIndex,
  getSelectedItem,
  getSelectedLabel,
  type HorizontalMenuItem,
  type HorizontalMenuState,
} from './horizontalMenu';

// Info Panel
export {
  InfoPanelManager,
  getInfoPanelManager,
  disposeInfoPanelManager,
  updateInfoPanel,
  formatForSDK,
  InfoPanelState,
  type InfoPanelLayout,
  type InfoPanelContent,
  type InfoPanelStyle,
  type InfoPanelConfig,
  DEFAULT_INFO_PANEL_LAYOUT,
  DEFAULT_INFO_PANEL_STYLE,
  DEFAULT_INFO_PANEL_CONFIG,
} from './infoPanel';
