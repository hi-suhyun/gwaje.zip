'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Tab = 'login' | 'signup'

const SUPABASE_READY =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!SUPABASE_READY) {
      setError('Supabase가 아직 연결되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요.')
      return
    }

    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else {
        if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); setLoading(false); return }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname } },
        })
        if (error) throw error

        if (data.session) {
          // 이메일 확인이 꺼져있으면 가입 즉시 세션이 발급됨 → 바로 로그인 처리
          router.push('/')
          router.refresh()
        } else {
          setSuccess('가입 확인 이메일을 발송했습니다. 이메일을 확인해주세요.')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Nav (간소화) */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', textDecoration: 'none' }}>
            과제<span style={{ color: 'var(--primary)' }}>.zip</span>
          </Link>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,.08)', border: '1px solid var(--border)' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                과제<span style={{ color: 'var(--primary)' }}>.zip</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 6 }}>
                {tab === 'login' ? '다시 오셨네요 👋' : '대학생 과제 공유 플랫폼에 오신 걸 환영해요 🎓'}
              </div>
            </div>

            {/* Tab */}
            <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
              {(['login', 'signup'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setSuccess('') }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all .2s',
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? 'var(--text)' : 'var(--subtext)',
                    boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,.08)' : 'none',
                  }}
                >
                  {t === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--subtext)', marginBottom: 6 }}>닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="예: 연세대_경영_22"
                    required
                    style={{
                      width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
                      color: 'var(--text)', borderRadius: 8, padding: '11px 14px',
                      fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--subtext)', marginBottom: 6 }}>이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@university.ac.kr"
                  required
                  style={{
                    width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
                    color: 'var(--text)', borderRadius: 8, padding: '11px 14px',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--subtext)', marginBottom: 6 }}>비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? '8자 이상 입력해주세요' : '비밀번호 입력'}
                  required
                  minLength={tab === 'signup' ? 8 : 1}
                  style={{
                    width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
                    color: 'var(--text)', borderRadius: 8, padding: '11px 14px',
                    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 회원가입 혜택 안내 */}
              {tab === 'signup' && (
                <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 6 }}>가입 혜택</div>
                  <div style={{ fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.7 }}>
                    🎁 가입 즉시 <strong>50 포인트</strong> 지급<br />
                    📤 과제 업로드 승인 시 <strong>+30P</strong><br />
                    ⭐ A+/A0 인증 시 <strong>추가 +50P</strong>
                  </div>
                </div>
              )}

              {/* Error / Success */}
              {error && (
                <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(4,120,87,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--green)' }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 800,
                  background: loading ? 'var(--border)' : 'var(--primary)',
                  color: loading ? 'var(--subtext)' : '#fff',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .2s', marginTop: 4,
                  fontFamily: 'inherit',
                }}
              >
                {loading ? '처리 중...' : tab === 'login' ? '로그인' : '가입하기'}
              </button>
            </form>
          </div>

          {/* 하단 링크 */}
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--subtext)' }}>
            {tab === 'login' ? (
              <>계정이 없으신가요? <button onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>회원가입</button></>
            ) : (
              <>이미 계정이 있으신가요? <button onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>로그인</button></>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
