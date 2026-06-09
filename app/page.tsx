'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import AssignmentCard from '@/components/AssignmentCard'
import DownloadModal from '@/components/DownloadModal'
import { MOCK_ASSIGNMENTS, DEPARTMENTS } from '@/lib/mock-data'
import { confirmDownloadAction } from '@/app/actions/download'
import type { Assignment } from '@/types'

type AssignmentWithLikes = Assignment & { likes: number }

export default function Home() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignmentWithLikes[]>([])
  const [userId, setUserId] = useState<string | null>(null)
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

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

  async function redownload(id: string) {
    const result = await confirmDownloadAction(id)
    if (result.error) { showToast(`⚠ ${result.error}`); return }
    if (result.url) {
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
      if (filterGrade === '상만' && a.grade !== '상') return false
      if (filterGrade === '중상이상' && a.grade !== '상' && a.grade !== '중상') return false
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

      {/* ── HERO ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--primary-light)', color: 'var(--primary-dark)',
            borderRadius: 100, padding: '6px 16px',
            fontSize: 13, fontWeight: 700, marginBottom: 24,
          }}>
            🎓 대학생을 위한 과제 공유 플랫폼
          </div>
          <h1 style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-1.5px', marginBottom: 20 }}>
            선배들의{' '}
            <span style={{ color: 'var(--primary)', position: 'relative' }} className="hero-highlight">
              A+ 노하우
            </span>
            ,<br />이제 내 것으로
          </h1>
          <p style={{ fontSize: 18, color: 'var(--subtext)', lineHeight: 1.75, marginBottom: 36 }}>
            과제 결과물, 발표자료, 코드, 리서치를<br />
            공유하고 참고하며 더 높은 수준의 결과물을<br />
            더 빠르게 만들어보세요.
          </p>
          <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/upload" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 14, padding: '18px 36px',
              fontSize: 17, fontWeight: 700, textDecoration: 'none',
              transition: 'background .2s, transform .15s, box-shadow .2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--primary-dark)'
                ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(91,108,249,.35)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--primary)'
                ;(e.currentTarget as HTMLAnchorElement).style.transform = 'none'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
              }}
            >
              📤 내 과제 업로드하기
            </Link>
            <button
              onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)',
                borderRadius: 14, padding: '18px 36px',
                fontSize: 17, fontWeight: 700, cursor: 'pointer',
                transition: 'background .2s, transform .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-light)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
              }}
            >
              과제 둘러보기 →
            </button>
          </div>
        </div>

        {/* Hero visual - app mockup */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: -16, right: -16, zIndex: 10 }} className="floating-badge">
            <div style={{
              background: '#fff', borderRadius: 14, padding: '10px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              animation: 'float 3s ease-in-out infinite',
            }}>
              🏆 A+ 과제 업로드 완료!
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 32, left: -20, zIndex: 10 }} className="floating-badge">
            <div style={{
              background: '#fff', borderRadius: 14, padding: '10px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,.12)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              animation: 'float 3s ease-in-out infinite 1.5s',
            }}>
              ⬡ +30P 포인트 적립됨
            </div>
          </div>
          <div style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(91,108,249,.18), 0 4px 20px rgba(0,0,0,.08)',
            overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            {/* mockup bar */}
            <div style={{ background: 'var(--bg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 26, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, color: 'var(--subtext)', border: '1px solid var(--border)' }}>
                🔒 과제.zip
              </div>
            </div>
            {/* mockup content */}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--subtext)', marginBottom: 12 }}>
                <span>🔍</span><span>데이터구조, 마케팅 케이스스터디...</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
                {['전체', '공학/IT', '경영', '인문사회'].map((tab, i) => (
                  <div key={tab} style={{
                    padding: '5px 12px', borderRadius: 100,
                    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    border: 'none', cursor: 'pointer',
                    background: i === 0 ? 'var(--primary)' : 'var(--bg)',
                    color: i === 0 ? '#fff' : 'var(--subtext)',
                  }}>
                    {tab}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: '#5B6CF9', initial: '이', author: '성균관대 컴공 23학번', grade: 'A+', title: 'AVL 트리 구현 및 성능 분석 보고서', tags: ['#자료구조', '#C++', '#알고리즘'] },
                  { color: '#FF6B6B', initial: '박', author: '연세대 경영 22학번', grade: 'A+', title: '스타벅스 소비자 행동 분석 케이스스터디', tags: ['#마케팅원론', '#케이스스터디'] },
                ].map((card) => (
                  <div key={card.title} style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, border: '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {card.initial}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500, flex: 1 }}>{card.author}</div>
                      <div style={{ background: '#FFF7ED', color: '#EA580C', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>{card.grade}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>{card.title}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {card.tags.map(t => (
                        <div key={t} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100 }}>{t}</div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--subtext)' }}>
                      <span>❤️ 342</span><span>⬡ 10P</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BROWSE ── */}
      <main id="browse" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <span style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            과제 탐색
          </span>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 6, lineHeight: 1.25 }}>
            우수 과제 모음
          </h2>
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
            <option value="">🏅 전체 점수</option>
            <option value="상만">상 만</option>
            <option value="중상이상">중상 이상</option>
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
                userId={userId}
                isDownloaded={downloads.includes(a.id)}
                isBookmarked={bookmarks.includes(a.id)}
                onDownload={id => userId ? setDownloadTarget(id) : router.push('/auth')}
                onRedownload={redownload}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── POINT SYSTEM ── */}
      <div style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
          <span style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            포인트 제도
          </span>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.25 }}>
            어떻게 포인트를 쓰나요?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--subtext)', lineHeight: 1.7, marginBottom: 36 }}>
            과제를 공유하면 포인트를 받고, 받은 포인트로 다른 과제를 다운로드하세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '🎁', amount: '+50 P', color: 'var(--gold)', name: '가입 보너스', desc: '첫 가입 시 50포인트를 드려요' },
              { icon: '📤', amount: '+30 P', color: 'var(--gold)', name: '과제 업로드', desc: '검수 승인된 과제 1건당 30포인트' },
              { icon: '⭐', amount: '+50 P', color: 'var(--gold)', name: '우수과제 추가 보상', desc: '성적 인증 시 30P + 추가 50P', highlight: true },
              { icon: '📥', amount: '-10 P', color: 'var(--red)', name: '과제 다운로드', desc: '다운로드 1회당 10포인트 차감' },
            ].map(item => (
              <div key={item.name} style={{
                background: '#fff', border: `1.5px solid ${item.highlight ? 'rgba(217,119,6,0.3)' : 'var(--border)'}`,
                borderRadius: 16, padding: 24, textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: item.color }}>{item.amount}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXCELLENCE ── */}
      <div>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
          <span style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            우수과제 인증
          </span>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.25 }}>
            어떤 과제가 우수과제인가요?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--subtext)', lineHeight: 1.7, marginBottom: 24 }}>
            아래 기준을 충족하는 과제에는 <span style={{ color: 'var(--gold)', fontWeight: 700 }}>⭐ 우수과제</span> 배지가 부여됩니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                num: 1,
                title: '상 또는 중상 이상의 최종 학점',
                desc: '해당 과목에서 중상(90점) 이상의 학점을 취득한 과제만 등록 가능합니다. 전공필수·교양 구분 없이 동일하게 적용됩니다.',
              },
              {
                num: 2,
                title: '성적표 이미지 업로드 (신뢰 인증)',
                desc: '학교 학사시스템에서 다운로드한 성적확인서 또는 성적표 이미지를 업로드합니다. 운영팀이 1-2일 내 수동 검수 후 승인합니다.',
              },
              {
                num: 3,
                title: '교수 피드백 포함 시 추가 인정',
                desc: '교수님의 채점 의견이나 피드백이 포함된 과제는 신뢰도를 높게 평가합니다. 추가 20P 보너스가 제공됩니다.',
              },
              {
                num: 4,
                title: '원본성 검증',
                desc: '표절이나 AI 생성 의심 과제는 운영팀 검토 후 삭제 처리됩니다. 허위 성적 업로드 적발 시 계정이 영구 정지됩니다.',
              },
            ].map(item => (
              <div key={item.num} style={{
                background: 'var(--bg)', border: '1.5px solid var(--border)',
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>
                  {item.num}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📋 운영 정책 (MVP 기간)</div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.8 }}>
              · 현재는 수동 검수(1-2 영업일) 방식으로 운영합니다<br />
              · 추후 OCR 기반 자동 성적 인증 시스템으로 전환 예정<br />
              · 다운로드 수가 많은 과제는 별도 검수를 통해 품질 보증<br />
              · 부적절한 과제 신고 기능 제공 예정
            </div>
          </div>
        </div>
      </div>

      {/* ── FEEDBACK ── */}
      <FeedbackSection onToast={showToast} />

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0F1024', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                과제<span style={{ color: 'var(--primary)' }}>.zip</span>
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 8, maxWidth: 240, lineHeight: 1.5 }}>
                대학생들의 지식이 쌓이는<br />과제 공유 플랫폼
              </p>
            </div>
            <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase' }}>서비스</h4>
                <a href="#browse" style={{ display: 'block', fontSize: 14, color: '#6B7280', textDecoration: 'none', marginBottom: 10 }}
                  onClick={e => { e.preventDefault(); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }) }}>
                  과제 탐색
                </a>
                <Link href="/upload" style={{ display: 'block', fontSize: 14, color: '#6B7280', textDecoration: 'none', marginBottom: 10 }}>
                  과제 업로드
                </Link>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase' }}>안내</h4>
                <a href="#point" style={{ display: 'block', fontSize: 14, color: '#6B7280', textDecoration: 'none', marginBottom: 10 }}>포인트 제도</a>
                <a href="#excellence" style={{ display: 'block', fontSize: 14, color: '#6B7280', textDecoration: 'none', marginBottom: 10 }}>우수과제 기준</a>
              </div>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #1F2037', marginBottom: 24 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#4B5563', flexWrap: 'wrap', gap: 12 }}>
            <span>© 2025 과제.zip. 본 서비스는 가설 검증 목적의 프로토타입입니다.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="#" style={{ color: '#4B5563', textDecoration: 'none' }}>이용약관</a>
              <a href="#" style={{ color: '#4B5563', textDecoration: 'none' }}>개인정보처리방침</a>
            </div>
          </div>
        </div>
      </footer>

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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .hero-highlight::after {
          content: '';
          position: absolute;
          bottom: 2px; left: 0; width: 100%; height: 8px;
          background: var(--primary-light); z-index: -1; border-radius: 4px;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 60px 20px 40px !important;
            gap: 48px !important;
            text-align: center;
          }
          .hero-grid h1 {
            font-size: 38px !important;
          }
          .hero-grid > div:first-child > div:last-child {
            justify-content: center;
          }
          .floating-badge {
            display: none !important;
          }
        }
        @media (max-width: 560px) {
          .hero-grid h1 {
            font-size: 32px !important;
          }
        }
      `}</style>
    </>
  )
}

function FeedbackSection({ onToast }: { onToast: (msg: string) => void }) {
  const [email, setEmail] = useState('')
  const [advice, setAdvice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !re.test(email)) {
      onToast('⚠ 올바른 이메일을 입력해주세요')
      return
    }

    setLoading(true)
    const endpoint = process.env.NEXT_PUBLIC_GAS_ENDPOINT
    if (endpoint) {
      const data = JSON.stringify({ id: Date.now().toString(36), email, advice })
      await fetch(
        `${endpoint}?action=insert&table=tab_final&data=${encodeURIComponent(data)}`,
        { mode: 'no-cors' }
      ).catch(() => {})
    }

    // GA4 이벤트
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'feedback_submit', {
        email_domain: email.split('@')[1],
      })
    }

    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #4046C8 0%, #5B6CF9 50%, #7C6CF9 100%)',
      padding: '88px 24px',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
          marginBottom: 16, letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          피드백
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.2 }}>
          과제.zip, 더 좋게 만들어요
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', lineHeight: 1.7, marginBottom: 32 }}>
          이메일을 남겨주시면 업데이트 소식과<br />얼리버드 포인트 혜택을 드립니다.
        </p>

        {submitted ? (
          <div style={{ padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 10 }}>감사합니다!</div>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
              소중한 피드백을 보내드릴게요.<br />과제.zip을 계속 이용해주세요!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 14,
              padding: '12px 18px', marginBottom: 4, textAlign: 'left',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', padding: '4px 0' }}>✅ 업데이트 소식 가장 먼저 받기</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', padding: '4px 0' }}>✅ 얼리버드 포인트 추가 지급</div>
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              style={{
                padding: '14px 18px', border: 'none', borderRadius: 12,
                fontSize: 15, fontFamily: 'inherit', outline: 'none',
                width: '100%', background: '#fff', color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={advice}
              onChange={e => setAdvice(e.target.value)}
              placeholder="서비스에 바라는 점이나 피드백을 남겨주세요 (선택)"
              rows={3}
              style={{
                padding: '14px 18px', border: 'none', borderRadius: 12,
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
                width: '100%', background: '#fff', color: 'var(--text)',
                resize: 'none', lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--text)', color: '#fff', border: 'none',
                borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 800,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'transform .15s, box-shadow .2s',
              }}
            >
              {loading ? '전송 중...' : '피드백 보내기 →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
