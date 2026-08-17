import { signToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  const password = (req.body && req.body.password) || ''
  if (!process.env.APP_PASSWORD) {
    res.status(500).json({ error: '服务端未配置 APP_PASSWORD，请先设置环境变量' })
    return
  }
  if (password === process.env.APP_PASSWORD) {
    res.json({ token: signToken(), message: 'ok' })
    return
  }
  res.status(401).json({ error: '密码错误' })
}
