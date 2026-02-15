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
// DEEP SKY OBJECT DESCRIPTIONS
// ============================================================================

export const DEEPSKY_DESCRIPTIONS: Record<string, CelestialDescription> = {
  'Andromeda Galaxy': {
    name: 'Andromeda Galaxy',
    summary: 'Nearest major galaxy, larger than the Milky Way',
    description: 'The Andromeda Galaxy (M31) is the nearest major galaxy to the Milky Way, located 2.5 million light-years away. It contains about 1 trillion stars and is heading toward the Milky Way at 110 km/s. In about 4.5 billion years, Andromeda will merge with the Milky Way to form a new elliptical galaxy. Despite being the most distant object visible to the naked eye, it covers an area of sky six times wider than the full Moon.',
    distance: '2.5 million light-years',
    season: 'Autumn/Winter',
    funFact: 'Andromeda is so large that under dark skies you can fit 6 full Moons across its disk.',
  },
  'Triangulum Galaxy': {
    name: 'Triangulum Galaxy',
    summary: 'Third-largest galaxy in the Local Group',
    description: 'The Triangulum Galaxy (M33) is a spiral galaxy about 3 million light-years away and part of the Local Group with the Milky Way and Andromeda. Though it contains about 40 billion stars, it appears much smaller than Andromeda due to its distance and orientation. It\'s a favorite target for astrophotographers because its spiral structure is well-defined and relatively easy to observe.',
    distance: '3 million light-years',
    season: 'Autumn/Winter',
    funFact: 'M33 is one of the farthest objects you can see without binoculars.',
  },
  'Whirlpool Galaxy': {
    name: 'Whirlpool Galaxy',
    summary: 'Classic spiral galaxy with prominent arms',
    description: 'The Whirlpool Galaxy (M51) is a grand-design spiral galaxy about 23 million light-years away. It\'s famous for its striking spiral arms and is interacting with the smaller NGC 5195 galaxy. This gravitational encounter is responsible for the dramatic spiral structure that makes M51 one of the most photographed galaxies. The galaxy is tilted toward us, giving an excellent view of its spiral structure.',
    distance: '23 million light-years',
    season: 'Spring',
    funFact: 'M51 was one of the first objects confirmed to be outside the Milky Way.',
  },
  'Black Eye Galaxy': {
    name: 'Black Eye Galaxy',
    summary: 'Galaxy with prominent dark dust lane',
    description: 'The Black Eye Galaxy (M64) is a spiral galaxy with an unusual large dust lane crossing in front of its bright central core, giving it the appearance of an eye with an eyebrow. This dust structure makes it one of the most distinctive galaxies visible through amateur telescopes. It\'s located 24 million light-years away and contains about 100 billion stars.',
    distance: '24 million light-years',
    season: 'Spring',
    funFact: 'The dust lane may be material from a smaller galaxy that M64 absorbed in the past.',
  },
  'Phantom Galaxy': {
    name: 'Phantom Galaxy',
    summary: 'Grand-design spiral galaxy with perfect symmetry',
    description: 'The Phantom Galaxy (M74) is a face-on spiral galaxy famous for its perfect symmetrical spiral structure and ten clearly defined spiral arms. Located 32 million light-years away, it\'s a favorite for professional and amateur astronomers because of its peaceful, regular appearance. The term "grand design" refers to its prominent and well-defined spiral arms.',
    distance: '32 million light-years',
    season: 'Autumn/Winter',
    funFact: 'The Phantom Galaxy\'s spins one rotation every 300 million years.',
  },
  'Cetus A Galaxy': {
    name: 'Cetus A Galaxy',
    summary: 'Active radio galaxy with powerful jets',
    description: 'Cetus A (M77) is a Seyfert galaxy about 47 million light-years away, meaning it has an extremely bright core powered by a supermassive black hole. It\'s one of the strongest radio sources in the sky and shows powerful jets of energy extending millions of light-years into space. The galaxy is spiral-shaped internally but appears much smaller than more distant spirals.',
    distance: '47 million light-years',
    season: 'Autumn/Winter',
    funFact: 'M77 is a billion times more luminous than the Sun at radio wavelengths.',
  },
  'Bode\'s Galaxy': {
    name: 'Bode\'s Galaxy',
    summary: 'Bright spiral galaxy with smooth structure',
    description: 'Bode\'s Galaxy (M81) is a grand-design spiral galaxy about 12 million light-years away, making it one of the nearest galaxies to Earth. It\'s nearly as large as the Andromeda Galaxy but shines with a more concentrated light. M81 is gravitationally interacting with nearby M82 (Cigar Galaxy), and these two galaxies are among the most prominent in the northern sky.',
    distance: '12 million light-years',
    season: 'Winter/Spring',
    funFact: 'Bode\'s Galaxy formed from the collision of two smaller galaxies billions of years ago.',
  },
  'Cigar Galaxy': {
    name: 'Cigar Galaxy',
    summary: 'Starburst galaxy with intense star formation',
    description: 'The Cigar Galaxy (M82) is an edge-on spiral galaxy famous for its intense starburst activity, with star formation occurring at rates 10 times higher than the Milky Way. Located 11.5 million light-years away, it\'s undergoing gravitational tidal forces from Bode\'s Galaxy (M81), which is fueling the extreme star formation. X-rays from massive stars and supernova explosions create dramatic galactic winds.',
    distance: '11.5 million light-years',
    season: 'Winter/Spring',
    funFact: 'The starburst in M82 will eventually calm down over the next few billion years.',
  },
  'Sombrero Galaxy': {
    name: 'Sombrero Galaxy',
    summary: 'Edge-on galaxy with spectacular dust lane',
    description: 'The Sombrero Galaxy (M104) is an edge-on spiral galaxy about 29 million light-years away, famous for its unusual appearance. A massive dust lane encircles the galaxy\'s bright core, creating the distinctive sombrero shape. The prominence of this dust band suggests a major galactic collision in the distant past. M104 contains about 800 billion stars and a supermassive black hole.',
    distance: '29 million light-years',
    season: 'Spring',
    funFact: 'The Sombrero\'s dust lane is so thick it blocks visible light from the galaxy\'s bright center in some areas.',
  },
  'Orion Nebula': {
    name: 'Orion Nebula',
    summary: 'Brightest emission nebula, stellar nursery',
    description: 'The Orion Nebula (M42) is the brightest emission nebula visible to the naked eye and one of the most famous deep sky objects. Located 1,300 light-years away, it\'s a stellar nursery where hundreds of new stars are actively forming. The nebula glows from radiation emitted by hot young stars at its core. Through a telescope, you can see the Trapezium Cluster of four bright hot stars that illuminate the nebula.',
    distance: '1,300 light-years',
    season: 'Winter',
    funFact: 'New stars are being born in the Orion Nebula right now at a rate of about 1,500 per year.',
  },
  'De Mairan\'s Nebula': {
    name: 'De Mairan\'s Nebula',
    summary: 'Part of the Orion Nebula complex',
    description: 'De Mairan\'s Nebula (M43) is a bright nebula and a distinct part of the larger Orion Nebula complex. It\'s separated from M42 by a dark dust lane and contains its own bright central star. The nebula is illuminated by a young hot star similar to those in M42, making it an excellent target for studying stellar formation.',
    distance: '1,300 light-years',
    season: 'Winter',
    funFact: 'M43 was cataloged separately from M42 because of the dark dust lane between them.',
  },
  'Ring Nebula': {
    name: 'Ring Nebula',
    summary: 'Archetypal planetary nebula, glowing stellar remnant',
    description: 'The Ring Nebula (M57) is perhaps the most famous planetary nebula and is created by a dying star that has ejected its outer layers. Located 2,200 light-years away in the constellation Lyra, it appears as a glowing ring of gas surrounding a white dwarf. The ring is thought to be a torus, with the dark center being a hole through the middle rather than an empty space.',
    distance: '2,200 light-years',
    season: 'Summer',
    funFact: 'M57 won\'t remain a ring forever—in about 10,000 years it will expand and fade away.',
  },
  'Dumbbell Nebula': {
    name: 'Dumbbell Nebula',
    summary: 'Large, bright planetary nebula with twin lobes',
    description: 'The Dumbbell Nebula (M27) is one of the largest and brightest planetary nebulae, located about 1,200 light-years away. Its distinctive dumbbell shape comes from two lobes of gas expanding outward from a central white dwarf. The nebula glows brilliantly in green and red wavelengths of light. Through a telescope it\'s a spectacular sight, with details visible in its structure.',
    distance: '1,200 light-years',
    season: 'Summer',
    funFact: 'The Dumbbell Nebula was the first planetary nebula discovered.',
  },
  'Owl Nebula': {
    name: 'Owl Nebula',
    summary: 'Planetary nebula with eye-like appearance',
    description: 'The Owl Nebula (M97) is a planetary nebula located about 2,600 light-years away in Ursa Major. True to its name, it has two prominent dark spots that resemble owl eyes, created by denser regions in the nebula shell. The nebula is much larger than it appears because its outer regions are extremely faint and require dark skies and good optics to fully appreciate.',
    distance: '2,600 light-years',
    season: 'Winter/Spring',
    funFact: 'The Owl Nebula\'s total expansion rate is about 26 km/s.',
  },
  'Trifid Nebula': {
    name: 'Trifid Nebula',
    summary: 'Three-lobed nebula combining three types',
    description: 'The Trifid Nebula (M20) is a complex nebula featuring three distinct types: a red emission nebula, a blue reflection nebula, and a dark absorption nebula that divides it into three lobes. Located 6,000 light-years away in Sagittarius, it\'s illuminated by a hot central star. The three types show different processes of interaction between gas and starlight.',
    distance: '6,000 light-years',
    season: 'Summer',
    funFact: 'The dark dividing lines in M20 are caused by cosmic dust blocking starlight.',
  },
  'Lagoon Nebula': {
    name: 'Lagoon Nebula',
    summary: 'Large H II region with dark dust lane',
    description: 'The Lagoon Nebula (M8) is a bright H II region about 6,000 light-years away in Sagittarius. It gets its name from the dark dust lane running through its center, resembling a lagoon. The nebula contains several embedded star clusters and is an excellent region for studying stellar formation. It\'s one of the larger nebulae visible with binoculars under dark skies.',
    distance: '6,000 light-years',
    season: 'Summer',
    funFact: 'The Lagoon Nebula spans an area equivalent to 4 full Moon diameters.',
  },
  'Omega Nebula': {
    name: 'Omega Nebula',
    summary: 'Swan-shaped emission nebula',
    description: 'The Omega Nebula (M17), also called the Swan Nebula, is a bright emission nebula about 6,000 light-years away in Sagittarius. Its distinctive shape looks like the Greek letter Omega (Ω) or a graceful swan in flight. The nebula is illuminated by the radiation from hot young stars within it, creating an excellent stellar nursery for studying star formation processes.',
    distance: '6,000 light-years',
    season: 'Summer',
    funFact: 'In the southern hemisphere, M17 is sometimes called the Checkmark Nebula.',
  },
  'Great Globular Cluster in Hercules': {
    name: 'Great Globular Cluster in Hercules',
    summary: 'Brightest globular cluster in northern sky',
    description: 'The Great Globular Cluster in Hercules (M13) is the brightest globular cluster visible from the northern hemisphere, located about 25,000 light-years away. It contains several hundred thousand stars packed into a sphere about 145 light-years in diameter. M13 was chosen as the target for the Arecibo message in 1974, a radio signal beamed toward extraterrestrial life. Through binoculars it appears as a faint fuzzball; telescopes resolve thousands of individual stars.',
    distance: '25,000 light-years',
    season: 'Summer',
    funFact: 'M13 is so bright that it\'s visible to the naked eye under perfect conditions.',
  },
  'Canes Venatici Globular Cluster': {
    name: 'Canes Venatici Globular Cluster',
    summary: 'Compact, rich globular cluster',
    description: 'The Canes Venatici Globular Cluster (M3) is a magnificent globular cluster about 35,000 light-years away containing about 500,000 stars. Despite being fainter than M13, it\'s considered by many to be more beautiful due to its more compact appearance and more even star distribution. M3 is one of the best regions for studying the evolution of old stars.',
    distance: '35,000 light-years',
    season: 'Spring',
    funFact: 'M3 contains many variable stars that change brightness over time.',
  },
  'Serpens Globular Cluster': {
    name: 'Serpens Globular Cluster',
    summary: 'Oblate spheroid globular cluster',
    description: 'The Serpens Globular Cluster (M5) is a bright globular cluster about 24,500 light-years away in the constellation Serpens. It\'s one of the oldest clusters we know of, with an age of about 13 billion years. M5 has an interesting flattened shape (oblate spheroid) rather than a perfect sphere, possibly due to its rapid rotation.',
    distance: '24,500 light-years',
    season: 'Spring/Summer',
    funFact: 'The core of M5 is so densely packed that stars are colliding and merging.',
  },
  'Ophiuchus Globular Cluster': {
    name: 'Ophiuchus Globular Cluster',
    summary: 'Rich globular cluster with distinct core',
    description: 'The Ophiuchus Globular Cluster (M10) is a globular cluster about 14,300 light-years away featuring a bright, concentrated core surrounded by a more diffuse outer region. It contains hundreds of thousands of stars and shows clear signs of core collapse, where the central region becomes increasingly dense over time. M10 is an excellent laboratory for studying stellar dynamics.',
    distance: '14,300 light-years',
    season: 'Summer',
    funFact: 'M10\'s characteristic structure shows the effects of gravitational interactions among its millions of stars.',
  },
  'Pegasus Globular Cluster': {
    name: 'Pegasus Globular Cluster',
    summary: 'Distant globular cluster',
    description: 'The Pegasus Globular Cluster (M15) is a densely packed globular cluster about 35,000 light-years away in Pegasus. It\'s one of the most concentrated globular clusters known, with a very tight stellar core. Despite being relatively faint, M15 is a popular target for advanced amateur astronomers due to its interesting structure.',
    distance: '35,000 light-years',
    season: 'Autumn',
    funFact: 'M15 contains one of the densest stellar cores known, possibly harboring a central black hole.',
  },
  'Aquarius Globular Cluster': {
    name: 'Aquarius Globular Cluster',
    summary: 'Distant southern globular cluster',
    description: 'The Aquarius Globular Cluster (M2) is a bright globular cluster about 37,500 light-years away, one of the most distant globular clusters observable from the northern hemisphere. Despite its distance, it remains quite bright and visible in small telescopes. M2 contains over 150,000 stars within a sphere about 175 light-years in diameter.',
    distance: '37,500 light-years',
    season: 'Autumn',
    funFact: 'M2 is so distant that its variable stars are at the edge of what we can observe.',
  },
  'Sagittarius Globular Cluster': {
    name: 'Sagittarius Globular Cluster',
    summary: 'Brightest globular cluster in southern sky',
    description: 'The Sagittarius Globular Cluster (M22) is the brightest globular cluster visible from the southern hemisphere, located about 10,600 light-years away. It contains over 500,000 stars packed into a region about 35 light-years across. M22 is visible to the naked eye under dark skies and is one of the most densely packed stellar systems known.',
    distance: '10,600 light-years',
    season: 'Summer',
    funFact: 'M22 is one of the closest globular clusters to Earth, making it ideal for detailed study.',
  },
  'Hercules Globular Cluster': {
    name: 'Hercules Globular Cluster',
    summary: 'Compact globular cluster with notable structure',
    description: 'The Hercules Globular Cluster (M92) is a bright globular cluster about 26,700 light-years away. Though often overlooked in favor of the nearby M13, M92 is actually remarkably similar and equally beautiful. It shows clear concentric rings of stars when viewed through a telescope, and contains about 330,000 stars.',
    distance: '26,700 light-years',
    season: 'Summer',
    funFact: 'M92 is one of the oldest globular clusters known, with an age of about 14 billion years.',
  },
  'Auriga Open Cluster': {
    name: 'Auriga Open Cluster',
    summary: 'Rich open cluster with hundreds of stars',
    description: 'The Auriga Open Cluster (M37) is one of the richest open clusters known, containing over 500 stars spread across a region about 24 light-years wide. Located about 4,500 light-years away in Auriga, M37 is famous for its beautiful golden and red colored stars that give it a jeweled appearance through a telescope.',
    distance: '4,500 light-years',
    season: 'Winter',
    funFact: 'The many different colored stars in M37 reflect different temperatures and ages.',
  },
  'Pleiades': {
    name: 'Pleiades',
    summary: 'Brilliant open cluster with mythology',
    description: 'The Pleiades (M45) is one of the most famous open clusters and arguably the most beautiful asterism in the night sky. Located about 440 light-years away in Taurus, it\'s a group of young, hot, blue stars surrounded by reflection nebulosity. The Pleiades is visible to the naked eye and appears as a tiny dipper-shaped group. In many cultures, it\'s known as the Seven Sisters.',
    distance: '440 light-years',
    season: 'Winter',
    funFact: 'Islamic calendars have traditionally used the Pleiades to mark the beginning of the year.',
  },
  'Beehive Cluster': {
    name: 'Beehive Cluster',
    summary: 'Ancient open cluster, naked eye visible',
    description: 'The Beehive Cluster (M44) is one of the oldest known open clusters, located about 577 light-years away in Cancer. Despite containing several hundred stars, it\'s quite extended and appears as a misty patch to the naked eye in dark skies. The cluster is surrounded by a faint nebula, though much of it has dispersed. The cluster is about 730 million years old, making its stars significantly older than those in the Pleiades.',
    distance: '577 light-years',
    season: 'Winter/Spring',
    funFact: 'The Beehive is one of the nearest open clusters to Earth.',
  },
  'Gemini Open Cluster': {
    name: 'Gemini Open Cluster',
    summary: 'Young, rich open cluster',
    description: 'The Gemini Open Cluster (M35) is a bright, young open cluster about 2,150 light-years away in Gemini. It contains several hundred stars and shows clear evidence of stellar formation. Through a telescope, M35 appears as a beautiful field of white stars on a dark background, with some members showing subtle color variations.',
    distance: '2,150 light-years',
    season: 'Winter',
    funFact: 'M35 is young enough that some of its stars are still clearing away nebulosity.',
  },
  'Wild Duck Cluster': {
    name: 'Wild Duck Cluster',
    summary: 'Spectacular open cluster with fan shape',
    description: 'The Wild Duck Cluster (M11) is one of the densest open clusters known, containing several thousand stars. Located about 6,000 light-years away in Scutum, it derives its name from the flight pattern of a wild duck flock. Through a telescope, hundreds of stars are resolvable, creating one of the most spectacular stellar scenes in the night sky.',
    distance: '6,000 light-years',
    season: 'Summer',
    funFact: 'M11 is so dense that it may eventually become a globular cluster.',
  },
  'Crab Nebula': {
    name: 'Crab Nebula',
    summary: 'Supernova remnant with pulsar',
    description: 'The Crab Nebula (M1) is a supernova remnant resulting from a supernova explosion observed in 1054 AD by Chinese astronomers. Located about 6,500 light-years away in Taurus, it contains a rapidly spinning neutron star (pulsar) at its center. The nebula is expanding at about 1,500 km/s and continues to brighten as the pulsar supplies energy. It\'s one of the most studied objects in modern astronomy.',
    distance: '6,500 light-years',
    season: 'Winter',
    funFact: 'The pulsar in the Crab Nebula rotates 30 times per second and is the remnant of the original star\'s core.',
  },
  'Butterfly Cluster': {
    name: 'Butterfly Cluster',
    summary: 'Open cluster with distinctive butterfly shape',
    description: 'The Butterfly Cluster (M6) is a bright open cluster in the constellation Scorpius, located about 1,600 light-years away. It gets its name from its distinctive butterfly shape formed by its brightest stars. The cluster contains about 80 bright stars with a red supergiant prominently positioned among them, creating a particularly beautiful sight through telescopes.',
    distance: '1,600 light-years',
    season: 'Summer',
    funFact: 'The red star in M6 creates a striking color contrast with the blue and white stars in the cluster.',
  },
  'Ptolemaeus Cluster': {
    name: 'Ptolemaeus Cluster',
    summary: 'Large, loose open cluster',
    description: 'The Ptolemaeus Cluster (M7) is one of the largest and brightest open clusters, located about 980 light-years away in Scorpius. It was known to the ancient Greeks and was cataloged by Ptolemy in the 2nd century. M7 contains several hundred stars spread across an area of sky about 1.3 degrees wide—roughly equivalent to 2.6 full Moon diameters.',
    distance: '980 light-years',
    season: 'Summer',
    funFact: 'M7 is visible to the naked eye even from light-polluted locations.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get description for a celestial object by name
 * Searches built-in stars/planets/deepsky first, then the user-discovered catalog
 */
export function getObjectDescription(name: string): CelestialDescription | null {
  return STAR_DESCRIPTIONS[name] || PLANET_DESCRIPTIONS[name] || DEEPSKY_DESCRIPTIONS[name] || getUserDescription(name) || null;
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
