export interface Star {
  id: string;
  name: string;
  ra: number; // Right Ascension (hours)
  dec: number; // Declination (degrees)
  mag: number; // Apparent Magnitude
  dist?: number; // Distance in light years
  constellation?: string;
}

// Top brightest stars (subset of Yale Bright Star Catalog)
export const BRIGHT_STARS: Star[] = [
  { id: 'sirius', name: 'Sirius', ra: 6.75, dec: -16.72, mag: -1.46, dist: 8.6, constellation: 'Cão Maior' },
  { id: 'canopus', name: 'Canopus', ra: 6.4, dec: -52.7, mag: -0.72, dist: 310, constellation: 'Carina' },
  { id: 'arcturus', name: 'Arcturus', ra: 14.26, dec: 19.18, mag: -0.04, dist: 37, constellation: 'Boieiro' },
  { id: 'vega', name: 'Vega', ra: 18.62, dec: 38.78, mag: 0.03, dist: 25, constellation: 'Lira' },
  { id: 'capella', name: 'Capella', ra: 5.28, dec: 46.0, mag: 0.08, dist: 42, constellation: 'Cocheiro' },
  { id: 'rigel', name: 'Rigel', ra: 5.24, dec: -8.2, mag: 0.12, dist: 860, constellation: 'Orion' },
  { id: 'procyon', name: 'Procyon', ra: 7.65, dec: 5.22, mag: 0.34, dist: 11, constellation: 'Cão Menor' },
  { id: 'betelgeuse', name: 'Betelgeuse', ra: 5.92, dec: 7.4, mag: 0.42, dist: 640, constellation: 'Orion' },
  { id: 'altair', name: 'Altair', ra: 19.85, dec: 8.87, mag: 0.77, dist: 17, constellation: 'Águia' },
  { id: 'aldebaran', name: 'Aldebaran', ra: 4.59, dec: 16.5, mag: 0.85, dist: 65, constellation: 'Touro' },
  { id: 'antares', name: 'Antares', ra: 16.49, dec: -26.43, mag: 1.06, dist: 550, constellation: 'Escorpião' },
  { id: 'spica', name: 'Spica', ra: 13.42, dec: -11.16, mag: 1.04, dist: 260, constellation: 'Virgem' },
  { id: 'pollux', ra: 7.75, dec: 28.02, mag: 1.14, name: 'Pollux', dist: 34, constellation: 'Gêmeos' },
  { id: 'fomalhaut', ra: 22.96, dec: -29.62, mag: 1.16, name: 'Fomalhaut', dist: 25, constellation: 'Peixe Austral' },
  { id: 'deneb', ra: 20.69, dec: 45.28, mag: 1.25, name: 'Deneb', dist: 2600, constellation: 'Cisne' },
  { id: 'regulus', ra: 10.14, dec: 11.97, mag: 1.35, name: 'Regulus', dist: 77, constellation: 'Leão' },
  { id: 'castor', ra: 7.58, dec: 31.88, mag: 1.58, name: 'Castor', dist: 52, constellation: 'Gêmeos' },
  { id: 'bellatrix', ra: 5.42, dec: 6.35, mag: 1.64, name: 'Bellatrix', dist: 240, constellation: 'Orion' },
  { id: 'polaris', ra: 2.53, dec: 89.26, mag: 1.97, name: 'Polaris', dist: 430, constellation: 'Ursa Menor' },
];

export interface ConstellationLine {
  from: string;
  to: string;
}

export const CONSTELLATION_LINES: ConstellationLine[] = [
  // Orion
  { from: 'betelgeuse', to: 'bellatrix' },
  { from: 'bellatrix', to: 'rigel' },
  { from: 'rigel', to: 'sirius' }, // Just for visualization
];
