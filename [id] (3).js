import { requireAuth } from '../_lib/auth.js'
import { deleteRow, updateRow } from '../_lib/db.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  const id = req.query.id || req.params.id
  if (!id) {
    res.status(400).json({ error: '缺少 ID' })
    return
  }
  if (req.method === 'PUT') {
    const { name, targetRole, content } = req.body || {}
    const patch = {}
    if (typeof name === 'string') patch.name = name.trim() || '未命名版本'
    if (typeof targetRole === 'string') patch.target_role = targetRole.trim()
    if (typeof content === 'string') patch.content = content
    patch.updated_at = new Date().toISOString()
    const version = await updateRow('resume_versions', id, patch)
    res.json({ version })
    return
  }
  if (req.method === 'DELETE') {
    await deleteRow('resume_versions', id)
    res.json({ ok: true })
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
