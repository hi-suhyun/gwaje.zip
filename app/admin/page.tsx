'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  getPendingAssignments,
  approveAssignment,
  rejectAssignment,
  getTranscriptUrl,
} from '@/app/actions/admin'

type Assignment = {
  id: string
  title: string
  school: string
  department: string
  subject: string
  professor: string | null
  grade: string
  has_professor_feedback: boolean
  transcript_url: string | null
  file_url: string
  created_at: string
  profiles: { nickname: string; email: string } | null
}

const SCORE_COLOR: Record<string, string> = {
  '상': '#EA580C',
  '중상': '#D97706',
  '중': '#4B5563',
  '중하': '#6B7280',
  '하': '#9CA3AF',
}

export default function AdminPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await getPendingAssignments()
    if (res.error) { setError(res.error); return }
    setAssignments(res.assignments as Assignment[])
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleApprove(id: string, asExcellent: boolean) {
    setProcessingId(id)
    startTransition(async () => {
      const res = await approveAssignment(id, asExcellent)
      if (res.error) { showToast(`⚠ ${res.error}`); setProcessingId(null); return }
      setAssignments(prev => prev.filter(a => a.id !== id))
      showToast(asExcellent ? '⭐ 우수과제로 승인됐어요!' : '✅ 승인됐어요!')
      setProcessingId(null)
    })
  }

  async function handleReject(id: string) {
    if (!confirm('정말 거절하시겠어요? 업로드된 파일도 함께 삭제됩니다.')) return
    setProcessingId(id)
    startTransition(async () => {
      const res = await rejectAssignment(id)
      if (res.error) { showToast(`⚠ ${res.error}`); setProcessingId(null); return }
      setAssignments(prev => prev.filter(a => a.id !== id))
      showToast('🗑 거절 및 삭제됐어요.')
      setProcessingId(null)
    })
  }

  async function openTranscript(path: string) {
    const res = await getTranscriptUrl(path)
    if (res.url) window.open(res.url, '_blank')
    else showToast('⚠ 성적표를 불러올 수 없습니다.')
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', textDecoration: 'none' }}>
              과제<span style={{ color: 'var(--primary)' }}>.zip</span>
            </Link>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--primary)', color: '#fff', padding: '3px 10px', borderRadius: 100 }}>
              관리자
            </span>
          </div>
          <Link href="/" style={{ fontSize: 14, color: 'var(--subtext)', textDecoration: 'none' }}>← 메인으로</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>검수 대기 과제</h1>
          <p style={{ fontSize: 14, color: 'var(--subtext)' }}>
            성적 인증 이미지를 확인하고 승인하세요. 승인/거절 시 이미지는 자동 삭제됩니다.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '14px 18px', fontSize: 14, color: 'var(--red)', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {assignments.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--subtext)', fontSize: 15 }}>
            검수 대기 중인 과제가 없어요 🎉
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {assignments.map(a => {
            const excellentPoints = 30 + 50 + (a.has_professor_feedback ? 20 : 0)
            const isProcessing = processingId === a.id

            return (
              <div key={a.id} style={{
                background: '#fff', border: '1.5px solid var(--border)',
                borderRadius: 16, padding: 24,
                opacity: isProcessing ? 0.6 : 1,
                transition: 'opacity .2s',
              }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                        {a.department}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 800,
                        background: '#FFF7ED', color: SCORE_COLOR[a.grade] ?? '#EA580C',
                      }}>
                        점수 {a.grade}
                      </span>
                      {a.has_professor_feedback && (
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 700, background: 'var(--green-bg)', color: 'var(--green)' }}>
                          교수 피드백 포함
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
                      {a.school} · {a.subject}{a.professor ? ` · ${a.professor}` : ''}
                    </div>
                  </div>
                </div>

                {/* 업로더 + 제출 시간 */}
                <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 16, display: 'flex', gap: 16 }}>
                  <span>👤 {a.profiles?.nickname ?? '알 수 없음'} ({a.profiles?.email})</span>
                  <span>🕐 {new Date(a.created_at).toLocaleString('ko-KR')}</span>
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* 과제 파일 보기 */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assignments/${a.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)',
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    📄 과제 파일 보기
                  </a>

                  {/* 성적 인증 이미지 보기 */}
                  {a.transcript_url && (
                    <button
                      onClick={() => openTranscript(a.transcript_url!)}
                      style={{
                        padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: 'var(--gold-bg)', border: '1px solid rgba(217,119,6,0.2)',
                        color: 'var(--gold)', cursor: 'pointer',
                      }}
                    >
                      🎓 성적 인증 확인
                    </button>
                  )}

                  <div style={{ flex: 1 }} />

                  {/* 거절 */}
                  <button
                    onClick={() => handleReject(a.id)}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: 'none', border: '1.5px solid rgba(220,38,38,.3)',
                      color: 'var(--red)', cursor: 'pointer',
                    }}
                  >
                    거절
                  </button>

                  {/* 일반 승인 */}
                  <button
                    onClick={() => handleApprove(a.id, false)}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: 'var(--primary-light)', border: '1px solid rgba(91,108,249,.25)',
                      color: 'var(--primary-dark)', cursor: 'pointer',
                    }}
                  >
                    ✅ 승인 (+30P)
                  </button>

                  {/* 우수과제 승인 */}
                  <button
                    onClick={() => handleApprove(a.id, true)}
                    disabled={isProcessing}
                    style={{
                      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: 'var(--gold)', border: 'none',
                      color: '#fff', cursor: 'pointer',
                    }}
                  >
                    ⭐ 우수과제 (+{excellentPoints}P)
                  </button>
                </div>
              </div>
            )
          })}
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
