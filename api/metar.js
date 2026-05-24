// Vercel serverless function — proxies METAR requests to aviationweather.gov
// from the server side, eliminating browser CORS restrictions.
//
// File location: /api/metar.js (at the repo root, NOT inside /src)
// Vercel automatically deploys any .js file in /api/ as a serverless function
// at the matching URL — so this file is reachable at https://your-app.vercel.app/api/metar
//
// Usage from the client:
//   fetch("/api/metar?id=KADS")
//     .then(r => r.json())
//     .then(data => /* data is an array of METAR observations */)
//
// Query params:
//   id — ICAO airport code (e.g. KADS, KFTW)
//
// Returns: the raw JSON response from aviationweather.gov, with permissive
// CORS headers so even the unlikely cross-origin case works.

export default async function handler(req, res) {
  // Set CORS headers — same-origin won't need these but it's harmless
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Cache for 5 minutes — METAR updates hourly so this is fine
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Parse the airport code from the query string
  const id = (req.query.id || "").toString().trim().toUpperCase();
  if (!id) {
    res.status(400).json({ error: "Missing 'id' query parameter" });
    return;
  }
  // Light validation — ICAO codes are letters and digits, 3-5 chars
  if (!/^[A-Z0-9]{3,5}$/.test(id)) {
    res.status(400).json({ error: "Invalid airport code format" });
    return;
  }

  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(id)}&format=json`;
    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "ThrustCFI/1.0",
      },
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: `Upstream returned HTTP ${upstream.status}`,
      });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({
      error: "Failed to reach aviationweather.gov",
      detail: err.message || String(err),
    });
  }
}
