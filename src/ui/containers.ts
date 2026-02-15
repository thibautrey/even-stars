// UI Container definitions for Even glasses display

import type {
  ImageContainerProperty,
  TextContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk';

// Container IDs
// Layout: Main sky view (with menu rendered on top) + Info text + Event capture text container
export const CONTAINER_IDS = {
  SKY_VIEW: 1,      // Main view area (sky + menu rendered together)
  INFO_TEXT: 2,     // Text info container
  EVENT_CAPTURE: 3, // Text container with isEventCapture=1 for receiving scroll/click events
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
 * Create a text container for capturing ring events (scroll, click, double-click).
 * Using a TextContainerProperty (instead of ListContainerProperty) ensures that
 * scroll/swipe events arrive as textEvent with SCROLL_TOP_EVENT/SCROLL_BOTTOM_EVENT,
 * rather than being consumed by the native list widget.
 * 
 * The container is positioned behind the image container, so it's visually hidden,
 * but it still captures ring input events via isEventCapture=1.
 *
 * See SDK_DOCUMENTATION.md § "Event Handling Best Practices" for details.
 */
export function createEventCaptureContainer(): TextContainerProperty {
  return {
    xPosition: 0,
    yPosition: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    borderWidth: 0,
    borderColor: 0,
    borderRdaius: 0,
    paddingLength: 0,
    containerID: CONTAINER_IDS.EVENT_CAPTURE,
    containerName: 'event-capture',
    content: '',
    isEventCapture: 1,
    toJson: () => ({
      xPosition: 0,
      yPosition: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      borderWidth: 0,
      borderColor: 0,
      borderRdaius: 0,
      paddingLength: 0,
      containerID: CONTAINER_IDS.EVENT_CAPTURE,
      containerName: 'event-capture',
      content: '',
      isEventCapture: 1,
    }),
  };
}



/**
 * Create simplified startup page config
 * Sky view includes the menu rendered on top
 * Plus an invisible text container for capturing scroll/click events
 */
export function createSimplifiedStartupConfig(_menuItemNames: string[] = ['Find Target', 'Explain', 'Time']): CreateStartUpPageContainer {
  const config: CreateStartUpPageContainer = {
    containerTotalNum: 3, // Sky view + info text + event capture text
    imageObject: [createSkyViewContainer()],
    textObject: [createInfoTextContainer(), createEventCaptureContainer()],
    toJson: function() {
      return {
        containerTotalNum: 3,
        imageObject: this.imageObject?.map(o => o.toJson()) || [],
        textObject: this.textObject?.map(o => o.toJson()) || [],
      };
    },
  };
  return config;
}

/**
 * Create page rebuild config
 */
export function createSimplifiedRebuildConfig(_menuItemNames: string[] = ['Find Target', 'Explain', 'Time']): CreateStartUpPageContainer {
  return createSimplifiedStartupConfig(_menuItemNames);
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
