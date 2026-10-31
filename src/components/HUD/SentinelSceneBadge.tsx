import React, { useState } from 'react';
import { Sentinel2Scene } from '../../core/geospatial/stacClient';
import { Satellite, Cloud, Calendar, ExternalLink, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface SentinelSceneBadgeProps {
  scene: Sentinel2Scene | null;
  loading: boolean;
  onRefreshScene: () => void;
  showTrueColorOverlay: boolean;
  onToggleTrueColorOverlay: (show: boolean) => void;
}

export const SentinelSceneBadge: React.FC<SentinelSceneBadgeProps> = ({
  scene,
  loading,
  onRefreshScene,
  showTrueColorOverlay,
  onToggleTrueColorOverlay,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  if (!scene) {
    return (
      <div className="absolute top-16 left-4 z-20 pointer-events-auto font-mono text-xs">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-tactical-surface/90 backdrop-blur-md border border-tactical-border text-slate-300 shadow-xl">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Scanning Sentinel-2 STAC…</span>
        </div>
      </div>
    );
  }

  const dateStr = new Date(scene.datetime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="absolute top-16 left-4 z-20 pointer-events-auto font-mono text-xs max-w-[320px] sm:max-w-[380px]">
        <div className="p-3 rounded-lg bg-tactical-surface/90 backdrop-blur-md border border-tactical-border shadow-2xl text-slate-200">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-200 tracking-wider">
                {scene.satellite} (10m L2A)
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={onRefreshScene}
                disabled={loading}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                title="Search latest cloud-free Sentinel-2 pass"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
              {scene.thumbnailUrl && (
                <button
                  onClick={() => setShowPreviewModal(!showPreviewModal)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 border border-slate-700 transition-colors"
                  title="View scene thumbnail preview"
                >
                  PREVIEW
                </button>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Calendar className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Cloud className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span
                className={
                  scene.cloudCoverPercent < 10
                    ? 'text-emerald-400 font-semibold'
                    : scene.cloudCoverPercent < 25
                    ? 'text-amber-400'
                    : 'text-red-400'
                }
              >
                Cloud: {scene.cloudCoverPercent}%
              </span>
            </div>
          </div>

          {/* Scene ID line */}
          <div className="mt-2 text-[10px] text-slate-500 truncate" title={scene.id}>
            ID: <span className="text-slate-300">{scene.id}</span>
          </div>

          {/* Quick Actions & SDB Mode */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1 text-emerald-400 text-[10px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>LIVE SDB INVERSION</span>
            </div>

            <label className="flex items-center space-x-1 text-[10px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showTrueColorOverlay}
                onChange={(e) => onToggleTrueColorOverlay(e.target.checked)}
                className="w-3 h-3 accent-cyan-400 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>True Color</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Thumbnail Preview Modal */}
      {showPreviewModal && scene.thumbnailUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-xl bg-tactical-surface border border-tactical-border p-4 font-mono text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-cyan-300">SENTINEL-2 L2A SCENE PREVIEW</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="my-3 rounded overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={scene.thumbnailUrl}
                alt="Sentinel-2 Optical Preview"
                className="w-full h-auto object-cover max-h-[300px]"
              />
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Scene ID: <strong className="text-slate-200">{scene.id}</strong></div>
              <div>Captured: <strong className="text-slate-200">{new Date(scene.datetime).toUTCString()}</strong></div>
              <div>Cloud Coverage: <strong className="text-slate-200">{scene.cloudCoverPercent}%</strong></div>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs">
              {scene.visualUrl && (
                <a
                  href={scene.visualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-cyan-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Full-Res GeoTIFF</span>
                </a>
              )}
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
