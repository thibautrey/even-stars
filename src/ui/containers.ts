// UI Container definitions for Even glasses display

import type {
  ListContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk';

// Container IDs
export const CONTAINER_IDS = {
  SKY_VIEW: 1,
  INFO: 2,
  MODE_SELECTOR: 3,
} as const;

// Glasses display dimensions
export const GLASSES_WIDTH = 576;
export const GLASSES_HEIGHT = 288;

// Image container takes full width, leaves room for menu at bottom
export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 220; // 288 - 68 for menu area

/**
 * Create the main sky view image container
 * Full width (576), height 220, leaving 68px for menu at bottom
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
 * Create the mode selector list container
 */
export function createModeSelectorContainer(): ListContainerProperty {
  const itemContainer = {
    itemCount: 3,
    itemWidth: 0,
    isItemSelectBorderEn: 1,
    itemName: ['Stars', 'Constellations', 'Planets'],
    toJson: () => ({
      itemCount: 3,
      itemWidth: 0,
      isItemSelectBorderEn: 1,
      itemName: ['Stars', 'Constellations', 'Planets'],
    }),
  };

  return {
    xPosition: 10,
    yPosition: 228,
    width: 556,
    height: 55,
    borderWidth: 1,
    borderColor: 8,
    borderRdaius: 3,
    paddingLength: 3,
    containerID: CONTAINER_IDS.MODE_SELECTOR,
    containerName: 'mode-selector',
    itemContainer,
    isEventCapture: 1,
    toJson: () => ({
      xPosition: 10,
      yPosition: 228,
      width: 556,
      height: 55,
      borderWidth: 1,
      borderColor: 8,
      borderRdaius: 3,
      paddingLength: 3,
      containerID: CONTAINER_IDS.MODE_SELECTOR,
      containerName: 'mode-selector',
      itemContainer: itemContainer.toJson(),
      isEventCapture: 1,
    }),
  };
}

/**
 * Create the startup page container configuration
 * This must be called only once when initializing
 */
export function createStartupPageConfig(): CreateStartUpPageContainer {
  const config: CreateStartUpPageContainer = {
    containerTotalNum: 2,
    imageObject: [createSkyViewContainer()],
    listObject: [createModeSelectorContainer()],
    toJson: function() {
      return {
        containerTotalNum: 2,
        imageObject: this.imageObject?.map(o => o.toJson()) || [],
        textObject: this.textObject?.map(o => o.toJson()) || [],
        listObject: this.listObject?.map(o => o.toJson()) || [],
      };
    },
  };
  return config;
}

/**
 * Create a simplified page config for rebuilding
 * (Same structure as startup but used for updates)
 */
export function createPageRebuildConfig(): CreateStartUpPageContainer {
  return createStartupPageConfig();
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


