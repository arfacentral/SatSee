export interface MapLayerConfig {
  id: string;
  name: string;
  category: 'base' | 'bathymetry' | 'satellite' | 'overlay';
  url: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  opacity: number;
  isWms?: boolean;
  wmsParams?: Record<string, string>;
  description: string;
  badge?: string;
}

const CARTO_TILE_URL: string = (import.meta.env.VITE_CARTO_TILE_URL as string | undefined)?.trim() || '';

export const MAP_LAYERS: Record<string, MapLayerConfig> = {
  tacticalDark: {
    id: 'tacticalDark',
    name: "Tactical HUD Dark (God's Eye)",
    category: 'base',
    // Uses a CARTO raster URL from .env.local (VITE_CARTO_TILE_URL) when provided,
    // otherwise falls back to the key-free Esri Dark Gray canvas.
    url: CARTO_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: CARTO_TILE_URL ? '&copy; OpenStreetMap contributors &copy; CARTO' : 'Esri, HERE, Garmin, OpenStreetMap contributors',
    maxZoom: CARTO_TILE_URL ? 19 : 16,
    minZoom: 1,
    opacity: 1.0,
    description: 'High-contrast dark tactical base map ideal for overlaying bathymetry gradients.',
    badge: CARTO_TILE_URL ? 'CARTO DARK' : 'ESRI DARK',
  },
  satelliteTrueColor: {
    id: 'satelliteTrueColor',
    name: 'Satellite Multispectral (Sentinel-2 / World Imagery)',
    category: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 18,
    minZoom: 1,
    opacity: 0.85,
    description: 'High-resolution optical imagery showing true shallow seabed features, sandbanks, and reefs.',
    badge: 'OPTICAL S2',
  },
  gebcoGlobal: {
    id: 'gebcoGlobal',
    name: 'GEBCO 2024 Global Seafloor Grid',
    category: 'bathymetry',
    url: 'https://wms.gebco.net/mapserv?',
    attribution: 'GEBCO Compilation Group (2024) - IHO / IOC UNESCO',
    maxZoom: 16,
    minZoom: 1,
    opacity: 0.7,
    isWms: true,
    wmsParams: {
      layers: 'gebco_latest',
      format: 'image/png',
      transparent: 'true',
      version: '1.3.0',
    },
    description: 'Official global bathymetric baseline model for the world ocean.',
    badge: 'GLOBAL 15-ARCSEC',
  },
  emodnetHighRes: {
    id: 'emodnetHighRes',
    name: 'EMODnet Bathymetry High-Res DTM (Europe & North Sea)',
    category: 'bathymetry',
    url: 'https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png',
    attribution: 'EMODnet Bathymetry Consortium / European Commission',
    maxZoom: 16,
    minZoom: 2,
    opacity: 0.75,
    description: 'High-resolution Digital Terrain Model compiled from multi-beam hydrographic surveys.',
    badge: 'HIGH-RES DTM',
  },
  esriOcean: {
    id: 'esriOcean',
    name: 'World Ocean Basemap & Bathymetric Tint',
    category: 'bathymetry',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Garmin, GEBCO, NOAA NGDC, and other contributors',
    maxZoom: 13,
    minZoom: 1,
    opacity: 0.65,
    description: 'Cartographic ocean basemap emphasizing depth contours and continental shelf drop-offs.',
    badge: 'NOAA / GEBCO',
  },
};
