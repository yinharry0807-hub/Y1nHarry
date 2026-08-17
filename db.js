import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { BASE_PROFILE_TEXT } from './seed.js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const useSupabase = Boolean(supabaseUrl && supabaseKey)

let supabase = null
if (useSupabase) {
  supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

const DATA_DIR = path.join(process.cwd(), '.data')

function jstore(table) {
  const file = path.join(DATA_DIR, `${table}.json`)
  const read = () => {
    if (!fs.existsSync(file)) return []
    try {
      const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
      return Array.isArray(rows) ? rows : []
    } catch {
      return []
    }
  }
  const write = (rows) => {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(rows, null, 2))
  }
  return { read, write }
}

function nextSeq(rows) {
  return rows.reduce((m, r) => Math.max(m, Number(r.seq) || 0), 0) + 1
}

function nowIso() {
  return new Date().toISOString()
}

export const isSupabase = useSupabase
export const storageMode = useSupabase ? 'supabase' : 'local'

export async function listRows(table, orderBy = 'created_at', orderDir = 'desc', limit = 500) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending: orderDir === 'asc' })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data || []
  }
  const store = jstore(table)
  const rows = store.read().sort((a, b) => {
    const av = a[orderBy]
    const bv = b[orderBy]
    if (av === bv) return 0
    if (orderDir === 'asc') return av > bv ? 1 : -1
    return av < bv ? 1 : -1
  })
  return rows.slice(0, limit)
}

export async function getRow(table, id) {
  if (useSupabase) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }
  return jstore(table).read().find((r) => String(r.id) === String(id)) || null
}

export async function insertRow(table, row) {
  const data = { ...row, created_at: row.created_at || nowIso() }
  if (useSupabase) {
    const { data: inserted, error } = await supabase.from(table).insert(data).select().single()
    if (error) throw new Error(error.message)
    return inserted
  }
  const store = jstore(table)
  const rows = store.read()
  const id = data.id || crypto.randomUUID()
  const item = { ...data, id }
  if (table === 'messages') item.seq = nextSeq(rows)
  rows.push(item)
  store.write(rows)
  return item
}

export async function updateRow(table, id, patch) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from(table)
      .update({ ...patch, updated_at: patch.updated_at || nowIso() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const store = jstore(table)
  const rows = store.read()
  const idx = rows.findIndex((r) => String(r.id) === String(id))
  if (idx === -1) return null
  rows[idx] = { ...rows[idx], ...patch, updated_at: patch.updated_at || nowIso() }
  store.write(rows)
  return rows[idx]
}

export async function deleteRow(table, id) {
  if (useSupabase) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
  }
  const store = jstore(table)
  const rows = store.read()
  store.write(rows.filter((r) => String(r.id) !== String(id)))
  return true
}

export async function getMessages(conversationId, limit = 500) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data || []
  }
  return jstore('messages')
    .read()
    .filter((r) => String(r.conversation_id) === String(conversationId))
    .sort((a, b) => (Number(a.seq) || 0) - (Number(b.seq) || 0))
    .slice(-limit)
}

export async function deleteConversation(id) {
  if (useSupabase) {
    const { error } = await supabase.from('conversations').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
  }
  const convs = jstore('conversations')
  const msgs = jstore('messages')
  convs.write(convs.read().filter((r) => String(r.id) !== String(id)))
  msgs.write(msgs.read().filter((r) => String(r.conversation_id) !== String(id)))
  return true
}

export async function getProfileRow() {
  let profile = await getRow('user_profile', 1)
  if (!profile) {
    profile = await insertRow('user_profile', {
      id: 1,
      base_text: BASE_PROFILE_TEXT,
      updates: [],
      latest_summary: '',
      updated_at: nowIso()
    })
  }
  return profile
}
