import { requireAuth } from './_lib/auth.js'
import { insertRow, listRows } from './_lib/db.js'
import { chatJSON, isDeepSeekConfigured } from './_lib/deepseek.js'
import { knowledgeClassifyPrompt } from './_lib/prompts.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return
  if (req.method === 'GET') {
    const items = await listRows('knowledge_base', 'created_at', 'desc', 500)
    res.json({ items })
    return
  }
  if (req.method === 'POST') {
    const content = ((req.body && req.body.content) || '').trim()
    if (!content) {
      res.status(400).json({ error: '内容不能为空' })
      return
    }
    let category = '当前阶段有用'
    let title = content.slice(0, 20)
    let summary = content.slice(0, 150)
    let reason = '未启用 AI 分类（未配置 DEEPSEEK_API_KEY），默认归入当前阶段有用'
    let usedFallback = false

    if (isDeepSeekConfigured()) {
      const result = await chatJSON({
        messages: [{ role: 'user', content: knowledgeClassifyPrompt(content) }]
      })
      if (result.ok && result.content) {
        const c = result.content
        if (['当前阶段有用', '未来有用', '有误导性'].includes(c.category)) category = c.category
        if (c.title) title = c.title
        if (c.summary) summary = c.summary
        if (c.reason) reason = c.reason
        usedFallback = Boolean(result.usedFallback)
      }
    }

    const item = await insertRow('knowledge_base', {
      category,
      title,
      summary,
      reason,
      original_content: content,
      created_at: new Date().toISOString()
    })
    res.json({ item, usedFallback })
    return
  }
  res.status(405).json({ error: 'Method Not Allowed' })
}
