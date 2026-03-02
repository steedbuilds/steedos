/*
 * api/save.js
 * ──────────────────────────────────────────────────
 * Saves the full SteedOS state to Upstash Redis.
 * Called every time the user does something in the app.
 *
 * Method: POST
 * Body:   { userId: "nik", data: { ...full app state } }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { userId, data } = req.body;
  if (!userId || !data) {
    return res.status(400).json({ error: 'Missing userId or data' });
  }

  try {
    // Upstash Redis REST API — SET key value
    const response = await fetch(
      `${process.env.STORAGE_URL}/set/steedos:${userId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STORAGE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) throw new Error(`Redis error: ${response.status}`);

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Save failed:', err);
    return res.status(500).json({ error: 'Save failed' });
  }
}
