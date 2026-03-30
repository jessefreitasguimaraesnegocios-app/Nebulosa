import {
  HorizonFromVector,
  Observer,
  RotateVector,
  Rotation_EQJ_HOR,
  Spherical,
  VectorFromSphere,
} from 'astronomy-engine';
import type { Coordinates } from './astronomy';

/** Alt/az para estrela com RA/Dec J2000, alinhado ao pipeline do Astronomy Engine (refração). */
export function getStarHorizontalEngine(
  raHours: number,
  decDeg: number,
  location: Coordinates,
  date: Date
): { alt: number; az: number } {
  const observer = new Observer(location.lat, location.lon, 0);
  let lonDeg = (raHours * 15) % 360;
  if (lonDeg < 0) lonDeg += 360;
  const sphere = new Spherical(decDeg, lonDeg, 1);
  const vec = VectorFromSphere(sphere, date);
  const rot = Rotation_EQJ_HOR(date, observer);
  const horVec = RotateVector(rot, vec);
  const h = HorizonFromVector(horVec, 'normal');
  return { alt: h.lat, az: h.lon };
}
