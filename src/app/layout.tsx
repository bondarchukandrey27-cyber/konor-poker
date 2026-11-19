import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'
import { TelegramInit } from '@/components/TelegramInit'
import { LanguageProvider } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'Konor Poker',
  description: 'Poker training platform by Konor.',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="classic" suppressHydrationWarning>
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <LanguageProvider>
          <TelegramInit />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
