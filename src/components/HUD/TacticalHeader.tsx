import React from 'react';
import { Satellite, Radio, Compass, Anchor, Wifi, WifiOff, Layers, Activity, HelpCircle } from 'lucide-react';
import { BenchmarkLocation } from '../../types/bathymetry';
import { BENCHMARK_LOCATIONS } from '../../core/geospatial/benchmarks';
import { TargetSearch } from './TargetSearch';

interface TacticalHeaderProps {
  currentBenchmark: BenchmarkLocation;
  onSelectBenchmark: (loc: BenchmarkLocation) => void;
  isOnline: boolean;
  soundSpeed: number;
  activeLayerName: string;
  onOpenLayers: () => void;
  onOpenCalibration: () => void;
  onToggleTransectMode: () => void;
  isTransectMode: boolean;
  onOpenHelp: () => void;
  viewCenter: { lat: number; lon: number; zoom: number };
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  currentBenchmark,
  onSelectBenchmark,
  isOnline,
  soundSpeed,
  activeLayerName,
  onOpenLayers,
  onOpenCalibration,
  onToggleTransectMode,
  isTransectMode,
  onOpenHelp,
  viewCenter,
}) => {
  const isCustom = currentBenchmark.id.startsWith('custom-');
  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between px-4 py-2.5 bg-tactical-surface/90 backdrop-blur-md border-b border-tactical-border/70 text-slate-200">
      {/* Brand & Mission Title */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded bg-tactical-panel border border-tactical-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
          <Satellite className="w-5 h-5 text-tactical-cyan animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-wider text-slate-100 font-mono">
              Sat<span className="text-tactical-cyan">See</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest font-semibold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
              SDB v1.0
            </span>
          </div>
          <p className="text-[11px] text-tactical-muted font-mono tracking-tight hidden sm:block">
            Satellite-Derived Bathymetry & Hydrographic Intelligence
          </p>
        </div>
      </div>

      {/* Target Benchmark Selector */}
      <div className="flex items-center space-x-2 my-1 sm:my-0">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-tactical-panel/80 border border-tactical-border text-xs font-mono">
          <Compass className="w-3.5 h-3.5 text-tactical-cyan" />
          <span className="text-tactical-muted hidden md:inline">SURVEY AOI:</span>
          <select
            value={currentBenchmark.id}
            onChange={(e) => {
              const found = BENCHMARK_LOCATIONS.find((b) => b.id === e.target.value);
              if (found) onSelectBenchmark(found);
            }}
            className="bg-transparent text-slate-100 font-mono font-medium focus:outline-none cursor-pointer pr-1"
          >
            {isCustom && (
              <option value={currentBenchmark.id} className="bg-slate-900 text-slate-200">
                Custom: {currentBenchmark.name}
              </option>
            )}
            {BENCHMARK_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-slate-900 text-slate-200">
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <TargetSearch viewCenter={viewCenter} onTarget={onSelectBenchmark} />
      </div>

      {/* Real-time Status Readouts & Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono">
        {/* Sound Velocity Readout */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-[11px]">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">SOUND SPEED:</span>
          <span className="text-emerald-300 font-bold">{soundSpeed} m/s</span>
        </div>

        {/* Online / Offline status */}
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-[11px]">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold hidden sm:inline">LIVE STAC</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-semibold hidden sm:inline">OFFLINE PWA</span>
            </>
          )}
        </div>

        {/* Transect Mode Toggle */}
        <button
          onClick={onToggleTransectMode}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs transition-colors ${
            isTransectMode
              ? 'bg-tactical-cyan/20 border-tactical-cyan text-tactical-cyan shadow-[0_0_10px_rgba(0,229,255,0.3)]'
              : 'bg-tactical-panel border-tactical-border text-slate-300 hover:border-slate-500'
          }`}
          title="Click two points on the water to measure transect depth profile"
        >
          <Anchor className="w-3.5 h-3.5" />
          <span className="font-semibold">TRANSECT</span>
        </button>

        {/* Calibration & Tuning */}
        <button
          onClick={onOpenCalibration}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-tactical-panel border border-tactical-border text-slate-300 hover:border-tactical-cyan/60 hover:text-tactical-cyan transition-colors"
          title="Adjust Stumpf & Lyzenga inversion coefficients"
        >
          <Radio className="w-3.5 h-3.5 text-tactical-amber" />
          <span className="hidden sm:inline">CALIBRATE</span>
        </button>

        {/* Layer Selector */}
        <button
          onClick={onOpenLayers}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-tactical-panel border border-tactical-border text-slate-300 hover:border-tactical-cyan/60 hover:text-tactical-cyan transition-colors"
          title="Toggle Basemaps & Depth Layers"
        >
          <Layers className="w-3.5 h-3.5 text-tactical-cyan" />
          <span className="hidden md:inline">{activeLayerName.split(' ')[0]}</span>
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/70 border border-tactical-cyan/60 text-tactical-cyan hover:bg-cyan-900/70 transition-colors"
          title="What does everything here mean?"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="font-semibold">HELP</span>
        </button>
      </div>
    </header>
  );
};
