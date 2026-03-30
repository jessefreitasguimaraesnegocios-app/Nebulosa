import type { Star } from '../constants/stars';
import type { SolarBodyPosition } from '../lib/ephemeris';

export type SkySelection =
  | { kind: 'star'; star: Star }
  | { kind: 'solar'; solar: SolarBodyPosition };
