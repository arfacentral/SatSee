import React, { useState, useEffect, useCallback } from 'react';
import { BenchmarkLocation, ColorRamp, SDBParameters, SurveyTransect } from './types/bathymetry';
import { CursorTelemetry } from './types/telemetry';
import { BENCHMARK_LOCATIONS } from './core/geospatial/benchmarks';
import { MAP_LAYERS } from './core/geospatial/wmsProviders';
import { TacticalHeader } from './components/HUD/TacticalHeader';
import { CoordinateTelemetry } from './components/HUD/CoordinateTelemetry';
import { DepthColorBar } from './components/HUD/DepthColorBar';
import { TransectPanel } from './components/Tools/TransectPanel';
import { CalibrationModal } from './components/Tools/CalibrationModal';
import { LayersModal } from './components/Tools/LayersModal';
import { HelpModal } from './components/Tools/HelpModal';
import { SentinelSceneBadge } from './components/HUD/SentinelSceneBadge';
import { Sentinel2Scene, searchSentinel2Scene } from './core/geospatial/stacClient';
import { SatSeeMap } from './components/MapViewport/SatSeeMap';
import { getICESat2TracksForRegion } from './core/geospatial/icesatClient';
import { calibrateStumpfModel } from './core/sdb/stumpf';

export const App: React.FC = () => {
  // Benchmark and view state
  const [currentBenchmark, setCurrentBenchmark] = useState<BenchmarkLocation>(
    BENCHMARK_LOCATIONS[1] // Default to Lingyang Reef (2026 Nature study benchmark)
  );

  // Basemap & Layer controls
  const [activeBaseLayerId, setActiveBaseLayerId] = useState<string>('satelliteTrueColor');
  const [activeColorRamp, setActiveColorRamp] = useState<ColorRamp>('hydrographic');
  const [showSdbOverlay, setShowSdbOverlay] = useState<boolean>(true);
  const [showICESat2Tracks, setShowICESat2Tracks] = useState<boolean>(true);
  const [showIsobaths, setShowIsobaths] = useState<boolean>(true);
  const [analyticsVisible, setAnalyticsVisible] = useState<boolean>(true);
  const [showCables, setShowCables] = useState<boolean>(false);
  const [showVessels, setShowVessels] = useState<boolean>(false);
  const [showQuakes, setShowQuakes] = useState<boolean>(false);

  // Hydrographic & Inversion parameters
  const [sdbParams, setSdbParams] = useState<SDBParameters>(currentBenchmark.defaultParams);
  const [vesselDraft, setVesselDraft] = useState<number>(2.5); // Default 2.5m draft

  // Transect survey state
  const [isTransectMode, setIsTransectMode] = useState<boolean>(false);
  const [activeTransect, setActiveTransect] = useState<SurveyTransect | null>(null);

  // Modals state
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(
    () => localStorage.getItem('satsee-help-seen') !== '1'
  );
  const [viewCenter, setViewCenter] = useState({ lat: currentBenchmark.lat, lon: currentBenchmark.lon, zoom: currentBenchmark.defaultZoom });
  const handleViewChange = useCallback(
    (lat: number, lon: number, zoom: number) => setViewCenter({ lat, lon, zoom }),
    []
  );
  useEffect(() => {
    if (!isHelpOpen) localStorage.setItem('satsee-help-seen', '1');
  }, [isHelpOpen]);

  // Real-time telemetry
  const [telemetry, setTelemetry] = useState<CursorTelemetry>({
    lat: currentBenchmark.lat,
    lon: currentBenchmark.lon,
    utmZone: '49N',
    utmEasting: 563000,
    utmNorthing: 1820000,
    depthMeters: 5.4,
    uncertaintyMeters: 1.5,
    estimatedSoundSpeed: 1512.4,
    waterTemperatureEst: 26.0,
    salinityEst: 34.5,
    opticalWaterType: 'Jerlov I (Ultra-Clear)',
    sunGlintRisk: 'Low',
  });

  // Online / Offline connectivity listener
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sentinel-2 L2A STAC Pipeline state
  const [activeScene, setActiveScene] = useState<Sentinel2Scene | null>(null);
  const [loadingScene, setLoadingScene] = useState<boolean>(false);
  const [showTrueColorOverlay, setShowTrueColorOverlay] = useState<boolean>(false);

  const fetchSentinelScene = useCallback(async (lat: number, lon: number) => {
    setLoadingScene(true);
    // 0.1 degree bounding box around target
    const delta = 0.08;
    const bbox: [number, number, number, number] = [
      lon - delta,
      lat - delta,
      lon + delta,
      lat + delta,
    ];
    const scene = await searchSentinel2Scene(bbox);
    if (scene) {
      setActiveScene(scene);
    }
    setLoadingScene(false);
  }, []);

  // Fetch scene on mount and benchmark changes
  useEffect(() => {
    fetchSentinelScene(currentBenchmark.lat, currentBenchmark.lon);
  }, [currentBenchmark, fetchSentinelScene]);

  // Update parameters when user chooses a new benchmark
  const handleSelectBenchmark = (bench: BenchmarkLocation) => {
    setCurrentBenchmark(bench);
    setSdbParams(bench.defaultParams);
    setActiveTransect(null);
  };

  // Reset parameters to current AOI defaults
  const handleResetDefaults = () => {
    setSdbParams(currentBenchmark.defaultParams);
  };

  // Auto-calibrate Stumpf m1 and m0 using ICESat-2 spaceborne LiDAR tracks
  const handleAutoCalibrateICESat2 = () => {
    const tracks = getICESat2TracksForRegion(currentBenchmark.id);
    if (!tracks.length) return;

    const points = tracks.flatMap((t) =>
      t.photons.map((p) => ({
        rwBlue: 0.042,
        rwGreen: 0.035,
        trueDepth: p.depth,
      }))
    );

    const calibration = calibrateStumpfModel(points);
    setSdbParams((prev) => ({
      ...prev,
      m1: calibration.m1,
      m0: calibration.m0,
    }));
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-tactical-dark">
      {/* Tactical Top Header Bar */}
      <TacticalHeader
        currentBenchmark={currentBenchmark}
        onSelectBenchmark={handleSelectBenchmark}
        isOnline={isOnline}
        soundSpeed={telemetry.estimatedSoundSpeed}
        activeLayerName={MAP_LAYERS[activeBaseLayerId]?.name || 'Basemap'}
        onOpenLayers={() => setIsLayersOpen(true)}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onToggleTransectMode={() => setIsTransectMode(!isTransectMode)}
        isTransectMode={isTransectMode}
        onOpenHelp={() => setIsHelpOpen(true)}
        viewCenter={viewCenter}
      />

      {/* Main Interactive Map Canvas */}
      <main className="relative flex-1 w-full h-full">
        <SatSeeMap
          currentBenchmark={currentBenchmark}
          activeBaseLayerId={activeBaseLayerId}
          activeColorRamp={activeColorRamp}
          sdbParams={sdbParams}
          vesselDraft={vesselDraft}
          showSdbOverlay={showSdbOverlay && analyticsVisible}
          showICESat2Tracks={showICESat2Tracks && analyticsVisible}
          showIsobaths={showIsobaths && analyticsVisible}
          showCables={showCables}
          showVessels={showVessels}
          showQuakes={showQuakes}
          analyticsVisible={analyticsVisible}
          onToggleAnalytics={() => setAnalyticsVisible((v) => !v)}
          isTransectMode={isTransectMode}
          showTrueColorOverlay={showTrueColorOverlay}
          activeScene={activeScene}
          onSetTelemetry={setTelemetry}
          onViewChange={handleViewChange}
          onCompleteTransect={(t) => {
            setActiveTransect(t);
            setIsTransectMode(false);
          }}
        />

        {/* Sentinel-2 L2A STAC Live Pipeline Badge */}
        <SentinelSceneBadge
          scene={activeScene}
          loading={loadingScene}
          onRefreshScene={() => fetchSentinelScene(currentBenchmark.lat, currentBenchmark.lon)}
          showTrueColorOverlay={showTrueColorOverlay}
          onToggleTrueColorOverlay={setShowTrueColorOverlay}
        />

        {/* Tactical Telemetry HUD */}
        <CoordinateTelemetry telemetry={telemetry} vesselDraft={vesselDraft} />

        {/* Depth Color Palette & Draft Limiter */}
        <DepthColorBar
          activeRamp={activeColorRamp}
          onSelectRamp={setActiveColorRamp}
          vesselDraft={vesselDraft}
          onChangeDraft={setVesselDraft}
          datum={sdbParams.datum}
          tideOffset={sdbParams.tideOffset}
        />

        {/* 2D Seafloor Transect Profiler Drawer */}
        <TransectPanel
          transect={activeTransect}
          onClose={() => setActiveTransect(null)}
          vesselDraft={vesselDraft}
        />
      </main>

      {/* Calibration & Algorithm Tuner Modal */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        params={sdbParams}
        onUpdateParams={setSdbParams}
        onResetDefaults={handleResetDefaults}
        onAutoCalibrateICESat2={handleAutoCalibrateICESat2}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Geospatial Layers Modal */}
      <LayersModal
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        activeBaseLayerId={activeBaseLayerId}
        onSelectBaseLayer={(id) => setActiveBaseLayerId(id)}
        showSdbOverlay={showSdbOverlay}
        onToggleSdbOverlay={setShowSdbOverlay}
        showICESat2Tracks={showICESat2Tracks}
        onToggleICESat2Tracks={setShowICESat2Tracks}
        showIsobaths={showIsobaths}
        onToggleIsobaths={setShowIsobaths}
        showCables={showCables}
        onToggleCables={setShowCables}
        showVessels={showVessels}
        onToggleVessels={setShowVessels}
        showQuakes={showQuakes}
        onToggleQuakes={setShowQuakes}
      />
    </div>
  );
};

export default App;
