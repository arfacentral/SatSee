import { describe, it, expect } from 'vitest';
import { computeStumpfRatio, invertDepthStumpf, calibrateStumpfModel } from './stumpf';
import { invertDepthLyzenga } from './lyzenga';
import { computeNDWI, classifyOpticalWater } from './turbidity';
import { normalizeDatum, calculateMackenzieSoundSpeed } from './tidal';
import { latLonToUTM } from '../geospatial/utm';

describe('Stumpf Log-Ratio Model', () => {
  it('computes positive log ratio for standard shallow water reflectance', () => {
    // Blue has higher reflectance than green in clear blue water
    const ratio = computeStumpfRatio(0.045, 0.035);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.2);
  });

  it('inverts water depth correctly with known m1 and m0', () => {
    // m1=28.4, m0=19.8 (Lingyang Reef benchmark)
    const result = invertDepthStumpf(0.045, 0.038, 28.4, 19.8, 0);
    expect(result.isValid).toBe(true);
    expect(result.depth).toBeGreaterThan(0);
    expect(result.depth).toBeLessThan(30);
    expect(result.uncertainty).toBeGreaterThan(1.0);
  });

  it('applies instantaneous tide correction', () => {
    const raw = invertDepthStumpf(0.045, 0.038, 28.4, 19.8, 0);
    const withTide = invertDepthStumpf(0.045, 0.038, 28.4, 19.8, 1.5);
    expect(withTide.depth).toBeCloseTo(raw.depth - 1.5, 1);
  });

  it('calibrates m1 and m0 using synthetic/ground truth points', () => {
    // In clear water, green light attenuates faster than blue (Kd_green > Kd_blue)
    // Therefore as depth increases, Rw_green drops faster than Rw_blue,
    // so ln(n*Rw_blue)/ln(n*Rw_green) increases with depth.
    const samplePoints = [
      { rwBlue: 0.045, rwGreen: 0.042, trueDepth: 2.0 },  // shallow: green still strong
      { rwBlue: 0.042, rwGreen: 0.032, trueDepth: 8.5 },
      { rwBlue: 0.039, rwGreen: 0.022, trueDepth: 16.0 },
      { rwBlue: 0.036, rwGreen: 0.014, trueDepth: 24.5 }, // deep: green heavily attenuated
    ];
    const calib = calibrateStumpfModel(samplePoints);
    expect(calib.m1).toBeGreaterThan(15);
    expect(calib.m0).toBeGreaterThan(5);
    expect(calib.rSquared).toBeGreaterThan(0.85);
  });
});

describe('Lyzenga Multi-Band Log-Linear Model', () => {
  it('inverts depth with multi-band reflectance and deep water subtraction', () => {
    const bands = {
      blue: 0.040,
      green: 0.032,
      red: 0.008,
      nir: 0.001,
    };
    const params = {
      a0: 5.0,
      aBlue: 12.0,
      aGreen: -10.0,
      aRed: 2.0,
      rInfBlue: 0.012,
      rInfGreen: 0.010,
      rInfRed: 0.003,
    };
    const result = invertDepthLyzenga(bands, params);
    expect(result.isValid).toBe(true);
    expect(result.depth).toBeGreaterThanOrEqual(0);
  });
});

describe('Turbidity & Optical Water Classification', () => {
  it('computes correct NDWI values for water and land', () => {
    // Water: high green, low NIR -> positive NDWI
    const waterNDWI = computeNDWI(0.04, 0.005);
    expect(waterNDWI).toBeGreaterThan(0.5);

    // Land / Vegetation: higher NIR than green -> negative NDWI
    const landNDWI = computeNDWI(0.05, 0.25);
    expect(landNDWI).toBeLessThan(0);
  });

  it('classifies water optical clarity types', () => {
    // Ultra clear (Jerlov I)
    const clear = classifyOpticalWater(0.05, 0.04, 0.004);
    expect(clear.waterType).toBe('Jerlov I (Ultra-Clear)');
    expect(clear.maxSDBDepthMeters).toBe(30.0);

    // Turbid coastal (Jerlov III)
    const turbid = classifyOpticalWater(0.03, 0.04, 0.025);
    expect(turbid.waterType).toBe('Jerlov III (Turbid Coastal)');
    expect(turbid.maxSDBDepthMeters).toBe(8.0);
  });
});

describe('Hydrographic Datum & Mackenzie Sound Speed', () => {
  it('shifts depth between MSL and LAT chart datum', () => {
    const depthMsl = 10.0;
    const depthLat = normalizeDatum(depthMsl, 1.2, 1.2, 'LAT');
    expect(depthLat).toBeCloseTo(8.8, 1);
  });

  it('computes sound speed in seawater using Mackenzie formula', () => {
    // Standard seawater at 15°C, 35 PSU, 5m depth is approx 1507 m/s
    const speed = calculateMackenzieSoundSpeed(15.0, 35.0, 5.0);
    expect(speed).toBeGreaterThan(1500);
    expect(speed).toBeLessThan(1520);
  });
});

describe('Tactical UTM Coordinate Conversion', () => {
  it('converts Lingyang Reef coordinates to UTM Zone 49N', () => {
    const utm = latLonToUTM(16.4644, 111.5894);
    expect(utm.zone).toBe(49);
    expect(utm.hemisphere).toBe('N');
    expect(utm.easting).toBeGreaterThan(500000);
    expect(utm.northing).toBeGreaterThan(1800000);
  });

  it('converts North Sea Dogger Bank coordinates to UTM Zone 31N', () => {
    const utm = latLonToUTM(54.75, 2.25);
    expect(utm.zone).toBe(31);
    expect(utm.hemisphere).toBe('N');
    expect(utm.formatted).toContain('31N');
  });
});
