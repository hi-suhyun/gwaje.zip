'use client'

import { useState, useEffect, useMemo } from 'react'
import Nav from '@/components/Nav'
import AssignmentCard from '@/components/AssignmentCard'
import DownloadModal from '@/components/DownloadModal'
import { MOCK_ASSIGNMENTS, DEPARTMENTS } from '@/lib/mock-data'

export default function Home() {
  const [points, setPoints] = useState(50)
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
    const p = localStorage.getItem('gj_points')
    const d = localStorage.getItem('gj_downloads')
    const b = localStorage.getItem('gj_bookmarks')
    if (p) setPoints(parseInt(p))
    if (d) setDownloads(JSON.parse(d))
    if (b) setBookmarks(JSON.parse(b))
  }, [])

  function saveState(newPoints: number, newDownloads: string[], newBookmarks: string[]) {
    localStorage.setItem('gj_points', String(newPoints))
    localStorage.setItem('gj_downloads', JSON.stringify(newDownloads))
    localStorage.setItem('gj_bookmarks', JSON.stringify(newBookmarks))
  }

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    const t = setTimeout(() => setToast(''), 2800)
    setToastTimer(t)
  }

  function handleDownload(id: string) {
    setDownloadTarget(id)
  }

  function confirmDownload() {
    if (!downloadTarget) return
    const assignment = MOCK_ASSIGNMENTS.find(a => a.id === downloadTarget)!
    if (points < assignment.point_cost) return

    const newPoints = points - assignment.point_cost
    const newDownloads = [...downloads, downloadTarget]
    setPoints(newPoints)
    setDownloads(newDownloads)
    saveState(newPoints, newDownloads, bookmarks)
    setDownloadTarget(null)
    showToast('✅ 다운로드 완료! (실제 파일은 Supabase 연결 후 제공됩니다)')
  }

  function toggleBookmark(id: string) {
    const newBookmarks = bookmarks.includes(id)
      ? bookmarks.filter(b => b !== id)
      : [...bookmarks, id]
    setBookmarks(newBookmarks)
    saveState(points, downloads, newBookmarks)
    showToast(bookmarks.includes(id) ? '북마크 해제됨' : '🔖 북마크 추가됨')
  }

  const filtered = useMemo(() => {
    return MOCK_ASSIGNMENTS.filter(a => {
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
  }, [filterDept, filterGrade, filterBookmark, search, bookmarks])

  const targetAssignment = downloadTarget ? MOCK_ASSIGNMENTS.find(a => a.id === downloadTarget) : null

  return (
    <>
      <Nav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
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
              padding: '9px 14px', fontSize: 13, fontFamily: 'inherit',
              outline: 'none',
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
                onDownload={handleDownload}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* Download Modal */}
      {downloadTarget && targetAssignment && (
        <DownloadModal
          assignment={targetAssignment}
          points={points}
          onConfirm={confirmDownload}
          onClose={() => setDownloadTarget(null)}
        />
      )}

      {/* Toast */}
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
