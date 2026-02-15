// UI Container definitions for Even glasses display

import type {
  ImageContainerProperty,
  TextContainerProperty,
  ListContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk';

// Container IDs
// Layout: Main sky view (with menu rendered on top) + Info text + Event capture container
export const CONTAINER_IDS = {
  SKY_VIEW: 1,      // Main view area (sky + menu rendered together)
  INFO_TEXT: 2,     // Text info container
  MENU_EVENT: 3,    // Invisible list container for capturing scroll events
} as const;

// Glasses display dimensions
export const GLASSES_WIDTH = 576;
export const GLASSES_HEIGHT = 288;

// Sky chart takes full screen size (576x288)
// Menu is rendered on top of the sky chart at the bottom
export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 288; // Full screen height

// Menu dimensions - overlaid at bottom of screen
// Layout: [8px margin][menu image][8px margin]
// Width: 8 + 560 + 8 = 576 ✓
export const MENU_HEIGHT = 32;
export const MENU_Y_POSITION = 248; // 288 - 32 - 8 (bottom margin)
export const SINGLE_MENU_WIDTH = 560; // Full width for single menu

/**
 * Create the main sky view image container
 * Full screen size (576x288), menu is rendered on top
 */
export function createSkyViewContainer(): ImageContainerProperty {
  return {
    xPosition: 0,
    yPosition: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    containerID: CONTAINER_IDS.SKY_VIEW,
    containerName: 'sky-view',
    toJson: () => ({
      xPosition: 0,
      yPosition: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      containerID: CONTAINER_IDS.SKY_VIEW,
      containerName: 'sky-view',
    }),
  };
}

/**
 * Create the info text container for displaying identification text
 * Positioned at top of screen, overlaying the sky view
 */
export function createInfoTextContainer(): TextContainerProperty {
  return {
    xPosition: 10,
    yPosition: 10,
    width: 556, // 576 - 10 - 10
    height: 70, // Enough for 3 lines of text
    containerID: CONTAINER_IDS.INFO_TEXT,
    containerName: 'info-text',
    content: 'Point at sky', // Initial content
    toJson: () => ({
      xPosition: 10,
      yPosition: 10,
      width: 556,
      height: 70,
      containerID: CONTAINER_IDS.INFO_TEXT,
      containerName: 'info-text',
      content: 'Point at sky',
    }),
  };
}

/**
 * Create an invisible container for capturing scroll events
 * This container has 20 virtual items so scroll events can change selectedItemIndex.
 * We detect direction by tracking index changes and render our own menu image separately.
 */
export function createMenuEventContainer(): ListContainerProperty {
  // Create 20 virtual items to enable scrolling detection
  // Scrolling up increases index (0→1→2...→19→0), down decreases (1→0→19→...)
  const virtualItemNames = Array.from({ length: 20 }, (_, i) => `_${i}`);
  
  const itemContainer = {
    itemCount: 20,
    itemWidth: 0,
    isItemSelectBorderEn: 0, // No selection border
    itemName: virtualItemNames,
    toJson: () => ({
      itemCount: 20,
      itemWidth: 0,
      isItemSelectBorderEn: 0,
      itemName: virtualItemNames,
    }),
  };

  return {
    xPosition: 8,
    yPosition: MENU_Y_POSITION,
    width: SINGLE_MENU_WIDTH,
    height: MENU_HEIGHT,
    borderWidth: 0,          // No border (invisible)
    borderColor: 0,          // Black
    borderRdaius: 0,
    paddingLength: 0,
    containerID: CONTAINER_IDS.MENU_EVENT,
    containerName: 'menu-event',
    itemContainer,
    isEventCapture: 1,       // Captures scroll events
    toJson: () => ({
      xPosition: 8,
      yPosition: MENU_Y_POSITION,
      width: SINGLE_MENU_WIDTH,
      height: MENU_HEIGHT,
      borderWidth: 0,
      borderColor: 0,
      borderRdaius: 0,
      paddingLength: 0,
      containerID: CONTAINER_IDS.MENU_EVENT,
      containerName: 'menu-event',
      itemContainer: itemContainer.toJson(),
      isEventCapture: 1,
    }),
  };
}



/**
 * Create simplified startup page config
 * Sky view includes the menu rendered on top
 * Plus an invisible list container for capturing scroll events
 */
export function createSimplifiedStartupConfig(): CreateStartUpPageContainer {
  const config: CreateStartUpPageContainer = {
    containerTotalNum: 3, // Sky view + text info + event capture container
    imageObject: [createSkyViewContainer()],
    textObject: [createInfoTextContainer()],
    listObject: [createMenuEventContainer()], // Captures scroll events
    toJson: function() {
      return {
        containerTotalNum: 3,
        imageObject: this.imageObject?.map(o => o.toJson()) || [],
        textObject: this.textObject?.map(o => o.toJson()) || [],
        listObject: this.listObject?.map(o => o.toJson()) || [],
      };
    },
  };
  return config;
}

/**
 * Create page rebuild config
 */
export function createSimplifiedRebuildConfig(): CreateStartUpPageContainer {
  return createSimplifiedStartupConfig();
}

/**
 * Generate text content for info panel
 */
export function generateInfoText(
  objectName: string,
  magnitude?: number,
  constellation?: string
): string {
  let text = objectName;
  if (magnitude !== undefined) {
    text += ` | Mag: ${magnitude.toFixed(1)}`;
  }
  if (constellation) {
    text += ` | ${constellation}`;
  }
  return text;
}
