const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export default async function handler(req, res) {
  const query = req.method === 'POST' ? req.body : req.query.data

  if (!query) {
    return res.status(400).json({ error: 'Missing query' })
  }

  let lastError = null

  for (const endpoint of ENDPOINTS) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(14000),
      })

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${endpoint}`
        continue
      }

      const text = await response.text()
      JSON.parse(text) // valide que c'est du JSON
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).send(text)
    } catch (err) {
      lastError = err.message
    }
  }

  res.status(502).json({ error: lastError })
}
