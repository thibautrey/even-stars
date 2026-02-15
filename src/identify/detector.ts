// Object Detection Engine for Even Stars
// Identifies celestial objects based on head orientation and location

import type {
  HeadOrientation,
  GeoLocation,
  FocusTarget,
  IdentifiedObject,
  Star,
} from '../types';
import {
  getStarHorizontalCoords,
  getViewOffset,
  isInFieldOfView,
  isAboveHorizon,
  toRadians,
  toDegrees,
} from '../sky/calculator';
import { BRIGHT_STARS } from '../sky/stars';
import { PLANETS, getPlanetHorizontalCoords, type Planet } from '../sky/planets';
import { getUserCatalogObjects } from '../speech/userCatalog';

/**
 * Options for object detection
 */
export interface DetectionOptions {
  /** Horizontal field of view in degrees (default: 60) */
  fovHorizontal: number;
  /** Vertical field of view in degrees (default: 40) */
  fovVertical: number;
  /** Minimum altitude above horizon in degrees (default: 10) */
  minAltitude: number;
  /** Maximum magnitude for stars (lower = brighter, default: 2.5) */
  maxMagnitude: number;
  /** Maximum angular distance to consider for identification in degrees (default: 15) */
  maxIdentificationDistance: number;
}

/** Default detection options */
export const DEFAULT_DETECTION_OPTIONS: DetectionOptions = {
  fovHorizontal: 25,
  fovVertical: 7.8125,
  minAltitude: 10,
  maxMagnitude: 2.5,
  maxIdentificationDistance: 8,
};

/**
 * Calculate angular distance between two points on a sphere
 * Using the haversine formula for better accuracy
 */
function sphericalDistance(
  az1: number,
  alt1: number,
  az2: number,
  alt2: number
): number {
  const dAlt = toRadians(alt2 - alt1);
  const dAz = toRadians(az2 - az1);
  
  const alt1Rad = toRadians(alt1);
  const alt2Rad = toRadians(alt2);
  
  const a =
    Math.sin(dAlt / 2) * Math.sin(dAlt / 2) +
    Math.cos(alt1Rad) * Math.cos(alt2Rad) *
    Math.sin(dAz / 2) * Math.sin(dAz / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return toDegrees(c);
}

/**
 * Calculate confidence score based on angular distance
 * @param angularDistance Angular distance from view center in degrees
 * @param maxDistance Maximum distance to consider for confidence
 * @returns Confidence score (0-1), higher when object is closer to center
 */
export function calculateConfidence(
  angularDistance: number,
  maxDistance: number = 15
): number {
  if (angularDistance > maxDistance) {
    return 0;
  }
  
  // Linear falloff: 1.0 at center, 0.0 at max distance
  const confidence = 1 - (angularDistance / maxDistance);
  
  // Apply curve for better UX: closer objects have even higher confidence
  return Math.pow(confidence, 0.7);
}

/**
 * Convert a Star to a FocusTarget
 */
function starToFocusTarget(star: Star): FocusTarget {
  return {
    id: `star-${star.hr}`,
    name: star.name,
    type: 'star',
    ra: star.ra,
    dec: star.dec,
    magnitude: star.magnitude,
    info: star.spectral,
  };
}

/**
 * Convert a Planet to a FocusTarget
 */
function planetToFocusTarget(planet: Planet): FocusTarget {
  return {
    id: `planet-${planet.name}`,
    name: planet.name,
    type: 'planet',
    ra: 0, // Will be calculated dynamically
    dec: 0,
    magnitude: planet.baseMagnitude,
    info: `Orbital period: ${planet.period} years`,
  };
}

/**
 * Get all candidate objects that could be identified
 * Filters by visibility criteria (magnitude, altitude)
 * Includes: bright stars, planets, and user-discovered objects
 */
export function getCandidateObjects(
  location: GeoLocation,
  options: Partial<DetectionOptions> = {},
  date: Date = new Date()
): FocusTarget[] {
  const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };
  const candidates: FocusTarget[] = [];
  
  // Add bright stars
  const brightStars = BRIGHT_STARS.filter(
    star => star.magnitude <= opts.maxMagnitude
  );
  
  for (const star of brightStars) {
    const horizontal = getStarHorizontalCoords(star, location, date);
    
    // Only include if above minimum altitude
    if (isAboveHorizon(horizontal.altitude, opts.minAltitude)) {
      const target = starToFocusTarget(star);
      target.direction = {
        azimuth: horizontal.azimuth,
        altitude: horizontal.altitude,
        distance: 0, // Will be calculated later
      };
      candidates.push(target);
    }
  }
  
  // Add planets
  for (const planet of PLANETS) {
    const position = getPlanetHorizontalCoords(planet, location, date);
    
    if (position && isAboveHorizon(position.altitude, opts.minAltitude)) {
      const target = planetToFocusTarget(planet);
      target.direction = {
        azimuth: position.azimuth,
        altitude: position.altitude,
        distance: 0,
      };
      candidates.push(target);
    }
  }
  
  // Add user-discovered objects from the local catalog
  // These are objects that have been identified through the find target + LLM feature
  // and stored locally. By including them here, the explain mode can auto-identify them
  // without needing to re-query the API, and will display their stored descriptions.
  const userObjects = getUserCatalogObjects();
  for (const userObj of userObjects) {
    // Filter by magnitude threshold
    if (userObj.magnitude > opts.maxMagnitude) {
      continue;
    }
    
    // Calculate horizontal coordinates for this object
    // Use the same method as for stars (simple conversion from RA/Dec)
    const horizontal = getStarHorizontalCoords(
      {
        hr: 0, // User catalog objects don't have HR number
        name: userObj.name,
        ra: userObj.ra,
        dec: userObj.dec,
        magnitude: userObj.magnitude,
        spectral: '',
      },
      location,
      date
    );
    
    // Only include if above minimum altitude
    if (isAboveHorizon(horizontal.altitude, opts.minAltitude)) {
      const target: FocusTarget = {
        id: userObj.id,
        name: userObj.name,
        type: userObj.type,
        ra: userObj.ra,
        dec: userObj.dec,
        magnitude: userObj.magnitude,
        info: userObj.info,
        direction: {
          azimuth: horizontal.azimuth,
          altitude: horizontal.altitude,
          distance: 0,
        },
      };
      candidates.push(target);
    }
  }
  
  return candidates;
}

/**
 * Find the nearest object to the current view direction
 * Returns the closest object within the identification threshold
 * 
 * @param orientation Current head orientation (azimuth and pitch)
 * @param location Observer's geographic location
 * @param options Detection options for filtering and thresholds
 * @returns IdentifiedObject with confidence score, or null if no suitable object found
 */
export function findNearestObject(
  orientation: HeadOrientation,
  location: GeoLocation,
  options: Partial<DetectionOptions> = {}
): IdentifiedObject | null {
  const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };
  const date = new Date();
  
  // Get all visible candidates
  const candidates = getCandidateObjects(location, opts, date);
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Calculate angular distance for each candidate
  let nearestCandidate: FocusTarget | null = null;
  let nearestDistance = Infinity;
  
  for (const candidate of candidates) {
    if (!candidate.direction) continue;
    
    const distance = sphericalDistance(
      orientation.azimuth,
      orientation.pitch,
      candidate.direction.azimuth,
      candidate.direction.altitude
    );
    
    // Update candidate's direction with current distance
    candidate.direction.distance = distance;
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCandidate = candidate;
    }
  }
  
  // If no candidate found or too far away, return null
  if (!nearestCandidate || nearestDistance > opts.maxIdentificationDistance) {
    return null;
  }
  
  // Calculate confidence based on angular distance
  const confidence = calculateConfidence(
    nearestDistance,
    opts.maxIdentificationDistance
  );
  
  return {
    object: nearestCandidate,
    confidence,
    angularDistance: nearestDistance,
  };
}

/**
 * Find all objects within the current field of view
 * Returns objects sorted by distance from view center (closest first)
 * 
 * @param orientation Current head orientation
 * @param location Observer's geographic location
 * @param options Detection options including FOV settings
 * @returns Array of objects within FOV, sorted by distance
 */
export function findObjectsInView(
  orientation: HeadOrientation,
  location: GeoLocation,
  options: Partial<DetectionOptions> = {}
): IdentifiedObject[] {
  const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };
  const date = new Date();
  
  // Get all visible candidates
  const candidates = getCandidateObjects(location, opts, date);
  
  const objectsInView: IdentifiedObject[] = [];
  
  for (const candidate of candidates) {
    if (!candidate.direction) continue;
    
    const { deltaAz, deltaAlt } = getViewOffset(
      { azimuth: candidate.direction.azimuth, altitude: candidate.direction.altitude },
      orientation.azimuth,
      orientation.pitch
    );
    
    // Check if within FOV
    if (isInFieldOfView(deltaAz, deltaAlt, opts.fovHorizontal, opts.fovVertical)) {
      const angularDistance = Math.sqrt(deltaAz * deltaAz + deltaAlt * deltaAlt);
      candidate.direction.distance = angularDistance;
      
      const confidence = calculateConfidence(
        angularDistance,
        opts.maxIdentificationDistance
      );
      
      objectsInView.push({
        object: candidate,
        confidence,
        angularDistance,
      });
    }
  }
  
  // Sort by angular distance (closest first)
  return objectsInView.sort((a, b) => a.angularDistance - b.angularDistance);
}

/**
 * Get identification text for display
 * Formats the identified object into readable text
 */
export function formatIdentificationText(
  identified: IdentifiedObject,
  includeSecondary: boolean = true
): { primary: string; secondary?: string } {
  const obj = identified.object;
  
  let primary = obj.name;
  
  // Add prefix based on type
  switch (obj.type) {
    case 'star':
      primary = `★ ${obj.name}`;
      break;
    case 'planet':
      primary = `○ ${obj.name}`;
      break;
    case 'constellation':
      primary = `◊ ${obj.name}`;
      break;
    case 'deepsky':
      primary = `◇ ${obj.name}`;
      break;
  }
  
  if (!includeSecondary) {
    return { primary };
  }
  
  // Build secondary info line
  const parts: string[] = [];
  
  if (obj.magnitude !== undefined) {
    parts.push(`Mag ${obj.magnitude.toFixed(1)}`);
  }
  
  if (obj.info) {
    parts.push(obj.info);
  }
  
  // Add distance info if object is not centered
  if (identified.angularDistance > 3) {
    const direction = getDirectionDescription(
      identified.object.direction?.azimuth || 0,
      identified.object.direction?.altitude || 0,
      identified.angularDistance
    );
    parts.push(direction);
  }
  
  return {
    primary,
    secondary: parts.join(' · '),
  };
}

/**
 * Get a human-readable direction description
 */
function getDirectionDescription(
  targetAz: number,
  targetAlt: number,
  distance: number
): string {
  const direction: string[] = [];
  
  // Cardinal direction based on azimuth
  if (targetAz >= 337.5 || targetAz < 22.5) direction.push('N');
  else if (targetAz >= 22.5 && targetAz < 67.5) direction.push('NE');
  else if (targetAz >= 67.5 && targetAz < 112.5) direction.push('E');
  else if (targetAz >= 112.5 && targetAz < 157.5) direction.push('SE');
  else if (targetAz >= 157.5 && targetAz < 202.5) direction.push('S');
  else if (targetAz >= 202.5 && targetAz < 247.5) direction.push('SW');
  else if (targetAz >= 247.5 && targetAz < 292.5) direction.push('W');
  else if (targetAz >= 292.5 && targetAz < 337.5) direction.push('NW');
  
  // Altitude description
  if (targetAlt > 60) direction.push('high');
  else if (targetAlt < 20) direction.push('low');
  
  return `${distance.toFixed(0)}° ${direction.join(' ')}`;
}

/**
 * Check if the identified object is centered enough for confident display
 * Used to decide when to show identification vs "scanning" state
 */
export function isConfidentIdentification(
  identified: IdentifiedObject | null,
  threshold: number = 0.7
): boolean {
  if (!identified) return false;
  return identified.confidence >= threshold;
}
