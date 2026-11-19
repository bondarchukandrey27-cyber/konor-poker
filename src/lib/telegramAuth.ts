import { createHmac, timingSafeEqual } from 'node:crypto'

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

export function verifyTelegramData(initData: string): TelegramUser | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    throw new Error('Telegram bot token is missing')
  }

  const params = new URLSearchParams(initData)
  const receivedHash = params.get('hash')

  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) {
    return null
  }

  const authDate = Number(params.get('auth_date'))

  if (!Number.isFinite(authDate)) return null

  const now = Math.floor(Date.now() / 1000)

  if (authDate > now + 60 || now - authDate > 86400) {
    return null
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest()

  const expectedHash = Buffer.from(receivedHash, 'hex')

  if (
    expectedHash.length !== calculatedHash.length ||
    !timingSafeEqual(expectedHash, calculatedHash)
  ) {
    return null
  }

  const userData = params.get('user')

  if (!userData) return null

  try {
    const user = JSON.parse(userData) as TelegramUser

    if (!Number.isSafeInteger(user.id) || user.id <= 0) {
      return null
    }

    return user
  } catch {
    return null
  }
}