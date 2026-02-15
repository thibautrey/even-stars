// Sky coordinate calculations
// Converts celestial coordinates (RA/Dec) to horizontal coordinates (Alt/Az)
// Uses proper gnomonic (tangent-plane) projection for accurate star placement

import type { GeoLocation, HorizontalCoords, Star, FieldOfView, HeadOrientation } from '../types';

// ────────────────────────────────────────────────────────────────────────────
// Basic angle utilities
// ────────────────────────────────────────────────────────────────────────────

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Normalize angle to range [0, 360) */
export function normalizeDegrees(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

// ────────────────────────────────────────────────────────────────────────────
// Time calculations
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Julian Date from JavaScript Date
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
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T - (T * T * T) / 38710000;
  return normalizeDegrees(gmst);
}

/**
 * Calculate Local Sidereal Time (LST) in degrees
 */
export function getLST(gmst: number, longitude: number): number {
  return normalizeDegrees(gmst + longitude);
}

/**
 * Calculate Hour Angle from LST and Right Ascension
 * @returns Hour Angle in degrees (-180 to 180)
 */
export function getHourAngle(lst: number, ra: number): number {
  let ha = lst - ra;
  if (ha > 180) ha -= 360;
  if (ha < -180) ha += 360;
  return ha;
}

// ────────────────────────────────────────────────────────────────────────────
// Precession correction (J2000.0 → date of observation)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Apply precession correction to J2000.0 equatorial coordinates.
 * Uses IAU 1976 precession (Lieske et al.) — accurate to ~1" over decades.
 *
 * @param ra0  Right Ascension at J2000.0 in degrees
 * @param dec0 Declination at J2000.0 in degrees
 * @param jd   Julian Date of observation
 * @returns Precessed {ra, dec} in degrees
 */
export function precessJ2000(
  ra0: number,
  dec0: number,
  jd: number
): { ra: number; dec: number } {
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0

  // Precession parameters in degrees (Lieske 1979)
  const zetaA  = (0.6406161 + 0.0000839 * T + 0.0000050 * T * T) * T;
  const zA     = (0.6406161 + 0.0003041 * T + 0.0000051 * T * T) * T;
  const thetaA = (0.5567530 - 0.0001185 * T - 0.0000116 * T * T) * T;

  const ra0Rad  = toRadians(ra0);
  const dec0Rad = toRadians(dec0);
  const zetaRad  = toRadians(zetaA);
  const thetaRad = toRadians(thetaA);
  // zRad is used in rigorous precession but omitted in this simplified form
  // const zRad = toRadians(zA);

  const cosD  = Math.cos(dec0Rad);
  const sinD  = Math.sin(dec0Rad);
  const cosT  = Math.cos(thetaRad);
  const sinT  = Math.sin(thetaRad);
  const cosRZ = Math.cos(ra0Rad + zetaRad);
  const sinRZ = Math.sin(ra0Rad + zetaRad);

  const A = cosD * sinRZ;
  const B = cosT * cosD * cosRZ - sinT * sinD;
  const C = sinT * cosD * cosRZ + cosT * sinD;

  const ra  = normalizeDegrees(toDegrees(Math.atan2(A, B)) + zA);
  const dec = toDegrees(Math.asin(Math.max(-1, Math.min(1, C))));

  return { ra, dec };
}

// ────────────────────────────────────────────────────────────────────────────
// Atmospheric refraction
// ────────────────────────────────────────────────────────────────────────────

/**
 * Apply standard atmospheric refraction correction.
 * Uses Saemundsson's formula (accuracy ~0.07' above 5°).
 *
 * @param altitudeTrue Geometric (true) altitude in degrees
 * @returns Apparent altitude in degrees (always >= true altitude)
 */
export function applyRefraction(altitudeTrue: number): number {
  if (altitudeTrue < -1) return altitudeTrue; // Far below horizon, skip
  // Saemundsson formula: R in arcminutes
  const h = Math.max(-1, altitudeTrue);
  const R = 1.02 / Math.tan(toRadians(h + 10.3 / (h + 5.11))) + 0.0019279;
  return altitudeTrue + R / 60; // Convert arcminutes to degrees
}

// ────────────────────────────────────────────────────────────────────────────
// Equatorial → Horizontal conversion
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convert celestial coordinates to horizontal coordinates
 */
export function toHorizontal(
  _ra: number,
  dec: number,
  ha: number,
  latitude: number
): HorizontalCoords {
  const decRad = toRadians(dec);
  const latRad = toRadians(latitude);
  const haRad  = toRadians(ha);

  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altitude = toDegrees(Math.asin(Math.max(-1, Math.min(1, sinAlt))));

  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(toRadians(altitude)));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  let azimuth = toDegrees(Math.acos(clampedCosAz));

  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Get horizontal coordinates for a star at given location and time.
 * Applies precession correction from J2000.0 to observation date
 * and atmospheric refraction.
 */
export function getStarHorizontalCoords(
  star: Star,
  location: GeoLocation,
  date: Date = new Date()
): HorizontalCoords {
  const jd = getJulianDate(date);

  // 1. Apply precession from J2000.0 → date
  const raDeg0  = star.ra * 15;      // catalog RA (hours → degrees)
  const decDeg0 = star.dec;           // catalog Dec
  const { ra: raDeg, dec: decDeg } = precessJ2000(raDeg0, decDeg0, jd);

  // 2. Compute hour angle and horizontal coords
  const gmst = getGMST(jd);
  const lst  = getLST(gmst, location.longitude);
  const ha   = getHourAngle(lst, raDeg);
  const coords = toHorizontal(raDeg, decDeg, ha, location.latitude);

  // 3. Apply atmospheric refraction
  coords.altitude = applyRefraction(coords.altitude);

  return coords;
}

/**
 * Check if an object is above the horizon
 */
export function isAboveHorizon(altitude: number, minAltitude: number = 0): boolean {
  return altitude > minAltitude;
}

/**
 * Calculate the angular distance between two points on the celestial sphere
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

// ────────────────────────────────────────────────────────────────────────────
// Legacy helpers (kept for backward compatibility but prefer gnomonicProject)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the field of view offset for head orientation (legacy/simple).
 * Prefer gnomonicProject() for accurate rendering.
 */
export function getViewOffset(
  coords: HorizontalCoords,
  heading: number,
  pitch: number
): { deltaAz: number; deltaAlt: number } {
  let deltaAz = coords.azimuth - heading;
  if (deltaAz > 180) deltaAz -= 360;
  if (deltaAz < -180) deltaAz += 360;
  const deltaAlt = coords.altitude - pitch;
  return { deltaAz, deltaAlt };
}

/**
 * Check if an object is within the field of view (legacy/simple).
 * Prefer gnomonicProject() which returns null for out-of-view.
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
 * Project horizontal coordinates to canvas coordinates (legacy/linear).
 * Prefer gnomonicProject() for accurate rendering.
 */
export function projectToCanvas(
  deltaAz: number,
  deltaAlt: number,
  canvasWidth: number,
  canvasHeight: number,
  fovHorizontal: number,
  fovVertical: number
): { x: number; y: number } {
  const x = canvasWidth / 2 + (deltaAz / (fovHorizontal / 2)) * (canvasWidth / 2);
  const y = canvasHeight / 2 - (deltaAlt / (fovVertical / 2)) * (canvasHeight / 2);
  return { x, y };
}

// ────────────────────────────────────────────────────────────────────────────
// Gnomonic (tangent-plane) projection — the correct way to project sky → screen
// ────────────────────────────────────────────────────────────────────────────

/**
 * Result of gnomonic projection
 */
export interface ProjectionResult {
  /** X pixel coordinate on canvas */
  x: number;
  /** Y pixel coordinate on canvas */
  y: number;
  /** True if the object is in front of the viewer (cos_c > 0) */
  visible: boolean;
}

/**
 * Project a sky position (alt/az) onto a canvas using gnomonic (tangent-plane)
 * projection centred on the current head orientation.
 *
 * This is the geometrically correct projection for mapping a spherical sky onto
 * a flat display. It correctly handles:
 *   - Convergence of azimuth lines near the zenith
 *   - Non-linear angular distance mapping (tan rather than linear)
 *   - Head roll (rotation of the image plane)
 *   - Different horizontal/vertical FOV (non-square pixel mapping)
 *
 * The projection maps angular offsets through tan() so objects near the edges of
 * the field of view appear slightly further out than a linear projection would
 * place them — matching what a camera or eye actually sees.
 *
 * @param coords     Horizontal coordinates (alt/az) of the object
 * @param orientation Head orientation (azimuth, pitch, roll)
 * @param fov        Field of view {horizontal, vertical} in degrees
 * @param canvasW    Canvas width in pixels
 * @param canvasH    Canvas height in pixels
 * @returns ProjectionResult with pixel coords, or visible=false if behind viewer
 */
export function gnomonicProject(
  coords: HorizontalCoords,
  orientation: HeadOrientation,
  fov: FieldOfView,
  canvasW: number,
  canvasH: number
): ProjectionResult {
  // View center direction
  const az0  = toRadians(orientation.azimuth);
  const alt0 = toRadians(orientation.pitch);
  const roll = toRadians(orientation.roll);

  // Object direction
  const az  = toRadians(coords.azimuth);
  const alt = toRadians(coords.altitude);

  // Cosine of angular distance between view centre and object (dot product)
  const sinAlt0 = Math.sin(alt0);
  const cosAlt0 = Math.cos(alt0);
  const sinAlt  = Math.sin(alt);
  const cosAlt  = Math.cos(alt);
  const dAz     = az - az0;
  const cosDaz  = Math.cos(dAz);

  const cos_c = sinAlt0 * sinAlt + cosAlt0 * cosAlt * cosDaz;

  // Object is behind viewer
  if (cos_c <= 0.001) {
    return { x: canvasW / 2, y: canvasH / 2, visible: false };
  }

  // Gnomonic projection onto tangent plane at view centre
  //   xi  = horizontal displacement (positive = right / increasing azimuth)
  //   eta = vertical displacement   (positive = up / increasing altitude)
  const xi  = (cosAlt * Math.sin(dAz)) / cos_c;
  const eta = (cosAlt0 * sinAlt - sinAlt0 * cosAlt * cosDaz) / cos_c;

  // Apply roll rotation (clockwise rotation of the image plane)
  const cosR = Math.cos(roll);
  const sinR = Math.sin(roll);
  const xi_r  =  xi * cosR + eta * sinR;
  const eta_r = -xi * sinR + eta * cosR;

  // Scale factors: map tan(fov/2) on the tangent plane to half the canvas
  const scaleX = (canvasW / 2) / Math.tan(toRadians(fov.horizontal / 2));
  const scaleY = (canvasH / 2) / Math.tan(toRadians(fov.vertical / 2));

  // Pixel coordinates (canvas origin at top-left)
  const x = canvasW / 2 + xi_r * scaleX;
  const y = canvasH / 2 - eta_r * scaleY;

  // Within canvas bounds with generous margin for partially visible objects
  const margin = 20;
  const visible = x >= -margin && x <= canvasW + margin &&
                  y >= -margin && y <= canvasH + margin;

  return { x, y, visible };
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
