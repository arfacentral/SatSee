import React from 'react';
import { SDBParameters, VerticalDatum } from '../../types/bathymetry';
import { X, Sparkles, RotateCcw, BookOpen, Check } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: SDBParameters;
  onUpdateParams: (newParams: SDBParameters) => void;
  onResetDefaults: () => void;
  onAutoCalibrateICESat2: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  params,
  onUpdateParams,
  onResetDefaults,
  onAutoCalibrateICESat2,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-mono text-slate-200">
      <div className="w-full max-w-lg rounded-xl bg-tactical-surface border border-tactical-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-tactical-border bg-tactical-panel/80">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-tactical-amber animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider">
              SDB ALGORITHM TUNER & TIDAL DATUM
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
          {/* Scientific Paper Reference Box */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5 text-tactical-cyan font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Model Reference: Stumpf et al. (2003) & Lu et al. (2026)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Formula: <code className="text-amber-300">Z = m₁ &middot; [ ln(1000&middot;R_blue) / ln(1000&middot;R_green) ] - m₀ - Tide</code>. 
              The 2026 Nature Scientific Reports benchmark demonstrated an empirical fit of <strong className="text-emerald-400">R² = 0.839</strong> on Sentinel-2 optical bands for shallow depths (0-30m).
            </p>
          </div>

          {/* Quick Auto-Calibration with ICESat-2 */}
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
            <div>
              <div className="font-bold text-cyan-300 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Spaceborne Active-Passive Fusion</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Auto-fit m₁ & m₀ against NASA ICESat-2 ATL24 green laser photon returns.
              </p>
            </div>
            <button
              onClick={onAutoCalibrateICESat2}
              className="px-3 py-1.5 rounded bg-tactical-cyan text-slate-950 font-bold hover:bg-cyan-400 transition-colors text-xs flex-shrink-0 ml-2"
            >
              Auto-Fit
            </button>
          </div>

          {/* Inversion Sliders */}
          <div className="space-y-3 pt-1">
            {/* m1 Gain */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">Slope Gain (m₁):</span>
                <span className="text-cyan-300 font-bold">{params.m1.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="15.0"
                max="45.0"
                step="0.5"
                value={params.m1}
                onChange={(e) => onUpdateParams({ ...params, m1: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>15.0 (Gentle slope)</span>
                <span>45.0 (Steep attenuation)</span>
              </div>
            </div>

            {/* m0 Offset */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">Depth Offset (m₀):</span>
                <span className="text-cyan-300 font-bold">{params.m0.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="10.0"
                max="35.0"
                step="0.5"
                value={params.m0}
                onChange={(e) => onUpdateParams({ ...params, m0: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>10.0m</span>
                <span>35.0m</span>
              </div>
            </div>

            {/* Tide Height Offset */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 font-semibold">Instantaneous Tide Offset:</span>
                <span className="text-amber-300 font-bold">+{params.tideOffset.toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="6.0"
                step="0.1"
                value={params.tideOffset}
                onChange={(e) =>
                  onUpdateParams({ ...params, tideOffset: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>-2.0m (Spring Low)</span>
                <span>+6.0m (Macrotidal)</span>
              </div>
            </div>

            {/* Vertical Datum Selection */}
            <div className="pt-2">
              <label className="block text-slate-300 font-semibold mb-1.5">
                Vertical Chart Datum:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['LAT', 'MSL', 'CD'] as VerticalDatum[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onUpdateParams({ ...params, datum: d })}
                    className={`py-1.5 px-2 rounded border text-center font-bold transition-colors ${
                      params.datum === d
                        ? 'bg-tactical-cyan/20 border-tactical-cyan text-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.25)]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {d}
                    <div className="text-[9px] font-normal opacity-70">
                      {d === 'LAT' ? 'Lowest Tide' : d === 'MSL' ? 'Mean Sea Level' : 'Chart Datum'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-tactical-border bg-tactical-panel/80">
          <button
            onClick={onResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset AOI Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-tactical-cyan text-slate-950 font-bold hover:bg-cyan-400 text-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
