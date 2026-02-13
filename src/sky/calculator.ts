// Sky coordinate calculations
// Converts celestial coordinates (RA/Dec) to horizontal coordinates (Alt/Az)

import type { GeoLocation, HorizontalCoords, Star } from '../types';

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize angle to range [0, 360)
 */
export function normalizeDegrees(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate Julian Date from JavaScript Date
 * @param date JavaScript Date object
 * @returns Julian Date
 */
export function getJulianDate(date: Date = new Date()): number {
  const time = date.getTime();
  return 2440587.5 + time / 86400000;
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) in degrees
 * @param jd Julian Date
 * @returns GMST in degrees (0-360)
 */
export function getGMST(jd: number): number {
  // Julian centuries since J2000.0
  const T = (jd - 2451545.0) / 36525;
  
  // GMST at 0h UT in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T - (T * T * T) / 38710000;
  
  return normalizeDegrees(gmst);
}

/**
 * Calculate Local Sidereal Time (LST) in degrees
 * @param gmst Greenwich Mean Sidereal Time in degrees
 * @param longitude Observer's longitude in degrees (positive East)
 * @returns LST in degrees (0-360)
 */
export function getLST(gmst: number, longitude: number): number {
  return normalizeDegrees(gmst + longitude);
}

/**
 * Calculate Hour Angle from LST and Right Ascension
 * @param lst Local Sidereal Time in degrees
 * @param ra Right Ascension in degrees
 * @returns Hour Angle in degrees (-180 to 180)
 */
export function getHourAngle(lst: number, ra: number): number {
  let ha = lst - ra;
  // Normalize to -180 to 180
  if (ha > 180) ha -= 360;
  if (ha < -180) ha += 360;
  return ha;
}

/**
 * Convert celestial coordinates to horizontal coordinates
 * @param ra Right Ascension in degrees
 * @param dec Declination in degrees
 * @param ha Hour Angle in degrees
 * @param latitude Observer's latitude in degrees
 * @returns Horizontal coordinates (altitude and azimuth)
 */
export function toHorizontal(
  _ra: number,
  dec: number,
  ha: number,
  latitude: number
): HorizontalCoords {
  const decRad = toRadians(dec);
  const latRad = toRadians(latitude);
  const haRad = toRadians(ha);

  // Calculate altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = toDegrees(Math.asin(sinAlt));

  // Calculate azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(toRadians(altitude)));
  
  // Clamp to [-1, 1] to avoid numerical errors
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  let azimuth = toDegrees(Math.acos(clampedCosAz));

  // Determine correct quadrant for azimuth
  // If sin(HA) > 0, azimuth is 360 - azimuth
  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Get horizontal coordinates for a star at given location and time
 * @param star Star object with RA and Dec
 * @param location Observer's location
 * @param date Observation time
 * @returns Horizontal coordinates or null if below horizon
 */
export function getStarHorizontalCoords(
  star: Star,
  location: GeoLocation,
  date: Date = new Date()
): HorizontalCoords {
  // Convert RA from hours to degrees
  const raDegrees = star.ra * 15;
  
  const jd = getJulianDate(date);
  const gmst = getGMST(jd);
  const lst = getLST(gmst, location.longitude);
  const ha = getHourAngle(lst, raDegrees);
  
  return toHorizontal(raDegrees, star.dec, ha, location.latitude);
}

/**
 * Check if an object is above the horizon
 * @param altitude Altitude in degrees
 * @param minAltitude Minimum altitude to be considered visible (default: 0)
 * @returns True if visible
 */
export function isAboveHorizon(altitude: number, minAltitude: number = 0): boolean {
  return altitude > minAltitude;
}

/**
 * Calculate the angular distance between two points on the celestial sphere
 * @param ra1 Right Ascension of first point in degrees
 * @param dec1 Declination of first point in degrees
 * @param ra2 Right Ascension of second point in degrees
 * @param dec2 Declination of second point in degrees
 * @returns Angular distance in degrees
 */
export function angularDistance(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number
): number {
  const dec1Rad = toRadians(dec1);
  const dec2Rad = toRadians(dec2);
  const deltaRa = toRadians(ra2 - ra1);

  const cosDistance = Math.sin(dec1Rad) * Math.sin(dec2Rad) +
    Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(deltaRa);
  
  return toDegrees(Math.acos(Math.max(-1, Math.min(1, cosDistance))));
}

/**
 * Calculate the field of view offset for head orientation
 * @param coords Horizontal coordinates of the star
 * @param heading Head azimuth (compass direction) in degrees
 * @param pitch Head pitch (elevation) in degrees
 * @returns Offset from center of view in degrees
 */
export function getViewOffset(
  coords: HorizontalCoords,
  heading: number,
  pitch: number
): { deltaAz: number; deltaAlt: number } {
  let deltaAz = coords.azimuth - heading;
  
  // Normalize to -180 to 180
  if (deltaAz > 180) deltaAz -= 360;
  if (deltaAz < -180) deltaAz += 360;
  
  const deltaAlt = coords.altitude - pitch;
  
  return { deltaAz, deltaAlt };
}

/**
 * Check if an object is within the field of view
 * @param deltaAz Azimuth offset from center
 * @param deltaAlt Altitude offset from center
 * @param fovHorizontal Horizontal field of view in degrees
 * @param fovVertical Vertical field of view in degrees
 * @returns True if within FOV
 */
export function isInFieldOfView(
  deltaAz: number,
  deltaAlt: number,
  fovHorizontal: number,
  fovVertical: number
): boolean {
  return (
    Math.abs(deltaAz) <= fovHorizontal / 2 &&
    Math.abs(deltaAlt) <= fovVertical / 2
  );
}

/**
 * Project horizontal coordinates to canvas coordinates
 * @param deltaAz Azimuth offset from center (-FOV/2 to FOV/2)
 * @param deltaAlt Altitude offset from center (-FOV/2 to FOV/2)
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @param fovHorizontal Horizontal field of view in degrees
 * @param fovVertical Vertical field of view in degrees
 * @returns Canvas coordinates {x, y}
 */
export function projectToCanvas(
  deltaAz: number,
  deltaAlt: number,
  canvasWidth: number,
  canvasHeight: number,
  fovHorizontal: number,
  fovVertical: number
): { x: number; y: number } {
  // Map from [-FOV/2, FOV/2] to [0, canvas dimension]
  const x = canvasWidth / 2 + (deltaAz / (fovHorizontal / 2)) * (canvasWidth / 2);
  const y = canvasHeight / 2 - (deltaAlt / (fovVertical / 2)) * (canvasHeight / 2);
  
  return { x, y };
}

/**
 * Get the current moon position (simplified)
 * @param location Observer's location
 * @param date Date for calculation
 * @returns Horizontal coordinates of the moon
 */
export function getMoonPosition(
  location: GeoLocation,
  date: Date = new Date()
): HorizontalCoords {
  // Simplified moon calculation - for better accuracy, use a proper ephemeris
  // This gives approximate position good to within a few degrees
  const jd = getJulianDate(date);
  const T = (jd - 2451545.0) / 36525;
  
  // Mean longitude
  let L = 218.316 + 13.176396 * (jd - 2451545.0);
  L = normalizeDegrees(L);
  
  // Mean anomaly
  const M = 134.963 + 13.064993 * (jd - 2451545.0);
  
  // Longitude with perturbations (M used in calculation)
  const lambda = L + 6.289 * Math.sin(toRadians(M));
  // Suppress unused warning - M is used above
  void M;
  
  // Latitude (simplified)
  const beta = 5.128 * Math.sin(toRadians(93.273 + 13.22935 * (jd - 2451545.0)));
  
  // Convert to RA/Dec (simplified ecliptic to equatorial)
  const epsilon = 23.439 - 0.013 * T; // Obliquity of ecliptic
  const raDeg = toDegrees(Math.atan2(
    Math.sin(toRadians(lambda)) * Math.cos(toRadians(epsilon)) -
    Math.tan(toRadians(beta)) * Math.sin(toRadians(epsilon)),
    Math.cos(toRadians(lambda))
  ));
  
  const dec = toDegrees(Math.asin(
    Math.sin(toRadians(beta)) * Math.cos(toRadians(epsilon)) +
    Math.cos(toRadians(beta)) * Math.sin(toRadians(epsilon)) * Math.sin(toRadians(lambda))
  ));
  
  const gmst = getGMST(jd);
  const lst = getLST(gmst, location.longitude);
  const ha = getHourAngle(lst, raDeg);
  
  return toHorizontal(raDeg, dec, ha, location.latitude);
}
