/*
 * api/load.js
 * ──────────────────────────────────────────────────
 * Loads the SteedOS state from Upstash Redis.
 * Called once when the app first opens.
 *
 * Method: GET
 * Query:  ?userId=nik
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // Upstash Redis REST API — GET key
    const response = await fetch(
      `${process.env.STORAGE_URL}/get/steedos:${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STORAGE_TOKEN}`,
        },
      }
    );

    if (!response.ok) throw new Error(`Redis error: ${response.status}`);

    const json = await response.json();

    // Upstash returns { result: "..." } — result is the stored value
    // If result is null, no data exists yet — app will use defaults
    if (!json.result) {
      return res.status(200).json({ data: null });
    }

    // The data was stored as a JSON string — parse it back
    const data = typeof json.result === 'string'
      ? JSON.parse(json.result)
      : json.result;

    return res.status(200).json({ data });

  } catch (err) {
    console.error('Load failed:', err);
    return res.status(500).json({ error: 'Load failed' });
  }
}
