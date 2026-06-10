export const config = {
  api: { bodyParser: { type: 'text/plain' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
      headers: { 'Content-Type': 'text/plain' },
    })

    if (!response.ok) {
      return res.status(502).json({ error: `Overpass error: ${response.status}` })
    }

    const text = await response.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
