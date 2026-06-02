'use client'

import { useState, useEffect, useMemo } from 'react'
import Nav from '@/components/Nav'
import AssignmentCard from '@/components/AssignmentCard'
import DownloadModal from '@/components/DownloadModal'
import { MOCK_ASSIGNMENTS, DEPARTMENTS } from '@/lib/mock-data'
import { confirmDownloadAction } from '@/app/actions/download'
import type { Assignment } from '@/types'

type AssignmentWithLikes = Assignment & { likes: number }

export default function Home() {
  const [assignments, setAssignments] = useState<AssignmentWithLikes[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [downloads, setDownloads] = useState<string[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [downloadTarget, setDownloadTarget] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const [filterDept, setFilterDept] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterBookmark, setFilterBookmark] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // 과제 목록 (공개된 것)
    const { data: dbAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    setAssignments(
      dbAssignments && dbAssignments.length > 0
        ? dbAssignments.map(a => ({ ...a, likes: 0 }))
        : MOCK_ASSIGNMENTS
    )

    // 유저 정보
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, downloadsRes, bookmarksRes] = await Promise.all([
      supabase.from('profiles').select('points').eq('id', user.id).single(),
      supabase.from('downloads').select('assignment_id').eq('user_id', user.id),
      supabase.from('bookmarks').select('assignment_id').eq('user_id', user.id),
    ])

    if (profileRes.data) setUserPoints(profileRes.data.points)
    if (downloadsRes.data) setDownloads(downloadsRes.data.map(d => d.assignment_id))
    if (bookmarksRes.data) setBookmarks(bookmarksRes.data.map(b => b.assignment_id))
  }

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    const t = setTimeout(() => setToast(''), 2800)
    setToastTimer(t)
  }

  async function confirmDownload() {
    if (!downloadTarget) return

    const result = await confirmDownloadAction(downloadTarget)
    setDownloadTarget(null)

    if (result.error) {
      showToast(`⚠ ${result.error}`)
      return
    }

    if (result.url) {
      setDownloads(prev => [...prev, downloadTarget])
      setUserPoints(prev => prev - 10)
      window.open(result.url, '_blank')
      showToast('✅ 다운로드 완료!')
    }
  }

  async function toggleBookmark(id: string) {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { showToast('로그인 후 이용 가능합니다.'); return }

    if (bookmarks.includes(id)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('assignment_id', id)
      setBookmarks(prev => prev.filter(b => b !== id))
      showToast('북마크 해제됨')
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, assignment_id: id })
      setBookmarks(prev => [...prev, id])
      showToast('🔖 북마크 추가됨')
    }
  }

  const filtered = useMemo(() => {
    return assignments.filter(a => {
      if (filterDept && a.department !== filterDept) return false
      if (filterGrade === 'A+만' && a.grade !== 'A+') return false
      if (filterGrade === 'A0이상' && a.grade !== 'A+' && a.grade !== 'A0') return false
      if (filterBookmark && !bookmarks.includes(a.id)) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.subject.toLowerCase().includes(q) &&
          !(a.professor ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [assignments, filterDept, filterGrade, filterBookmark, search, bookmarks])

  const targetAssignment = downloadTarget ? assignments.find(a => a.id === downloadTarget) : null

  return (
    <>
      <Nav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            과제 탐색
          </span>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6, lineHeight: 1.25 }}>
            우수 과제 모음
          </h1>
          <p style={{ fontSize: 16, color: 'var(--subtext)' }}>
            선배들의 A+ 노하우를 내 것으로 만들어보세요.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            style={{
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              color: 'var(--text)', borderRadius: 8,
              padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="">📚 전체 학과</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>

          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            style={{
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              color: 'var(--text)', borderRadius: 8,
              padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="">🏅 전체 학점</option>
            <option value="A+만">A+ 만</option>
            <option value="A0이상">A0 이상</option>
          </select>

          <button
            onClick={() => setFilterBookmark(prev => !prev)}
            style={{
              background: filterBookmark ? 'var(--primary-light)' : 'var(--bg)',
              border: `1.5px solid ${filterBookmark ? 'var(--primary)' : 'var(--border)'}`,
              color: filterBookmark ? 'var(--primary-dark)' : 'var(--subtext)',
              borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .15s',
            }}
          >
            🔖 북마크
          </button>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 과제명, 과목, 교수명 검색..."
            style={{
              flex: 1, minWidth: 180,
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              color: 'var(--text)', borderRadius: 8,
              padding: '9px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--subtext)', padding: '60px 0', fontSize: 15 }}>
            검색 결과가 없습니다
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(a => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                isDownloaded={downloads.includes(a.id)}
                isBookmarked={bookmarks.includes(a.id)}
                onDownload={id => setDownloadTarget(id)}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {downloadTarget && targetAssignment && (
        <DownloadModal
          assignment={targetAssignment}
          points={userPoints}
          onConfirm={confirmDownload}
          onClose={() => setDownloadTarget(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text)', color: '#fff', borderRadius: 30,
          padding: '10px 20px', fontSize: 14, zIndex: 300, whiteSpace: 'nowrap',
          animation: 'fadeIn .3s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to { opacity: 1; transform: none; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}
