'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const [points, setPoints] = useState(50)
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('gj_points')
    if (stored) setPoints(parseInt(stored))
  }, [])

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{
            background: 'none', border: 'none', fontSize: 14, fontWeight: 600,
            color: pathname === '/' ? 'var(--text)' : 'var(--subtext)',
            cursor: 'pointer', textDecoration: 'none', transition: 'color .15s',
          }}>
            과제 탐색
          </Link>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--gold-bg)', border: '1px solid rgba(217,119,6,0.2)',
            padding: '5px 12px', borderRadius: 20,
            fontSize: 13, fontWeight: 600, color: 'var(--gold)',
          }}>
            ⬡ <span>{points} P</span>
          </div>

          <Link href="/upload" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 18px',
            fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'background .2s', textDecoration: 'none',
          }}>
            📤 업로드
          </Link>

          <Link href="/auth" style={{
            background: 'none',
            border: '1.5px solid var(--border)',
            color: 'var(--text)', borderRadius: 10,
            padding: '9px 18px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'background .15s', textDecoration: 'none',
          }}>
            로그인
          </Link>
        </div>
      </div>
    </nav>
  )
}
