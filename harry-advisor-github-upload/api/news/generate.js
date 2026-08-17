import { requireAuth } from '../_lib/auth.js'
import { insertRow } from '../_lib/db.js'
import { chatJSON, isDeepSeekConfigured } from '../_lib/deepseek.js'
import { newsGeneratePrompt } from '../_lib/prompts.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  if (!isDeepSeekConfigured()) {
    res.status(500).json({ error: '未配置 DEEPSEEK_API_KEY，无法生成资讯' })
    return
  }
  const mode = (req.body && req.body.mode) === 'daily' ? 'daily' : 'weekly'

  let items = []
  let usedFallback = false
  let lastError = ''
  for (let attempt = 0; attempt < 2 && !items.length; attempt += 1) {
    const result = await chatJSON({
      messages: [
        {
          role: 'user',
          content:
            newsGeneratePrompt(mode) +
            (attempt === 0
              ? ''
              : '\n\n注意：上一次生成被截断。这次请直接输出完整 JSON，不要省略任何条目，不要在任何 item 中间截断。')
        }
      ]
    })
    if (!result.ok) {
      lastError = (result.data && result.data.error && result.data.error.message) || '生成失败'
      break
    }
    usedFallback = usedFallback || Boolean(result.usedFallback)
    items = Array.isArray(result.content && result.content.items) ? result.content.items : []
    if (!items.length) lastError = 'AI 返回格式无法解析，请重试'
  }
  if (!items.length) {
    res.status(500).json({ error: lastError || '生成失败' })
    return
  }
  const digest = await insertRow('news_digest', {
    mode,
    items,
    created_at: new Date().toISOString()
  })
  res.json({ digest, usedFallback })
}
