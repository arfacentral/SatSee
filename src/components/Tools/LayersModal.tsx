import React from 'react';
import { MAP_LAYERS } from '../../core/geospatial/wmsProviders';
import { X, Layers, Check } from 'lucide-react';

interface LayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBaseLayerId: string;
  onSelectBaseLayer: (id: string) => void;
  showSdbOverlay: boolean;
  onToggleSdbOverlay: (show: boolean) => void;
  showICESat2Tracks: boolean;
  onToggleICESat2Tracks: (show: boolean) => void;
  showIsobaths: boolean;
  onToggleIsobaths: (show: boolean) => void;
  showCables: boolean;
  onToggleCables: (show: boolean) => void;
  showVessels: boolean;
  onToggleVessels: (show: boolean) => void;
  showQuakes: boolean;
  onToggleQuakes: (show: boolean) => void;
}

export const LayersModal: React.FC<LayersModalProps> = ({
  isOpen,
  onClose,
  activeBaseLayerId,
  onSelectBaseLayer,
  showSdbOverlay,
  onToggleSdbOverlay,
  showICESat2Tracks,
  onToggleICESat2Tracks,
  showIsobaths,
  onToggleIsobaths,
  showCables,
  onToggleCables,
  showVessels,
  onToggleVessels,
  showQuakes,
  onToggleQuakes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-mono text-slate-200">
      <div className="w-full max-w-lg rounded-xl bg-tactical-surface border border-tactical-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-tactical-border bg-tactical-panel/80">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-tactical-cyan" />
            <h3 className="text-sm font-bold text-slate-100 tracking-wider">
              GEOSPATIAL BASEMAP & DATA LAYERS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* SDB Analytical Overlays */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              SDB Analytical Overlays
            </h4>
            <div className="space-y-2">
              {/* SDB Depth Shader Layer */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div>
                  <div className="font-semibold text-cyan-300">
                    Live SDB Depth Inversion Surface
                  </div>
                  <div className="text-[11px] text-slate-400">
                    On-the-fly Stumpf band-ratio depth color ramp (0-30m)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showSdbOverlay}
                  onChange={(e) => onToggleSdbOverlay(e.target.checked)}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>

              {/* ICESat-2 Spaceborne LiDAR Tracks */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div>
                  <div className="font-semibold text-emerald-300">
                    ICESat-2 ATL24 Spaceborne LiDAR Tracks
                  </div>
                  <div className="text-[11px] text-slate-400">
                    NASA photon-counting laser calibration soundings
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showICESat2Tracks}
                  onChange={(e) => onToggleICESat2Tracks(e.target.checked)}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </label>

              {/* Isobaths Contours */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <div>
                  <div className="font-semibold text-amber-300">
                    Depth Contours & Isobaths
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Vector contour lines at 2m, 5m, 10m, 15m, 20m, 30m intervals
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showIsobaths}
                  onChange={(e) => onToggleIsobaths(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Marine Intelligence */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Marine Intelligence (live / open data)
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Submarine Telecom Cables', note: 'Global cable routes. TeleGeography, CC BY-NC-SA (non-commercial).', v: showCables, set: onToggleCables, c: 'accent-pink-400', t: 'text-pink-300' },
                { label: 'Live Vessel Tracks (AIS)', note: 'Real-time AIS. Global when the AISStream relay is running (npm run relay), otherwise Baltic Sea only.', v: showVessels, set: onToggleVessels, c: 'accent-emerald-400', t: 'text-emerald-300' },
                { label: 'Earthquakes (past 7 days, M2.5+)', note: 'USGS global feed. Red rings carry a tsunami flag.', v: showQuakes, set: onToggleQuakes, c: 'accent-amber-400', t: 'text-amber-300' },
              ].map((o) => (
                <label key={o.label} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div>
                    <div className={`font-semibold ${o.t}`}>{o.label}</div>
                    <div className="text-[11px] text-slate-400">{o.note}</div>
                  </div>
                  <input type="checkbox" checked={o.v} onChange={(e) => o.set(e.target.checked)} className={`w-4 h-4 cursor-pointer ${o.c}`} />
                </label>
              ))}
            </div>
          </div>

          {/* Basemaps Selection */}
          <div className="pt-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Primary Hydrographic Basemap
            </h4>
            <div className="space-y-2">
              {Object.values(MAP_LAYERS).map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => onSelectBaseLayer(layer.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    activeBaseLayerId === layer.id
                      ? 'bg-tactical-panel border-tactical-cyan shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 flex items-center space-x-1.5">
                      {activeBaseLayerId === layer.id && (
                        <Check className="w-3.5 h-3.5 text-tactical-cyan" />
                      )}
                      <span>{layer.name}</span>
                    </span>
                    {layer.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {layer.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    {layer.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-tactical-border bg-tactical-panel/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-tactical-cyan text-slate-950 font-bold hover:bg-cyan-400 text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
