import { SKY_STARS } from '../constants/stars';
import { SOLAR_BODIES } from './ephemeris';
import { NAMED_ASTERISMS } from '../constants/constellationFigures';

export type SearchEntryKind = 'star' | 'solar' | 'asterism' | 'constellation';

export interface SearchEntry {
  id: string;
  label: string;
  kind: SearchEntryKind;
  /** Para foco por constelação (campo `constellation` das estrelas). */
  constellation?: string;
}

export const CONSTELLATION_SEARCH: { id: string; label: string; constellation: string }[] = [
  { id: 'const-orion', label: 'Constelação Órion', constellation: 'Orion' },
  { id: 'const-cruzeiro', label: 'Constelação Cruzeiro do Sul', constellation: 'Cruzeiro do Sul' },
  { id: 'const-ursamaior', label: 'Constelação Ursa Maior', constellation: 'Ursa Maior' },
  { id: 'const-escorpiao', label: 'Constelação Escorpião', constellation: 'Escorpião' },
  { id: 'const-gemeos', label: 'Constelação Gêmeos', constellation: 'Gêmeos' },
  { id: 'const-leao', label: 'Constelação Leão', constellation: 'Leão' },
  { id: 'const-cassiopeia', label: 'Constelação Cassiopeia', constellation: 'Cassiopeia' },
  { id: 'const-cisne', label: 'Constelação Cisne', constellation: 'Cisne' },
  { id: 'const-centauro', label: 'Constelação Centauro', constellation: 'Centauro' },
];

export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const s of SKY_STARS) {
    out.push({ id: s.id, label: `${s.name} (estrela)`, kind: 'star' });
  }
  for (const b of SOLAR_BODIES) {
    out.push({ id: b.id, label: `${b.name}`, kind: 'solar' });
  }
  for (const a of NAMED_ASTERISMS) {
    out.push({ id: `asterism-${a.id}`, label: `${a.label} (asterismo)`, kind: 'asterism' });
  }
  for (const c of CONSTELLATION_SEARCH) {
    out.push({
      id: c.id,
      label: c.label,
      kind: 'constellation',
      constellation: c.constellation,
    });
  }
  return out;
}

export interface FocusDrawPoint {
  x: number;
  y: number;
}

/** Resolve centro do mapa (coordenadas no disco antes do pan/zoom) para focar busca. */
export function resolveFocusPosition(
  focusId: string | null,
  starDraw: { id: string; x: number; y: number; constellation?: string }[],
  bodyDraw: { id: string; x: number; y: number }[]
): FocusDrawPoint | null {
  if (!focusId) return null;
  const st = starDraw.find((s) => s.id === focusId);
  if (st) return { x: st.x, y: st.y };
  const bd = bodyDraw.find((b) => b.id === focusId);
  if (bd) return { x: bd.x, y: bd.y };
  if (focusId.startsWith('asterism-')) {
    const raw = focusId.slice('asterism-'.length);
    const def = NAMED_ASTERISMS.find((a) => a.id === raw);
    if (!def) return null;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const sid of def.starIds) {
      const p = starDraw.find((s) => s.id === sid);
      if (p) {
        sx += p.x;
        sy += p.y;
        n++;
      }
    }
    return n > 0 ? { x: sx / n, y: sy / n } : null;
  }
  const csearch = CONSTELLATION_SEARCH.find((c) => c.id === focusId);
  if (csearch) {
    const members = starDraw.filter((s) => s.constellation === csearch.constellation);
    if (members.length === 0) return null;
    const sx = members.reduce((a, s) => a + s.x, 0);
    const sy = members.reduce((a, s) => a + s.y, 0);
    return { x: sx / members.length, y: sy / members.length };
  }
  return null;
}
