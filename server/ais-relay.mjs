// SatSee global AIS relay (AISStream.io -> simple bbox HTTP API).
// Keeps your API key server-side (browsers cannot connect to AISStream directly).
// Run:  npm run relay      (needs AISSTREAM_API_KEY in .env.local)
import http from 'node:http';

const KEY = process.env.AISSTREAM_API_KEY;
const PORT = Number(process.env.RELAY_PORT || 8799);
const TTL_MS = 10 * 60 * 1000;
const vessels = new Map(); // mmsi -> {mmsi,name,lat,lon,sog,cog,heading,t}
let connected = false;

function connect() {
  if (!KEY) return;
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
  ws.onopen = () => {
    connected = true;
    ws.send(
      JSON.stringify({
        APIKey: KEY,
        BoundingBoxes: [[[90, -180], [-90, 180]]],
        FilterMessageTypes: ['PositionReport'],
      })
    );
    console.log('[relay] connected and subscribed to AISStream');
  };
  ws.onmessage = async (ev) => {
    try {
      let text;
      if (typeof ev.data === 'string') {
        text = ev.data;
      } else if (ev.data && typeof ev.data.text === 'function') {
        text = await ev.data.text();
      } else {
        text = String(ev.data);
      }
      const m = JSON.parse(text);
      if (m.MessageType !== 'PositionReport') return;
      const p = m.Message?.PositionReport;
      const md = m.MetaData;
      if (!md || !p) return;
      vessels.set(md.MMSI, {
        mmsi: md.MMSI,
        name: (md.ShipName || '').trim(),
        lat: md.latitude,
        lon: md.longitude,
        sog: p.Sog ?? 0,
        cog: p.Cog ?? 0,
        heading: p.TrueHeading ?? 511,
        t: Date.now(),
      });
      if (vessels.size % 100 === 0) {
        console.log(`[relay] tracking ${vessels.size} vessels globally`);
      }
    } catch {
      /* ignore invalid packets */
    }
  };
  const retry = () => {
    connected = false;
    console.log('[relay] disconnected, retrying in 10s');
    setTimeout(connect, 10000);
  };
  ws.onclose = retry;
  ws.onerror = () => {};
}

setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of vessels) if (v.t < cutoff) vessels.delete(k);
}, 60000);

const server = http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    res.setHeader('Content-Type', 'application/json');
    if (u.pathname === '/api/health') {
      res.end(JSON.stringify({ configured: !!KEY, connected, vessels: vessels.size }));
      return;
    }
    if (u.pathname === '/api/sentinel/search' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const stacRes = await fetch('https://earth-search.aws.element84.com/v1/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body || '{}',
          });
          const json = await stacRes.json();
          res.end(JSON.stringify(json));
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: 'Failed to query STAC', details: err.message }));
        }
      });
      return;
    }

    if (u.pathname === '/api/vessels') {
      if (!KEY) {
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'AISSTREAM_API_KEY not set' }));
        return;
      }
      const q = (n) => Number(u.searchParams.get(n));
      const [minLat, minLon, maxLat, maxLon] = ['minLat', 'minLon', 'maxLat', 'maxLon'].map(q);
      const out = [];
      for (const v of vessels.values()) {
        if (v.lat >= minLat && v.lat <= maxLat && v.lon >= minLon && v.lon <= maxLon) {
          out.push(v);
          if (out.length >= 1500) break;
        }
      }
      res.end(JSON.stringify(out));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[relay] Port ${PORT} is already in use. You can change it by adding RELAY_PORT=8800 in .env.local`);
  } else {
    console.error('[relay] Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => console.log(`[relay] listening on http://127.0.0.1:${PORT}`));

if (!KEY) console.log('[relay] AISSTREAM_API_KEY missing: relay is up but has no data.');
connect();
