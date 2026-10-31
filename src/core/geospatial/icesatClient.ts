import { SoundingPoint } from '../../types/bathymetry';

export interface ICESat2Track {
  trackId: string;
  orbitNumber: number;
  beamName: 'gt1l' | 'gt1r' | 'gt2l' | 'gt2r' | 'gt3l' | 'gt3r';
  acquisitionDate: string;
  photons: SoundingPoint[];
}

/**
 * Returns ICESat-2 ATL24 bathymetric calibration tracks for benchmark areas
 */
export function getICESat2TracksForRegion(benchmarkId: string): ICESat2Track[] {
  switch (benchmarkId) {
    case 'lingyang-reef':
      return [
        {
          trackId: 'RGT-0482-AT24',
          orbitNumber: 14892,
          beamName: 'gt2l',
          acquisitionDate: '2023-04-12',
          photons: [
            { lat: 16.4800, lon: 111.5850, depth: 18.2, uncertainty: 0.35, turbidityIndex: 0.10, source: 'icesat-2' },
            { lat: 16.4750, lon: 111.5862, depth: 16.4, uncertainty: 0.30, turbidityIndex: 0.11, source: 'icesat-2' },
            { lat: 16.4700, lon: 111.5875, depth: 11.2, uncertainty: 0.28, turbidityIndex: 0.09, source: 'icesat-2' },
            { lat: 16.4650, lon: 111.5888, depth: 2.1,  uncertainty: 0.22, turbidityIndex: 0.08, source: 'icesat-2' }, // Reef crest
            { lat: 16.4600, lon: 111.5900, depth: 0.9,  uncertainty: 0.20, turbidityIndex: 0.07, source: 'icesat-2' }, // Shallow reef flat
            { lat: 16.4550, lon: 111.5912, depth: 7.5,  uncertainty: 0.26, turbidityIndex: 0.10, source: 'icesat-2' },
            { lat: 16.4500, lon: 111.5925, depth: 14.8, uncertainty: 0.32, turbidityIndex: 0.12, source: 'icesat-2' },
          ],
        },
      ];

    case 'north-sea-dogger-bank':
      return [
        {
          trackId: 'RGT-0114-AT24',
          orbitNumber: 15301,
          beamName: 'gt1r',
          acquisitionDate: '2023-08-19',
          photons: [
            { lat: 54.8200, lon: 2.2300, depth: 22.4, uncertainty: 0.45, turbidityIndex: 0.34, source: 'icesat-2' },
            { lat: 54.7900, lon: 2.2400, depth: 19.8, uncertainty: 0.40, turbidityIndex: 0.32, source: 'icesat-2' },
            { lat: 54.7600, lon: 2.2500, depth: 16.5, uncertainty: 0.38, turbidityIndex: 0.31, source: 'icesat-2' },
            { lat: 54.7300, lon: 2.2600, depth: 18.2, uncertainty: 0.41, turbidityIndex: 0.33, source: 'icesat-2' },
            { lat: 54.7000, lon: 2.2700, depth: 24.1, uncertainty: 0.48, turbidityIndex: 0.36, source: 'icesat-2' },
          ],
        },
      ];

    case 'florida-keys':
      return [
        {
          trackId: 'RGT-0891-AT24',
          orbitNumber: 14210,
          beamName: 'gt2r',
          acquisitionDate: '2023-02-05',
          photons: [
            { lat: 24.4800, lon: -81.8700, depth: 1.5, uncertainty: 0.18, turbidityIndex: 0.08, source: 'icesat-2' },
            { lat: 24.4650, lon: -81.8720, depth: 3.8, uncertainty: 0.22, turbidityIndex: 0.09, source: 'icesat-2' },
            { lat: 24.4500, lon: -81.8750, depth: 7.2, uncertainty: 0.25, turbidityIndex: 0.10, source: 'icesat-2' },
            { lat: 24.4350, lon: -81.8780, depth: 13.5, uncertainty: 0.30, turbidityIndex: 0.12, source: 'icesat-2' },
          ],
        },
      ];

    case 'conception-bay-nl':
    default:
      return [
        {
          trackId: 'RGT-0312-AT24',
          orbitNumber: 16104,
          beamName: 'gt3l',
          acquisitionDate: '2023-06-28',
          photons: [
            { lat: 47.6500, lon: -53.0000, depth: 14.5, uncertainty: 0.42, turbidityIndex: 0.35, source: 'icesat-2' },
            { lat: 47.6300, lon: -53.0050, depth: 8.2,  uncertainty: 0.35, turbidityIndex: 0.30, source: 'icesat-2' },
            { lat: 47.6100, lon: -53.0100, depth: 19.4, uncertainty: 0.48, turbidityIndex: 0.38, source: 'icesat-2' },
          ],
        },
      ];
  }
}
