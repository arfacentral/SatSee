/**
 * Lyzenga Multi-Band Log-Linear Model for Satellite-Derived Bathymetry (SDB)
 * References:
 * - Lyzenga, D. R. (1978). "Passive remote sensing techniques for mapping water depth and bottom features."
 *   Applied Optics, 17(3), 379-383.
 * - Lyzenga, D. R. (1985). "Shallow-water bathymetry using combined lidar and passive multispectral scanner data."
 *   Int. J. Remote Sens. 6, 115-125.
 *
 * Formula: Z = a0 + sum( ai * ln[ Rw(lambda_i) - R_inf(lambda_i) ] )
 */

export interface MultiBandReflectance {
  blue: number;   // Sentinel-2 B2 (496 nm) / Landsat B2 (482 nm)
  green: number;  // Sentinel-2 B3 (560 nm) / Landsat B3 (561 nm)
  red: number;    // Sentinel-2 B4 (664 nm) / Landsat B4 (654 nm)
  nir: number;    // Sentinel-2 B8 (835 nm) / Landsat B5 (865 nm)
}

export interface LyzengaParameters {
  a0: number;
  aBlue: number;
  aGreen: number;
  aRed: number;
  rInfBlue: number;  // Deep-water dark radiance
  rInfGreen: number;
  rInfRed: number;
}

export function invertDepthLyzenga(
  bands: MultiBandReflectance,
  params: LyzengaParameters,
  tideOffsetMeters: number = 0
): { depth: number; uncertainty: number; isValid: boolean; status: string } {
  // Check contrast over deep water
  const diffBlue = bands.blue - params.rInfBlue;
  const diffGreen = bands.green - params.rInfGreen;

  if (diffBlue <= 0.0001 || diffGreen <= 0.0001) {
    return {
      depth: 30,
      uncertainty: 4.5,
      isValid: false,
      status: 'optically_deep_water',
    };
  }

  const logBlue = Math.log(Math.max(1e-5, diffBlue));
  const logGreen = Math.log(Math.max(1e-5, diffGreen));

  // Red band is heavily absorbed in water > 5m, so weight dynamically
  let redContrib = 0;
  const diffRed = bands.red - params.rInfRed;
  if (diffRed > 0.0001) {
    redContrib = params.aRed * Math.log(diffRed);
  }

  let rawDepth = params.a0 + (params.aBlue * logBlue) + (params.aGreen * logGreen) + redContrib;
  let depth = rawDepth - tideOffsetMeters;

  if (depth < 0) depth = 0;
  if (depth > 30) depth = 30;

  return {
    depth: Number(depth.toFixed(2)),
    uncertainty: Number((1.5 + depth * 0.05).toFixed(2)),
    isValid: depth < 30,
    status: depth >= 30 ? 'optical_limit' : 'valid',
  };
}
