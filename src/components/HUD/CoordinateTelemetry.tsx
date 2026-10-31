import React from 'react';
import { Crosshair, Waves, ShieldAlert, Sparkles, Navigation } from 'lucide-react';
import { CursorTelemetry } from '../../types/telemetry';

interface CoordinateTelemetryProps {
  telemetry: CursorTelemetry;
  vesselDraft: number;
}

export const CoordinateTelemetry: React.FC<CoordinateTelemetryProps> = ({
  telemetry,
  vesselDraft,
}) => {
  const isShoalHazard =
    telemetry.depthMeters !== null && telemetry.depthMeters <= vesselDraft;

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex flex-col space-y-1.5 font-mono text-xs">
      {/* Shoal hazard alert tag if hovering over water shallower than vessel draft */}
      {isShoalHazard && (
        <div className="flex items-center space-x-2 px-3 py-1 rounded bg-red-950/90 border border-red-500 text-red-200 animate-pulse shadow-[0_0_15px_rgba(255,51,102,0.5)]">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="font-bold tracking-wider">
            SHOAL HAZARD: {telemetry.depthMeters?.toFixed(1)}m &le; DRAFT ({vesselDraft.toFixed(1)}m)
          </span>
        </div>
      )}

      {/* Main Tactical Box */}
      <div className="p-3 rounded-lg bg-tactical-surface/90 backdrop-blur-md border border-tactical-border shadow-xl text-slate-200 min-w-[280px] sm:min-w-[340px]">
        {/* Header line with crosshair and depth */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-tactical-cyan animate-spin-slow" />
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
              TACTICAL SOUNDING
            </span>
          </div>

          <div className="flex items-baseline space-x-1">
            <Waves className="w-3.5 h-3.5 text-tactical-cyan mr-1" />
            {telemetry.depthMeters !== null ? (
              <>
                <span
                  className={`text-lg font-bold font-mono tracking-tight ${
                    isShoalHazard ? 'text-red-400' : 'text-tactical-cyan'
                  }`}
                >
                  {telemetry.depthMeters.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">m</span>
                {telemetry.uncertaintyMeters !== null && (
                  <span className="text-[10px] text-slate-500 ml-1">
                    (&plusmn;{telemetry.uncertaintyMeters.toFixed(1)}m)
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500 italic">Positioning...</span>
            )}
          </div>
        </div>

        {/* Spatial Coordinates Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Navigation className="w-2.5 h-2.5 text-slate-400" />
              <span>GEODETIC WGS84</span>
            </div>
            <div className="font-medium text-slate-200">
              {telemetry.lat.toFixed(5)}&deg; N
            </div>
            <div className="font-medium text-slate-200">
              {telemetry.lon.toFixed(5)}&deg; E
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              PROJECTED UTM
            </div>
            <div className="font-medium text-slate-200 truncate">
              {telemetry.utmZone} {telemetry.utmEasting}m E
            </div>
            <div className="font-medium text-slate-200 truncate">
              {telemetry.utmNorthing}m N
            </div>
          </div>
        </div>

        {/* Water Quality & Remote Sensing Optics */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center space-x-1 truncate max-w-[200px]" title={telemetry.opticalWaterType}>
            <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{telemetry.opticalWaterType}</span>
          </div>
          <div>
            <span className="text-slate-500">SUN GLINT:</span>{' '}
            <span
              className={
                telemetry.sunGlintRisk === 'High'
                  ? 'text-red-400 font-semibold'
                  : telemetry.sunGlintRisk === 'Moderate'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              {telemetry.sunGlintRisk}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
