// Planet data and calculations for the sky chart
// Simplified positions for demonstration - in production, use proper ephemeris calculations

import type { GeoLocation, HorizontalCoords } from '../types';
import { getJulianDate, toRadians, toDegrees, normalizeDegrees, getGMST, getLST, getHourAngle, toHorizontal } from './calculator';

/**
 * Planet definition with orbital parameters
 * These are simplified mean orbital elements
 */
export interface Planet {
  name: string;
  symbol: string;
  /** Mean distance from Sun in AU */
  semiMajorAxis: number;
  /** Orbital period in years */
  period: number;
  /** Orbital eccentricity */
  eccentricity: number;
  /** Longitude of ascending node in degrees (J2000) */
  longitudeNode: number;
  /** Inclination in degrees */
  inclination: number;
  /** Argument of perihelion in degrees */
  argPerihelion: number;
  /** Mean longitude at J2000 in degrees */
  meanLongitude: number;
  /** Visual magnitude at 1 AU */
  baseMagnitude: number;
  /** Planet radius in Earth radii */
  radius: number;
  /** True if inner planet (Mercury, Venus) */
  isInner: boolean;
}

/**
 * Planet catalog with approximate orbital elements
 * Reference: JPL Horizons simplified orbital elements
 */
export const PLANETS: Planet[] = [
  {
    name: 'Mercury',
    symbol: '☿',
    semiMajorAxis: 0.387,
    period: 0.241,
    eccentricity: 0.206,
    longitudeNode: 48.331,
    inclination: 7.005,
    argPerihelion: 29.124,
    meanLongitude: 252.251,
    baseMagnitude: -0.4,
    radius: 0.383,
    isInner: true,
  },
  {
    name: 'Venus',
    symbol: '♀',
    semiMajorAxis: 0.723,
    period: 0.615,
    eccentricity: 0.007,
    longitudeNode: 76.680,
    inclination: 3.395,
    argPerihelion: 54.884,
    meanLongitude: 181.979,
    baseMagnitude: -4.4,
    radius: 0.949,
    isInner: true,
  },
  {
    name: 'Mars',
    symbol: '♂',
    semiMajorAxis: 1.524,
    period: 1.881,
    eccentricity: 0.093,
    longitudeNode: 49.578,
    inclination: 1.850,
    argPerihelion: 286.502,
    meanLongitude: 355.433,
    baseMagnitude: -1.5,
    radius: 0.532,
    isInner: false,
  },
  {
    name: 'Jupiter',
    symbol: '♃',
    semiMajorAxis: 5.203,
    period: 11.862,
    eccentricity: 0.049,
    longitudeNode: 100.546,
    inclination: 1.303,
    argPerihelion: 273.877,
    meanLongitude: 34.351,
    baseMagnitude: -9.3,
    radius: 11.21,
    isInner: false,
  },
  {
    name: 'Saturn',
    symbol: '♄',
    semiMajorAxis: 9.537,
    period: 29.457,
    eccentricity: 0.057,
    longitudeNode: 113.665,
    inclination: 2.489,
    argPerihelion: 339.391,
    meanLongitude: 50.077,
    baseMagnitude: -8.9,
    radius: 9.45,
    isInner: false,
  },
];

/**
 * Calculate planet's heliocentric position (simplified)
 * Returns ecliptic longitude and latitude in degrees
 */
function calculatePlanetPosition(
  planet: Planet, 
  date: Date = new Date()
): { longitude: number; latitude: number; distance: number } {
  const jd = getJulianDate(date);
  // Note: Julian centuries from J2000 (T) would be calculated as (jd - 2451545.0) / 36525
  // for more precise calculations, but we use a simplified model here
  
  // Mean anomaly
  const n = 360 / (planet.period * 365.25); // Mean daily motion
  const M = normalizeDegrees(planet.meanLongitude + n * (jd - 2451545.0) - planet.argPerihelion);
  const MRad = toRadians(M);
  
  // Eccentric anomaly (simplified - using first approximation)
  const E = M + toDegrees(planet.eccentricity * Math.sin(MRad));
  const ERad = toRadians(E);
  
  // True anomaly
  const nu = 2 * toDegrees(Math.atan2(
    Math.sqrt(1 + planet.eccentricity) * Math.sin(ERad / 2),
    Math.sqrt(1 - planet.eccentricity) * Math.cos(ERad / 2)
  ));
  
  // Distance from Sun
  const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(ERad));
  
  // Heliocentric ecliptic coordinates
  const L = normalizeDegrees(nu + planet.argPerihelion);
  
  // Simplified - assume planets are near ecliptic plane
  // For more accuracy, would need full 3D coordinate transformation
  const longitude = L;
  const latitude = 0; // Simplified
  
  return { longitude, latitude, distance: r };
}

/**
 * Calculate Earth's heliocentric position
 */
function calculateEarthPosition(date: Date = new Date()): { longitude: number; distance: number } {
  // Simplified Earth position
  const jd = getJulianDate(date);
  const n = 360 / 365.25;
  const L = normalizeDegrees(100.466 + n * (jd - 2451545.0));
  return { longitude: L, distance: 1.0 };
}

/**
 * Convert heliocentric ecliptic to geocentric equatorial coordinates
 */
function toEquatorial(
  planetLongitude: number,
  planetDistance: number,
  earthLongitude: number
): { ra: number; dec: number } {
  // Simplified calculation - assumes circular orbits in ecliptic plane
  // For production, use VSOP87 or similar high-precision theory
  
  // Convert to radians
  const Lp = toRadians(planetLongitude);
  const Le = toRadians(earthLongitude);
  
  // Geocentric ecliptic longitude (simplified)
  const x = planetDistance * Math.cos(Lp) - Math.cos(Le);
  const y = planetDistance * Math.sin(Lp) - Math.sin(Le);
  
  const geocentricLon = toDegrees(Math.atan2(y, x));
  const geocentricLat = 0; // Simplified - planets stay near ecliptic
  
  // Convert ecliptic to equatorial (simplified - neglecting obliquity variation)
  const epsilon = toRadians(23.4397); // Obliquity of ecliptic
  const lonRad = toRadians(geocentricLon);
  const latRad = toRadians(geocentricLat);
  
  const ra = toDegrees(Math.atan2(
    Math.sin(lonRad) * Math.cos(epsilon) - Math.tan(latRad) * Math.sin(epsilon),
    Math.cos(lonRad)
  ));
  
  const dec = toDegrees(Math.asin(
    Math.sin(latRad) * Math.cos(epsilon) + Math.cos(latRad) * Math.sin(epsilon) * Math.sin(lonRad)
  ));
  
  return { ra: normalizeDegrees(ra) / 15, dec }; // Convert RA to hours
}

/**
 * Get horizontal coordinates for a planet at given location and time
 */
export function getPlanetHorizontalCoords(
  planet: Planet,
  location: GeoLocation,
  date: Date = new Date()
): HorizontalCoords | null {
  const planetPos = calculatePlanetPosition(planet, date);
  const earthPos = calculateEarthPosition(date);
  
  // Don't compute for planets behind the Sun (simplified check)
  const elongation = Math.abs(planetPos.longitude - earthPos.longitude);
  if (elongation < 5 && planet.isInner) {
    // Inner planet too close to Sun - may not be visible
    // But still calculate position
  }
  
  const equatorial = toEquatorial(planetPos.longitude, planetPos.distance, earthPos.longitude);
  
  const jd = getJulianDate(date);
  const gmst = getGMST(jd);
  const lst = getLST(gmst, location.longitude);
  const ha = getHourAngle(lst, equatorial.ra * 15); // Convert RA hours to degrees
  
  return toHorizontal(equatorial.ra * 15, equatorial.dec, ha, location.latitude);
}

/**
 * Get all planets with their current positions
 */
export function getAllPlanets(
  location: GeoLocation,
  date: Date = new Date()
): Array<{ planet: Planet; coords: HorizontalCoords | null }> {
  return PLANETS.map(planet => ({
    planet,
    coords: getPlanetHorizontalCoords(planet, location, date),
  }));
}

/**
 * Get only inner planets (Mercury, Venus)
 */
export function getInnerPlanets(
  location: GeoLocation,
  date: Date = new Date()
): Array<{ planet: Planet; coords: HorizontalCoords | null }> {
  return getAllPlanets(location, date).filter(p => p.planet.isInner);
}

/**
 * Get only outer planets (Mars, Jupiter, Saturn, etc.)
 */
export function getOuterPlanets(
  location: GeoLocation,
  date: Date = new Date()
): Array<{ planet: Planet; coords: HorizontalCoords | null }> {
  return getAllPlanets(location, date).filter(p => !p.planet.isInner);
}

/**
 * Get only visible planets (above horizon)
 */
export function getVisiblePlanets(
  location: GeoLocation,
  date: Date = new Date()
): Array<{ planet: Planet; coords: HorizontalCoords }> {
  return getAllPlanets(location, date)
    .filter((p): p is { planet: Planet; coords: HorizontalCoords } => 
      p.coords !== null && p.coords.altitude > 0
    );
}

/**
 * Get a planet by name
 */
export function getPlanetByName(name: string): Planet | undefined {
  return PLANETS.find(p => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Calculate apparent magnitude of a planet
 * This is a very simplified calculation
 */
export function getPlanetMagnitude(planet: Planet, date: Date = new Date()): number {
  const pos = calculatePlanetPosition(planet, date);
  const earthPos = calculateEarthPosition(date);
  
  // Distance from Earth
  const delta = Math.sqrt(
    pos.distance * pos.distance + earthPos.distance * earthPos.distance - 
    2 * pos.distance * earthPos.distance * Math.cos(toRadians(pos.longitude - earthPos.longitude))
  );
  
  // Very simplified magnitude calculation
  return planet.baseMagnitude + 5 * Math.log10(delta);
}
