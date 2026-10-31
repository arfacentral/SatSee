export interface CursorTelemetry {
  lat: number;
  lon: number;
  utmZone: string;
  utmEasting: number;
  utmNorthing: number;
  depthMeters: number | null;
  uncertaintyMeters: number | null;
  estimatedSoundSpeed: number; // m/s (Mackenzie equation approximation, 1480-1530)
  waterTemperatureEst: number; // °C
  salinityEst: number; // PSU
  opticalWaterType: 'Jerlov I (Ultra-Clear)' | 'Jerlov II (Clear Coastal)' | 'Jerlov III (Turbid Coastal)' | 'Land/Masked';
  sunGlintRisk: 'Low' | 'Moderate' | 'High';
}

export interface MapViewportState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}
