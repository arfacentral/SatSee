/**
 * Turbidity, Water Masking & Optical Attenuation (Kd) Utilities
 * Handles NDWI land/water segmentation and Jerlov water classification
 */

export function computeNDWI(greenReflectance: number, nirReflectance: number): number {
  const sum = greenReflectance + nirReflectance;
  if (Math.abs(sum) < 1e-6) return -1;
  return (greenReflectance - nirReflectance) / sum;
}

export function classifyOpticalWater(
  rwBlue: number,
  rwGreen: number,
  rwRed: number
): {
  waterType: 'Jerlov I (Ultra-Clear)' | 'Jerlov II (Clear Coastal)' | 'Jerlov III (Turbid Coastal)' | 'Land/Masked';
  secchiDepthEstimateMeters: number;
  maxSDBDepthMeters: number;
  turbidityRatio: number;
} {
  // Turbidity index: high red relative to green indicates sediment/algal scattering.
  // In clear water, blue penetrates and reflects strongly relative to green (rwBlue / rwGreen >= 1.0)
  const turbidityRatio = rwGreen > 0 ? (rwRed / rwGreen) : 1.0;
  const blueGreenRatio = rwGreen > 0 ? (rwBlue / rwGreen) : 0.0;

  if (turbidityRatio < 0.15 && blueGreenRatio > 0.8) {
    return {
      waterType: 'Jerlov I (Ultra-Clear)',
      secchiDepthEstimateMeters: 28.0,
      maxSDBDepthMeters: 30.0,
      turbidityRatio: Number(turbidityRatio.toFixed(3)),
    };
  } else if (turbidityRatio < 0.40) {
    return {
      waterType: 'Jerlov II (Clear Coastal)',
      secchiDepthEstimateMeters: 16.0,
      maxSDBDepthMeters: 18.0,
      turbidityRatio: Number(turbidityRatio.toFixed(3)),
    };
  } else if (turbidityRatio < 0.85) {
    return {
      waterType: 'Jerlov III (Turbid Coastal)',
      secchiDepthEstimateMeters: 6.0,
      maxSDBDepthMeters: 8.0,
      turbidityRatio: Number(turbidityRatio.toFixed(3)),
    };
  } else {
    return {
      waterType: 'Land/Masked',
      secchiDepthEstimateMeters: 0,
      maxSDBDepthMeters: 0,
      turbidityRatio: Number(turbidityRatio.toFixed(3)),
    };
  }
}
