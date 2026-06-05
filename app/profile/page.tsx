'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { getMyProfile, updateNickname, deleteAccount } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  email: string
  nickname: string
  points: number
  is_admin: boolean
  created_at: string
}

type MyAssignment = {
  id: string
  title: string
  subject: string
  grade: string
  is_published: boolean
  is_verified: boolean
  download_count: number
  created_at: string
}

type Transaction = {
  id: string
  amount: number
  type: string
  created_at: string
}

const TX_LABELS: Record<string, string> = {
  signup_bonus: '회원가입 보너스',
  upload_reward: '과제 업로드 승인',
  excellence_bonus: '우수과제 선정',
  feedback_bonus: '교수 피드백 보너스',
  download: '과제 다운로드',
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<{
    profile: Profile
    assignments: MyAssignment[]
    transactions: Transaction[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingNick, setEditingNick] = useState(false)
  const [nickInput, setNickInput] = useState('')
  const [nickError, setNickError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [toast, setToast] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    getMyProfile().then(res => {
      if (!res) { router.push('/auth'); return }
      setData(res as typeof data)
      setNickInput(res.profile?.nickname ?? '')
      setLoading(false)
    })
  }, [router])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleEditNick() {
    setNickInput(data?.profile.nickname ?? '')
    setNickError('')
    setEditingNick(true)
  }

  function handleSaveNick() {
    startTransition(async () => {
      const res = await updateNickname(nickInput)
      if (res.error) { setNickError(res.error); return }
      setData(prev => prev ? { ...prev, profile: { ...prev.profile, nickname: nickInput.trim() } } : prev)
      setEditingNick(false)
      showToast('닉네임이 변경됐어요.')
    })
  }

  async function handleDeleteAccount() {
    if (deleteInput !== '탈퇴합니다') return
    const res = await deleteAccount()
    if (res.error) { showToast(`⚠ ${res.error}`); return }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--subtext)', fontSize: 14 }}>불러오는 중...</div>
        </main>
      </>
    )
  }

  if (!data) return null

  const { profile, assignments, transactions } = data
  const initials = profile.nickname.slice(0, 2)
  const joinDate = new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const publishedCount = assignments.filter(a => a.is_published).length
  const pendingCount = assignments.filter(a => !a.is_published).length

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        {/* 프로필 카드 */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 28,
          border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.04)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* 아바타 */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, flexShrink: 0,
            }}>
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              {/* 닉네임 */}
              {editingNick ? (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={nickInput}
                      onChange={e => setNickInput(e.target.value)}
                      maxLength={20}
                      style={{
                        fontSize: 20, fontWeight: 800, border: '1.5px solid var(--primary)',
                        borderRadius: 8, padding: '4px 10px', outline: 'none',
                        background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit',
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNick() }}
                      autoFocus
                    />
                    <button onClick={handleSaveNick} style={{ ...smallBtn, background: 'var(--primary)', color: '#fff', border: 'none' }}>저장</button>
                    <button onClick={() => setEditingNick(false)} style={{ ...smallBtn, background: 'none', border: '1.5px solid var(--border)', color: 'var(--subtext)' }}>취소</button>
                  </div>
                  {nickError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{nickError}</div>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 900 }}>{profile.nickname}</span>
                  <button onClick={handleEditNick} style={{ ...smallBtn, background: 'none', border: '1.5px solid var(--border)', color: 'var(--subtext)' }}>수정</button>
                </div>
              )}

              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 4 }}>{profile.email}</div>
              <div style={{ fontSize: 12, color: 'var(--subtext)' }}>가입일 {joinDate}</div>
            </div>

            {/* 포인트 */}
            <div style={{
              background: 'var(--gold-bg)', border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: 14, padding: '12px 18px', textAlign: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, marginBottom: 2 }}>보유 포인트</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold)' }}>{profile.points.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--gold)' }}>P</div>
            </div>
          </div>

          {/* 통계 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <StatBox label="공개된 과제" value={publishedCount} unit="개" />
            <StatBox label="검수 대기" value={pendingCount} unit="개" />
            <StatBox label="총 포인트" value={profile.points} unit="P" />
          </div>
        </div>

        {/* 내 과제 목록 */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>내가 올린 과제</h2>
          {assignments.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: 32, textAlign: 'center', color: 'var(--subtext)', fontSize: 14 }}>
              아직 업로드한 과제가 없어요.<br />
              <Link href="/upload" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>
                첫 과제 업로드 →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assignments.map(a => (
                <div key={a.id} style={{
                  background: '#fff', borderRadius: 12, border: '1px solid var(--border)',
                  padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                      {a.subject} · 점수 {a.grade}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    {a.is_published ? (
                      <>
                        {a.is_verified && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--gold-bg)', color: 'var(--gold)', fontWeight: 700 }}>
                            ⭐ 우수
                          </span>
                        )}
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 600 }}>
                          공개
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'var(--bg)', color: 'var(--subtext)', border: '1px solid var(--border)', fontWeight: 600 }}>
                        검수중
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--subtext)' }}>↓{a.download_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 포인트 내역 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>포인트 내역</h2>
          {transactions.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: 24, textAlign: 'center', color: 'var(--subtext)', fontSize: 14 }}>
              포인트 내역이 없어요.
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{
                  padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{TX_LABELS[tx.type] ?? tx.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: tx.amount > 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}P
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 회원탈퇴 */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'none', border: '1.5px solid rgba(220,38,38,.3)',
                color: 'var(--red)', borderRadius: 10, padding: '10px 18px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              회원 탈퇴
            </button>
          ) : (
            <div style={{ background: 'rgba(220,38,38,.04)', border: '1.5px solid rgba(220,38,38,.2)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>정말 탈퇴하시겠어요?</div>
              <p style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.7, marginBottom: 14 }}>
                탈퇴 시 업로드한 과제와 포인트가 모두 삭제되며 복구할 수 없습니다.<br />
                계속하려면 아래에 <strong style={{ color: 'var(--text)' }}>탈퇴합니다</strong> 를 입력하세요.
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="탈퇴합니다"
                style={{
                  width: '100%', border: '1.5px solid rgba(220,38,38,.3)', borderRadius: 8,
                  padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  background: '#fff', color: 'var(--text)', boxSizing: 'border-box', marginBottom: 12,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                  style={{ ...smallBtn, flex: 1, padding: '11px 0', background: 'none', border: '1.5px solid var(--border)', color: 'var(--subtext)' }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== '탈퇴합니다'}
                  style={{
                    ...smallBtn, flex: 1, padding: '11px 0',
                    background: deleteInput === '탈퇴합니다' ? 'var(--red)' : 'rgba(220,38,38,.3)',
                    color: '#fff', border: 'none', cursor: deleteInput === '탈퇴합니다' ? 'pointer' : 'not-allowed',
                  }}
                >
                  탈퇴
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text)', color: '#fff', borderRadius: 30,
          padding: '10px 20px', fontSize: 14, zIndex: 300, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}

function StatBox({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{value.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 500 }}>{unit}</span></div>
    </div>
  )
}

const smallBtn: React.CSSProperties = {
  borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}
