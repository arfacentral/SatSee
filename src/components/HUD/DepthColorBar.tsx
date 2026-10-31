import React from 'react';
import { ColorRamp, VerticalDatum } from '../../types/bathymetry';
import { COLOR_RAMPS } from '../../core/sdb/colorRamps';
import { Anchor } from 'lucide-react';

interface DepthColorBarProps {
  activeRamp: ColorRamp;
  onSelectRamp: (ramp: ColorRamp) => void;
  vesselDraft: number;
  onChangeDraft: (draft: number) => void;
  datum: VerticalDatum;
  tideOffset: number;
}

export const DepthColorBar: React.FC<DepthColorBarProps> = ({
  activeRamp,
  onSelectRamp,
  vesselDraft,
  onChangeDraft,
  datum,
  tideOffset,
}) => {
  const currentRampConfig = COLOR_RAMPS[activeRamp];

  // Construct gradient CSS string from color stops
  const gradientStops = currentRampConfig.stops
    .map((s) => `${s.hex} ${s.depthRatio * 100}%`)
    .join(', ');

  return (
    <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex flex-col items-end space-y-2 font-mono text-xs">
      <div className="p-3 rounded-lg bg-tactical-surface/90 backdrop-blur-md border border-tactical-border shadow-xl text-slate-200 w-64 sm:w-72">
        {/* Header & Palette Selector */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            SDB COLOR PALETTE
          </span>
          <select
            value={activeRamp}
            onChange={(e) => onSelectRamp(e.target.value as ColorRamp)}
            className="bg-tactical-panel border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-cyan-300 focus:outline-none cursor-pointer"
          >
            {(Object.keys(COLOR_RAMPS) as ColorRamp[]).map((key) => (
              <option key={key} value={key} className="bg-slate-900 text-slate-200">
                {COLOR_RAMPS[key].name.split(' (')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Visual Color Gradient Bar */}
        <div className="mt-2.5">
          <div
            className="h-4 w-full rounded border border-slate-700/80 shadow-inner relative"
            style={{ background: `linear-gradient(to right, ${gradientStops})` }}
          >
            {/* Vessel Draft Indicator Line on Bar */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_6px_#ff1e46]"
              style={{ left: `${Math.min(100, (vesselDraft / 30) * 100)}%` }}
              title={`Vessel Draft Limit: ${vesselDraft}m`}
            />
          </div>

          {/* Depth Scale Tick Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0m (Shoal)</span>
            <span>7.5m</span>
            <span>15m</span>
            <span>22.5m</span>
            <span>30m+</span>
          </div>
        </div>

        {/* Vessel Draft Safety Limiter */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
            <Anchor className="w-3.5 h-3.5 text-red-400" />
            <span>VESSEL DRAFT:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={vesselDraft}
              onChange={(e) => onChangeDraft(parseFloat(e.target.value))}
              className="w-20 accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <span className="text-red-400 font-bold text-[11px] min-w-[32px] text-right">
              {vesselDraft.toFixed(1)}m
            </span>
          </div>
        </div>

        {/* Datum & Tidal Offset Info */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>VERTICAL DATUM: <strong className="text-slate-300">{datum}</strong></span>
          <span>TIDE ADJ: <strong className="text-slate-300">+{tideOffset.toFixed(1)}m</strong></span>
        </div>
      </div>
    </div>
  );
};
