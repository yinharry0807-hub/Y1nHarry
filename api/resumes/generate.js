import { requireAuth } from '../_lib/auth.js'
import { getProfileRow } from '../_lib/db.js'
import { chatJSON, isDeepSeekConfigured } from '../_lib/deepseek.js'
import { resumeGeneratePrompt } from '../_lib/prompts.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  if (!isDeepSeekConfigured()) {
    res.status(500).json({ error: '未配置 DEEPSEEK_API_KEY，无法生成简历' })
    return
  }
  const { targetRole, raw } = req.body || {}
  const profile = await getProfileRow()
  const result = await chatJSON({
    messages: [
      {
        role: 'user',
        content: resumeGeneratePrompt(targetRole || 'supply', (raw || '').trim(), profile.base_text)
      }
    ]
  })
  if (!result.ok) {
    const msg = (result.data && result.data.error && result.data.error.message) || '生成失败'
    res.status(500).json({ error: msg })
    return
  }
  if (!result.content) {
    res.status(500).json({ error: 'AI 返回格式无法解析，请重试' })
    return
  }
  res.json({ draft: result.content, markdown: draftToMarkdown(result.content), usedFallback: Boolean(result.usedFallback) })
}

function draftToMarkdown(d) {
  const lines = []
  lines.push('# 个人总结')
  lines.push(d.summary || '')
  lines.push('')
  lines.push('# 工作经历')
  const exps = Array.isArray(d.experience) ? d.experience : []
  if (!exps.length) lines.push('（暂无）')
  for (const exp of exps) {
    const head = [exp.company, exp.position].filter(Boolean).join(' · ')
    if (head) lines.push(`## ${head}`)
    if (exp.period) lines.push(`（${exp.period}）`)
    for (const b of exp.bullets || []) lines.push(`- ${b}`)
    lines.push('')
  }
  lines.push('# 技能')
  lines.push((d.skills || []).join('、'))
  lines.push('')
  lines.push('# 关键词')
  lines.push((d.keywords || []).join('、'))
  return lines.join('\n').trim()
}
