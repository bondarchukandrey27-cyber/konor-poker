import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

function verifyTelegramData(initData: string) {
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
    return JSON.parse(userData)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const initData = body?.initData

    if (typeof initData !== 'string' || !initData) {
      return NextResponse.json(
        { error: 'Telegram data is missing' },
        { status: 400 }
      )
    }

    const user = verifyTelegramData(initData)

    if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
      return NextResponse.json(
        { error: 'Invalid Telegram authentication' },
        { status: 401 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const displayName = [
      user.first_name,
      user.last_name,
    ].filter(Boolean).join(' ')

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        telegram_id: user.id,
        username: user.username ?? null,
        display_name: displayName || null,
        avatar_url: user.photo_url ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'telegram_id',
      })

    if (error) {
      console.error('Profile save failed:', error.message)

      return NextResponse.json(
        { error: 'Could not save profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: {
        telegramId: user.id,
        displayName,
        username: user.username ?? null,
      },
    })
  } catch (error) {
    console.error('Telegram authentication error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}