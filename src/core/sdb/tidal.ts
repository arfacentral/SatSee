import { VerticalDatum } from '../../types/bathymetry';

/**
 * Normalizes water depth between vertical datums
 * @param depthMsl Raw depth referenced to Mean Sea Level (MSL)
 * @param tideHeightMeters Current tide height above Chart Datum / LAT
 * @param targetDatum Target datum for display / charting
 */
export function normalizeDatum(
  depthMsl: number,
  _tideHeightMeters: number,
  latToMslOffsetMeters: number = 1.2,
  targetDatum: VerticalDatum = 'LAT'
): number {
  switch (targetDatum) {
    case 'LAT':
      // Chart depth = MSL depth - LAT offset
      return Math.max(0, depthMsl - latToMslOffsetMeters);
    case 'CD':
      // Local Chart Datum
      return Math.max(0, depthMsl - latToMslOffsetMeters);
    case 'MSL':
    default:
      return depthMsl;
  }
}

/**
 * Mackenzie (1981) formula for sound speed in seawater
 * Standard empirical equation used in hydrographic survey operations
 * c = 1448.96 + 4.591*T - 5.304e-2*T^2 + 2.374e-4*T^3 + 1.340*(S - 35) + 1.630e-2*D
 *
 * @param tempC Water temperature in Celsius (typical coastal 5 to 28°C)
 * @param salinityPsu Salinity in PSU (typical seawater ~34-36 PSU)
 * @param depthMeters Water depth in meters (0 to 30m)
 * @returns Sound speed in m/s (typically ~1490 - 1530 m/s)
 */
export function calculateMackenzieSoundSpeed(
  tempC: number = 15.0,
  salinityPsu: number = 35.0,
  depthMeters: number = 5.0
): number {
  const T = tempC;
  const S = salinityPsu;
  const D = depthMeters;

  const c = 
    1448.96 +
    (4.591 * T) -
    (5.304e-2 * Math.pow(T, 2)) +
    (2.374e-4 * Math.pow(T, 3)) +
    (1.340 * (S - 35.0)) +
    (1.630e-2 * D);

  return Number(c.toFixed(1));
}
