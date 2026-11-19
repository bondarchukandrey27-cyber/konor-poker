'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        initData: string
      }
    }
  }
}

export function TelegramInit() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (!tg) return

    tg.ready()
    tg.expand()
    tg.setHeaderColor('#000000')
    tg.setBackgroundColor('#000000')

    const initData = tg.initData

    if (!initData) return

    async function authenticate() {
      try {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData }),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('Telegram authentication failed:', result.error)
          return
        }

        console.log('Konor Poker profile connected:', result.profile)
      } catch (error) {
        console.error('Telegram connection error:', error)
      }
    }

    authenticate()
  }, [])

  return null
}