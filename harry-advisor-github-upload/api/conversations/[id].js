import { requireAuth } from '../_lib/auth.js'
import { getMessages, deleteConversation } from '../_lib/db.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  const id = req.query.id || req.params.id
  if (!id) {
    res.status(400).json({ error: '缺少对话 ID' })
    return
  }
  try {
    if (req.method === 'GET') {
      const messages = await getMessages(id)
      res.json({ messages })
    } else if (req.method === 'DELETE') {
      await deleteConversation(id)
      res.json({ ok: true })
    } else {
      res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
