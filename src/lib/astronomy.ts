/**
 * Basic astronomy calculations for coordinate conversion.
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface CelestialCoords {
  ra: number; // Right Ascension in decimal hours (0-24)
  dec: number; // Declination in decimal degrees (-90 to 90)
}

export interface HorizontalCoords {
  alt: number; // Altitude in degrees (0 to 90)
  az: number; // Azimuth in degrees (0 to 360, North=0, East=90)
}

/**
 * Converts RA/Dec to Alt/Az based on location and time.
 */
export function getHorizontalCoords(
  celestial: CelestialCoords,
  location: Coordinates,
  date: Date = new Date()
): HorizontalCoords {
  const { ra, dec } = celestial;
  const { lat, lon } = location;

  // Convert to radians
  const latRad = (lat * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const raRad = (ra * 15 * Math.PI) / 180; // 15 degrees per hour

  // Calculate Local Sidereal Time (LST)
  const lst = getLST(date, lon);
  const lstRad = (lst * 15 * Math.PI) / 180;

  // Hour Angle (HA)
  const haRad = lstRad - raRad;

  // Altitude
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altRad = Math.asin(sinAlt);
  const alt = (altRad * 180) / Math.PI;

  // Azimuth
  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(altRad));
  let azRad = Math.acos(cosAz);
  let az = (azRad * 180) / Math.PI;

  if (Math.sin(haRad) > 0) {
    az = 360 - az;
  }

  return { alt, az };
}

/**
 * Calculates Local Sidereal Time in decimal hours.
 */
function getLST(date: Date, lon: number): number {
  const j2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const now = date.getTime();
  const daysSinceJ2000 = (now - j2000) / (1000 * 60 * 60 * 24);

  // Greenwich Sidereal Time
  let gst = 18.697374558 + 24.06570982441908 * daysSinceJ2000;
  gst = gst % 24;
  if (gst < 0) gst += 24;

  // Local Sidereal Time
  let lst = gst + lon / 15;
  lst = lst % 24;
  if (lst < 0) lst += 24;

  return lst;
}
