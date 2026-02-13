// UI Container definitions for Even glasses display

import type {
  ListContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk';

import { ActiveMenu } from '../types';

// Container IDs
export const CONTAINER_IDS = {
  SKY_VIEW: 1,
  INFO: 2,
  LEFT_MENU: 3,
  RIGHT_MENU: 4,
} as const;

// Glasses display dimensions
export const GLASSES_WIDTH = 576;
export const GLASSES_HEIGHT = 288;

// Image container takes full width, leaves room for menus at bottom
export const CANVAS_WIDTH = 576;
export const CANVAS_HEIGHT = 232; // 288 - 56 for menu area (menu + padding)

// Menu dimensions - must fit within 576x288
// Layout: [8px margin][left menu][8px gap][right menu][8px margin]
// Width: 8 + 276 + 8 + 276 + 8 = 576 ✓
export const MENU_HEIGHT = 40;
export const MENU_Y_POSITION = 240; // 288 - 40 - 8 (bottom margin)
export const MENU_SPACING = 8;      // Gap between menus
export const LEFT_MENU_WIDTH = 276;  // (576 - 8 - 8 - 8) / 2 = 276
export const RIGHT_MENU_WIDTH = 276;

/**
 * Create the main sky view image container
 * Full width (576), height 235, leaving 53px for menu area at bottom
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
 * Create the left menu container (primary navigation)
 */
export function createLeftMenuContainer(itemNames: string[] = ['Stars', 'Constellations', 'Planets'], isActive: boolean = true): ListContainerProperty {
  const itemContainer = {
    itemCount: itemNames.length,
    itemWidth: 0,
    isItemSelectBorderEn: 1,
    itemName: itemNames,
    toJson: () => ({
      itemCount: itemNames.length,
      itemWidth: 0,
      isItemSelectBorderEn: 1,
      itemName: itemNames,
    }),
  };

  // Border color: 8 = white when active, 5 = gray when inactive
  const borderColor = isActive ? 8 : 5;

  return {
    xPosition: 8,
    yPosition: MENU_Y_POSITION,
    width: LEFT_MENU_WIDTH,
    height: MENU_HEIGHT,
    borderWidth: isActive ? 2 : 1,
    borderColor: borderColor,
    borderRdaius: 3,
    paddingLength: 3,
    containerID: CONTAINER_IDS.LEFT_MENU,
    containerName: 'left-menu',
    itemContainer,
    isEventCapture: isActive ? 1 : 0, // Active menu must capture events
    toJson: () => ({
      xPosition: 8,
      yPosition: MENU_Y_POSITION,
      width: LEFT_MENU_WIDTH,
      height: MENU_HEIGHT,
      borderWidth: isActive ? 2 : 1,
      borderColor: borderColor,
      borderRdaius: 3,
      paddingLength: 3,
      containerID: CONTAINER_IDS.LEFT_MENU,
      containerName: 'left-menu',
      itemContainer: itemContainer.toJson(),
      isEventCapture: isActive ? 1 : 0,
    }),
  };
}

/**
 * Create the right menu container (secondary - Stars vs Deep Sky)
 */
export function createRightMenuContainer(itemNames: string[] = ['Stars', 'Deep Sky'], isActive: boolean = false): ListContainerProperty {
  const itemContainer = {
    itemCount: itemNames.length,
    itemWidth: 0,
    isItemSelectBorderEn: 1,
    itemName: itemNames,
    toJson: () => ({
      itemCount: itemNames.length,
      itemWidth: 0,
      isItemSelectBorderEn: 1,
      itemName: itemNames,
    }),
  };

  // Border color: 8 = white when active, 5 = gray when inactive
  const borderColor = isActive ? 8 : 5;

  return {
    xPosition: 8 + LEFT_MENU_WIDTH + MENU_SPACING,
    yPosition: MENU_Y_POSITION,
    width: RIGHT_MENU_WIDTH,
    height: MENU_HEIGHT,
    borderWidth: isActive ? 2 : 1,
    borderColor: borderColor,
    borderRdaius: 3,
    paddingLength: 3,
    containerID: CONTAINER_IDS.RIGHT_MENU,
    containerName: 'right-menu',
    itemContainer,
    isEventCapture: isActive ? 1 : 0, // Active menu must capture events
    toJson: () => ({
      xPosition: 8 + LEFT_MENU_WIDTH + MENU_SPACING,
      yPosition: MENU_Y_POSITION,
      width: RIGHT_MENU_WIDTH,
      height: MENU_HEIGHT,
      borderWidth: isActive ? 2 : 1,
      borderColor: borderColor,
      borderRdaius: 3,
      paddingLength: 3,
      containerID: CONTAINER_IDS.RIGHT_MENU,
      containerName: 'right-menu',
      itemContainer: itemContainer.toJson(),
      isEventCapture: isActive ? 1 : 0,
    }),
  };
}

/**
 * @deprecated Use createLeftMenuContainer instead
 */
export function createModeSelectorContainer(itemNames: string[] = ['Stars', 'Constellations', 'Planets']): ListContainerProperty {
  return createLeftMenuContainer(itemNames, true);
}

/**
 * Create list container configuration from item names
 * For use with rebuildPageContainer - creates both menus
 */
export function createListContainerConfig(
  leftItemNames: string[], 
  rightItemNames: string[] = ['Stars', 'Deep Sky'],
  activeMenu: ActiveMenu = ActiveMenu.Left
): ListContainerProperty[] {
  const isLeftActive = activeMenu === ActiveMenu.Left;
  
  return [
    createLeftMenuContainer(leftItemNames, isLeftActive),
    createRightMenuContainer(rightItemNames, !isLeftActive),
  ];
}

/**
 * @deprecated Use createListContainerConfig with multiple items
 */
export function createSingleListContainerConfig(itemNames: string[]): ListContainerProperty {
  const itemContainer = {
    itemCount: itemNames.length,
    itemWidth: 0,
    isItemSelectBorderEn: 1,
    itemName: itemNames,
    toJson: () => ({
      itemCount: itemNames.length,
      itemWidth: 0,
      isItemSelectBorderEn: 1,
      itemName: itemNames,
    }),
  };

  return {
    containerID: CONTAINER_IDS.LEFT_MENU,
    containerName: 'left-menu',
    xPosition: 10,
    yPosition: 243,
    width: 556,
    height: 40,
    borderWidth: 1,
    borderColor: 8,
    borderRdaius: 3,
    paddingLength: 3,
    isEventCapture: 1,
    itemContainer,
    toJson: () => ({
      containerID: CONTAINER_IDS.LEFT_MENU,
      containerName: 'left-menu',
      xPosition: 10,
      yPosition: 243,
      width: 556,
      height: 40,
      borderWidth: 1,
      borderColor: 8,
      borderRdaius: 3,
      paddingLength: 3,
      isEventCapture: 1,
      itemContainer: itemContainer.toJson(),
    }),
  };
}

/**
 * Create the startup page container configuration
 * This must be called only once when initializing
 */
export function createStartupPageConfig(): CreateStartUpPageContainer {
  const config: CreateStartUpPageContainer = {
    containerTotalNum: 3,
    imageObject: [createSkyViewContainer()],
    listObject: [createLeftMenuContainer(), createRightMenuContainer()],
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

