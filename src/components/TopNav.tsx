'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export type NavPage = 'viewer' | 'play'

interface Props {
  active: NavPage
  setupParams: URLSearchParams
}

const PAGES: { id: NavPage; label: 'ranges' | 'play'; href: string }[] = [
  { id: 'viewer', label: 'ranges', href: '/' },
  { id: 'play', label: 'play', href: '/play' },
]

export function TopNav({ active, setupParams }: Props) {
  const query = setupParams.toString()
  const { language, setLanguage, t } = useLanguage()

  return (
    <nav className="topbar" aria-label="Pages">
      {PAGES.map((page) => (
        <Link
          key={page.id}
          href={query ? `${page.href}?${query}` : page.href}
          className={`topbar__link${page.id === active ? ' topbar__link--active' : ''}`}
          aria-current={page.id === active ? 'page' : undefined}
        >
          {t(page.label)}
        </Link>
      ))}

      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        <button
          type="button"
          className={`topbar__link${language === 'en' ? ' topbar__link--active' : ''}`}
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          type="button"
          className={`topbar__link${language === 'ua' ? ' topbar__link--active' : ''}`}
          onClick={() => setLanguage('ua')}
          aria-pressed={language === 'ua'}
        >
          UA
        </button>
      </div>
    </nav>
  )
}
