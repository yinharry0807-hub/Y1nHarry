import { requireAuth } from './_lib/auth.js'
import { getProfileRow } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  const profile = await getProfileRow()
  res.json({ profile })
}
