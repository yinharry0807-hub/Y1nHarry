import { requireAuth } from './_lib/auth.js'
import { insertRow, updateRow, getMessages, getProfileRow, listRows } from './_lib/db.js'
import { chatStream } from './_lib/deepseek.js'
import { buildSystemPrompt, recentHistory } from './_lib/context.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return

  const { conversationId, message, model } = req.body || {}
  const content = (message || '').trim()
  if (!content) {
    res.status(400).json({ error: '消息不能为空' })
    return
  }

  let convId = conversationId || null
  try {
    if (!convId) {
      const conv = await insertRow('conversations', {
        title: content.slice(0, 24),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      convId = conv.id
    }

    await insertRow('messages', {
      conversation_id: convId,
      role: 'user',
      content,
      model: null,
      created_at: new Date().toISOString()
    })
    await updateRow('conversations', convId, { updated_at: new Date().toISOString() })

    const [profile, allKnowledge, history] = await Promise.all([
      getProfileRow(),
      listRows('knowledge_base', 'created_at', 'desc', 500),
      getMessages(convId, 500)
    ])
    const knowledge = allKnowledge
      .filter((k) => k.category === '当前阶段有用')
      .slice(0, 10)

    const messages = [
      { role: 'system', content: buildSystemPrompt(profile, knowledge) },
      ...recentHistory(history)
    ]

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    })
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)
    send({ type: 'meta', conversationId: convId })

    let acc = ''
    const result = await chatStream({
      model,
      messages,
      onDelta: (delta) => send({ type: 'delta', content: delta })
    })

    if (result.ok) {
      acc = result.content || ''
      if (result.usedFallback) {
        acc = `（注：所选模型 ${model || ''} 当前不可用，已自动切换为 ${result.fallbackModel}）\n\n${acc}`
      }
      await insertRow('messages', {
        conversation_id: convId,
        role: 'assistant',
        content: acc,
        model: result.model || model || null,
        created_at: new Date().toISOString()
      })
      send({ type: 'done', content: acc, usedFallback: Boolean(result.usedFallback) })
    } else {
      const msg = (result.data && result.data.error && result.data.error.message) || 'AI 服务调用失败'
      send({ type: 'error', message: msg, status: result.status })
    }
  } catch (e) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`)
    } else {
      res.status(500).json({ error: e.message })
    }
  }
  if (!res.writableEnded) res.end()
}
