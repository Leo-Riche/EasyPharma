export const config = {
  api: { bodyParser: false },
}

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await readBody(req)
  let lastError = null

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'text/plain' },
        signal: AbortSignal.timeout(12000),
      })

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${endpoint}`
        continue
      }

      const text = await response.text()
      // Vérifie que c'est bien du JSON avant de renvoyer
      JSON.parse(text)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).send(text)
    } catch (err) {
      lastError = err.message
    }
  }

  res.status(502).json({ error: `All Overpass endpoints failed: ${lastError}` })
}
