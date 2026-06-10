export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = await new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'text/plain' },
  })

  const data = await response.json()
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(data)
}
