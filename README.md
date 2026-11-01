# SatSee: Global Satellite-Derived Bathymetry (SDB) Platform

[![Live App](https://img.shields.io/badge/Live_App-Launch_SatSee-00e5ff?style=for-the-badge&logo=googlemaps&logoColor=black)](https://arfacentral.github.io/SatSee/)

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Sentinel-2](https://img.shields.io/badge/Sentinel--2-L2A_BOA-00e5ff.svg)](https://dataspace.copernicus.eu/)
[![ICESat-2](https://img.shields.io/badge/ICESat--2-ATL24_LiDAR-00ffaa.svg)](https://icesat-2.gsfc.nasa.gov/)

> 🌊 **Live Web Platform:** **[https://arfacentral.github.io/SatSee/](https://arfacentral.github.io/SatSee/)**  
> *(Custom domain alias: `https://satsee.arfaali.cc`)*

**SatSee** is an open-access, browser-native spatial intelligence and Satellite-Derived Bathymetry (SDB) platform. It allows coastal researchers, hydrographic survey crews, marine navigators, and the public to inspect shallow underwater bathymetry (0–30 meters) anywhere on Earth.

Inspired by the tactical, cinematic visual command deck of [God's Eye View (`bilawalsidhu/gods-eye-view`)](https://github.com/bilawalsidhu/gods-eye-view), SatSee operationalizes the empirical and machine-learning findings of the 2026 Nature Scientific Reports benchmark study (*"Comparative study of different methods for bathymetric mapping based on multi-source remote sensing data"*).

---

## Key Capabilities

### 🛰️ Live Sentinel-2 L2A STAC Pipeline
- Connects directly to the **AWS Earth Search & Copernicus STAC API** with zero API keys required ($0 default budget).
- Automatically retrieves the freshest cloud-free Level-2A Bottom-Of-Atmosphere (BOA) multispectral scenes.
- Tracks:
  - **Band 2 (Blue, 490 nm)**: Maximum underwater penetration (0–30m).
  - **Band 3 (Green, 560 nm)**: Moderate penetration (0–15m).
  - **Band 4 (Red, 665 nm)**: Turbidity and intertidal detection.
  - **Band 8 (NIR, 842 nm)**: Land/water NDWI segmentation mask.
- Includes a live scene inspector showing exact satellite pass (`Sentinel-2B / 2C`), cloud cover %, acquisition timestamp, and thumbnail preview.

### 📐 Scientific Inversion Engine
- **Stumpf Log-Ratio Model**:
  $$Z = m_1 \frac{\ln(1000 \cdot R_w(\text{Blue}))}{\ln(1000 \cdot R_w(\text{Green}))} - m_0 - \text{Tide}$$
- **Lyzenga Multi-Band Model**: Multi-band log-linear regression with deep-water dark-pixel radiance subtraction ($R_\infty$).
- **Spaceborne LiDAR Calibration**: Active-passive fusion using NASA **ICESat-2 ATL24** green laser photon tracks to solve $m_1$ and $m_0$ coefficients without requiring a physical survey vessel on site.
- **Jerlov Optical Water Classification**: Evaluates optical clarity (Jerlov I Ultra-Clear down to 30m; Jerlov III Turbid Coastal down to 8m).
- **Mackenzie Sound Speed Estimation**: Real-time sound velocity profile ($\sim 1480\text{--}1530\text{ m/s}$) for hydrographic acoustic cross-validation.

### 🚢 Tactical Hydrographic Survey Tools
- **2D Seafloor Transect Profiler**: Click any two points across a reef or channel to generate an interactive SVG seafloor cross-section showing seabed elevation vs. track distance.
- **Shoal Hazard Limiter**: Configurable vessel draft slider (1.0m to 8.0m) that flags shallow navigational hazards with crimson visual warnings.
- **Data Export Suite**: Instant export to **CSV Soundings** (`Latitude, Longitude, Depth, Uncertainty, Source`) and **GeoJSON LineStrings** for QGIS, ArcGIS, and chartplotters.

### 🌐 Marine Intelligence Layers
- **Global Live AIS Vessel Tracking**: Real-time WebSocket relay tracking thousands of ships globally with MMSI, speed (knots), course, and vessel name.
- **Submarine Telecom Cables**: Complete global undersea cable network routes (TeleGeography).
- **USGS Global Earthquakes**: Real-time seismic activity with tsunami flag indicators.
- **Multi-Source Basemaps**: Seamless switching between GEBCO 2024 Global Grid, EMODnet High-Res DTM (North Sea / Europe), NOAA BlueTopo, Esri Ocean, and CARTO Tactical Dark.

---

## Benchmark Environments Seeded

1. **North Sea (Dogger Bank / Southern Bight)**: Offshore wind energy corridor with dynamic migrating sand ridges (15–32m) benchmarked against EMODnet soundings.
2. **Lingyang Reef (Xisha Islands, South China Sea)**: The 2026 Nature study benchmark atoll ($R^2 > 0.84$) with 3,362 shipborne MBES survey verification points.
3. **Florida Keys (Key West & Sand Key)**: Ultra-clear carbonate shelf with coral spur-and-groove formations and NOAA BlueTopo coverage.
4. **Conception Bay & Bell Island, Newfoundland**: North Atlantic cold-water coastal shelf with steep bathymetric gradient and historic WWII shipwreck sites.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended)
- `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arfacentral/satsee.git
   cd satsee
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure API keys:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   - `AISSTREAM_API_KEY`: Free key from [aisstream.io](https://aisstream.io) for global live vessel tracking.
   - `VITE_CARTO_TILE_URL`: Optional custom raster URL from CARTO. (Defaults to free Esri Dark Gray if omitted).

4. **Launch the application:**
   - **Start the web app:**
     ```bash
     npm run dev
     ```
     Open `http://localhost:5173` in your browser.

   - **(Optional) Start the global AIS vessel & STAC relay:**
     In a separate terminal:
     ```bash
     npm run relay
     ```

---

## Project Structure

```text
satsee/
├── public/                  # Favicon, PWA manifest, submarine cable GeoJSON
├── server/
│   └── ais-relay.mjs        # Global AIS WebSocket relay & STAC proxy
├── src/
│   ├── components/
│   │   ├── HUD/             # Tactical telemetry, header, color ramps, S2 badge
│   │   ├── MapViewport/     # Leaflet map, SDB depth mesh, contours, marine layers
│   │   └── Tools/           # Transect profiler, calibration tuner, layers & help modals
│   ├── core/
│   │   ├── geospatial/      # STAC client, benchmarks, UTM converter, marine feeds
│   │   └── sdb/             # Stumpf log-ratio, Lyzenga, turbidity & tidal algorithms
│   ├── types/               # TypeScript interfaces for bathymetry & telemetry
│   ├── App.tsx              # Main application shell
│   └── main.tsx             # React entry point
└── package.json
```

---

## Testing

Run the automated Vitest test suite:
```bash
npm test
```

Run TypeScript strict verification:
```bash
npx tsc --noEmit
```

Build production bundle:
```bash
npm run build
```

---

## Scientific References

- **Lu, T., Wang, L., Ji, C., et al. (2026)**. *Comparative study of different methods for bathymetric mapping based on multi-source remote sensing data*. Scientific Reports, 16:32108. (CC BY 4.0)
- **Stumpf, R. P., Holderied, K., & Sinclair, M. (2003)**. *Determination of water depth with high-resolution satellite imagery over variable bottom types*. Limnology and Oceanography, 48(1), 547-556.
- **Lyzenga, D. R. (1978)**. *Passive remote sensing techniques for mapping water depth and bottom features*. Applied Optics, 17(3), 379-383.
- **Markus, T., et al. (2017)**. *The Ice, Cloud, and land Elevation Satellite-2 (ICESat-2): Science requirements, concept, and implementation*. Remote Sensing of Environment, 190, 260-273.

---

## Open Data Attributions & Disclaimer

- **Satellite Imagery**: Contains modified Copernicus Sentinel-2 data (European Space Agency / Copernicus Open Access Hub), accessed via Element 84 / AWS Earth Search STAC.
- **Spaceborne LiDAR**: NASA ICESat-2 (ATLAS / ATL24) public domain datasets.
- **Bathymetric Basemaps**: GEBCO Compilation Group (CC BY 4.0), EMODnet Bathymetry Consortium, and NOAA Office of Coast Survey (Public Domain).
- **Marine Layers**: Submarine cable routes courtesy of TeleGeography Submarine Cable Map (CC BY-NC-SA 4.0, non-commercial use); Baltic AIS data via Fintraffic Digitraffic (CC BY 4.0); seismic feeds via USGS (Public Domain).
- **Navigational Disclaimer**: SatSee is strictly an educational, scientific, and preliminary reconnaissance visualization platform. Satellite-Derived Bathymetry (SDB) is subject to optical water clarity, atmospheric, and seabed reflectance uncertainties and **must never be used for primary marine navigation**. Always rely on official Hydrographic Office Electronic Navigational Charts (ENCs) and active onboard echosounders.

---

## Author & License

Created by **[Arfa Ali Khan](https://arfaali.cc)** ([@arfacentral](https://github.com/arfacentral)).  
Released under the [MIT License](./LICENSE).
