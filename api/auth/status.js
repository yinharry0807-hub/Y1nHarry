import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  res.json({ ok: true })
}
