import React, { useState } from 'react';
import { SurveyTransect } from '../../types/bathymetry';
import { X, Download, TrendingDown, AlertTriangle, FileSpreadsheet } from 'lucide-react';

interface TransectPanelProps {
  transect: SurveyTransect | null;
  onClose: () => void;
  vesselDraft: number;
}

export const TransectPanel: React.FC<TransectPanelProps> = ({
  transect,
  onClose,
  vesselDraft,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!transect || transect.points.length === 0) return null;

  // Chart coordinate math
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Depth scale (0m down to max(30, maxDepth + 2))
  const maxPlotDepth = Math.max(25, Math.ceil((transect.maxDepth + 4) / 5) * 5);
  const totalDist = transect.totalDistanceMeters;

  const pointsData = transect.points;

  // Build SVG path for seafloor
  const svgPoints = pointsData.map((pt) => {
    const x = padding.left + (pt.distanceMeters / totalDist) * plotWidth;
    const y = padding.top + (pt.depth / maxPlotDepth) * plotHeight;
    return { x, y, pt };
  });

  const pathD = svgPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Fill path closing at bottom
  const fillPathD = `${pathD} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;

  // Draft line Y
  const draftY = padding.top + (vesselDraft / maxPlotDepth) * plotHeight;

  // Check if any point violates draft
  const hasShoalBreach = transect.minDepth <= vesselDraft;

  // Export handlers
  const handleExportCSV = () => {
    const headers = 'Latitude,Longitude,Distance_Meters,Depth_Meters,Uncertainty_Meters,Source\n';
    const rows = pointsData
      .map(
        (p) =>
          `${p.lat.toFixed(6)},${p.lon.toFixed(6)},${p.distanceMeters},${p.depth.toFixed(2)},${p.uncertainty.toFixed(2)},${p.source}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satsee_transect_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pointsData.map((p) => [p.lon, p.lat, -p.depth]),
          },
          properties: {
            name: transect.name,
            totalDistanceMeters: transect.totalDistanceMeters,
            minDepth: transect.minDepth,
            maxDepth: transect.maxDepth,
            avgDepth: transect.avgDepth,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satsee_transect_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeHoveredPoint =
    hoveredPointIndex !== null && pointsData[hoveredPointIndex]
      ? pointsData[hoveredPointIndex]
      : null;

  return (
    <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-4 z-20 pointer-events-auto max-w-[680px] rounded-lg bg-tactical-surface/95 backdrop-blur-md border border-tactical-border shadow-2xl font-mono text-slate-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-tactical-border/70 bg-tactical-panel/70">
        <div className="flex items-center space-x-2">
          <TrendingDown className="w-4 h-4 text-tactical-cyan" />
          <span className="text-xs font-bold tracking-wider text-slate-100">
            TRANSECT BATHYMETRIC PROFILE
          </span>
          <span className="text-[11px] text-tactical-muted">
            ({(transect.totalDistanceMeters / 1000).toFixed(2)} km)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            title="Download CSV sounding points"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            title="Download GeoJSON LineString"
          >
            <Download className="w-3.5 h-3.5 text-tactical-cyan" />
            <span className="hidden sm:inline">GeoJSON</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-slate-800 text-center text-xs">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Min Depth</div>
          <div className={`font-bold ${hasShoalBreach ? 'text-red-400' : 'text-cyan-300'}`}>
            {transect.minDepth.toFixed(1)}m
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Max Depth</div>
          <div className="font-bold text-slate-200">{transect.maxDepth.toFixed(1)}m</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Avg Depth</div>
          <div className="font-bold text-slate-300">{transect.avgDepth.toFixed(1)}m</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Shoal Clearance</div>
          <div
            className={`font-bold flex items-center justify-center space-x-1 ${
              hasShoalBreach ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {hasShoalBreach && <AlertTriangle className="w-3 h-3" />}
            <span>
              {hasShoalBreach
                ? `HAZARD (${(vesselDraft - transect.minDepth).toFixed(1)}m)`
                : `CLEAR (+${(transect.minDepth - vesselDraft).toFixed(1)}m)`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Profile SVG Chart */}
      <div className="p-3 relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          {/* Background grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#080e18"
            stroke="#162338"
          />

          {/* Depth Grid Lines */}
          {[0, 5, 10, 15, 20, 25, 30].map((d) => {
            if (d > maxPlotDepth) return null;
            const y = padding.top + (d / maxPlotDepth) * plotHeight;
            return (
              <g key={d}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="#1c2f4a"
                  strokeDasharray="2 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#5a718c"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {d}m
                </text>
              </g>
            );
          })}

          {/* Water Surface Line (0m) */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + plotWidth}
            y2={padding.top}
            stroke="#00e5ff"
            strokeWidth="1.5"
          />

          {/* Vessel Draft Safety Line */}
          {vesselDraft <= maxPlotDepth && (
            <g>
              <line
                x1={padding.left}
                y1={draftY}
                x2={padding.left + plotWidth}
                y2={draftY}
                stroke="#ff1e46"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={padding.left + plotWidth - 4}
                y={draftY - 3}
                textAnchor="end"
                fill="#ff1e46"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                DRAFT {vesselDraft.toFixed(1)}m
              </text>
            </g>
          )}

          {/* Seafloor Gradient Shading */}
          <defs>
            <linearGradient id="seafloorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#0055aa" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#08182b" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d={fillPathD} fill="url(#seafloorGradient)" />
          <path d={pathD} fill="none" stroke="#00e5ff" strokeWidth="2.5" />

          {/* Interactive Hover Point & Markers */}
          {svgPoints.map((sp, idx) => (
            <circle
              key={idx}
              cx={sp.x}
              cy={sp.y}
              r={hoveredPointIndex === idx ? 5 : 2}
              fill={sp.pt.depth <= vesselDraft ? '#ff1e46' : '#00e5ff'}
              stroke="#ffffff"
              strokeWidth={hoveredPointIndex === idx ? 1.5 : 0}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPointIndex(idx)}
            />
          ))}

          {/* X Axis Distance Labels */}
          <text
            x={padding.left}
            y={height - 8}
            textAnchor="start"
            fill="#5a718c"
            fontSize="9"
            fontFamily="monospace"
          >
            0 km
          </text>
          <text
            x={padding.left + plotWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fill="#5a718c"
            fontSize="9"
            fontFamily="monospace"
          >
            {(totalDist / 2000).toFixed(2)} km
          </text>
          <text
            x={padding.left + plotWidth}
            y={height - 8}
            textAnchor="end"
            fill="#5a718c"
            fontSize="9"
            fontFamily="monospace"
          >
            {(totalDist / 1000).toFixed(2)} km
          </text>
        </svg>

        {/* Hovered Point Callout */}
        {activeHoveredPoint && (
          <div className="mt-2 p-2 rounded bg-slate-900/90 border border-slate-700 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-400">TRACK DISTANCE:</span>{' '}
              <span className="text-slate-200 font-bold">
                {activeHoveredPoint.distanceMeters} m
              </span>{' '}
              <span className="text-slate-500">
                ({(activeHoveredPoint.distanceMeters / 1000).toFixed(2)} km)
              </span>
            </div>
            <div>
              <span className="text-slate-400">DEPTH:</span>{' '}
              <span
                className={`font-bold ${
                  activeHoveredPoint.depth <= vesselDraft ? 'text-red-400' : 'text-tactical-cyan'
                }`}
              >
                {activeHoveredPoint.depth.toFixed(1)} m
              </span>{' '}
              <span className="text-slate-500">
                (&plusmn;{activeHoveredPoint.uncertainty.toFixed(1)}m)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
