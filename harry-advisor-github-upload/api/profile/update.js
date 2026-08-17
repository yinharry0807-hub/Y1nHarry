import { requireAuth } from '../_lib/auth.js'
import { getProfileRow, updateRow } from '../_lib/db.js'
import { chatJSON, isDeepSeekConfigured } from '../_lib/deepseek.js'
import { profileUpdatePrompt } from '../_lib/prompts.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  const text = (req.body && req.body.text || '').trim()
  if (!text) {
    res.status(400).json({ error: '近况内容不能为空' })
    return
  }

  const profile = await getProfileRow()
  let summary = text.slice(0, 120)
  let tags = ['近况']
  let usedFallback = false

  if (isDeepSeekConfigured()) {
    const result = await chatJSON({
      messages: [{ role: 'user', content: profileUpdatePrompt(text) }]
    })
    if (result.ok && result.content) {
      if (result.content.summary) summary = result.content.summary
      if (Array.isArray(result.content.tags)) tags = result.content.tags
      usedFallback = Boolean(result.usedFallback)
    }
  }

  const updates = Array.isArray(profile.updates) ? profile.updates : []
  updates.push({
    date: new Date().toISOString().slice(0, 10),
    text,
    summary,
    tags
  })

  const updated = await updateRow('user_profile', 1, {
    updates,
    latest_summary: summary,
    updated_at: new Date().toISOString()
  })

  res.json({ profile: updated, extracted: { summary, tags }, usedFallback })
}
