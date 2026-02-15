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
 * Calculate planet's heliocentric position using full 3D orbital geometry.
 * Returns ecliptic longitude and latitude in degrees, and heliocentric distance.
 */
function calculatePlanetPosition(
  planet: Planet, 
  date: Date = new Date()
): { longitude: number; latitude: number; distance: number } {
  const jd = getJulianDate(date);

  // Mean daily motion (degrees per day)
  const n = 360 / (planet.period * 365.25);

  // Current mean longitude
  const currentMeanLong = planet.meanLongitude + n * (jd - 2451545.0);

  // Longitude of perihelion: ω̃ = ω + Ω
  const longPerihelion = planet.argPerihelion + planet.longitudeNode;

  // Mean anomaly: M = L − ω̃
  const M = normalizeDegrees(currentMeanLong - longPerihelion);
  const MRad = toRadians(M);

  // Solve Kepler's equation  M = E − e·sin(E)  via Newton-Raphson
  let E = M + toDegrees(planet.eccentricity * Math.sin(MRad)); // first-order seed
  for (let i = 0; i < 6; i++) {
    const ERad_i = toRadians(E);
    const dE = (E - toDegrees(planet.eccentricity * Math.sin(ERad_i)) - M) /
               (1 - planet.eccentricity * Math.cos(ERad_i));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  const ERad = toRadians(E);

  // True anomaly
  const nu = 2 * toDegrees(Math.atan2(
    Math.sqrt(1 + planet.eccentricity) * Math.sin(ERad / 2),
    Math.sqrt(1 - planet.eccentricity) * Math.cos(ERad / 2)
  ));

  // Heliocentric distance
  const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(ERad));

  // Full 3D heliocentric ecliptic coordinates
  // Argument of latitude: u = ν + ω  (angle in the orbital plane from the ascending node)
  const uRad = toRadians(nu + planet.argPerihelion);
  const OmegaRad = toRadians(planet.longitudeNode);
  const iRad = toRadians(planet.inclination);

  const xEcl = r * (Math.cos(OmegaRad) * Math.cos(uRad) -
                    Math.sin(OmegaRad) * Math.sin(uRad) * Math.cos(iRad));
  const yEcl = r * (Math.sin(OmegaRad) * Math.cos(uRad) +
                    Math.cos(OmegaRad) * Math.sin(uRad) * Math.cos(iRad));
  const zEcl = r * Math.sin(uRad) * Math.sin(iRad);

  const longitude = normalizeDegrees(toDegrees(Math.atan2(yEcl, xEcl)));
  const latitude  = toDegrees(Math.atan2(zEcl, Math.sqrt(xEcl * xEcl + yEcl * yEcl)));

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
 * Convert heliocentric ecliptic to geocentric equatorial coordinates.
 * Uses full 3D geometry (ecliptic latitude is taken into account).
 */
function toEquatorial(
  planetLongitude: number,
  planetLatitude: number,
  planetDistance: number,
  earthLongitude: number
): { ra: number; dec: number } {
  // Planet heliocentric ecliptic → rectangular
  const Lp = toRadians(planetLongitude);
  const Bp = toRadians(planetLatitude);
  const rp = planetDistance;
  const xp = rp * Math.cos(Bp) * Math.cos(Lp);
  const yp = rp * Math.cos(Bp) * Math.sin(Lp);
  const zp = rp * Math.sin(Bp);

  // Earth heliocentric (simplified circular orbit in ecliptic plane)
  const Le = toRadians(earthLongitude);
  const xe = Math.cos(Le);
  const ye = Math.sin(Le);

  // Geocentric ecliptic rectangular
  const xg = xp - xe;
  const yg = yp - ye;
  const zg = zp; // Earth is in ecliptic plane, so ze = 0

  // Geocentric ecliptic spherical
  const geocentricLon = toDegrees(Math.atan2(yg, xg));
  const geocentricLat = toDegrees(Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)));

  // Convert ecliptic to equatorial
  const epsilon = toRadians(23.4393); // Mean obliquity of ecliptic (J2000)
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
  
  const equatorial = toEquatorial(planetPos.longitude, planetPos.latitude, planetPos.distance, earthPos.longitude);
  
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
  
  // Distance from Earth (3D)
  const Lp = toRadians(pos.longitude);
  const Bp = toRadians(pos.latitude);
  const Le = toRadians(earthPos.longitude);
  const dx = pos.distance * Math.cos(Bp) * Math.cos(Lp) - earthPos.distance * Math.cos(Le);
  const dy = pos.distance * Math.cos(Bp) * Math.sin(Lp) - earthPos.distance * Math.sin(Le);
  const dz = pos.distance * Math.sin(Bp);
  const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Very simplified magnitude calculation
  return planet.baseMagnitude + 5 * Math.log10(delta);
}
