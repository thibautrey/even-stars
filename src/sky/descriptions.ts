// Celestial object descriptions for Explain mode
// Short, glanceable descriptions for smart glasses auto-scrolling sidebar

import { getUserDescription } from '../speech/userCatalog';

/**
 * Star description entry
 */
export interface CelestialDescription {
  /** Display name (must match star/planet name in catalogs) */
  name: string;
  /** Quick one-line summary for the banner */
  summary: string;
  /** Longer description for auto-scrolling sidebar (3-6 sentences) */
  description: string;
  /** Distance from Earth as human-readable string */
  distance?: string;
  /** Constellation this object belongs to */
  constellation?: string;
  /** Best season to observe */
  season?: string;
  /** Fun/cultural fact */
  funFact?: string;
}

// ============================================================================
// STAR DESCRIPTIONS
// ============================================================================

export const STAR_DESCRIPTIONS: Record<string, CelestialDescription> = {
  'Sirius': {
    name: 'Sirius',
    summary: 'Brightest star in the night sky',
    description: 'Sirius is the brightest star visible from Earth, shining at magnitude -1.46. It is a binary system: Sirius A is a white main-sequence star, and Sirius B is a faint white dwarf. Ancient Egyptians based their calendar on its heliacal rising, which signaled the annual flooding of the Nile.',
    distance: '8.6 light-years',
    constellation: 'Canis Major',
    season: 'Winter',
    funFact: 'Known as the "Dog Star" — origin of the phrase "dog days of summer".',
  },
  'Canopus': {
    name: 'Canopus',
    summary: 'Second brightest star',
    description: 'Canopus is a white supergiant and the second brightest star in the sky. It served as a key navigation star for sailors in the Southern Hemisphere. NASA uses Canopus as a reference point for spacecraft orientation due to its brightness and position far from the ecliptic.',
    distance: '310 light-years',
    constellation: 'Carina',
    season: 'Winter',
    funFact: 'Named after the pilot of King Menelaus in Greek mythology.',
  },
  'Arcturus': {
    name: 'Arcturus',
    summary: 'Brightest star in the northern sky',
    description: 'Arcturus is an orange giant about 25 times the diameter of the Sun. It is the brightest star in the northern celestial hemisphere. Its light was used to open the 1933 Chicago World\'s Fair because it was believed to be 40 light-years away, matching the time since the previous fair.',
    distance: '37 light-years',
    constellation: 'Boötes',
    season: 'Spring',
    funFact: 'Moving toward us at 5 km/s — in 4,000 years it will be even brighter.',
  },
  'Vega': {
    name: 'Vega',
    summary: 'Former North Star, future North Star',
    description: 'Vega is a blue-white star and was the northern pole star around 12,000 BC. It will be again in about 13,700 years. Vega was the first star (after the Sun) to be photographed and the first to have its spectrum recorded. It is part of the Summer Triangle asterism with Deneb and Altair.',
    distance: '25 light-years',
    constellation: 'Lyra',
    season: 'Summer',
    funFact: 'Vega spins so fast it bulges 23% wider at its equator.',
  },
  'Capella': {
    name: 'Capella',
    summary: 'A quadruple star system',
    description: 'Capella appears as a single bright star but is actually four stars in two binary pairs. The primary pair consists of two evolved giant stars. Capella is the closest first-magnitude star to the north celestial pole and is circumpolar from most northern latitudes.',
    distance: '43 light-years',
    constellation: 'Auriga',
    season: 'Winter',
    funFact: 'Its name means "little she-goat" in Latin.',
  },
  'Rigel': {
    name: 'Rigel',
    summary: 'Blue supergiant in Orion',
    description: 'Rigel is a blue supergiant roughly 120,000 times more luminous than the Sun. It marks the left foot of Orion. Despite its "Beta" designation, Rigel is usually brighter than Betelgeuse (Alpha Orionis). If placed where the Sun is, Rigel would extend past Mercury\'s orbit.',
    distance: '860 light-years',
    constellation: 'Orion',
    season: 'Winter',
    funFact: 'Its name comes from Arabic meaning "the foot of the great one".',
  },
  'Procyon': {
    name: 'Procyon',
    summary: 'The "before the dog" star',
    description: 'Procyon rises just before Sirius (the Dog Star) in the night sky, which gave it its Greek name meaning "before the dog." It is a binary system with a white dwarf companion, Procyon B. Together with Sirius and Betelgeuse, it forms the Winter Triangle asterism.',
    distance: '11.5 light-years',
    constellation: 'Canis Minor',
    season: 'Winter',
    funFact: 'One of the nearest bright stars to Earth.',
  },
  'Betelgeuse': {
    name: 'Betelgeuse',
    summary: 'Red supergiant, future supernova',
    description: 'Betelgeuse is a red supergiant so large that if it replaced the Sun, its surface would reach Jupiter\'s orbit. It is nearing the end of its life and will explode as a supernova within the next 100,000 years. When it does, it will briefly outshine the full Moon.',
    distance: '700 light-years',
    constellation: 'Orion',
    season: 'Winter',
    funFact: 'Its brightness dimmed dramatically in 2019-2020, exciting astronomers worldwide.',
  },
  'Altair': {
    name: 'Altair',
    summary: 'Fastest-spinning bright star',
    description: 'Altair rotates once every 10 hours — so fast that it is noticeably flattened. Its equatorial diameter is 22% larger than its polar diameter. Altair forms the Summer Triangle with Vega and Deneb. In Japanese legend, Altair represents the cowherd separated from the weaver star (Vega) by the Milky Way.',
    distance: '17 light-years',
    constellation: 'Aquila',
    season: 'Summer',
    funFact: 'One of the first stars directly imaged using interferometry.',
  },
  'Aldebaran': {
    name: 'Aldebaran',
    summary: 'The eye of the bull',
    description: 'Aldebaran is an orange giant marking the eye of Taurus the Bull. Though it appears embedded in the Hyades star cluster, it is actually much closer to us. It has exhausted its hydrogen fuel and is now fusing helium, having expanded to about 44 times the Sun\'s diameter.',
    distance: '65 light-years',
    constellation: 'Taurus',
    season: 'Winter',
    funFact: 'Pioneer 10 is heading toward Aldebaran and will arrive in about 2 million years.',
  },
  'Antares': {
    name: 'Antares',
    summary: 'Rival of Mars',
    description: 'Antares is a red supergiant whose reddish color rivals that of Mars — hence its name, meaning "rival of Ares" (the Greek Mars). It is over 700 times the Sun\'s diameter. Antares marks the heart of Scorpius and is best seen low on the southern horizon in summer evenings.',
    distance: '550 light-years',
    constellation: 'Scorpius',
    season: 'Summer',
    funFact: 'Has a hot blue companion star that is lost in its glare.',
  },
  'Spica': {
    name: 'Spica',
    summary: 'Ear of wheat in Virgo',
    description: 'Spica is a spectroscopic binary where the two stars orbit so close they distort each other into egg shapes. It represents the ear of wheat held by Virgo. Hipparchus discovered the precession of the equinoxes by comparing Spica\'s position over centuries.',
    distance: '250 light-years',
    constellation: 'Virgo',
    season: 'Spring',
    funFact: 'Appears on the flag of Brazil, representing the state of Pará.',
  },
  'Pollux': {
    name: 'Pollux',
    summary: 'Twin star with a planet',
    description: 'Pollux is the brighter of the Gemini twins and the closest giant star to the Sun. In 2006, a Jupiter-like exoplanet (Pollux b) was confirmed orbiting it. Unlike its "twin" Castor (a complex six-star system), Pollux is a single orange giant.',
    distance: '34 light-years',
    constellation: 'Gemini',
    season: 'Winter',
    funFact: 'Named after one of the twin sons of Zeus in Greek mythology.',
  },
  'Fomalhaut': {
    name: 'Fomalhaut',
    summary: 'The loneliest bright star',
    description: 'Fomalhaut sits in an otherwise dim region of sky, earning it the nickname "the loneliest star." It is surrounded by a spectacular debris disk — one of the first to be directly imaged. A candidate exoplanet, Fomalhaut b, was one of the first directly photographed, though its nature is debated.',
    distance: '25 light-years',
    constellation: 'Piscis Austrinus',
    season: 'Autumn',
    funFact: 'Its debris ring is sometimes called "the Eye of Sauron".',
  },
  'Deneb': {
    name: 'Deneb',
    summary: 'One of the most luminous stars known',
    description: 'Deneb is roughly 200,000 times more luminous than the Sun. It marks the tail of Cygnus the Swan and is the most distant first-magnitude star. Part of the Summer Triangle, Deneb would appear as bright as a half-Moon if placed at Sirius\'s distance.',
    distance: '2,600 light-years',
    constellation: 'Cygnus',
    season: 'Summer',
    funFact: 'Its name means "tail" in Arabic (from the swan\'s tail).',
  },
  'Regulus': {
    name: 'Regulus',
    summary: 'The little king',
    description: 'Regulus is a quadruple star system at the heart of Leo the Lion. It sits almost exactly on the ecliptic, so the Moon and planets regularly pass very close to it. Regulus spins remarkably fast — if it rotated just 16% faster, it would tear itself apart.',
    distance: '79 light-years',
    constellation: 'Leo',
    season: 'Spring',
    funFact: 'Copernicus, Ptolemy, and nearly every ancient astronomer cataloged it.',
  },
  'Castor': {
    name: 'Castor',
    summary: 'A six-star system',
    description: 'Castor appears as one star but is actually six stars in three binary pairs. Through a telescope, the two main components are a beautiful double star. Castor represents one of the mythological twins of Gemini, paired with its neighbor Pollux.',
    distance: '51 light-years',
    constellation: 'Gemini',
    season: 'Winter',
    funFact: 'Despite being "Alpha Geminorum," it is fainter than Pollux (Beta).',
  },
  'Polaris': {
    name: 'Polaris',
    summary: 'The North Star',
    description: 'Polaris sits within 1° of the north celestial pole, making it the most important navigation star in history. It is a Cepheid variable star that pulsates slightly. Polaris is actually a triple-star system. Due to precession, it won\'t always be the pole star — Vega held the title 12,000 years ago.',
    distance: '430 light-years',
    constellation: 'Ursa Minor',
    season: 'Year-round',
    funFact: 'Polaris has gotten 2.5 times brighter over the last century.',
  },
  'Dubhe': {
    name: 'Dubhe',
    summary: 'Pointer to Polaris',
    description: 'Dubhe and Merak form the "pointer stars" of the Big Dipper — draw a line through them and you find Polaris. Dubhe is actually a binary star with an orange giant primary. Unlike most Big Dipper stars, Dubhe is not part of the Ursa Major moving group.',
    distance: '124 light-years',
    constellation: 'Ursa Major',
    season: 'Year-round',
    funFact: 'Its name comes from Arabic meaning "the bear" (from Ursa Major).',
  },
};

// ============================================================================
// PLANET DESCRIPTIONS
// ============================================================================

export const PLANET_DESCRIPTIONS: Record<string, CelestialDescription> = {
  'Mercury': {
    name: 'Mercury',
    summary: 'Closest planet to the Sun',
    description: 'Mercury is the smallest planet and closest to the Sun. A day on Mercury (sunrise to sunrise) lasts 176 Earth days. Its surface temperatures swing from -180°C at night to 430°C during the day. With no atmosphere to retain heat, Mercury has the most extreme temperature range in the solar system.',
    distance: '77 million km (avg)',
    funFact: 'Mercury has shrunk by 14 km in diameter as its core cooled.',
  },
  'Venus': {
    name: 'Venus',
    summary: 'Brightest planet, morning/evening star',
    description: 'Venus is the hottest planet at 465°C, hotter even than Mercury, due to a runaway greenhouse effect. Its thick clouds reflect sunlight brilliantly, making it the third brightest object in our sky after the Sun and Moon. Venus rotates backwards — the Sun rises in the west.',
    distance: '41 million km (closest)',
    funFact: 'A day on Venus is longer than its year.',
  },
  'Mars': {
    name: 'Mars',
    summary: 'The Red Planet',
    description: 'Mars gets its red color from iron oxide (rust) on its surface. It has the tallest volcano in the solar system — Olympus Mons at 22 km high. Mars has two tiny moons, Phobos and Deimos. Multiple rovers are currently exploring its surface, searching for signs of ancient microbial life.',
    distance: '56 million km (closest)',
    funFact: 'Mars has seasons like Earth because of a similar axial tilt (25°).',
  },
  'Jupiter': {
    name: 'Jupiter',
    summary: 'Largest planet, gas giant',
    description: 'Jupiter is so large that 1,300 Earths could fit inside it. Its Great Red Spot is a storm larger than Earth that has raged for over 350 years. Jupiter has at least 95 known moons, including Ganymede, the largest moon in the solar system. It acts as a cosmic shield, deflecting asteroids away from Earth.',
    distance: '588 million km (closest)',
    funFact: 'Jupiter\'s magnetic field is 20,000 times stronger than Earth\'s.',
  },
  'Saturn': {
    name: 'Saturn',
    summary: 'The ringed planet',
    description: 'Saturn\'s iconic rings are made of billions of particles of ice and rock, ranging from tiny grains to house-sized boulders. The rings span 282,000 km but are only about 10 meters thick. Saturn is so light it would float in water (if you had a big enough bathtub). Its moon Titan has lakes of liquid methane.',
    distance: '1.2 billion km (closest)',
    funFact: 'Saturn\'s rings may be only 100 million years old — younger than the dinosaurs.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get description for a celestial object by name
 * Searches built-in stars/planets first, then the user-discovered catalog
 */
export function getObjectDescription(name: string): CelestialDescription | null {
  return STAR_DESCRIPTIONS[name] || PLANET_DESCRIPTIONS[name] || getUserDescription(name) || null;
}

/**
 * Get a default description for unknown objects
 */
export function getDefaultDescription(
  name: string,
  type: string,
  magnitude?: number,
  spectral?: string
): CelestialDescription {
  let summary = '';
  let description = '';

  switch (type) {
    case 'star':
      summary = `Star · Mag ${magnitude?.toFixed(1) ?? '?'}`;
      description = `${name} is a star`;
      if (spectral) description += ` of spectral type ${spectral}`;
      if (magnitude !== undefined) {
        if (magnitude < 0) description += '. One of the brightest stars in the sky.';
        else if (magnitude < 1) description += '. A bright first-magnitude star.';
        else if (magnitude < 2) description += '. A second-magnitude star, easily visible to the naked eye.';
        else description += '. Visible on clear nights away from city lights.';
      }
      break;
    case 'planet':
      summary = `Planet · Mag ${magnitude?.toFixed(1) ?? '?'}`;
      description = `${name} is a planet in our solar system visible tonight.`;
      break;
    default:
      summary = `${type} · Mag ${magnitude?.toFixed(1) ?? '?'}`;
      description = `${name} is a ${type} object.`;
  }

  return { name, summary, description };
}
