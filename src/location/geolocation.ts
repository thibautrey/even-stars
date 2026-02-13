// Geolocation services for getting observer's position

import type { GeoLocation } from '../types';

/**
 * Default location (used when geolocation is unavailable)
 * Set to Greenwich Observatory as a neutral default
 */
export const DEFAULT_LOCATION: GeoLocation = {
  latitude: 51.4769,  // Greenwich
  longitude: 0.0005,
  altitude: 0,
};

/**
 * Check if geolocation is available in the browser
 */
export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Get current position using browser geolocation API
 * @returns Promise resolving to GeoLocation
 */
export function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation is not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Watch position changes
 * @param callback Function to call when position updates
 * @returns Watch ID for clearing
 */
export function watchPosition(
  callback: (location: GeoLocation) => void
): number | null {
  if (!isGeolocationAvailable()) {
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || 0,
      });
    },
    (error) => {
      console.error('Position watch error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
}

/**
 * Clear position watch
 * @param watchId Watch ID returned by watchPosition
 */
export function clearPositionWatch(watchId: number): void {
  if (isGeolocationAvailable()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Get a human-readable location string
 */
export function formatLocation(location: GeoLocation): string {
  const latDir = location.latitude >= 0 ? 'N' : 'S';
  const lonDir = location.longitude >= 0 ? 'E' : 'W';
  const lat = Math.abs(location.latitude).toFixed(2);
  const lon = Math.abs(location.longitude).toFixed(2);
  return `${lat}°${latDir}, ${lon}°${lonDir}`;
}

/**
 * Load saved location from localStorage
 */
export function loadSavedLocation(): GeoLocation | null {
  try {
    const saved = localStorage.getItem('even-stars-location');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

/**
 * Save location to localStorage
 */
export function saveLocation(location: GeoLocation): void {
  try {
    localStorage.setItem('even-stars-location', JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}
