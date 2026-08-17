import { requireAuth } from '../_lib/auth.js'
import { deleteRow } from '../_lib/db.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  await deleteRow('news_digest', req.query.id || req.params.id)
  res.json({ ok: true })
}
