// Search menu system for the left menu - object finder/locator

import type { MenuState } from '../types';
import { SearchCategory, type SearchableObject } from '../types/search';
import {
  getAllSearchableObjects,
  getSearchableObjectsByCategory,
  findObjectById,
  getObjectNamesForMenu,
} from '../sky/searchCatalog';

// Search menu categories as menu items
export const SEARCH_MENU_CATEGORIES = [
  { name: 'All', value: SearchCategory.All },
  { name: 'Stars', value: SearchCategory.BrightStars },
  { name: 'Planets', value: SearchCategory.Planets },
  { name: 'Deep Sky', value: SearchCategory.DeepSky },
  { name: 'Constellations', value: SearchCategory.Constellations },
];

/**
 * Create initial search menu state (shows categories)
 */
export function createInitialSearchMenuState(): MenuState {
  return {
    currentItems: SEARCH_MENU_CATEGORIES.map(cat => ({
      name: cat.name,
      value: cat.value,
    })),
    history: [],
    level: 0,
    path: [],
  };
}

/**
 * Navigate into a category to show objects
 */
export function navigateToCategory(menuState: MenuState, categoryName: string): boolean {
  const category = SEARCH_MENU_CATEGORIES.find(c => c.name === categoryName);
  if (!category) return false;

  const objects = getSearchableObjectsByCategory(category.value);
  
  // Save current state to history
  menuState.history.push([...menuState.currentItems]);
  
  // Show objects in this category
  menuState.currentItems = objects.map(obj => ({
    name: obj.name,
    value: obj.id, // Store the object ID
    description: obj.info || `${obj.type} in ${obj.constellation || 'unknown'}`,
  }));
  
  menuState.level = 1;
  menuState.path = [categoryName];
  return true;
}

/**
 * Navigate back to categories
 */
export function navigateSearchBack(menuState: MenuState): boolean {
  if (menuState.level === 0 || menuState.history.length === 0) {
    return false;
  }
  
  const parentItems = menuState.history.pop();
  if (parentItems) {
    menuState.currentItems = parentItems;
    menuState.level--;
    menuState.path.pop();
    return true;
  }
  
  return false;
}

/**
 * Get the selected object from a menu item name
 */
export function getSelectedObject(itemName: string): SearchableObject | undefined {
  const allObjects = getAllSearchableObjects();
  return allObjects.find(obj => obj.name === itemName);
}

/**
 * Check if an item is a category (not an object)
 */
export function isCategory(itemName: string): boolean {
  return SEARCH_MENU_CATEGORIES.some(c => c.name === itemName);
}

/**
 * Get current menu names
 */
export function getSearchMenuNames(menuState: MenuState): string[] {
  return menuState.currentItems.map(item => item.name);
}

/**
 * Check if we can go back in the search menu
 */
export function canSearchGoBack(menuState: MenuState): boolean {
  return menuState.level > 0;
}

/**
 * Get breadcrumb for display
 */
export function getSearchBreadcrumb(menuState: MenuState): string {
  if (menuState.path.length === 0) {
    return 'Find';
  }
  return `Find > ${menuState.path.join(' > ')}`;
}

// Re-export catalog functions for convenience
export { getAllSearchableObjects, getSearchableObjectsByCategory, findObjectById, getObjectNamesForMenu };
