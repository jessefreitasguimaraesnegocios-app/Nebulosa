/** Arestas do desenho clássico (IDs do nosso catálogo). */
export interface ConstellationEdge {
  from: string;
  to: string;
}

export const CONSTELLATION_EDGES: ConstellationEdge[] = [
  // Orion
  { from: 'betelgeuse', to: 'bellatrix' },
  { from: 'bellatrix', to: 'mintaka' },
  { from: 'mintaka', to: 'alnilam' },
  { from: 'alnilam', to: 'alnitak' },
  { from: 'alnitak', to: 'saiph' },
  { from: 'saiph', to: 'rigel' },
  { from: 'betelgeuse', to: 'alnitak' },
  // Cruzeiro do Sul (com δ Cru)
  { from: 'acrux', to: 'mimosa' },
  { from: 'mimosa', to: 'gacrux' },
  { from: 'gacrux', to: 'deltacru' },
  { from: 'deltacru', to: 'acrux' },
  { from: 'acrux', to: 'epsilongcru' },
  { from: 'epsilongcru', to: 'gacrux' },
  // Ursa Maior
  { from: 'dubhe', to: 'merak' },
  { from: 'merak', to: 'phecda' },
  { from: 'phecda', to: 'megrez' },
  { from: 'megrez', to: 'dubhe' },
  { from: 'megrez', to: 'alioth' },
  { from: 'alioth', to: 'mizar' },
  { from: 'mizar', to: 'alkaid' },
  // Escorpião
  { from: 'antares', to: 'shaula' },
  { from: 'shaula', to: 'girtab' },
  // Gêmeos
  { from: 'pollux', to: 'castor' },
  { from: 'castor', to: 'alhena' },
  { from: 'alhena', to: 'pollux' },
  // Leão
  { from: 'regulus', to: 'algieba' },
  { from: 'algieba', to: 'denebola' },
  // Cassiopeia (triângulo principal no catálogo)
  { from: 'schedar', to: 'caph' },
  { from: 'caph', to: 'gammacas' },
  { from: 'gammacas', to: 'schedar' },
  // Cisne
  { from: 'deneb', to: 'sadr' },
  { from: 'sadr', to: 'albireo' },
  // Andrômeda
  { from: 'alpheratz', to: 'mirach' },
  { from: 'mirach', to: 'almach' },
  // Centauro
  { from: 'rigilkent', to: 'hadar' },
];

/** Asterismos com rótulo em português (centroide = média das posições projetadas). */
export const NAMED_ASTERISMS: { id: string; label: string; starIds: string[] }[] = [
  { id: 'tres-marias', label: 'Três Marias', starIds: ['alnitak', 'alnilam', 'mintaka'] },
  { id: 'cruzeiro', label: 'Cruzeiro do Sul', starIds: ['acrux', 'mimosa', 'gacrux', 'deltacru'] },
];

/** Nome exibido por constelação (agrupa estrelas do catálogo). */
export const CONSTELLATION_DISPLAY_NAMES: Record<string, string> = {
  Orion: 'Órion',
  'Cruzeiro do Sul': 'Cruzeiro do Sul',
  'Ursa Maior': 'Ursa Maior',
  Escorpião: 'Escorpião',
  Gêmeos: 'Gêmeos',
  Leão: 'Leão',
  Cassiopeia: 'Cassiopeia',
  Cisne: 'Cisne',
  Andrômeda: 'Andrômeda',
  Centauro: 'Centauro',
  'Cão Maior': 'Cão Maior',
  'Cão Menor': 'Cão Menor',
  Touro: 'Touro',
  Virgem: 'Virgem',
  Boieiro: 'Boieiro',
  Lira: 'Lira',
  Águia: 'Águia',
  Carina: 'Carina',
  Perseu: 'Perseu',
  Pégaso: 'Pégaso',
  Sagitário: 'Sagitário',
  Cefeu: 'Cefeu',
  Ofiúco: 'Ofiúco',
  Dragão: 'Dragão',
  Pavão: 'Pavão',
  Eriano: 'Eriano',
  Fênix: 'Fênix',
  'Peixe Austral': 'Peixe Austral',
  'Ursa Menor': 'Ursa Menor',
  Áries: 'Áries',
  Cocheiro: 'Cocheiro',
};
