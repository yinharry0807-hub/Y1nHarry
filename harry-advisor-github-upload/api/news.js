import { requireAuth } from './_lib/auth.js'
import { listRows } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  const digests = await listRows('news_digest', 'created_at', 'desc', 50)
  res.json({ digests })
}
