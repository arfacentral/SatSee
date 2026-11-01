import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[11px] font-bold text-tactical-cyan uppercase tracking-wider mb-1">{title}</h4>
    <div className="text-slate-300 leading-relaxed space-y-1">{children}</div>
  </div>
);

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-mono text-slate-200">
      <div className="w-full max-w-2xl rounded-xl bg-tactical-surface border border-tactical-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-tactical-border bg-tactical-panel/80">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-tactical-cyan" />
            <h3 className="text-sm font-bold tracking-wider">SATSEE HELP & GLOSSARY</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3 rounded bg-cyan-950/40 border border-cyan-700/60 text-cyan-200">
            <strong>Live Sentinel-2 STAC Pipeline Active:</strong> SatSee queries open, zero-cost Sentinel-2 Level-2A (Bottom-of-Atmosphere surface reflectance) imagery in real time via AWS Earth Search and Copernicus. The top-left badge displays the exact satellite pass, acquisition timestamp, and cloud cover percentage.
          </div>

          <Section title="What is SDB?">
            <p>Satellite-Derived Bathymetry estimates shallow seabed depth from how sunlight is absorbed in water, as seen by satellites such as Sentinel-2. It works to roughly 0–30 m in clear water and is a low-cost supplement to, not a replacement for, acoustic surveys.</p>
          </Section>

          <Section title="Finding & targeting a location">
            <p><b>Search box</b>: type a place name or coordinates (e.g. <code>47.56, -52.71</code>) and pick a result. <b>SCAN VIEW</b> targets the centre of whatever the map is currently showing. <b>Survey AOI</b> dropdown jumps to the four benchmark sites (North Sea, Lingyang Reef, Florida Keys, Conception Bay).</p>
          </Section>

          <Section title="Header buttons">
            <p><b>TRANSECT</b>: click two points to draw a survey line and see a seafloor cross-section, with CSV/GeoJSON export.</p>
            <p><b>CALIBRATE</b>: tune the model (m₁ slope, m₀ offset, tide, datum). <b>Auto-Fit</b> uses ICESat-2 laser tracks as reference depths.</p>
            <p><b>Layers</b>: switch basemaps and toggle the depth surface, ICESat-2 tracks and contours.</p>
            <p><b>LIVE / OFFLINE badge</b>: shows connectivity; calculations still work offline.</p>
          </Section>

          <Section title="Readouts">
            <p><b>Depth (±)</b>: estimated depth and expected error. Error grows with depth.</p>
            <p><b>UTM</b>: projected grid coordinates used on survey charts.</p>
            <p><b>Optical water type (Jerlov)</b>: water clarity class. Murkier water means shallower usable depth.</p>
            <p><b>Sun glint</b>: sun reflection off the surface that can corrupt satellite depth estimates.</p>
            <p><b>Sound speed</b>: estimated speed of sound in seawater (Mackenzie equation), useful for comparing with echo-sounder data.</p>
          </Section>

          <Section title="Depth colours, draft & datum">
            <p><b>Palette</b>: colour scale for depth. <b>Vessel draft</b>: cells at or shallower than your draft are flagged red as shoal hazards. <b>Datum</b>: the vertical reference (MSL mean sea level, LAT lowest astronomical tide, CD chart datum). <b>Tide adj</b>: instantaneous tide correction.</p>
          </Section>

          <Section title="Layers explained">
            <p><b>GEBCO</b>: global ~450 m grid, coarse. <b>EMODnet</b>: high-resolution European survey-based terrain model (Europe/North Sea only). <b>ESRI Ocean</b>: cartographic ocean basemap. <b>ICESat-2</b>: NASA satellite laser depth tracks (green dots) used for calibration. <b>Isobaths</b>: lines of equal depth.</p>
          </Section>

          <Section title="Depth colour palette (bottom-right panel)">
            <p>The palette maps depth to colour on the SDB depth surface. The bar runs from <b>0 m (left, shoal)</b> to <b>30 m+ (right, deep)</b>; the red tick marks your vessel draft.</p>
            <p><b>Hydrographic Nautical</b>: red/amber for dangerously shallow, yellow then cyan for moderate, deep blue for deep. Best for hazard spotting (default).</p>
            <p><b>Turbo</b>: rainbow with high contrast, good for spotting small depth changes. <b>Viridis</b> and <b>Batlow</b>: perceptually uniform scientific palettes that don't mislead and are colour-blind friendly; use these for reports. <b>FLIR Thermal</b>: white-hot shallows fading to black, a stylistic tactical look.</p>
          </Section>

          <Section title="What does Jerlov mean?">
            <p>Jerlov water types are a standard scale of how clear the ocean is, i.e. how deep light penetrates. SatSee shows a simplified version in the readout panel because clarity decides how deep SDB can see:</p>
            <p><b>Jerlov I (ultra-clear)</b>: open tropical ocean, usable to about 30 m. <b>Jerlov II (clear coastal)</b>: usable to about 15–18 m. <b>Jerlov III (turbid coastal)</b>: sediment- or plankton-rich, usable to about 6–8 m. <b>Land/Masked</b>: not water, or too murky or glinty to estimate.</p>
            <p>If you see Jerlov III, treat any depth deeper than a few metres as unreliable.</p>
          </Section>

          <Section title="Marine intelligence layers (Layers menu)">
            <p><b>Eye button</b> (under the zoom buttons): hides or shows all SDB analytical overlays (depth surface, ICESat-2 tracks, contours) so you can see the plain map.</p>
            <p><b>Submarine cables</b>: global telecom cable routes (TeleGeography, non-commercial licence). <b>Live vessels</b>: real and simulated AIS positions (green arrows are underway, grey are anchored/moored). <b>Earthquakes</b>: USGS, past 7 days; red rings carry a tsunami flag.</p>
          </Section>

          <Section title="Limits & Navigational Disclaimer">
            <p>Turbid water, clouds, waves, glint and dark seabed (seagrass) reduce accuracy. Always calibrate against local ground truth where you can.</p>
            <p><b>Not for Navigation</b>: SatSee is an open-source scientific, educational, and reconnaissance tool. Satellite-derived depths do not replace official hydrographic charts (ENC/RNC) or active echosounder surveys and must never be used for primary marine navigation.</p>
          </Section>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-tactical-border bg-tactical-panel/80">
          <button onClick={onClose} className="px-4 py-1.5 rounded bg-tactical-cyan text-slate-950 font-bold hover:bg-cyan-400 text-xs">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
