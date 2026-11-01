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
  source: 'global' | 'baltic';
}

/** Tries the global AISStream relay first; falls back to Baltic-only Digitraffic. */
export async function fetchVessels(
  lat: number,
  lon: number,
  radiusKm: number,
  bounds?: { minLat: number; minLon: number; maxLat: number; maxLon: number }
): Promise<VesselResult> {
  if (bounds) {
    try {
      const q = new URLSearchParams(Object.entries(bounds).map(([k, v]) => [k, String(v)]));
      const r = await fetch(`/api/vessels?${q}`);
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
        const arr = (await r.json()) as Vessel[];
        return { vessels: arr, source: 'global' };
      }
    } catch {
      /* relay not running: fall through */
    }
  }
  return { vessels: await fetchDigitraffic(lat, lon, radiusKm), source: 'baltic' };
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
