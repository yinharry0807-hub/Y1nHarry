import { requireAuth } from './_lib/auth.js'
import { listRows } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  const conversations = await listRows('conversations', 'updated_at', 'desc', 200)
  res.json({ conversations })
}
