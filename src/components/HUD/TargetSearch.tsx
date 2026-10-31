import React, { useState } from 'react';
import { Search, Crosshair, Loader2, MapPin } from 'lucide-react';
import { BenchmarkLocation } from '../../types/bathymetry';

interface Props {
  viewCenter: { lat: number; lon: number; zoom: number };
  onTarget: (loc: BenchmarkLocation) => void;
}

interface Hit {
  display_name: string;
  lat: string;
  lon: string;
}

export function makeCustomAOI(lat: number, lon: number, name: string, zoom = 12): BenchmarkLocation {
  return {
    id: `custom-${lat.toFixed(4)}-${lon.toFixed(4)}`,
    name: name.split(',').slice(0, 2).join(',').trim() || `Custom AOI`,
    subTitle: 'User-defined survey target',
    lat,
    lon,
    defaultZoom: zoom,
    depthRange: '0m – 30m (optical limit)',
    surveyContext: 'Custom area of interest chosen by the user.',
    recommendedAlgorithm: 'stumpf-log-ratio',
    recommendedDataSource: 'sentinel-2',
    defaultParams: {
      m1: 26.0, m0: 18.5,
      deepWaterBlue: 0.015, deepWaterGreen: 0.012, deepWaterRed: 0.004, deepWaterNIR: 0.001,
      turbidityThreshold: 0.3, tideOffset: 0, datum: 'MSL',
    },
    description: 'Custom target. Calibrate against local ground truth before relying on depths.',
    groundTruthType: 'None loaded',
  };
}

export const TargetSearch: React.FC<Props> = ({ viewCenter, onTarget }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const go = async () => {
    const q = query.trim();
    if (!q) return;
    setError('');
    // "lat, lon" coordinates
    const m = q.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lon = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        onTarget(makeCustomAOI(lat, lon, `${lat.toFixed(3)}, ${lon.toFixed(3)}`));
        setHits([]);
        return;
      }
      setError('Coordinates out of range');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`
      );
      const data: Hit[] = await r.json();
      setHits(data);
      if (!data.length) setError('No matches found');
    } catch {
      setError('Search needs an internet connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative font-mono text-xs">
      <div className="flex items-center space-x-1">
        <div className="flex items-center px-2 py-1 rounded bg-tactical-panel border border-tactical-border">
          <Search className="w-3.5 h-3.5 text-tactical-cyan mr-1.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Place or lat, lon…"
            className="bg-transparent w-36 md:w-48 text-slate-100 placeholder-slate-500 focus:outline-none select-text"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </div>
        <button
          onClick={() =>
            onTarget(makeCustomAOI(viewCenter.lat, viewCenter.lon, `View ${viewCenter.lat.toFixed(3)}, ${viewCenter.lon.toFixed(3)}`, Math.max(viewCenter.zoom, 8)))
          }
          className="flex items-center space-x-1 px-2 py-1 rounded bg-tactical-panel border border-tactical-border text-slate-300 hover:border-tactical-cyan hover:text-tactical-cyan"
          title="Point SatSee at the centre of the current map view"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden md:inline">SCAN VIEW</span>
        </button>
      </div>

      {(hits.length > 0 || error) && (
        <div className="absolute top-full left-0 mt-1 w-72 z-40 rounded bg-tactical-surface border border-tactical-border shadow-xl">
          {error && <div className="px-3 py-2 text-amber-400">{error}</div>}
          {hits.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                onTarget(makeCustomAOI(parseFloat(h.lat), parseFloat(h.lon), h.display_name));
                setHits([]);
                setQuery('');
              }}
              className="w-full text-left flex items-start space-x-2 px-3 py-2 hover:bg-tactical-panel text-slate-200"
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-tactical-cyan flex-shrink-0" />
              <span className="line-clamp-2">{h.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
