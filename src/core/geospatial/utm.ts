/**
 * UTM & MGRS Coordinate Conversion Utilities for Tactical Navigation
 * Computes UTM Zone, Easting, and Northing from WGS84 Lat/Lon
 */

export interface UTMCoordinate {
  zone: number;
  hemisphere: 'N' | 'S';
  easting: number;
  northing: number;
  formatted: string;
}

export function latLonToUTM(lat: number, lon: number): UTMCoordinate {
  // Constrain inputs
  const latitude = Math.max(-80, Math.min(84, lat));
  let longitude = lon;
  while (longitude < -180) longitude += 360;
  while (longitude > 180) longitude -= 360;

  const zone = Math.floor((longitude + 180) / 6) + 1;
  const hemisphere = latitude >= 0 ? 'N' : 'S';

  const a = 6378137.0; // WGS84 semi-major axis
  const f = 1 / 298.257223563; // WGS84 flattening
  const e2 = 2 * f - f * f; // eccentricity squared
  const k0 = 0.9996; // scale factor

  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;
  const lonOrigin = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = (e2 / (1 - e2)) * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - lonOrigin);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad)
  );

  const easting = k0 * N * (
    A +
    (1 - T + C) * Math.pow(A, 3) / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * (e2 / (1 - e2))) * Math.pow(A, 5) / 120
  ) + 500000.0;

  let northing = k0 * (
    M +
    N * Math.tan(latRad) * (
      Math.pow(A, 2) / 2 +
      (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 +
      (61 - 58 * T + T * T + 600 * C - 330 * (e2 / (1 - e2))) * Math.pow(A, 6) / 720
    )
  );

  if (latitude < 0) {
    northing += 10000000.0; // false northing for southern hemisphere
  }

  const roundedEasting = Math.round(easting);
  const roundedNorthing = Math.round(northing);

  return {
    zone,
    hemisphere,
    easting: roundedEasting,
    northing: roundedNorthing,
    formatted: `${zone}${hemisphere} ${roundedEasting}m E, ${roundedNorthing}m N`,
  };
}
