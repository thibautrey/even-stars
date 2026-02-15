/**
 * Deep Sky Object Catalog
 * Most notable and observable galaxies, nebulas, and clusters
 * Includes Messier objects, NGC objects, and other well-known targets
 */

/**
 * Deep sky object definition
 */
export interface DeepSkyObject {
  /** Messier number (if applicable, e.g., "M31") or NGC number */
  catalogId: string;
  /** Common name of the object (e.g., "Andromeda Galaxy") */
  name: string;
  /** Type of object: galaxy, nebula, cluster, planetary_nebula, supernova_remnant */
  objectType: 'galaxy' | 'nebula' | 'cluster' | 'planetary_nebula' | 'supernova_remnant';
  /** Right Ascension in decimal hours (0-24) */
  ra: number;
  /** Declination in decimal degrees (-90 to +90) */
  dec: number;
  /** Visual magnitude */
  magnitude: number;
  /** Size in arcminutes (approximate angular size) */
  sizeArcmin?: number;
  /** Constellation this object is located in */
  constellation: string;
  /** Best season to observe */
  season: string;
}

/**
 * Most notable deep sky objects - primarily Messier catalog
 * These are the most commonly observed and well-known objects
 */
export const DEEP_SKY_OBJECTS: DeepSkyObject[] = [
  // =========================================================================
  // GALAXY GROUP - Most famous galaxies
  // =========================================================================

  {
    catalogId: 'M31',
    name: 'Andromeda Galaxy',
    objectType: 'galaxy',
    ra: 0.7125,
    dec: 41.2688,
    magnitude: 3.4,
    sizeArcmin: 220,
    constellation: 'Andromeda',
    season: 'Autumn/Winter',
  },
  {
    catalogId: 'M33',
    name: 'Triangulum Galaxy',
    objectType: 'galaxy',
    ra: 1.5583,
    dec: 30.6599,
    magnitude: 5.7,
    sizeArcmin: 73,
    constellation: 'Triangulum',
    season: 'Autumn/Winter',
  },
  {
    catalogId: 'M51',
    name: 'Whirlpool Galaxy',
    objectType: 'galaxy',
    ra: 13.4297,
    dec: 47.1952,
    magnitude: 8.4,
    sizeArcmin: 11,
    constellation: 'Canes Venatici',
    season: 'Spring',
  },
  {
    catalogId: 'M64',
    name: 'Black Eye Galaxy',
    objectType: 'galaxy',
    ra: 12.8188,
    dec: 21.6829,
    magnitude: 8.5,
    sizeArcmin: 9,
    constellation: 'Coma Berenices',
    season: 'Spring',
  },
  {
    catalogId: 'M74',
    name: 'Phantom Galaxy',
    objectType: 'galaxy',
    ra: 1.3808,
    dec: 15.7917,
    magnitude: 9.2,
    sizeArcmin: 11,
    constellation: 'Pisces',
    season: 'Autumn/Winter',
  },
  {
    catalogId: 'M77',
    name: 'Cetus A Galaxy',
    objectType: 'galaxy',
    ra: 2.7083,
    dec: -0.0133,
    magnitude: 8.9,
    sizeArcmin: 7,
    constellation: 'Cetus',
    season: 'Autumn/Winter',
  },
  {
    catalogId: 'M81',
    name: 'Bode\'s Galaxy',
    objectType: 'galaxy',
    ra: 9.9358,
    dec: 69.0347,
    magnitude: 6.9,
    sizeArcmin: 27,
    constellation: 'Ursa Major',
    season: 'Winter/Spring',
  },
  {
    catalogId: 'M82',
    name: 'Cigar Galaxy',
    objectType: 'galaxy',
    ra: 9.9608,
    dec: 69.6797,
    magnitude: 8.4,
    sizeArcmin: 11,
    constellation: 'Ursa Major',
    season: 'Winter/Spring',
  },
  {
    catalogId: 'M104',
    name: 'Sombrero Galaxy',
    objectType: 'galaxy',
    ra: 12.3900,
    dec: -11.6230,
    magnitude: 8.0,
    sizeArcmin: 9,
    constellation: 'Virgo',
    season: 'Spring',
  },

  // =========================================================================
  // NEBULA GROUP - Bright emission and planetary nebulas
  // =========================================================================

  {
    catalogId: 'M42',
    name: 'Orion Nebula',
    objectType: 'nebula',
    ra: 5.5889,
    dec: -5.3917,
    magnitude: 4.0,
    sizeArcmin: 66,
    constellation: 'Orion',
    season: 'Winter',
  },
  {
    catalogId: 'M43',
    name: 'De Mairan\'s Nebula',
    objectType: 'nebula',
    ra: 5.6017,
    dec: -5.0239,
    magnitude: 9.0,
    sizeArcmin: 20,
    constellation: 'Orion',
    season: 'Winter',
  },
  {
    catalogId: 'M57',
    name: 'Ring Nebula',
    objectType: 'planetary_nebula',
    ra: 18.8942,
    dec: 33.0347,
    magnitude: 8.8,
    sizeArcmin: 1.4,
    constellation: 'Lyra',
    season: 'Summer',
  },
  {
    catalogId: 'M27',
    name: 'Dumbbell Nebula',
    objectType: 'planetary_nebula',
    ra: 19.9894,
    dec: 22.7206,
    magnitude: 7.5,
    sizeArcmin: 8,
    constellation: 'Vulpecula',
    season: 'Summer',
  },
  {
    catalogId: 'M97',
    name: 'Owl Nebula',
    objectType: 'planetary_nebula',
    ra: 11.0142,
    dec: 55.0136,
    magnitude: 9.9,
    sizeArcmin: 3.4,
    constellation: 'Ursa Major',
    season: 'Winter/Spring',
  },
  {
    catalogId: 'M20',
    name: 'Trifid Nebula',
    objectType: 'nebula',
    ra: 18.0233,
    dec: -23.0167,
    magnitude: 6.3,
    sizeArcmin: 29,
    constellation: 'Sagittarius',
    season: 'Summer',
  },
  {
    catalogId: 'M8',
    name: 'Lagoon Nebula',
    objectType: 'nebula',
    ra: 18.0408,
    dec: -24.3822,
    magnitude: 6.0,
    sizeArcmin: 90,
    constellation: 'Sagittarius',
    season: 'Summer',
  },
  {
    catalogId: 'M17',
    name: 'Omega Nebula',
    objectType: 'nebula',
    ra: 18.3408,
    dec: -16.1917,
    magnitude: 6.0,
    sizeArcmin: 40,
    constellation: 'Sagittarius',
    season: 'Summer',
  },

  // =========================================================================
  // CLUSTER GROUP - Star clusters (globular and open)
  // =========================================================================

  {
    catalogId: 'M13',
    name: 'Great Globular Cluster in Hercules',
    objectType: 'cluster',
    ra: 16.4161,
    dec: 36.4613,
    magnitude: 5.8,
    sizeArcmin: 16.6,
    constellation: 'Hercules',
    season: 'Summer',
  },
  {
    catalogId: 'M3',
    name: 'Canes Venatici Globular Cluster',
    objectType: 'cluster',
    ra: 13.7122,
    dec: 28.3767,
    magnitude: 6.2,
    sizeArcmin: 16.2,
    constellation: 'Canes Venatici',
    season: 'Spring',
  },
  {
    catalogId: 'M5',
    name: 'Serpens Globular Cluster',
    objectType: 'cluster',
    ra: 15.3089,
    dec: 2.0850,
    magnitude: 5.6,
    sizeArcmin: 17.4,
    constellation: 'Serpens',
    season: 'Spring/Summer',
  },
  {
    catalogId: 'M10',
    name: 'Ophiuchus Globular Cluster',
    objectType: 'cluster',
    ra: 16.7567,
    dec: -4.1,
    magnitude: 6.4,
    sizeArcmin: 15.1,
    constellation: 'Ophiuchus',
    season: 'Summer',
  },
  {
    catalogId: 'M15',
    name: 'Pegasus Globular Cluster',
    objectType: 'cluster',
    ra: 21.5,
    dec: 12.1667,
    magnitude: 6.2,
    sizeArcmin: 12.3,
    constellation: 'Pegasus',
    season: 'Autumn',
  },
  {
    catalogId: 'M2',
    name: 'Aquarius Globular Cluster',
    objectType: 'cluster',
    ra: 21.5333,
    dec: -0.8167,
    magnitude: 6.5,
    sizeArcmin: 16.0,
    constellation: 'Aquarius',
    season: 'Autumn',
  },
  {
    catalogId: 'M22',
    name: 'Sagittarius Globular Cluster',
    objectType: 'cluster',
    ra: 18.6042,
    dec: -23.9022,
    magnitude: 5.1,
    sizeArcmin: 32.3,
    constellation: 'Sagittarius',
    season: 'Summer',
  },
  {
    catalogId: 'M92',
    name: 'Hercules Globular Cluster',
    objectType: 'cluster',
    ra: 17.2708,
    dec: 43.1353,
    magnitude: 6.5,
    sizeArcmin: 11.2,
    constellation: 'Hercules',
    season: 'Summer',
  },
  {
    catalogId: 'M37',
    name: 'Auriga Open Cluster',
    objectType: 'cluster',
    ra: 5.8608,
    dec: 32.5517,
    magnitude: 5.6,
    sizeArcmin: 24,
    constellation: 'Auriga',
    season: 'Winter',
  },
  {
    catalogId: 'M45',
    name: 'Pleiades',
    objectType: 'cluster',
    ra: 3.7917,
    dec: 24.1067,
    magnitude: 1.6,
    sizeArcmin: 110,
    constellation: 'Taurus',
    season: 'Winter',
  },
  {
    catalogId: 'M44',
    name: 'Beehive Cluster',
    objectType: 'cluster',
    ra: 8.6667,
    dec: 19.9833,
    magnitude: 3.1,
    sizeArcmin: 95,
    constellation: 'Cancer',
    season: 'Winter/Spring',
  },
  {
    catalogId: 'M35',
    name: 'Gemini Open Cluster',
    objectType: 'cluster',
    ra: 6.1475,
    dec: 24.3375,
    magnitude: 5.1,
    sizeArcmin: 28,
    constellation: 'Gemini',
    season: 'Winter',
  },
  {
    catalogId: 'M11',
    name: 'Wild Duck Cluster',
    objectType: 'cluster',
    ra: 18.8517,
    dec: -6.2667,
    magnitude: 5.8,
    sizeArcmin: 14,
    constellation: 'Scutum',
    season: 'Summer',
  },

  // =========================================================================
  // SPECIAL OBJECTS
  // =========================================================================

  {
    catalogId: 'M1',
    name: 'Crab Nebula',
    objectType: 'supernova_remnant',
    ra: 5.5756,
    dec: 22.0147,
    magnitude: 8.4,
    sizeArcmin: 6,
    constellation: 'Taurus',
    season: 'Winter',
  },
  {
    catalogId: 'M6',
    name: 'Butterfly Cluster',
    objectType: 'cluster',
    ra: 17.6725,
    dec: -32.2192,
    magnitude: 4.2,
    sizeArcmin: 33,
    constellation: 'Scorpius',
    season: 'Summer',
  },
  {
    catalogId: 'M7',
    name: 'Ptolemaeus Cluster',
    objectType: 'cluster',
    ra: 17.8933,
    dec: -34.7917,
    magnitude: 3.3,
    sizeArcmin: 80,
    constellation: 'Scorpius',
    season: 'Summer',
  },
];
