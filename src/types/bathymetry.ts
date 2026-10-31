export type SatelliteSource = 'sentinel-2' | 'landsat-8' | 'worldview-2' | 'gebco' | 'emodnet' | 'noaa';

export type InversionAlgorithm = 'stumpf-log-ratio' | 'lyzenga-linear' | 'random-forest-sdb' | 'icesat2-calibrated';

export type ColorRamp = 'hydrographic' | 'turbo' | 'viridis' | 'batlow' | 'flir-tactical';

export type VerticalDatum = 'MSL' | 'LAT' | 'CD';

export interface SoundingPoint {
  lat: number;
  lon: number;
  depth: number; // in meters (positive down)
  uncertainty: number; // in meters (+/-)
  turbidityIndex: number; // 0 (crystal clear) to 1 (opaque)
  rawRatio?: number;
  timestamp?: string;
  source: SatelliteSource | 'icesat-2' | 'in-situ';
}

export interface TransectPoint extends SoundingPoint {
  distanceMeters: number;
}

export interface SurveyTransect {
  id: string;
  name: string;
  start: [number, number];
  end: [number, number];
  totalDistanceMeters: number;
  points: TransectPoint[];
  minDepth: number;
  maxDepth: number;
  avgDepth: number;
}

export interface ShoalHazard {
  id: string;
  lat: number;
  lon: number;
  minDepth: number;
  distanceFromTrackMeters?: number;
  draftLimit: number;
  hazardLevel: 'critical' | 'caution' | 'safe';
}

export interface SDBParameters {
  m1: number; // Stumpf gain/slope
  m0: number; // Stumpf offset
  deepWaterBlue: number; // R_inf deep water reflectance
  deepWaterGreen: number;
  deepWaterRed: number;
  deepWaterNIR: number;
  turbidityThreshold: number; // NDWI / optical limit threshold
  tideOffset: number; // in meters
  datum: VerticalDatum;
}

export interface BenchmarkLocation {
  id: string;
  name: string;
  subTitle: string;
  lat: number;
  lon: number;
  defaultZoom: number;
  depthRange: string;
  surveyContext: string;
  recommendedAlgorithm: InversionAlgorithm;
  recommendedDataSource: SatelliteSource;
  defaultParams: SDBParameters;
  description: string;
  groundTruthType: string;
}
