'use client'

import type { Assignment } from '@/types'

type Props = {
  assignment: Assignment & { likes: number }
  points: number
  onConfirm: () => void
  onClose: () => void
}

export default function DownloadModal({ assignment, points, onConfirm, onClose }: Props) {
  const canDownload = points >= assignment.point_cost
  const afterPoints = points - assignment.point_cost

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(26,27,46,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 480,
        boxShadow: '0 8px 40px rgba(0,0,0,.15)',
        animation: 'modalIn .25s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>과제 다운로드</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--subtext)', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>{assignment.title}</div>

        {/* 포인트 요약 */}
        <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
            <span>보유 포인트</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{points} P</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
            <span>다운로드 비용</span>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>-{assignment.point_cost} P</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '12px 0 4px', marginTop: 8, borderTop: '1px solid var(--border)', fontWeight: 700 }}>
            <span>다운로드 후 포인트</span>
            <span>{canDownload ? afterPoints : '—'} P</span>
          </div>
        </div>

        {!canDownload && (
          <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            ⚠ 포인트가 부족합니다. 과제를 업로드하거나 포인트를 충전하세요.
          </div>
        )}

        <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
          다운로드 후 환불은 불가합니다.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: 'none', border: '1.5px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
          }}>
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDownload}
            style={{
              flex: 2, padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 700,
              background: canDownload ? 'var(--primary)' : 'var(--border)',
              color: canDownload ? '#fff' : 'var(--subtext)',
              border: 'none', cursor: canDownload ? 'pointer' : 'not-allowed',
              transition: 'background .2s',
            }}
          >
            {assignment.point_cost}P로 다운로드
          </button>
        </div>
      </div>
    </div>
  )
}
