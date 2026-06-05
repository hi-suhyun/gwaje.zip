'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import DownloadModal from '@/components/DownloadModal'
import { confirmDownloadAction, getProfileAction } from '@/app/actions/download'
import type { Assignment } from '@/types'

type AssignmentWithLikes = Assignment & { likes: number }

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [assignment, setAssignment] = useState<AssignmentWithLikes | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error || !data) { setNotFound(true); return }
    setAssignment({ ...data, likes: 0 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [profileRes, downloadRes, bookmarkRes] = await Promise.all([
      getProfileAction(),
      supabase.from('downloads').select('id').eq('user_id', user.id).eq('assignment_id', id).maybeSingle(),
      supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('assignment_id', id).maybeSingle(),
    ])

    if (profileRes) setUserPoints(profileRes.points)
    setIsDownloaded(!!downloadRes.data)
    setIsBookmarked(!!bookmarkRes.data)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function confirmDownload() {
    const result = await confirmDownloadAction(id)
    setShowModal(false)
    if (result.error) { showToast(`⚠ ${result.error}`); return }
    if (result.url) {
      if (!isDownloaded) {
        setIsDownloaded(true)
        setUserPoints(prev => prev - 10)
        setAssignment(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : prev)
      }
      window.open(result.url, '_blank')
      showToast('✅ 다운로드 완료!')
    }
  }

  async function toggleBookmark() {
    if (!userId) { showToast('로그인 후 이용 가능합니다.'); return }
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', userId).eq('assignment_id', id)
      setIsBookmarked(false)
      showToast('북마크 해제됨')
    } else {
      await supabase.from('bookmarks').insert({ user_id: userId, assignment_id: id })
      setIsBookmarked(true)
      showToast('🔖 북마크 추가됨')
    }
  }

  if (notFound) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>과제를 찾을 수 없어요</div>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>← 메인으로</Link>
        </main>
      </>
    )
  }

  if (!assignment) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--subtext)', fontSize: 14 }}>불러오는 중...</div>
        </main>
      </>
    )
  }

  const a = assignment

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>

        {/* 뒤로 */}
        <Link href="/" style={{ fontSize: 13, color: 'var(--subtext)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← 목록으로
        </Link>

        {/* 카드 */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid var(--border)', padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>

          {/* 배지 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 100, fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
              {a.department}
            </span>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 100, fontWeight: 800, background: '#FFF7ED', color: '#EA580C' }}>
              점수 {a.grade}
            </span>
            {a.is_verified && (
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 100, fontWeight: 700, background: 'var(--green-bg)', color: 'var(--green)' }}>
                ⭐ 우수과제
              </span>
            )}
            {a.has_professor_feedback && (
              <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 100, fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                💬 교수 피드백 포함
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, marginBottom: 12 }}>{a.title}</h1>

          {/* 메타 */}
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>🏫 {a.school}</span>
            <span>📚 {a.subject}</span>
            {a.professor && <span>👨‍🏫 {a.professor}</span>}
            <span>📅 {new Date(a.created_at).toLocaleDateString('ko-KR')}</span>
            <span>↓ {a.download_count}회 다운로드</span>
          </div>

          {/* 설명 */}
          {a.description ? (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', marginBottom: 10 }}>과제 소개</div>
              <div style={{
                fontSize: 14, lineHeight: 1.8, color: 'var(--text)',
                background: 'var(--bg)', borderRadius: 12, padding: '16px 18px',
                border: '1px solid var(--border)', whiteSpace: 'pre-wrap',
              }}>
                {a.description}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 28, padding: '14px 18px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--subtext)' }}>
              작성된 설명이 없습니다.
            </div>
          )}

          {/* 다운로드 섹션 */}
          {userId === a.uploader_id ? (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <span style={{
                display: 'inline-block', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                color: 'var(--subtext)', border: '1px solid var(--border)', background: 'var(--bg)',
              }}>
                내가 올린 과제예요
              </span>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 4 }}>다운로드 비용</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>⬡ {a.point_cost}P</div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* 북마크 */}
                <button
                  onClick={toggleBookmark}
                  style={{
                    background: isBookmarked ? 'var(--primary-light)' : 'none',
                    border: `1.5px solid ${isBookmarked ? 'var(--primary)' : 'var(--border)'}`,
                    color: isBookmarked ? 'var(--primary-dark)' : 'var(--subtext)',
                    borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {isBookmarked ? '🔖 저장됨' : '🔖 저장'}
                </button>

                {/* 다운로드 */}
                {isDownloaded ? (
                  <button
                    onClick={confirmDownload}
                    style={{
                      padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      color: 'var(--green)', border: '1.5px solid rgba(4,120,87,.3)', background: 'var(--green-bg)',
                      cursor: 'pointer',
                    }}
                  >
                    ↓ 다시 받기
                  </button>
                ) : (
                  <button
                    onClick={() => userId ? setShowModal(true) : router.push('/auth')}
                    style={{
                      padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >
                    📥 다운로드
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <DownloadModal
          assignment={a}
          points={userPoints}
          onConfirm={confirmDownload}
          onClose={() => setShowModal(false)}
        />
      )}

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
