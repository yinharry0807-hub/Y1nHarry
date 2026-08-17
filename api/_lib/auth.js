import crypto from 'node:crypto'

const APP_PASSWORD = process.env.APP_PASSWORD || ''
const secret =
  process.env.JWT_SECRET ||
  crypto.createHash('sha256').update('harry-advisor:' + APP_PASSWORD).digest('hex')

function b64url(buf) {
  return Buffer.from(buf).toString('base64url')
}

export function signToken() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + 30 * 24 * 3600 * 1000 }))
  const sig = b64url(crypto.createHmac('sha256', secret).update(payload).digest())
  return `${payload}.${sig}`
}

export function verifyToken(token) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expect = b64url(crypto.createHmac('sha256', secret).update(payload).digest())
  if (sig !== expect) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof data.exp === 'number' && Date.now() < data.exp
  } catch {
    return false
  }
}

// 返回 true 表示通过；失败时已写入 401/500 响应
export function requireAuth(req, res) {
  if (!APP_PASSWORD) {
    res.status(500).json({ error: '服务端未设置 APP_PASSWORD，请先在环境变量中配置' })
    return false
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!verifyToken(token)) {
    res.status(401).json({ error: '未登录或登录已过期，请重新登录' })
    return false
  }
  return true
}
