import {
  Body,
  Equator,
  Horizon,
  Illumination,
  Observer,
} from 'astronomy-engine';
import type { Coordinates } from './astronomy';

export const SOLAR_BODIES: { id: string; name: string; body: Body; color: string }[] = [
  { id: 'moon', name: 'Lua', body: Body.Moon, color: '#e8e4d9' },
  { id: 'mercury', name: 'Mercúrio', body: Body.Mercury, color: '#b8b8b8' },
  { id: 'venus', name: 'Vênus', body: Body.Venus, color: '#f0e6a8' },
  { id: 'mars', name: 'Marte', body: Body.Mars, color: '#c86432' },
  { id: 'jupiter', name: 'Júpiter', body: Body.Jupiter, color: '#d4a574' },
  { id: 'saturn', name: 'Saturno', body: Body.Saturn, color: '#e8d4a8' },
  { id: 'uranus', name: 'Urano', body: Body.Uranus, color: '#9fd4e8' },
  { id: 'neptune', name: 'Netuno', body: Body.Neptune, color: '#6b8cff' },
];

export interface SolarBodyPosition {
  id: string;
  name: string;
  body: Body;
  color: string;
  alt: number;
  az: number;
  mag: number;
  /** Distância geocêntrica em UA */
  geoDistAu: number;
  phaseFraction?: number;
  ringTilt?: number;
}

function makeObserver(location: Coordinates): Observer {
  return new Observer(location.lat, location.lon, 0);
}

export function computeSolarPositions(
  location: Coordinates,
  date: Date
): SolarBodyPosition[] {
  const observer = makeObserver(location);
  const out: SolarBodyPosition[] = [];

  for (const row of SOLAR_BODIES) {
    const equ = Equator(row.body, date, observer, true, true);
    const hor = Horizon(date, observer, equ.ra, equ.dec, 'normal');
    const ill = Illumination(row.body, date);

    out.push({
      ...row,
      alt: hor.altitude,
      az: hor.azimuth,
      mag: ill.mag,
      geoDistAu: ill.geo_dist,
      phaseFraction: row.body === Body.Moon ? ill.phase_fraction : undefined,
      ringTilt: ill.ring_tilt,
    });
  }

  return out;
}
