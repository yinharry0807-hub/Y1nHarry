import { requireAuth } from './_lib/auth.js'
import { insertRow, listRows } from './_lib/db.js'

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  if (req.method === 'GET') {
    const versions = await listRows('resume_versions', 'updated_at', 'desc', 100)
    res.json({ versions })
    return
  }
  if (req.method === 'POST') {
    const { name, targetRole, content } = req.body || {}
    if (!content || !content.trim()) {
      res.status(400).json({ error: '简历内容不能为空' })
      return
    }
    const version = await insertRow('resume_versions', {
      name: (name || '').trim() || '未命名版本',
      target_role: (targetRole || '').trim(),
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    res.json({ version })
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
