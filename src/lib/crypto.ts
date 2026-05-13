import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const KEY_FILE = path.join(process.cwd(), 'data', '.stellaire.key')
const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const dir = path.dirname(KEY_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  if (fs.existsSync(KEY_FILE)) {
    return Buffer.from(fs.readFileSync(KEY_FILE, 'utf-8').trim(), 'hex')
  }

  const key = crypto.randomBytes(32)
  fs.writeFileSync(KEY_FILE, key.toString('hex'), { mode: 0o600 })
  return key
}

let cachedKey: Buffer | null = null
function key(): Buffer {
  if (!cachedKey) cachedKey = getKey()
  return cachedKey
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8')
}
