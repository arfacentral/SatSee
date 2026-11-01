import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Marine intelligence data sources (all free, no API key).
 *  - Cables:  TeleGeography Submarine Cable Map (CC BY-NC-SA 4.0, non-commercial use).
 *             Bundled as /data-cables.json because the source sends no CORS headers.
 *             Refresh by re-downloading https://www.submarinecablemap.com/api/v3/cable/cable-geo.json
 *  - Vessels: Fintraffic Digitraffic AIS (CC BY 4.0). Coverage: Baltic Sea / Finnish waters only.
 *  - Quakes:  USGS earthquake feed (public domain), global.
 */

export interface Vessel {
  mmsi: number;
  lat: number;
  lon: number;
  sog: number; // knots
  cog: number; // degrees
  heading: number; // degrees (511 = unavailable)
  name?: string;
}

export interface Quake {
  id: string;
  lat: number;
  lon: number;
  mag: number;
  place: string;
  time: number;
  depthKm: number;
  tsunami: boolean;
}

let cableCache: FeatureCollection<Geometry> | null = null;

export async function loadCables(): Promise<FeatureCollection<Geometry>> {
  if (cableCache) return cableCache;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cablePath = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data-cables.json`;
  const r = await fetch(cablePath);
  if (!r.ok) throw new Error(`Cable data unavailable (${r.status})`);
  cableCache = (await r.json()) as FeatureCollection<Geometry>;
  return cableCache;
}

export interface VesselResult {
  vessels: Vessel[];
  source: 'global' | 'baltic' | 'simulated';
}

const SIMULATED_FLEET = [
  { name: 'MV ATLANTIC VOYAGER', type: 'Container Ship', draft: 15.5 },
  { name: 'MV NORTHERN EXPRESS', type: 'Container Ship', draft: 16.0 },
  { name: 'MV HORIZON TRADER', type: 'Container Ship', draft: 15.7 },
  { name: 'MT PACIFIC ENDEAVOUR', type: 'Crude Oil Tanker', draft: 18.2 },
  { name: 'MV NORDIC BULKER', type: 'Bulk Carrier', draft: 13.4 },
  { name: 'OSV ATLANTIC PIONEER', type: 'Offshore Supply', draft: 6.8 },
  { name: 'RV OCEAN CHALLENGER', type: 'Research / Survey', draft: 5.2 },
  { name: 'FV ISLAND DISCOVERY', type: 'Fishing Vessel', draft: 4.1 },
  { name: 'FV CAPE SPEAR', type: 'Stern Trawler', draft: 5.0 },
  { name: 'MV BLUE HORIZON', type: 'General Cargo', draft: 8.5 },
  { name: 'MT BALTIC MARINER', type: 'Chemical Tanker', draft: 11.2 },
  { name: 'MV EASTERN CARRIER', type: 'Vehicles Carrier', draft: 9.8 },
  { name: 'MT SOUTHERN NAVIGATOR', type: 'LNG Tanker', draft: 12.0 },
  { name: 'PV SEA DEFENDER', type: 'Coastal Patrol', draft: 4.5 },
  { name: 'MV NORTHERN LIGHT', type: 'Passenger Ferry', draft: 5.8 },
];

/** Generates realistic shipping-lane traffic for any oceanic viewport. */
export function generateSimulatedVessels(bounds: {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}): Vessel[] {
  const dLat = bounds.maxLat - bounds.minLat;
  const dLon = bounds.maxLon - bounds.minLon;
  if (dLat <= 0 || dLon <= 0) return [];

  // Count scaled between 6 and 18 vessels depending on viewport size
  const count = Math.min(18, Math.max(7, Math.round(12 + Math.sin(bounds.minLat) * 4)));
  const nowMin = Math.floor(Date.now() / 20000); // changes slowly every 20s

  const vessels: Vessel[] = [];

  for (let i = 0; i < count; i++) {
    const ship = SIMULATED_FLEET[i % SIMULATED_FLEET.length];
    // Deterministic pseudo-random values based on geographic bounds and index
    const hash = Math.abs(Math.sin((bounds.minLat * 100 + bounds.minLon * 50 + i * 17.3 + nowMin * 0.05))) % 1;
    const hash2 = Math.abs(Math.cos((bounds.maxLat * 80 - bounds.maxLon * 40 + i * 29.1 + nowMin * 0.03))) % 1;
    const hash3 = Math.abs(Math.sin((i * 43.7 + bounds.minLat * 13))) % 1;

    // Position within 15% to 85% inner margin of current bounds
    const lat = bounds.minLat + dLat * (0.15 + 0.7 * hash);
    const lon = bounds.minLon + dLon * (0.15 + 0.7 * hash2);

    const sog = 6.0 + hash3 * 14.0; // 6 to 20 knots
    const cog = Math.round(hash * 360);
    const mmsi = 300000000 + Math.floor(hash * 600000000);

    vessels.push({
      mmsi,
      lat,
      lon,
      sog: parseFloat(sog.toFixed(1)),
      cog,
      heading: cog,
      name: `${ship.name} (${ship.type})`,
    });
  }

  return vessels;
}

/** Tries the global AISStream relay first; falls back to Baltic Digitraffic, then simulated shipping traffic. */
export async function fetchVessels(
  lat: number,
  lon: number,
  radiusKm: number,
  bounds?: { minLat: number; minLon: number; maxLat: number; maxLon: number }
): Promise<VesselResult> {
  // 1. Try local or cloud AISStream relay
  if (bounds) {
    try {
      const q = new URLSearchParams(Object.entries(bounds).map(([k, v]) => [k, String(v)]));
      const r = await fetch(`/api/vessels?${q}`);
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const arr = (await r.json()) as Vessel[];
        if (arr.length > 0) {
          return { vessels: arr, source: 'global' };
        }
      }
    } catch {
      /* relay not running */
    }
  }

  // 2. Try Baltic Digitraffic if within Northern European / Baltic latitudes
  if (lat >= 53 && lat <= 66 && lon >= 10 && lon <= 32) {
    try {
      const baltic = await fetchDigitraffic(lat, lon, radiusKm);
      if (baltic.length > 0) {
        return { vessels: baltic, source: 'baltic' };
      }
    } catch {
      /* Digitraffic failed */
    }
  }

  // 3. Fallback: realistic shipping lane traffic in the current viewport
  if (bounds) {
    return { vessels: generateSimulatedVessels(bounds), source: 'simulated' };
  }

  return { vessels: [], source: 'simulated' };
}

async function fetchDigitraffic(lat: number, lon: number, radiusKm: number): Promise<Vessel[]> {
  const from = Date.now() - 15 * 60 * 1000;
  const url =
    `https://meri.digitraffic.fi/api/ais/v1/locations?latitude=${lat.toFixed(4)}` +
    `&longitude=${lon.toFixed(4)}&radius=${Math.min(500, Math.round(radiusKm))}&from=${from}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`AIS feed error (${r.status})`);
  const data = await r.json();
  const out: Vessel[] = [];
  for (const f of data.features ?? []) {
    const c = f.geometry?.coordinates;
    if (!c) continue;
    out.push({
      mmsi: f.mmsi ?? f.properties?.mmsi,
      lon: c[0],
      lat: c[1],
      sog: f.properties?.sog ?? 0,
      cog: f.properties?.cog ?? 0,
      heading: f.properties?.heading ?? 511,
    });
    if (out.length >= 1500) break;
  }
  return out;
}

export async function fetchQuakes(): Promise<Quake[]> {
  const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson');
  if (!r.ok) throw new Error(`USGS feed error (${r.status})`);
  const data = await r.json();
  return (data.features ?? []).map((f: any) => ({
    id: f.id,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    depthKm: f.geometry.coordinates[2],
    mag: f.properties.mag,
    place: f.properties.place,
    time: f.properties.time,
    tsunami: !!f.properties.tsunami,
  }));
}
