// Searchable object catalog for the finder/locator feature

import type { SearchableObject } from '../types/search';
import { SearchObjectType } from '../types/search';

/**
 * Bright stars catalog - easily searchable named stars
 */
export const SEARCHABLE_STARS: SearchableObject[] = [
  // Very bright stars (negative to ~0 magnitude)
  { id: 'star_sirius', name: 'Sirius', type: SearchObjectType.Star, ra: 6.75, dec: -16.72, magnitude: -1.46, constellation: 'CMa', info: 'Brightest star' },
  { id: 'star_canopus', name: 'Canopus', type: SearchObjectType.Star, ra: 6.40, dec: -52.70, magnitude: -0.74, constellation: 'Car' },
  { id: 'star_arcturus', name: 'Arcturus', type: SearchObjectType.Star, ra: 14.26, dec: 19.11, magnitude: -0.05, constellation: 'Boo' },
  { id: 'star_rigel', name: 'Rigel', type: SearchObjectType.Star, ra: 5.24, dec: -8.20, magnitude: 0.12, constellation: 'Ori' },
  { id: 'star_vega', name: 'Vega', type: SearchObjectType.Star, ra: 18.62, dec: 38.78, magnitude: 0.03, constellation: 'Lyr' },
  { id: 'star_capella', name: 'Capella', type: SearchObjectType.Star, ra: 5.28, dec: 46.00, magnitude: 0.08, constellation: 'Aur' },
  { id: 'star_procyon', name: 'Procyon', type: SearchObjectType.Star, ra: 7.65, dec: 5.23, magnitude: 0.34, constellation: 'CMi' },
  { id: 'star_betelgeuse', name: 'Betelgeuse', type: SearchObjectType.Star, ra: 5.92, dec: 7.41, magnitude: 0.50, constellation: 'Ori', info: 'Red supergiant' },
  { id: 'star_altair', name: 'Altair', type: SearchObjectType.Star, ra: 19.85, dec: 8.87, magnitude: 0.77, constellation: 'Aql' },
  { id: 'star_antares', name: 'Antares', type: SearchObjectType.Star, ra: 16.49, dec: -26.43, magnitude: 1.06, constellation: 'Sco', info: 'Red supergiant' },
  { id: 'star_spica', name: 'Spica', type: SearchObjectType.Star, ra: 13.42, dec: -11.16, magnitude: 1.04, constellation: 'Vir' },
  { id: 'star_pollux', name: 'Pollux', type: SearchObjectType.Star, ra: 7.75, dec: 28.03, magnitude: 1.14, constellation: 'Gem' },
  { id: 'star_regulus', name: 'Regulus', type: SearchObjectType.Star, ra: 10.14, dec: 11.97, magnitude: 1.36, constellation: 'Leo' },
  { id: 'star_deneb', name: 'Deneb', type: SearchObjectType.Star, ra: 20.41, dec: 45.28, magnitude: 1.25, constellation: 'Cyg' },
  { id: 'star_castor', name: 'Castor', type: SearchObjectType.Star, ra: 7.58, dec: 31.89, magnitude: 1.58, constellation: 'Gem' },
  { id: 'star_aldebaran', name: 'Aldebaran', type: SearchObjectType.Star, ra: 4.60, dec: 16.51, magnitude: 0.85, constellation: 'Tau', info: 'Red giant' },
  { id: 'star_regor', name: 'Regor', type: SearchObjectType.Star, ra: 8.16, dec: -47.34, magnitude: 1.75, constellation: 'Vel' },
  { id: 'star_adhara', name: 'Adhara', type: SearchObjectType.Star, ra: 6.98, dec: -28.97, magnitude: 1.50, constellation: 'CMa' },
  { id: 'star_crux', name: 'Acrux', type: SearchObjectType.Star, ra: 12.44, dec: -63.06, magnitude: 1.39, constellation: 'Cru' },
  { id: 'star_polaris', name: 'Polaris', type: SearchObjectType.Star, ra: 2.53, dec: 89.26, magnitude: 1.98, constellation: 'UMi', info: 'North Star' },
  { id: 'star_mimosa', name: 'Mimosa', type: SearchObjectType.Star, ra: 12.79, dec: -59.69, magnitude: 1.25, constellation: 'Cru' },
  { id: 'star_alnilam', name: 'Alnilam', type: SearchObjectType.Star, ra: 5.60, dec: -1.20, magnitude: 1.69, constellation: 'Ori' },
  { id: 'star_mintaka', name: 'Mintaka', type: SearchObjectType.Star, ra: 5.53, dec: -0.30, magnitude: 2.20, constellation: 'Ori' },
  { id: 'star_alnitak', name: 'Alnitak', type: SearchObjectType.Star, ra: 5.68, dec: -1.95, magnitude: 1.74, constellation: 'Ori' },
  // Northern hemisphere favorites
  { id: 'star_dubhe', name: 'Dubhe', type: SearchObjectType.Star, ra: 11.06, dec: 61.75, magnitude: 1.81, constellation: 'UMa' },
  { id: 'star_merak', name: 'Merak', type: SearchObjectType.Star, ra: 11.03, dec: 56.38, magnitude: 2.34, constellation: 'UMa' },
  { id: 'star_alioth', name: 'Alioth', type: SearchObjectType.Star, ra: 12.90, dec: 55.96, magnitude: 1.76, constellation: 'UMa' },
  { id: 'star_mizar', name: 'Mizar', type: SearchObjectType.Star, ra: 13.40, dec: 54.93, magnitude: 2.23, constellation: 'UMa' },
  { id: 'star_kochab', name: 'Kochab', type: SearchObjectType.Star, ra: 14.85, dec: 74.16, magnitude: 2.07, constellation: 'UMi' },
  // Southern hemisphere favorites
  { id: 'star_rigilkent', name: 'Rigil Kent', type: SearchObjectType.Star, ra: 14.66, dec: -60.84, magnitude: -0.01, constellation: 'Cen', info: 'Alpha Centauri' },
  { id: 'star_achernar', name: 'Achernar', type: SearchObjectType.Star, ra: 1.63, dec: -57.24, magnitude: 0.46, constellation: 'Eri' },
  { id: 'star_hadar', name: 'Hadar', type: SearchObjectType.Star, ra: 14.06, dec: -60.37, magnitude: 0.61, constellation: 'Cen' },
];

/**
 * Planets catalog - these positions are calculated dynamically,
 * but we list them here for the search menu
 */
export const SEARCHABLE_PLANETS: SearchableObject[] = [
  { id: 'planet_mercury', name: 'Mercury', type: SearchObjectType.Planet, ra: 0, dec: 0, magnitude: -0.5, info: 'Inner planet' },
  { id: 'planet_venus', name: 'Venus', type: SearchObjectType.Planet, ra: 0, dec: 0, magnitude: -4.5, info: 'Brightest planet' },
  { id: 'planet_mars', name: 'Mars', type: SearchObjectType.Planet, ra: 0, dec: 0, magnitude: -1.5, info: 'Red planet' },
  { id: 'planet_jupiter', name: 'Jupiter', type: SearchObjectType.Planet, ra: 0, dec: 0, magnitude: -2.5, info: 'Gas giant' },
  { id: 'planet_saturn', name: 'Saturn', type: SearchObjectType.Planet, ra: 0, dec: 0, magnitude: 0.5, info: 'Ringed planet' },
];

/**
 * Deep sky objects - bright Messier and NGC objects
 */
export const SEARCHABLE_DEEPSKY: SearchableObject[] = [
  { id: 'dso_m45', name: 'Pleiades', type: SearchObjectType.DeepSky, ra: 3.79, dec: 24.12, magnitude: 1.6, constellation: 'Tau', info: 'M45 - Open cluster' },
  { id: 'dso_m42', name: 'Orion Nebula', type: SearchObjectType.DeepSky, ra: 5.58, dec: -5.39, magnitude: 4.0, constellation: 'Ori', info: 'M42 - Emission nebula' },
  { id: 'dso_m31', name: 'Andromeda Galaxy', type: SearchObjectType.DeepSky, ra: 0.71, dec: 41.27, magnitude: 3.4, constellation: 'And', info: 'M31 - Spiral galaxy' },
  { id: 'dso_m44', name: 'Beehive Cluster', type: SearchObjectType.DeepSky, ra: 8.67, dec: 19.99, magnitude: 3.7, constellation: 'Cnc', info: 'M44 - Open cluster' },
  { id: 'dso_m7', name: 'Ptolemy Cluster', type: SearchObjectType.DeepSky, ra: 17.90, dec: -34.80, magnitude: 3.3, constellation: 'Sco', info: 'M7 - Open cluster' },
  { id: 'dso_m22', name: 'Sagittarius Cluster', type: SearchObjectType.DeepSky, ra: 18.61, dec: -23.93, magnitude: 5.1, constellation: 'Sgr', info: 'M22 - Globular' },
  { id: 'dso_m8', name: 'Lagoon Nebula', type: SearchObjectType.DeepSky, ra: 18.06, dec: -24.39, magnitude: 5.8, constellation: 'Sgr', info: 'M8 - Emission nebula' },
  { id: 'dso_m20', name: 'Trifid Nebula', type: SearchObjectType.DeepSky, ra: 18.06, dec: -23.03, magnitude: 6.3, constellation: 'Sgr', info: 'M20 - Emission nebula' },
  { id: 'dso_m13', name: 'Hercules Cluster', type: SearchObjectType.DeepSky, ra: 16.69, dec: 36.46, magnitude: 5.8, constellation: 'Her', info: 'M13 - Globular' },
  { id: 'dso_m57', name: 'Ring Nebula', type: SearchObjectType.DeepSky, ra: 18.89, dec: 33.03, magnitude: 8.8, constellation: 'Lyr', info: 'M57 - Planetary' },
  { id: 'dso_m27', name: 'Dumbbell Nebula', type: SearchObjectType.DeepSky, ra: 19.99, dec: 22.72, magnitude: 7.5, constellation: 'Vul', info: 'M27 - Planetary' },
  { id: 'dso_m51', name: 'Whirlpool Galaxy', type: SearchObjectType.DeepSky, ra: 13.50, dec: 47.20, magnitude: 8.4, constellation: 'CVn', info: 'M51 - Spiral galaxy' },
  { id: 'dso_m81', name: 'Bode Galaxy', type: SearchObjectType.DeepSky, ra: 9.93, dec: 69.07, magnitude: 6.9, constellation: 'UMa', info: 'M81 - Spiral galaxy' },
  { id: 'dso_m101', name: 'Pinwheel Galaxy', type: SearchObjectType.DeepSky, ra: 14.05, dec: 54.35, magnitude: 7.9, constellation: 'UMa', info: 'M101 - Spiral galaxy' },
  { id: 'dso_m1', name: 'Crab Nebula', type: SearchObjectType.DeepSky, ra: 5.58, dec: 22.01, magnitude: 8.4, constellation: 'Tau', info: 'M1 - Supernova remnant' },
];

/**
 * Constellations - for finding whole constellations
 */
export const SEARCHABLE_CONSTELLATIONS: SearchableObject[] = [
  { id: 'const_orion', name: 'Orion', type: SearchObjectType.Constellation, ra: 5.50, dec: 5.00, magnitude: 0, constellation: 'Ori', info: 'The Hunter' },
  { id: 'const_ursa_major', name: 'Ursa Major', type: SearchObjectType.Constellation, ra: 11.00, dec: 55.00, magnitude: 0, constellation: 'UMa', info: 'Big Dipper' },
  { id: 'const_cassiopeia', name: 'Cassiopeia', type: SearchObjectType.Constellation, ra: 1.00, dec: 60.00, magnitude: 0, constellation: 'Cas', info: 'The Queen' },
  { id: 'const_cygnus', name: 'Cygnus', type: SearchObjectType.Constellation, ra: 20.50, dec: 42.00, magnitude: 0, constellation: 'Cyg', info: 'The Swan' },
  { id: 'const_scorpius', name: 'Scorpius', type: SearchObjectType.Constellation, ra: 16.50, dec: -30.00, magnitude: 0, constellation: 'Sco', info: 'The Scorpion' },
  { id: 'const_crux', name: 'Crux', type: SearchObjectType.Constellation, ra: 12.50, dec: -60.00, magnitude: 0, constellation: 'Cru', info: 'Southern Cross' },
  { id: 'const_leo', name: 'Leo', type: SearchObjectType.Constellation, ra: 10.50, dec: 15.00, magnitude: 0, constellation: 'Leo', info: 'The Lion' },
  { id: 'const_sagittarius', name: 'Sagittarius', type: SearchObjectType.Constellation, ra: 19.00, dec: -25.00, magnitude: 0, constellation: 'Sgr', info: 'The Archer' },
];

/**
 * Get all searchable objects
 */
export function getAllSearchableObjects(): SearchableObject[] {
  return [
    ...SEARCHABLE_STARS,
    ...SEARCHABLE_PLANETS,
    ...SEARCHABLE_DEEPSKY,
    ...SEARCHABLE_CONSTELLATIONS,
  ];
}

/**
 * Get objects by category
 */
export function getSearchableObjectsByCategory(category: string): SearchableObject[] {
  switch (category) {
    case 'bright_stars':
      return SEARCHABLE_STARS;
    case 'planets':
      return SEARCHABLE_PLANETS;
    case 'deepsky':
      return SEARCHABLE_DEEPSKY;
    case 'constellations':
      return SEARCHABLE_CONSTELLATIONS;
    case 'all':
    default:
      return getAllSearchableObjects();
  }
}

/**
 * Find an object by its ID
 */
export function findObjectById(id: string): SearchableObject | undefined {
  return getAllSearchableObjects().find(obj => obj.id === id);
}

/**
 * Get simple menu names for display
 */
export function getObjectNamesForMenu(category: string = 'all'): string[] {
  const objects = getSearchableObjectsByCategory(category);
  return objects.map(obj => obj.name);
}
