export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: req.body,
    headers: { 'Content-Type': 'text/plain' },
  })

  const data = await response.json()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(data)
}
