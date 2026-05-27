'use client'

import type { Assignment } from '@/types'

type Props = {
  assignment: Assignment & { likes: number }
  isDownloaded: boolean
  isBookmarked: boolean
  onDownload: (id: string) => void
  onBookmark: (id: string) => void
}

export default function AssignmentCard({ assignment: a, isDownloaded, isBookmarked, onDownload, onBookmark }: Props) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      transition: 'border-color .2s, transform .15s, box-shadow .2s',
      cursor: 'default',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(91,108,249,.1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
            {a.department}
          </span>
          {a.is_verified && (
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
              ⭐ 우수과제
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 800, background: '#FFF7ED', color: '#EA580C' }}>
          {a.grade}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 14 }}>
        {a.school} · {a.subject} · {a.professor}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⬡ {a.point_cost}P
          </span>
          <span style={{ fontSize: 12, color: 'var(--subtext)' }}>↓ {a.download_count}</span>
          <button
            onClick={() => onBookmark(a.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, opacity: isBookmarked ? 1 : 0.4,
              transition: 'opacity .15s',
              padding: '0 2px',
            }}
            title={isBookmarked ? '북마크 해제' : '북마크'}
          >
            {isBookmarked ? '🔖' : '🔖'}
          </button>
        </div>

        {isDownloaded ? (
          <span style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            color: 'var(--green)', border: '1px solid rgba(4,120,87,.3)', background: 'var(--green-bg)',
          }}>
            ✅ 다운로드됨
          </span>
        ) : (
          <button
            onClick={() => onDownload(a.id)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--primary-light)', border: '1px solid rgba(91,108,249,.25)',
              color: 'var(--primary)', cursor: 'pointer', transition: 'background .15s',
            }}
          >
            📥 다운로드
          </button>
        )}
      </div>
    </div>
  )
}
