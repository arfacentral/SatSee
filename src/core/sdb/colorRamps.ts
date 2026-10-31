import { ColorRamp } from '../../types/bathymetry';

export interface ColorStop {
  depthRatio: number; // 0 (shallowest) to 1 (deepest, e.g. 30m)
  r: number;
  g: number;
  b: number;
  hex: string;
}

export const COLOR_RAMPS: Record<ColorRamp, { name: string; stops: ColorStop[] }> = {
  hydrographic: {
    name: 'Hydrographic Nautical (Shoal Warning)',
    stops: [
      { depthRatio: 0.00, r: 255, g: 30,  b: 70,  hex: '#ff1e46' }, // < 1m Dangerous Shoal (Crimson)
      { depthRatio: 0.10, r: 255, g: 140, b: 0,   hex: '#ff8c00' }, // 3m Caution Shallow (Amber)
      { depthRatio: 0.25, r: 255, g: 215, b: 0,   hex: '#ffd700' }, // 7.5m Moderate
      { depthRatio: 0.45, r: 0,   g: 229, b: 255, hex: '#00e5ff' }, // 13.5m Clear Blue/Cyan
      { depthRatio: 0.70, r: 0,   g: 110, b: 220, hex: '#006edc' }, // 21m Mid Seafloor
      { depthRatio: 1.00, r: 10,  g: 25,  b: 70,  hex: '#0a1946' }, // 30m Deep Seafloor
    ],
  },
  turbo: {
    name: 'Turbo (Google AI Rainbow)',
    stops: [
      { depthRatio: 0.00, r: 180, g: 20,  b: 30,  hex: '#b4141e' },
      { depthRatio: 0.15, r: 245, g: 110, b: 35,  hex: '#f56e23' },
      { depthRatio: 0.35, r: 240, g: 220, b: 40,  hex: '#f0dc28' },
      { depthRatio: 0.55, r: 40,  g: 200, b: 120, hex: '#28c878' },
      { depthRatio: 0.75, r: 35,  g: 130, b: 230, hex: '#2382e6' },
      { depthRatio: 1.00, r: 48,  g: 18,  b: 59,  hex: '#30123b' },
    ],
  },
  viridis: {
    name: 'Viridis (Perceptually Uniform)',
    stops: [
      { depthRatio: 0.00, r: 253, g: 231, b: 37,  hex: '#fde725' },
      { depthRatio: 0.25, r: 94,  g: 201, b: 98,  hex: '#5ec962' },
      { depthRatio: 0.50, r: 33,  g: 145, b: 140, hex: '#21918c' },
      { depthRatio: 0.75, r: 59,  g: 82,  b: 139, hex: '#3b528b' },
      { depthRatio: 1.00, r: 68,  g: 1,   b: 84,  hex: '#440154' },
    ],
  },
  batlow: {
    name: 'Batlow (Scientific Crameri)',
    stops: [
      { depthRatio: 0.00, r: 248, g: 228, b: 92,  hex: '#f8e45c' },
      { depthRatio: 0.25, r: 143, g: 178, b: 59,  hex: '#8fb23b' },
      { depthRatio: 0.50, r: 44,  g: 130, b: 90,  hex: '#2c825a' },
      { depthRatio: 0.75, r: 26,  g: 68,  b: 110, hex: '#1a446e' },
      { depthRatio: 1.00, r: 1,   g: 17,  b: 49,  hex: '#011131' },
    ],
  },
  'flir-tactical': {
    name: 'FLIR Thermal Tactical',
    stops: [
      { depthRatio: 0.00, r: 255, g: 255, b: 255, hex: '#ffffff' }, // Shallow hottest white
      { depthRatio: 0.20, r: 255, g: 220, b: 60,  hex: '#ffdc3c' },
      { depthRatio: 0.45, r: 225, g: 60,  b: 40,  hex: '#e13c28' },
      { depthRatio: 0.70, r: 120, g: 20,  b: 140, hex: '#78148c' },
      { depthRatio: 1.00, r: 10,  g: 10,  b: 20,  hex: '#0a0a14' },
    ],
  },
};

/**
 * Interpolates color for a given depth (0 to maxDepth)
 */
export function getDepthColor(
  depth: number,
  ramp: ColorRamp = 'hydrographic',
  maxDepth: number = 30
): { r: number; g: number; b: number; hex: string } {
  const norm = Math.max(0, Math.min(1, depth / maxDepth));
  const stops = COLOR_RAMPS[ramp].stops;

  // Find bounding stops
  let lower = stops[0];
  let upper = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (norm >= stops[i].depthRatio && norm <= stops[i + 1].depthRatio) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper.depthRatio - lower.depthRatio;
  const t = range === 0 ? 0 : (norm - lower.depthRatio) / range;

  const r = Math.round(lower.r + t * (upper.r - lower.r));
  const g = Math.round(lower.g + t * (upper.g - lower.g));
  const b = Math.round(lower.b + t * (upper.b - lower.b));

  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  return { r, g, b, hex };
}
