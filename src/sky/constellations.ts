// Constellation definitions - line patterns connecting stars
// Uses HR numbers to reference stars from the catalog

import type { Constellation } from '../types';

/**
 * Major constellation line patterns
 * Each constellation defines the stars (by HR number) and lines connecting them
 */
export const CONSTELLATIONS: Constellation[] = [
  // ORION - The Hunter
  {
    abbr: 'ORI',
    name: 'Orion',
    stars: [
      1713, // Rigel (Beta)
      1790, // Bellatrix (Gamma)
      1903, // Alnilam (Epsilon) - middle of belt
      1948, // Alnitak (Zeta) - eastern belt
      1852, // Mintaka (Delta) - western belt
      2061, // Betelgeuse (Alpha)
      2047, // Meissa (Lambda) - head
      2124, // Tabit (Pi3) - shield
      2004, // Saiph (Kappa)
    ],
    lines: [
      [0, 1], // Rigel - Bellatrix (base)
      [1, 4], // Bellatrix - Mintaka
      [4, 2], // Mintaka - Alnilam
      [2, 3], // Alnilam - Alnitak
      [3, 0], // Alnitak - Rigel
      [2, 5], // Alnilam - Betelgeuse
      [5, 7], // Betelgeuse - Meissa
      [0, 8], // Rigel - Saiph
    ],
  },

  // URSA MAJOR - The Great Bear (Big Dipper)
  {
    abbr: 'UMA',
    name: 'Ursa Major',
    stars: [
      4301, // Dubhe (Alpha)
      4295, // Merak (Beta)
      4554, // Phecda (Gamma)
      4660, // Megrez (Delta)
      4905, // Alioth (Epsilon)
      5054, // Mizar (Zeta)
      5191, // Alkaid (Eta)
    ],
    lines: [
      [0, 1], // Dubhe - Merak
      [1, 2], // Merak - Phecda
      [2, 3], // Phecda - Megrez
      [3, 4], // Megrez - Alioth
      [4, 5], // Alioth - Mizar
      [5, 6], // Mizar - Alkaid
      [3, 0], // Megrez - Dubhe (bowl)
    ],
  },

  // CASSIOPEIA - The Queen (W shape)
  {
    abbr: 'CAS',
    name: 'Cassiopeia',
    stars: [
      168,  // Schedar (Alpha)
      403,  // Caph (Beta)
      542,  // Gamma
      403,  // Ruchbah (Delta)
      8544, // Segin (Epsilon)
    ],
    lines: [
      [1, 3], // Caph - Ruchbah
      [3, 2], // Ruchbah - Gamma
      [2, 4], // Gamma - Segin
      [2, 0], // Gamma - Schedar
    ],
  },

  // URSA MINOR - The Little Bear (Little Dipper)
  {
    abbr: 'UMI',
    name: 'Ursa Minor',
    stars: [
      424,  // Polaris (Alpha) - North Star
      5563, // Kochab (Beta)
      5903, // Pherkad (Gamma)
      4891, // Delta
      5744, // Epsilon
      5430, // Zeta
      5735, // Eta
    ],
    lines: [
      [0, 3], // Polaris - Delta
      [3, 4], // Delta - Epsilon
      [4, 5], // Epsilon - Zeta
      [5, 6], // Zeta - Eta
      [6, 1], // Eta - Kochab
      [1, 2], // Kochab - Pherkad
      [2, 0], // Pherkad - Polaris
    ],
  },

  // GEMINI - The Twins
  {
    abbr: 'GEM',
    name: 'Gemini',
    stars: [
      2891, // Castor (Alpha)
      2990, // Pollux (Beta)
      2216, // Alhena (Gamma)
      2540, // Wasat (Delta)
      2905, // Mebsuta (Epsilon)
      2473, // Mekbuda (Zeta)
      2821, // Propus (Eta)
    ],
    lines: [
      [0, 1], // Castor - Pollux (twin heads)
      [0, 2], // Castor - Alhena
      [1, 3], // Pollux - Wasat
      [2, 4], // Alhena - Mebsuta
      [3, 5], // Wasat - Mekbuda
      [4, 6], // Mebsuta - Propus
    ],
  },

  // CANIS MAJOR - The Great Dog
  {
    abbr: 'CMA',
    name: 'Canis Major',
    stars: [
      2491, // Sirius (Alpha) - brightest star
      2294, // Mirzam (Beta)
      2618, // Adhara (Epsilon)
      2693, // Wezen (Delta)
      2827, // Aludra (Eta)
    ],
    lines: [
      [0, 1], // Sirius - Mirzam
      [1, 2], // Mirzam - Adhara
      [2, 3], // Adhara - Wezen
      [3, 4], // Wezen - Aludra
    ],
  },

  // LEO - The Lion
  {
    abbr: 'LEO',
    name: 'Leo',
    stars: [
      3982, // Regulus (Alpha) - heart
      4057, // Algieba (Gamma)
      4031, // Adhafera (Zeta)
      4359, // Rasalas (Mu)
      3905, // Epsilon
      4534, // Denebola (Beta) - tail
      4399, // Zosma (Delta)
      4357, // Chertan (Theta)
    ],
    lines: [
      [4, 3], // Epsilon - Rasalas
      [3, 2], // Rasalas - Adhafera
      [2, 1], // Adhafera - Algieba
      [1, 0], // Algieba - Regulus (sickle)
      [0, 6], // Regulus - Zosma
      [6, 7], // Zosma - Chertan
      [7, 5], // Chertan - Denebola (tail)
    ],
  },

  // SCORPIUS - The Scorpion
  {
    abbr: 'SCO',
    name: 'Scorpius',
    stars: [
      6134, // Antares (Alpha) - heart
      5953, // Dschubba (Delta)
      5944, // Pi Scorpii
      6084, // Sargas (Theta)
      6247, // Shaula (Lambda) - tail sting
      6527, // Girtab (Kappa)
      6580, // Lesath (Upsilon)
    ],
    lines: [
      [0, 1], // Antares - Dschubba
      [1, 2], // Dschubba - Pi
      [0, 3], // Antares - Sargas
      [3, 4], // Sargas - Shaula (tail)
      [4, 5], // Shaula - Girtab
      [5, 6], // Girtab - Lesath
    ],
  },

  // CRUX - The Southern Cross
  {
    abbr: 'CRU',
    name: 'Crux',
    stars: [
      4853, // Mimosa (Beta)
      4730, // Acrux (Alpha)
      4763, // Gacrux (Gamma)
      4656, // Delta
    ],
    lines: [
      [0, 1], // Mimosa - Acrux
      [1, 3], // Acrux - Delta
      [3, 2], // Delta - Gacrux
      [2, 0], // Gacrux - Mimosa
    ],
  },

  // CYGINUS - The Swan (Northern Cross)
  {
    abbr: 'CYG',
    name: 'Cygnus',
    stars: [
      7924, // Deneb (Alpha) - tail
      7615, // Sadr (Gamma) - center
      7949, // Albireo (Beta) - beak
      7420, // Delta
      7498, // Epsilon
      7776, // Zeta
    ],
    lines: [
      [0, 1], // Deneb - Sadr
      [1, 2], // Sadr - Albireo (body)
      [1, 3], // Sadr - Delta (wing)
      [1, 4], // Sadr - Epsilon (wing)
      [4, 5], // Epsilon - Zeta
    ],
  },

  // AQUILA - The Eagle
  {
    abbr: 'AQL',
    name: 'Aquila',
    stars: [
      7557, // Altair (Alpha)
      7377, // Tarazed (Gamma)
      7235, // Alshain (Beta)
      7570, // Delta
      7447, // Epsilon
    ],
    lines: [
      [1, 0], // Tarazed - Altair
      [0, 2], // Altair - Alshain
      [0, 3], // Altair - Delta
      [0, 4], // Altair - Epsilon
    ],
  },

  // TAURUS - The Bull
  {
    abbr: 'TAU',
    name: 'Taurus',
    stars: [
      1457, // Aldebaran (Alpha) - red eye
      1239, // Elnath (Beta) - northern horn
      1412, // Ain (Epsilon)
      1346, // Hyadum I (Gamma)
      1178, // Hyadum II (Delta)
      1030, // Chamukuy (Theta)
    ],
    lines: [
      [3, 4], // Hyadum I - Hyadum II
      [4, 2], // Hyadum II - Ain
      [2, 0], // Ain - Aldebaran
      [0, 3], // Aldebaran - Hyadum I (V shape)
      [0, 5], // Aldebaran - Chamukuy
    ],
  },
];

/**
 * Get a constellation by abbreviation
 */
export function getConstellationByAbbr(abbr: string): Constellation | undefined {
  return CONSTELLATIONS.find(c => c.abbr === abbr.toUpperCase());
}

/**
 * Get all constellations visible in the sky (simplified - all for now)
 */
export function getAllConstellations(): Constellation[] {
  return CONSTELLATIONS;
}
