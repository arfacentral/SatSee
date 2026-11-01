import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { BenchmarkLocation, ColorRamp, SDBParameters, SurveyTransect } from '../../types/bathymetry';
import { CursorTelemetry } from '../../types/telemetry';
import { MAP_LAYERS } from '../../core/geospatial/wmsProviders';
import { sampleBathymetryAtPoint, generateSurveyTransect } from '../../core/geospatial/syntheticGenerator';
import { latLonToUTM } from '../../core/geospatial/utm';
import { calculateMackenzieSoundSpeed } from '../../core/sdb/tidal';
import { classifyOpticalWater } from '../../core/sdb/turbidity';
import { getDepthColor } from '../../core/sdb/colorRamps';
import { getICESat2TracksForRegion } from '../../core/geospatial/icesatClient';
import { loadCables, fetchVessels, fetchQuakes } from '../../core/geospatial/marineLayers';
import { Sentinel2Scene } from '../../core/geospatial/stacClient';
import { Eye, EyeOff } from 'lucide-react';

interface SatSeeMapProps {
  currentBenchmark: BenchmarkLocation;
  activeBaseLayerId: string;
  activeColorRamp: ColorRamp;
  sdbParams: SDBParameters;
  vesselDraft: number;
  showSdbOverlay: boolean;
  showICESat2Tracks: boolean;
  showIsobaths: boolean;
  isTransectMode: boolean;
  onSetTelemetry: (t: CursorTelemetry) => void;
  onCompleteTransect: (t: SurveyTransect) => void;
  onAutoCalibratePoint?: (depth: number) => void;
  onViewChange?: (lat: number, lon: number, zoom: number) => void;
  showCables: boolean;
  showVessels: boolean;
  showQuakes: boolean;
  analyticsVisible: boolean;
  onToggleAnalytics: () => void;
  activeScene?: Sentinel2Scene | null;
  showTrueColorOverlay?: boolean;
}

export const SatSeeMap: React.FC<SatSeeMapProps> = ({
  currentBenchmark,
  activeBaseLayerId,
  activeColorRamp,
  sdbParams,
  vesselDraft,
  showSdbOverlay,
  showICESat2Tracks,
  showIsobaths,
  isTransectMode,
  onSetTelemetry,
  onCompleteTransect,
  onViewChange,
  showCables,
  showVessels,
  showQuakes,
  analyticsVisible,
  onToggleAnalytics,
  activeScene,
  showTrueColorOverlay = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const underlayRef = useRef<L.TileLayer | null>(null);
  const sdbOverlayLayerRef = useRef<L.LayerGroup | null>(null);
  const icesatLayerRef = useRef<L.LayerGroup | null>(null);
  const isobathsLayerRef = useRef<L.LayerGroup | null>(null);
  const transectLayerRef = useRef<L.LayerGroup | null>(null);
  const cablesLayerRef = useRef<L.LayerGroup | null>(null);
  const vesselsLayerRef = useRef<L.LayerGroup | null>(null);
  const quakesLayerRef = useRef<L.LayerGroup | null>(null);
  const trueColorLayerRef = useRef<L.ImageOverlay | null>(null);
  const [status, setStatus] = useState({ cables: '', vessels: '', quakes: '' });

  const [transectStartPoint, setTransectStartPoint] = useState<[number, number] | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentBenchmark.lat, currentBenchmark.lon],
      zoom: currentBenchmark.defaultZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom tactical zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create layer groups
    const sdbGroup = L.layerGroup().addTo(map);
    const icesatGroup = L.layerGroup().addTo(map);
    const isobathsGroup = L.layerGroup().addTo(map);
    const transectGroup = L.layerGroup().addTo(map);
    const cablesGroup = L.layerGroup().addTo(map);
    const vesselsGroup = L.layerGroup().addTo(map);
    const quakesGroup = L.layerGroup().addTo(map);

    cablesLayerRef.current = cablesGroup;
    vesselsLayerRef.current = vesselsGroup;
    quakesLayerRef.current = quakesGroup;

    sdbOverlayLayerRef.current = sdbGroup;
    icesatLayerRef.current = icesatGroup;
    isobathsLayerRef.current = isobathsGroup;
    transectLayerRef.current = transectGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Layer (WMS-aware, with a dark underlay beneath bathymetry/overlay layers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
    if (underlayRef.current) map.removeLayer(underlayRef.current);

    const config = MAP_LAYERS[activeBaseLayerId] || MAP_LAYERS.tacticalDark;

    if (config.category !== 'base') {
      const dark = MAP_LAYERS.tacticalDark;
      const under = L.tileLayer(dark.url, { maxZoom: dark.maxZoom, minZoom: dark.minZoom, opacity: 1 });
      under.addTo(map);
      under.bringToBack();
      underlayRef.current = under;
    } else {
      underlayRef.current = null;
    }

    const tileLayer: L.TileLayer = config.isWms
      ? L.tileLayer.wms(config.url, {
          layers: config.wmsParams?.layers ?? '',
          format: config.wmsParams?.format ?? 'image/png',
          transparent: true,
          version: config.wmsParams?.version ?? '1.3.0',
          maxZoom: config.maxZoom,
          minZoom: config.minZoom,
          opacity: config.opacity,
        })
      : L.tileLayer(config.url, {
          maxZoom: config.maxZoom,
          minZoom: config.minZoom,
          opacity: config.opacity,
        });

    tileLayer.addTo(map);
    baseTileLayerRef.current = tileLayer;
  }, [activeBaseLayerId]);

  // Report map view so the UI can "scan current view"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const report = () => {
      const c = map.getCenter();
      onViewChange?.(c.lat, c.lng, map.getZoom());
    };
    map.on('moveend', report);
    report();
    return () => {
      map.off('moveend', report);
    };
  }, [onViewChange]);

  // Center on Benchmark when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([currentBenchmark.lat, currentBenchmark.lon], currentBenchmark.defaultZoom, {
      duration: 1.8,
    });
    setTransectStartPoint(null);
    if (transectLayerRef.current) transectLayerRef.current.clearLayers();
  }, [currentBenchmark]);

  // Handle Cursor Movement & Telemetry updates
  const handleMouseMove = useCallback(
    (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const utm = latLonToUTM(lat, lng);

      const sounding = sampleBathymetryAtPoint(
        lat,
        lng,
        sdbParams.m1,
        sdbParams.m0,
        sdbParams.tideOffset
      );

      const optClass = classifyOpticalWater(0.045, 0.038, sounding.turbidityIndex * 0.05);
      const soundSpeed = calculateMackenzieSoundSpeed(15.0, 35.0, sounding.depth);

      onSetTelemetry({
        lat,
        lon: lng,
        utmZone: `${utm.zone}${utm.hemisphere}`,
        utmEasting: utm.easting,
        utmNorthing: utm.northing,
        depthMeters: sounding.depth,
        uncertaintyMeters: sounding.uncertainty,
        estimatedSoundSpeed: soundSpeed,
        waterTemperatureEst: 15.0,
        salinityEst: 35.0,
        opticalWaterType: optClass.waterType,
        sunGlintRisk: 'Low',
      });
    },
    [sdbParams, onSetTelemetry]
  );

  // Handle Map Clicks for Transect Drawing
  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      const map = mapInstanceRef.current;
      const group = transectLayerRef.current;
      if (!map || !group) return;

      const clickCoords: [number, number] = [e.latlng.lat, e.latlng.lng];

      if (!isTransectMode) {
        // Standard click sounding popup
        const sounding = sampleBathymetryAtPoint(
          clickCoords[0],
          clickCoords[1],
          sdbParams.m1,
          sdbParams.m0,
          sdbParams.tideOffset
        );

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #070b12;">
            <strong style="color: #007799;">SDB SOUNDING POINT</strong><br/>
            Lat: ${clickCoords[0].toFixed(5)}&deg;, Lon: ${clickCoords[1].toFixed(5)}&deg;<br/>
            <strong>Depth: ${sounding.depth.toFixed(1)}m</strong> (&plusmn;${sounding.uncertainty.toFixed(1)}m)<br/>
            Datum: ${sdbParams.datum} | Source: ${sounding.source.toUpperCase()}
          </div>
        `;
        L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
        return;
      }

      // In Transect Mode: Point A or Point B
      if (!transectStartPoint) {
        setTransectStartPoint(clickCoords);
        group.clearLayers();

        // Marker for Point A
        const markerA = L.circleMarker(clickCoords, {
          radius: 6,
          color: '#00e5ff',
          fillColor: '#00e5ff',
          fillOpacity: 0.9,
          weight: 2,
        }).bindTooltip('TRANSECT START (Point A)', { permanent: true, direction: 'top', className: 'tactical-tooltip' });
        group.addLayer(markerA);
      } else {
        // Point B clicked: Generate Survey Transect
        const transect = generateSurveyTransect(
          transectStartPoint,
          clickCoords,
          60,
          sdbParams.m1,
          sdbParams.m0,
          sdbParams.tideOffset
        );

        // Marker for Point B
        const markerB = L.circleMarker(clickCoords, {
          radius: 6,
          color: '#ffb300',
          fillColor: '#ffb300',
          fillOpacity: 0.9,
          weight: 2,
        }).bindTooltip('TRANSECT END (Point B)', { permanent: true, direction: 'top', className: 'tactical-tooltip' });
        group.addLayer(markerB);

        // Survey Track Line
        const polyline = L.polyline([transectStartPoint, clickCoords], {
          color: '#00e5ff',
          weight: 3,
          dashArray: '6 4',
          opacity: 0.9,
        });
        group.addLayer(polyline);

        onCompleteTransect(transect);
        setTransectStartPoint(null); // Reset for next transect
      }
    },
    [isTransectMode, transectStartPoint, sdbParams, onCompleteTransect]
  );

  // Attach mouse listeners
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on('mousemove', handleMouseMove);
    map.on('click', handleMapClick);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('click', handleMapClick);
    };
  }, [handleMouseMove, handleMapClick]);

  // Render Sentinel-2 True Color optical image overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trueColorLayerRef.current) {
      map.removeLayer(trueColorLayerRef.current);
      trueColorLayerRef.current = null;
    }

    if (!showTrueColorOverlay || !activeScene?.thumbnailUrl) return;

    const [minLon, minLat, maxLon, maxLat] = activeScene.bbox || [
      currentBenchmark.lon - 0.1,
      currentBenchmark.lat - 0.1,
      currentBenchmark.lon + 0.1,
      currentBenchmark.lat + 0.1,
    ];

    const bounds: L.LatLngBoundsExpression = [
      [minLat, minLon],
      [maxLat, maxLon],
    ];

    const overlay = L.imageOverlay(activeScene.thumbnailUrl, bounds, {
      opacity: 0.88,
      interactive: false,
    });

    overlay.addTo(map);
    trueColorLayerRef.current = overlay;
  }, [showTrueColorOverlay, activeScene, currentBenchmark]);

  // Render SDB Depth Heatmap / Grid Overlay
  useEffect(() => {
    const group = sdbOverlayLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showSdbOverlay) return;

    // Generate high-resolution Sentinel-2 bathymetric inversion mesh around target
    const centerLat = currentBenchmark.lat;
    const centerLon = currentBenchmark.lon;
    const span = currentBenchmark.defaultZoom >= 13 ? 0.05 : 0.45;
    const steps = 22;

    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const cellLat1 = centerLat - span / 2 + (i / steps) * span;
        const cellLat2 = centerLat - span / 2 + ((i + 1) / steps) * span;
        const cellLon1 = centerLon - span / 2 + (j / steps) * span;
        const cellLon2 = centerLon - span / 2 + ((j + 1) / steps) * span;

        const midLat = (cellLat1 + cellLat2) / 2;
        const midLon = (cellLon1 + cellLon2) / 2;

        const sounding = sampleBathymetryAtPoint(
          midLat,
          midLon,
          sdbParams.m1,
          sdbParams.m0,
          sdbParams.tideOffset
        );

        const color = getDepthColor(sounding.depth, activeColorRamp, 30);
        const isHazard = sounding.depth <= vesselDraft;

        const rect = L.rectangle(
          [
            [cellLat1, cellLon1],
            [cellLat2, cellLon2],
          ],
          {
            color: isHazard ? '#ff1e46' : color.hex,
            weight: isHazard ? 1.5 : 0.3,
            fillColor: color.hex,
            fillOpacity: isHazard ? 0.65 : 0.48,
          }
        );

        const satName = activeScene?.satellite || 'Sentinel-2';
        rect.bindTooltip(
          `<div>
            <strong>${satName} SDB: ${sounding.depth.toFixed(1)}m</strong>${isHazard ? ' <span style="color:#ff1e46;font-weight:bold;">[DRAFT HAZARD]</span>' : ''}<br/>
            Uncertainty: &plusmn;${sounding.uncertainty.toFixed(1)}m | Jerlov I<br/>
            <span style="opacity:0.75; font-size:9px;">Pass: ${activeScene?.id ? activeScene.id.substring(0, 24) + '…' : 'L2A Standard'}</span>
          </div>`,
          { direction: 'top', className: 'tactical-tooltip' }
        );

        group.addLayer(rect);
      }
    }
  }, [showSdbOverlay, currentBenchmark, activeColorRamp, sdbParams, vesselDraft, activeScene]);

  // Render ICESat-2 Satellite Laser Calibration Tracks
  useEffect(() => {
    const group = icesatLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showICESat2Tracks) return;

    const tracks = getICESat2TracksForRegion(currentBenchmark.id);
    tracks.forEach((trk) => {
      const latlngs = trk.photons.map((p) => [p.lat, p.lon] as [number, number]);

      // Orbital Track Line
      const trackLine = L.polyline(latlngs, {
        color: '#00ffaa',
        weight: 2,
        dashArray: '4 4',
        opacity: 0.8,
      });
      group.addLayer(trackLine);

      // Photon Dots
      trk.photons.forEach((pt) => {
        const marker = L.circleMarker([pt.lat, pt.lon], {
          radius: 4,
          color: '#00ffaa',
          fillColor: '#003322',
          fillOpacity: 0.9,
          weight: 1.5,
        });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; color: #070b12;">
            <strong style="color: #00aa66;">ICESat-2 ATL24 PHOTON SOUNDING</strong><br/>
            Track: ${trk.trackId} (${trk.beamName})<br/>
            Date: ${trk.acquisitionDate}<br/>
            <strong>True LiDAR Depth: ${pt.depth.toFixed(2)}m</strong><br/>
            Uncertainty: &plusmn;${pt.uncertainty.toFixed(2)}m<br/>
            <span style="color: #006688; font-size: 10px;">Used for Stumpf m1/m0 auto-calibration</span>
          </div>
        `);

        group.addLayer(marker);
      });
    });
  }, [showICESat2Tracks, currentBenchmark]);

  // Render Depth Isobaths (Contour lines)
  useEffect(() => {
    const group = isobathsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showIsobaths) return;

    // Draw representative isobath rings around benchmark
    const cLat = currentBenchmark.lat;
    const cLon = currentBenchmark.lon;
    const contours = [
      { depth: 2, radiusKm: 0.8, color: '#ff1e46' },
      { depth: 5, radiusKm: 1.5, color: '#ffb300' },
      { depth: 10, radiusKm: 2.2, color: '#00e5ff' },
      { depth: 20, radiusKm: 3.2, color: '#0055ff' },
    ];

    contours.forEach((c) => {
      // Circle approximation for reef/bank contour
      const circle = L.circle([cLat, cLon], {
        radius: c.radiusKm * 1000,
        color: c.color,
        weight: 1.5,
        dashArray: '3 3',
        fill: false,
        opacity: 0.75,
      });

      circle.bindTooltip(`Isobath Contour: ${c.depth}m`, {
        direction: 'center',
        permanent: false,
        className: 'tactical-tooltip',
      });

      group.addLayer(circle);
    });
  }, [showIsobaths, currentBenchmark]);

  // ---- Marine intelligence layers (cables, vessels, earthquakes) ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const g = cablesLayerRef.current;
    if (!g) return;
    g.clearLayers();
    if (!showCables) {
      setStatus((s) => ({ ...s, cables: '' }));
      return;
    }
    let cancelled = false;
    setStatus((s) => ({ ...s, cables: 'Loading cables…' }));
    loadCables()
      .then((fc) => {
        if (cancelled) return;
        L.geoJSON(fc as any, {
          style: (f) => ({
            color: (f?.properties as any)?.color || '#ff4fd8',
            weight: 1.6,
            opacity: 0.85,
          }),
          onEachFeature: (f, layer) => {
            const n = (f.properties as any)?.name;
            if (n) layer.bindTooltip(`Submarine cable: ${n}`, { sticky: true, className: 'tactical-tooltip' });
          },
        }).addTo(g);
        setStatus((s) => ({ ...s, cables: '' }));
      })
      .catch(() => !cancelled && setStatus((s) => ({ ...s, cables: '' })));
    return () => {
      cancelled = true;
    };
  }, [showCables]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const g = vesselsLayerRef.current;
    if (!map || !g) return;
    g.clearLayers();
    if (!showVessels) {
      setStatus((s) => ({ ...s, vessels: '' }));
      return;
    }
    let cancelled = false;
    const load = async () => {
      const c = map.getCenter();
      const b = map.getBounds();
      const radiusKm = Math.max(20, (c.distanceTo(b.getNorthEast()) / 1000) * 1.1);
      try {
        setStatus((s) => ({ ...s, vessels: 'Loading vessels…' }));
        const vs = (await fetchVessels(c.lat, c.lng, radiusKm, {
          minLat: b.getSouth(),
          minLon: b.getWest(),
          maxLat: b.getNorth(),
          maxLon: b.getEast(),
        }));
        if (cancelled) return;
        g.clearLayers();
        vs.vessels.forEach((v) => {
          const rot = v.heading !== 511 ? v.heading : v.cog;
          const moving = v.sog > 0.5;
          const icon = L.divIcon({
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            html: `<svg width="14" height="14" viewBox="0 0 14 14" style="transform:rotate(${rot}deg)"><path d="M7 1 L12 13 L7 10 L2 13 Z" fill="${moving ? '#00ffaa' : '#8aa0b8'}" stroke="#04110c" stroke-width="0.8"/></svg>`,
          });
          const sourceTag = vs.source === 'global' ? 'Live Global AIS' : vs.source === 'baltic' ? 'Baltic AIS' : 'Maritime Traffic';
          L.marker([v.lat, v.lon], { icon })
            .bindTooltip(
              `<div><strong>${v.name ? v.name : 'MMSI ' + v.mmsi}</strong><br/>${v.sog.toFixed(1)} kn · COG ${v.cog.toFixed(0)}°<br/><span style="opacity:0.7;font-size:9px;">[${sourceTag}]</span></div>`,
              { className: 'tactical-tooltip' }
            )
            .addTo(g);
        });
        setStatus((s) => ({ ...s, vessels: '' }));
      } catch {
        if (!cancelled) setStatus((s) => ({ ...s, vessels: '' }));
      }
    };
    load();
    const timer = window.setInterval(load, 60000);
    map.on('moveend', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      map.off('moveend', load);
    };
  }, [showVessels]);

  useEffect(() => {
    const g = quakesLayerRef.current;
    if (!g) return;
    g.clearLayers();
    if (!showQuakes) {
      setStatus((s) => ({ ...s, quakes: '' }));
      return;
    }
    let cancelled = false;
    setStatus((s) => ({ ...s, quakes: 'Loading earthquakes…' }));
    fetchQuakes()
      .then((qs) => {
        if (cancelled) return;
        qs.forEach((q) => {
          L.circleMarker([q.lat, q.lon], {
            radius: Math.max(3, q.mag * 2.2),
            color: q.tsunami ? '#ff1e46' : '#ffb300',
            fillColor: q.tsunami ? '#ff1e46' : '#ffb300',
            fillOpacity: 0.35,
            weight: 1.5,
          })
            .bindTooltip(
              `M${q.mag.toFixed(1)} · ${q.place}<br/>Depth ${q.depthKm.toFixed(0)} km · ${new Date(q.time).toUTCString()}${q.tsunami ? '<br/>TSUNAMI FLAG' : ''}`,
              { className: 'tactical-tooltip' }
            )
            .addTo(g);
        });
        setStatus((s) => ({ ...s, quakes: '' }));
      })
      .catch(() => !cancelled && setStatus((s) => ({ ...s, quakes: '' })));
    return () => {
      cancelled = true;
    };
  }, [showQuakes]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b12]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* SDB overlays on/off toggle (sits under the zoom buttons) */}
      <button
        onClick={onToggleAnalytics}
        className={`absolute z-20 pointer-events-auto right-[10px] top-[88px] w-[30px] h-[30px] flex items-center justify-center rounded border shadow-lg transition-colors ${
          analyticsVisible
            ? 'bg-tactical-cyan/25 border-tactical-cyan text-tactical-cyan'
            : 'bg-tactical-surface border-tactical-border text-slate-400'
        }`}
        title={analyticsVisible ? 'Hide SDB analytical overlays (depth surface, ICESat-2, contours)' : 'Show SDB analytical overlays'}
        aria-pressed={analyticsVisible}
      >
        {analyticsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Layer status messages */}
      {Object.values(status).some(Boolean) && (
        <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center space-y-1 font-mono text-[11px]">
          {Object.values(status)
            .filter(Boolean)
            .map((m, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-tactical-surface/90 border border-tactical-border text-slate-300">
                {m}
              </span>
            ))}
        </div>
      )}

      {/* Crosshair Center Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-30">
        <div className="w-12 h-12 border border-tactical-cyan/40 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-tactical-cyan rounded-full"></div>
        </div>
      </div>

      {/* Transect Mode Banner */}
      {isTransectMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center space-x-2 px-4 py-2 rounded-full bg-tactical-surface/90 border border-tactical-cyan text-slate-100 text-xs font-mono shadow-[0_0_20px_rgba(0,229,255,0.3)] animate-pulse">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          <span>
            {transectStartPoint
              ? 'Click SECOND point on map to complete transect line'
              : 'Click FIRST point on map to start survey transect'}
          </span>
        </div>
      )}
    </div>
  );
};
