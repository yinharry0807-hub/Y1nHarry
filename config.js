import { requireAuth } from './_lib/auth.js'
import { getModels, getDefaultModel, isDeepSeekConfigured } from './_lib/deepseek.js'
import { storageMode, isSupabase } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!requireAuth(req, res)) return
  res.json({
    models: getModels(),
    defaultModel: getDefaultModel(),
    deepseekConfigured: isDeepSeekConfigured(),
    storageMode,
    supabaseConfigured: isSupabase
  })
}
