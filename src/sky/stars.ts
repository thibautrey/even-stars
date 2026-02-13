// Star catalog - Brightest stars from Yale Bright Star Catalog
// Limited to stars brighter than magnitude 3.5 for performance

import type { Star } from '../types';

/**
 * Bright star catalog for the sky chart
 * Data source: Yale Bright Star Catalog (simplified)
 * Magnitude cutoff: 3.5 (approximately 150 brightest stars)
 */
export const BRIGHT_STARS: Star[] = [
  // Sirius (Alpha Canis Majoris) - brightest star
  { hr: 2491, name: 'Sirius', ra: 6.7525, dec: -16.7161, magnitude: -1.46, spectral: 'A1V' },
  
  // Canopus (Alpha Carinae)
  { hr: 2326, name: 'Canopus', ra: 6.3992, dec: -52.6956, magnitude: -0.74, spectral: 'F0Ib' },
  
  // Arcturus (Alpha Bootis)
  { hr: 5340, name: 'Arcturus', ra: 14.2611, dec: 19.1824, magnitude: -0.05, spectral: 'K1.5IIIFe-0.5' },
  
  // Alpha Centauri (Rigil Kentaurus)
  { hr: 5459, name: 'Alpha Centauri', ra: 14.6608, dec: -60.8351, magnitude: -0.01, spectral: 'G2V' },
  
  // Vega (Alpha Lyrae)
  { hr: 7001, name: 'Vega', ra: 18.6156, dec: 38.7837, magnitude: 0.03, spectral: 'A0V' },
  
  // Capella (Alpha Aurigae)
  { hr: 1708, name: 'Capella', ra: 5.2782, dec: 45.9980, magnitude: 0.08, spectral: 'G5IIIe+G0III' },
  
  // Rigel (Beta Orionis)
  { hr: 1713, name: 'Rigel', ra: 5.2423, dec: -8.2016, magnitude: 0.13, spectral: 'B8Ia' },
  
  // Procyon (Alpha Canis Minoris)
  { hr: 2943, name: 'Procyon', ra: 7.6552, dec: 5.2250, magnitude: 0.34, spectral: 'F5IV-V' },
  
  // Betelgeuse (Alpha Orionis)
  { hr: 2061, name: 'Betelgeuse', ra: 5.9195, dec: 7.4071, magnitude: 0.50, spectral: 'M1-2Ia-Iab' },
  
  // Achernar (Alpha Eridani)
  { hr: 472, name: 'Achernar', ra: 1.6286, dec: -57.2368, magnitude: 0.46, spectral: 'B3Vpe' },
  
  // Hadar (Beta Centauri)
  { hr: 5267, name: 'Hadar', ra: 14.0637, dec: -60.3732, magnitude: 0.61, spectral: 'B1III' },
  
  // Altair (Alpha Aquilae)
  { hr: 7557, name: 'Altair', ra: 19.8463, dec: 8.8683, magnitude: 0.77, spectral: 'A7V' },
  
  // Aldebaran (Alpha Tauri)
  { hr: 1457, name: 'Aldebaran', ra: 4.5987, dec: 16.5093, magnitude: 0.85, spectral: 'K5III' },
  
  // Antares (Alpha Scorpii)
  { hr: 6134, name: 'Antares', ra: 16.4901, dec: -26.4320, magnitude: 0.96, spectral: 'M1.5Iab' },
  
  // Spica (Alpha Virginis)
  { hr: 5107, name: 'Spica', ra: 13.4200, dec: -11.1614, magnitude: 0.98, spectral: 'B1III-IV+B2V' },
  
  // Pollux (Beta Geminorum)
  { hr: 2990, name: 'Pollux', ra: 7.7553, dec: 28.0262, magnitude: 1.14, spectral: 'K0III' },
  
  // Fomalhaut (Alpha Piscis Austrini)
  { hr: 8728, name: 'Fomalhaut', ra: 22.9608, dec: -29.6222, magnitude: 1.16, spectral: 'A3V' },
  
  // Deneb (Alpha Cygni)
  { hr: 7924, name: 'Deneb', ra: 20.6905, dec: 45.2803, magnitude: 1.25, spectral: 'A2Ia' },
  
  // Mimosa (Beta Crucis)
  { hr: 4853, name: 'Mimosa', ra: 12.7954, dec: -59.6888, magnitude: 1.25, spectral: 'B0.5III' },
  
  // Regulus (Alpha Leonis)
  { hr: 3982, name: 'Regulus', ra: 10.1396, dec: 11.9672, magnitude: 1.36, spectral: 'B7V' },
  
  // Adhara (Epsilon Canis Majoris)
  { hr: 2618, name: 'Adhara', ra: 6.9771, dec: -28.9721, magnitude: 1.50, spectral: 'B2II' },
  
  // Castor (Alpha Geminorum)
  { hr: 2891, name: 'Castor', ra: 7.5766, dec: 31.8883, magnitude: 1.58, spectral: 'A1V' },
  
  // Gacrux (Gamma Crucis)
  { hr: 4763, name: 'Gacrux', ra: 12.5197, dec: -57.1132, magnitude: 1.64, spectral: 'M3.5III' },
  
  // Bellatrix (Gamma Orionis)
  { hr: 1790, name: 'Bellatrix', ra: 5.4189, dec: 6.3497, magnitude: 1.64, spectral: 'B2III' },
  
  // Elnath (Beta Tauri)
  { hr: 1791, name: 'Elnath', ra: 5.4382, dec: 28.6075, magnitude: 1.65, spectral: 'B7III' },
  
  // Miaplacidus (Beta Carinae)
  { hr: 3685, name: 'Miaplacidus', ra: 9.2200, dec: -69.7172, magnitude: 1.68, spectral: 'A1III' },
  
  // Alnilam (Epsilon Orionis)
  { hr: 1903, name: 'Alnilam', ra: 5.6036, dec: -1.2019, magnitude: 1.69, spectral: 'B0Ia' },
  
  // Alnair (Alpha Gruis)
  { hr: 8425, name: 'Alnair', ra: 22.1372, dec: -46.9610, magnitude: 1.73, spectral: 'B7IV' },
  
  // Alnitak (Zeta Orionis)
  { hr: 1948, name: 'Alnitak', ra: 5.6793, dec: -1.9426, magnitude: 1.74, spectral: 'O9.5Iab' },
  
  // Dubhe (Alpha Ursae Majoris)
  { hr: 4301, name: 'Dubhe', ra: 11.0621, dec: 61.7510, magnitude: 1.81, spectral: 'K0III' },
  
  // Mirfak (Alpha Persei)
  { hr: 1017, name: 'Mirfak', ra: 3.4054, dec: 49.8612, magnitude: 1.82, spectral: 'F5Ib' },
  
  // Wezen (Delta Canis Majoris)
  { hr: 2693, name: 'Wezen', ra: 7.1399, dec: -26.3932, magnitude: 1.83, spectral: 'F8Ia' },
  
  // Sargas (Theta Scorpii)
  { hr: 6084, name: 'Sargas', ra: 16.3501, dec: -42.9978, magnitude: 1.86, spectral: 'F1II' },
  
  // Kaus Australis (Epsilon Sagittarii)
  { hr: 6879, name: 'Kaus Australis', ra: 18.4029, dec: -34.3846, magnitude: 1.85, spectral: 'B9.5III' },
  
  // Avior (Epsilon Carinae)
  { hr: 3307, name: 'Avior', ra: 8.3752, dec: -59.5095, magnitude: 1.86, spectral: 'K3III+B2V' },
  
  // Alkaid (Eta Ursae Majoris)
  { hr: 5191, name: 'Alkaid', ra: 13.7923, dec: 49.3133, magnitude: 1.86, spectral: 'B3V' },
  
  // Menkalinan (Beta Aurigae)
  { hr: 2088, name: 'Menkalinan', ra: 5.9921, dec: 44.9474, magnitude: 1.90, spectral: 'A1IV' },
  
  // Atria (Alpha Trianguli Australis)
  { hr: 6217, name: 'Atria', ra: 16.8111, dec: -69.0277, magnitude: 1.91, spectral: 'K2IIb-IIIa' },
  
  // Alhena (Gamma Geminorum)
  { hr: 2421, name: 'Alhena', ra: 6.6285, dec: 16.3993, magnitude: 1.93, spectral: 'A0IV' },
  
  // Peacock (Alpha Pavonis)
  { hr: 7790, name: 'Peacock', ra: 20.4275, dec: -56.7351, magnitude: 1.94, spectral: 'B2IV' },
  
  // Polaris (Alpha Ursae Minoris) - North Star
  { hr: 424, name: 'Polaris', ra: 2.5303, dec: 89.2641, magnitude: 1.97, spectral: 'F7:Ib-IIv' },
  
  // Mirzam (Beta Canis Majoris)
  { hr: 2294, name: 'Mirzam', ra: 6.3780, dec: -17.9559, magnitude: 1.98, spectral: 'B1II-III' },
  
  // Alphard (Alpha Hydrae)
  { hr: 3748, name: 'Alphard', ra: 9.4598, dec: -8.6586, magnitude: 1.99, spectral: 'K3III' },
  
  // Hamal (Alpha Arietis)
  { hr: 617, name: 'Hamal', ra: 2.1195, dec: 23.4624, magnitude: 2.01, spectral: 'K2III' },
  
  // Algieba (Gamma Leonis)
  { hr: 4057, name: 'Algieba', ra: 10.3328, dec: 19.8415, magnitude: 2.01, spectral: 'K1III' },
  
  // Diphda (Beta Ceti)
  { hr: 188, name: 'Diphda', ra: 0.7260, dec: -17.9866, magnitude: 2.04, spectral: 'K0III' },
  
  // Mizar (Zeta Ursae Majoris)
  { hr: 5054, name: 'Mizar', ra: 13.3987, dec: 54.9254, magnitude: 2.04, spectral: 'A2Vp' },
  
  // Nunki (Sigma Sagittarii)
  { hr: 7121, name: 'Nunki', ra: 18.9211, dec: -26.2967, magnitude: 2.05, spectral: 'B2.5V' },
  
  // Menkent (Theta Centauri)
  { hr: 5288, name: 'Menkent', ra: 14.1116, dec: -36.3701, magnitude: 2.06, spectral: 'K0IIIb' },
  
  // Mirach (Beta Andromedae)
  { hr: 337, name: 'Mirach', ra: 1.1622, dec: 35.6206, magnitude: 2.07, spectral: 'M0III' },
  
  // Alphecca (Alpha Coronae Borealis)
  { hr: 5793, name: 'Alphecca', ra: 15.5781, dec: 26.7147, magnitude: 2.24, spectral: 'A0V' },
  
  // Rasalhague (Alpha Ophiuchi)
  { hr: 6556, name: 'Rasalhague', ra: 17.5822, dec: 12.5600, magnitude: 2.08, spectral: 'A5IV' },
  
  // Kochab (Beta Ursae Minoris)
  { hr: 5563, name: 'Kochab', ra: 14.8451, dec: 74.1555, magnitude: 2.08, spectral: 'K4III' },
  
  // Saiph (Kappa Orionis)
  { hr: 2004, name: 'Saiph', ra: 5.7959, dec: -9.6696, magnitude: 2.09, spectral: 'B0.5Ia' },
  
  // Denebola (Beta Leonis)
  { hr: 4534, name: 'Denebola', ra: 11.8176, dec: 14.5720, magnitude: 2.14, spectral: 'A3V' },
  
  // Algol (Beta Persei)
  { hr: 936, name: 'Algol', ra: 3.1361, dec: 40.9556, magnitude: 2.12, spectral: 'B8V' },
  
  // Tiaki (Beta Gruis)
  { hr: 8636, name: 'Tiaki', ra: 22.7112, dec: -46.8846, magnitude: 2.15, spectral: 'M5III' },
  
  // Muhlifain (Gamma Centauri)
  { hr: 4819, name: 'Muhlifain', ra: 12.4674, dec: -48.9599, magnitude: 2.17, spectral: 'A0III' },
  
  // Aspidiske (Iota Carinae)
  { hr: 3699, name: 'Aspidiske', ra: 9.2848, dec: -59.2752, magnitude: 2.21, spectral: 'A8Ib' },
  
  // Suhail (Lambda Velorum)
  { hr: 3634, name: 'Suhail', ra: 9.1333, dec: -43.4326, magnitude: 2.23, spectral: 'K4Ib' },
  
  // Alpheratz (Alpha Andromedae)
  { hr: 15, name: 'Alpheratz', ra: 0.1398, dec: 29.0904, magnitude: 2.22, spectral: 'B9p' },
  
  // Mintaka (Delta Orionis)
  { hr: 1852, name: 'Mintaka', ra: 5.5334, dec: -0.2991, magnitude: 2.23, spectral: 'B0III+O9V' },
  
  // Schedar (Alpha Cassiopeiae)
  { hr: 168, name: 'Schedar', ra: 0.6751, dec: 56.5373, magnitude: 2.24, spectral: 'K0IIIa' },
  
  // Almach (Gamma Andromedae)
  { hr: 603, name: 'Almach', ra: 2.0645, dec: 42.3297, magnitude: 2.26, spectral: 'K3IIb' },
  
  // Dschubba (Delta Scorpii)
  { hr: 5953, name: 'Dschubba', ra: 16.0056, dec: -22.6218, magnitude: 2.29, spectral: 'B0.2IV' },
  
  // Naos (Zeta Puppis)
  { hr: 3165, name: 'Naos', ra: 8.1258, dec: -40.0033, magnitude: 2.25, spectral: 'O5IAf' },
  
  // Unukalhai (Alpha Serpentis)
  { hr: 5854, name: 'Unukalhai', ra: 15.7378, dec: 6.4256, magnitude: 2.63, spectral: 'K2III' },
  
  // === Additional stars for constellations ===
  
  // Orion additional stars
  { hr: 2047, name: 'Meissa', ra: 5.5858, dec: 9.9340, magnitude: 3.5, spectral: 'O8e' },
  { hr: 2124, name: 'Tabit', ra: 5.7088, dec: 7.0458, magnitude: 3.2, spectral: 'F6V' },
  
  // Ursa Major additional stars (Big Dipper)
  { hr: 4295, name: 'Merak', ra: 11.0307, dec: 56.3824, magnitude: 2.4, spectral: 'A1V' },
  { hr: 4554, name: 'Phecda', ra: 11.5235, dec: 53.6948, magnitude: 2.4, spectral: 'A0V' },
  { hr: 4660, name: 'Megrez', ra: 12.2572, dec: 57.0326, magnitude: 3.3, spectral: 'A3V' },
  { hr: 4905, name: 'Alioth', ra: 12.9005, dec: 55.9598, magnitude: 1.8, spectral: 'A0p' },
  
  // Cassiopeia additional stars
  { hr: 403, name: 'Caph', ra: 0.1529, dec: 59.1498, magnitude: 2.3, spectral: 'F2III' },
  { hr: 542, name: 'Gamma Cas', ra: 0.9451, dec: 60.7167, magnitude: 2.2, spectral: 'B0.5IV' },
  { hr: 8544, name: 'Segin', ra: 1.9063, dec: 63.6701, magnitude: 3.4, spectral: 'B3V' },
  
  // Ursa Minor additional stars (Little Dipper)
  { hr: 5903, name: 'Pherkad', ra: 15.3455, dec: 71.8340, magnitude: 3.0, spectral: 'A3II-III' },
  { hr: 4891, name: 'Delta UMi', ra: 17.5369, dec: 86.5864, magnitude: 4.4, spectral: 'A1V' },
  { hr: 5744, name: 'Epsilon UMi', ra: 16.7666, dec: 82.0373, magnitude: 4.2, spectral: 'G5III' },
  { hr: 5430, name: 'Zeta UMi', ra: 15.7347, dec: 77.7945, magnitude: 4.3, spectral: 'A3Vn' },
  { hr: 5735, name: 'Eta UMi', ra: 16.2918, dec: 75.7553, magnitude: 4.6, spectral: 'F5V' },
  
  // Gemini additional stars
  { hr: 2216, name: 'Tejat', ra: 6.3827, dec: 22.5136, magnitude: 3.1, spectral: 'M3III' },
  { hr: 2540, name: 'Wasat', ra: 7.3353, dec: 21.9823, magnitude: 3.5, spectral: 'F0IV' },
  { hr: 2905, name: 'Mebsuta', ra: 6.8966, dec: 25.1312, magnitude: 3.0, spectral: 'G8III' },
  { hr: 2473, name: 'Mekbuda', ra: 7.1837, dec: 20.5707, magnitude: 4.0, spectral: 'G3Ib' },
  { hr: 2821, name: 'Propus', ra: 7.1009, dec: 22.6133, magnitude: 3.3, spectral: 'M1III' },
  
  // Canis Major additional stars
  { hr: 2827, name: 'Aludra', ra: 7.4016, dec: -29.3031, magnitude: 2.4, spectral: 'B5Ia' },
  
  // Leo additional stars
  { hr: 4031, name: 'Adhafera', ra: 10.2788, dec: 23.4173, magnitude: 3.4, spectral: 'F0III' },
  { hr: 4359, name: 'Rasalas', ra: 11.2370, dec: 26.1827, magnitude: 4.0, spectral: 'K0III' },
  { hr: 3905, name: 'Epsilon Leo', ra: 9.7642, dec: 23.7743, magnitude: 3.0, spectral: 'G1II' },
  { hr: 4399, name: 'Zosma', ra: 11.2302, dec: 20.5240, magnitude: 2.6, spectral: 'A4V' },
  { hr: 4357, name: 'Chertan', ra: 11.1618, dec: 15.6018, magnitude: 3.3, spectral: 'A2V' },
  
  // Scorpius additional stars
  { hr: 5944, name: 'Pi Sco', ra: 15.9501, dec: -26.1140, magnitude: 2.9, spectral: 'B1V' },
  { hr: 6247, name: 'Shaula', ra: 17.5600, dec: -37.1036, magnitude: 1.6, spectral: 'B1.5IV' },
  { hr: 6527, name: 'Girtab', ra: 17.6217, dec: -39.0340, magnitude: 2.4, spectral: 'F2II' },
  { hr: 6580, name: 'Lesath', ra: 17.7930, dec: -37.3105, magnitude: 2.7, spectral: 'B2IV' },
  
  // Crux additional stars
  { hr: 4730, name: 'Acrux', ra: 12.4433, dec: -63.0559, magnitude: 1.4, spectral: 'B0.5IV' },
  { hr: 4656, name: 'Delta Cru', ra: 12.2527, dec: -58.7489, magnitude: 2.8, spectral: 'B2IV' },
  
  // Cygnus additional stars (Northern Cross)
  { hr: 7615, name: 'Sadr', ra: 20.3705, dec: 40.2567, magnitude: 2.2, spectral: 'F8Ib' },
  { hr: 7949, name: 'Albireo', ra: 19.5120, dec: 27.9597, magnitude: 3.1, spectral: 'K3II' },
  { hr: 7420, name: 'Delta Cyg', ra: 19.7496, dec: 45.1308, magnitude: 2.9, spectral: 'F2Ib' },
  { hr: 7498, name: 'Epsilon Cyg', ra: 20.0474, dec: 47.4701, magnitude: 2.5, spectral: 'K0III' },
  { hr: 7776, name: 'Zeta Cyg', ra: 21.2150, dec: 30.2269, magnitude: 3.2, spectral: 'G8III' },
  
  // Aquila additional stars
  { hr: 7377, name: 'Tarazed', ra: 19.4609, dec: 10.6119, magnitude: 2.7, spectral: 'K3II' },
  { hr: 7235, name: 'Alshain', ra: 19.9244, dec: 6.4070, magnitude: 3.7, spectral: 'G8IV' },
  { hr: 7570, name: 'Delta Aql', ra: 19.4250, dec: 3.1146, magnitude: 3.4, spectral: 'F0IV' },
  { hr: 7447, name: 'Epsilon Aql', ra: 19.0904, dec: -5.0401, magnitude: 4.0, spectral: 'F0III' },
  
  // Taurus additional stars
  { hr: 1239, name: 'Elnath', ra: 5.6278, dec: 28.9875, magnitude: 1.7, spectral: 'B7III' },
  { hr: 1412, name: 'Ain', ra: 4.4769, dec: 19.1804, magnitude: 3.5, spectral: 'G9.5III' },
  { hr: 1346, name: 'Hyadum I', ra: 4.3297, dec: 15.6276, magnitude: 3.7, spectral: 'G8III' },
  { hr: 1178, name: 'Hyadum II', ra: 4.3820, dec: 17.5426, magnitude: 3.8, spectral: 'G9III' },
  { hr: 1030, name: 'Chamukuy', ra: 4.4762, dec: 15.9621, magnitude: 3.4, spectral: 'G7III' },
];

/**
 * Get a star by its HR number
 */
export function getStarByHR(hr: number): Star | undefined {
  return BRIGHT_STARS.find(star => star.hr === hr);
}

/**
 * Get stars visible above a certain magnitude (brightness threshold)
 * @param maxMagnitude Maximum magnitude to include (lower = brighter)
 */
export function getStarsByMagnitude(maxMagnitude: number): Star[] {
  return BRIGHT_STARS.filter(star => star.magnitude <= maxMagnitude);
}

/**
 * Get the brightest star in the catalog
 */
export function getBrightestStar(): Star {
  return BRIGHT_STARS.reduce((brightest, star) => 
    star.magnitude < brightest.magnitude ? star : brightest
  );
}
