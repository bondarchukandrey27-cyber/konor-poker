import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { verifyTelegramData } from '@/lib/telegramAuth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const initData = body?.initData
    const hand = body?.hand

    if (typeof initData !== 'string' || !initData) {
      return NextResponse.json(
        { error: 'Telegram data is missing' },
        { status: 400 }
      )
    }

    const user = verifyTelegramData(initData)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Telegram authentication' },
        { status: 401 }
      )
    }

    if (
      !hand ||
      !['mtt', 'cash'].includes(hand.format) ||
      typeof hand.hero_position !== 'string' ||
      typeof hand.hero_hand !== 'string' ||
      !Array.isArray(hand.board) ||
      !Array.isArray(hand.actions) ||
      typeof hand.result !== 'string' ||
      !Number.isInteger(hand.players) ||
      !Number.isFinite(hand.stack_bb)
    ) {
      return NextResponse.json(
        { error: 'Invalid hand data' },
        { status: 400 }
      )
    }

    if (
      hand.board.length > 5 ||
      hand.actions.length > 50 ||
      hand.hero_hand.length > 30 ||
      hand.result.length > 200
    ) {
      return NextResponse.json(
        { error: 'Hand data is too large' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const displayName = [
      user.first_name,
      user.last_name,
    ].filter(Boolean).join(' ')

    const { error: profileError } = await supabaseAdmin
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

    if (profileError) {
      console.error('Profile update failed:', profileError.message)

      return NextResponse.json(
        { error: 'Could not update profile' },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('hand_history')
      .insert({
        telegram_id: user.id,
        format: hand.format,
        range_type: hand.range_type ?? null,
        players: hand.players,
        hero_position: hand.hero_position,
        stack_bb: hand.stack_bb,
        hero_hand: hand.hero_hand,
        board: hand.board,
        actions: hand.actions,
        result: hand.result,
        is_correct: typeof hand.is_correct === 'boolean'
          ? hand.is_correct
          : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Hand history save failed:', error.message)

      return NextResponse.json(
        { error: 'Could not save hand history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      handId: data.id,
    })
  } catch (error) {
    console.error('History API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}