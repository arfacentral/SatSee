/**
 * Sentinel-2 L2A STAC Client
 * Queries open, free Bottom-of-Atmosphere (BOA) surface reflectance imagery
 * from AWS Earth Search STAC API (https://earth-search.aws.element84.com/v1)
 */

export interface Sentinel2Scene {
  id: string;
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Sentinel-2C';
  datetime: string;
  cloudCoverPercent: number;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  thumbnailUrl: string;
  visualUrl: string;
  blueUrl: string;  // Band 2 (490 nm)
  greenUrl: string; // Band 3 (560 nm)
  redUrl: string;   // Band 4 (665 nm)
  nirUrl: string;   // Band 8 (842 nm)
  resolutionMeters: number;
  sunElevationDeg?: number;
}

/**
 * Searches for the latest cloud-free Sentinel-2 L2A scene over a bounding box
 */
export async function searchSentinel2Scene(
  bbox: [number, number, number, number],
  maxCloudCover: number = 30
): Promise<Sentinel2Scene | null> {
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // Try local backend proxy first, fallback to direct STAC query
  const queryPayload = {
    collections: ['sentinel-2-l2a'],
    bbox: [minLon, minLat, maxLon, maxLat],
    limit: 1,
    query: {
      'eo:cloud_cover': { lt: maxCloudCover },
    },
  };

  try {
    let response: Response | null = null;
    try {
      response = await fetch('/api/sentinel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload),
      });
      if (!response.ok) {
        response = null; // Trigger direct fallback on static hosting (404)
      }
    } catch {
      response = null;
    }

    if (!response) {
      // Direct STAC API query fallback
      response = await fetch('https://earth-search.aws.element84.com/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload),
      });
    }

    if (!response.ok) {
      console.warn(`STAC query returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      // If cloud cover < max was too strict, try broader search
      if (maxCloudCover < 70) {
        return searchSentinel2Scene(bbox, 70);
      }
      return null;
    }

    const feature = data.features[0];
    const props = feature.properties || {};
    const assets = feature.assets || {};

    const id = feature.id || 'S2_L2A';
    const satellite = id.startsWith('S2C')
      ? 'Sentinel-2C'
      : id.startsWith('S2B')
      ? 'Sentinel-2B'
      : 'Sentinel-2A';

    return {
      id,
      satellite,
      datetime: props.datetime || new Date().toISOString(),
      cloudCoverPercent: Number((props['eo:cloud_cover'] ?? 0).toFixed(1)),
      bbox: (feature.bbox as [number, number, number, number]) || bbox,
      thumbnailUrl: assets.thumbnail?.href || assets.preview?.href || '',
      visualUrl: assets.visual?.href || '',
      blueUrl: assets.blue?.href || '',
      greenUrl: assets.green?.href || '',
      redUrl: assets.red?.href || '',
      nirUrl: assets.nir?.href || '',
      resolutionMeters: 10,
      sunElevationDeg: props['view:sun_elevation'] ? Number(props['view:sun_elevation'].toFixed(1)) : 42.5,
    };
  } catch (err) {
    console.error('Failed to search Sentinel-2 STAC catalog:', err);
    return null;
  }
}
