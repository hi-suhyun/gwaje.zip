'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { getProfileAction } from '@/app/actions/download'

type Profile = { nickname: string; points: number } | null

export default function Nav() {
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    getProfileAction().then(p => {
      setProfile(p)
      setLoading(false)
    })
  }, [pathname])

  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', textDecoration: 'none' }}>
          과제<span style={{ color: 'var(--primary)' }}>.zip</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{
            fontSize: 14, fontWeight: 600,
            color: pathname === '/' ? 'var(--text)' : 'var(--subtext)',
            textDecoration: 'none',
          }}>
            과제 탐색
          </Link>

          {!loading && profile && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--gold-bg)', border: '1px solid rgba(217,119,6,0.2)',
                padding: '5px 12px', borderRadius: 20,
                fontSize: 13, fontWeight: 600, color: 'var(--gold)',
              }}>
                ⬡ {profile.points} P
              </div>

              <Link href="/upload" style={{
                background: 'var(--primary)', color: '#fff',
                borderRadius: 10, padding: '10px 18px',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                📤 업로드
              </Link>

              <button onClick={handleLogout} style={{
                background: 'none', border: '1.5px solid var(--border)',
                color: 'var(--subtext)', borderRadius: 10,
                padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                로그아웃
              </button>
            </>
          )}

          {!loading && !profile && (
            <>
              <Link href="/upload" style={{
                background: 'var(--primary)', color: '#fff',
                borderRadius: 10, padding: '10px 18px',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                📤 업로드
              </Link>
              <Link href="/auth" style={{
                background: 'none', border: '1.5px solid var(--border)',
                color: 'var(--text)', borderRadius: 10,
                padding: '9px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}>
                로그인
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
