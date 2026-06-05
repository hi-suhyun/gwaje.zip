'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'

type ScoreLevel = '하' | '중하' | '중' | '중상' | '상' | ''

type FormData = {
  title: string
  school: string
  department: string
  subject: string
  professor: string
  grade: ScoreLevel
  hasFeedback: boolean
  assignmentFile: File | null
  transcriptFile: File | null
}

const SCORE_LEVELS: { value: ScoreLevel; label: string; desc: string }[] = [
  { value: '하', label: '하', desc: 'C 이하' },
  { value: '중하', label: '중하', desc: 'B0~B+' },
  { value: '중', label: '중', desc: 'B+ 내외' },
  { value: '중상', label: '중상', desc: 'A0 내외' },
  { value: '상', label: '상', desc: 'A+' },
]

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({
    title: '', school: '', department: '', subject: '', professor: '',
    grade: '', hasFeedback: false, assignmentFile: null, transcriptFile: null,
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof FormData, value: FormData[keyof FormData]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function goNext() {
    setError('')
    if (step === 1) {
      if (!form.title.trim() || !form.school.trim() || !form.department.trim() || !form.subject.trim()) {
        setError('필수 항목을 모두 입력해주세요.')
        return
      }
    }
    if (step === 2) {
      if (!form.grade) { setError('점수 수준을 선택해주세요.'); return }
      if (!form.transcriptFile) { setError('성적 인증 이미지를 첨부해주세요.'); return }
    }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!form.assignmentFile) { setError('과제 파일을 첨부해주세요.'); return }
    setError('')
    setLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const assignmentId = crypto.randomUUID()
      const fileExt = form.assignmentFile.name.split('.').pop()
      const filePath = `${user.id}/${assignmentId}/assignment.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(filePath, form.assignmentFile)
      if (uploadError) throw uploadError

      // 성적 인증 이미지 업로드 (필수)
      const tExt = form.transcriptFile!.name.split('.').pop()
      const transcriptPath = `${user.id}/${assignmentId}/transcript.${tExt}`
      const { error: tError } = await supabase.storage
        .from('transcripts')
        .upload(transcriptPath, form.transcriptFile!)
      if (tError) throw tError

      const { error: dbError } = await supabase.from('assignments').insert({
        id: assignmentId,
        uploader_id: user.id,
        title: form.title,
        school: form.school,
        department: form.department,
        subject: form.subject,
        professor: form.professor || null,
        grade: form.grade,
        file_url: filePath,
        transcript_url: transcriptPath,
        has_professor_feedback: form.hasFeedback,
      })
      if (dbError) throw dbError

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>업로드 신청 완료!</h2>
            <p style={{ fontSize: 15, color: 'var(--subtext)', lineHeight: 1.7, marginBottom: 28 }}>
              운영팀이 1~2 영업일 내 검수 후 승인합니다.<br />
              승인 완료 시 포인트가 자동으로 적립됩니다.
            </p>
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 8 }}>예상 적립 포인트</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>+30P~</div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 4 }}>
                기본 30P · 우수과제 인정 시 최대 +100P
              </div>
            </div>
            <Link href="/" style={{
              display: 'inline-block', background: 'var(--primary)', color: '#fff',
              borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
            }}>
              과제 탐색하러 가기 →
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <Link href="/" style={{ fontSize: 13, color: 'var(--subtext)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
              ← 돌아가기
            </Link>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>과제 업로드</h1>
            <p style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 6 }}>업로드한 과제가 승인되면 포인트를 받을 수 있어요</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < step ? 'var(--primary)' : i === step ? 'var(--gold)' : 'var(--border)',
                transition: 'background .3s',
              }} />
            ))}
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>1단계 · 과제 기본 정보</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>과제 제목 *</label>
                  <input style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="예: 소비자행동론 - 구매의사결정 분석 보고서" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>학교 *</label>
                    <input style={inputStyle} value={form.school} onChange={e => update('school', e.target.value)} placeholder="예: 연세대학교" />
                  </div>
                  <div>
                    <label style={labelStyle}>학과 *</label>
                    <input style={inputStyle} value={form.department} onChange={e => update('department', e.target.value)} placeholder="예: 경영학과" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>과목명 *</label>
                    <input style={inputStyle} value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="예: 마케팅원론" />
                  </div>
                  <div>
                    <label style={labelStyle}>교수명</label>
                    <input style={inputStyle} value={form.professor} onChange={e => update('professor', e.target.value)} placeholder="예: 김철수 교수" />
                  </div>
                </div>

                {error && <ErrorBox msg={error} />}
                <button style={btnPrimary} onClick={goNext}>다음 단계 →</button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>2단계 · 점수 수준 및 성적 인증</div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>받은 점수 수준 *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {SCORE_LEVELS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => update('grade', s.value)}
                        style={{
                          flex: 1, padding: '12px 4px', textAlign: 'center',
                          borderRadius: 8, fontSize: 14, fontWeight: 700,
                          border: `1.5px solid ${form.grade === s.value ? 'var(--gold)' : 'var(--border)'}`,
                          background: form.grade === s.value ? 'var(--gold-bg)' : 'var(--bg)',
                          color: form.grade === s.value ? 'var(--gold)' : 'var(--subtext)',
                          cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {form.grade && (
                    <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 6 }}>
                      선택: <strong style={{ color: 'var(--gold)' }}>{form.grade}</strong>
                      {' '}({SCORE_LEVELS.find(s => s.value === form.grade)?.desc})
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>성적 인증 이미지 * <span style={{ fontWeight: 400, color: 'var(--subtext)' }}>(모든 과제 필수)</span></label>
                  <label style={{
                    display: 'block', border: `1.5px dashed ${form.transcriptFile ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 12, padding: 24, textAlign: 'center', color: 'var(--subtext)',
                    fontSize: 13, cursor: 'pointer', transition: 'border-color .15s', background: 'var(--bg)',
                  }}>
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => update('transcriptFile', e.target.files?.[0] ?? null)} />
                    {form.transcriptFile
                      ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✅ {form.transcriptFile.name}</span>
                      : <>📎 성적확인서 또는 성적표 이미지 첨부<br /><span style={{ fontSize: 11 }}>JPG, PNG, PDF · 최대 5MB</span></>
                    }
                  </label>
                  <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--gold)', marginTop: 8, lineHeight: 1.6 }}>
                    ⚠ 이름·학번은 모자이크 처리 후 검수합니다. 승인/거절 후 이미지는 자동 삭제됩니다.
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>교수 피드백 포함 여부</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[false, true].map(v => (
                      <button
                        key={String(v)}
                        onClick={() => update('hasFeedback', v)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          border: `1.5px solid ${form.hasFeedback === v ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.hasFeedback === v ? 'var(--primary-light)' : 'var(--bg)',
                          color: form.hasFeedback === v ? 'var(--primary-dark)' : 'var(--subtext)',
                          cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                        }}
                      >
                        {v ? '✅ 포함됨 (+20P)' : '포함 안 됨'}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <ErrorBox msg={error} />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnGhost} onClick={() => setStep(1)}>← 이전</button>
                  <button style={{ ...btnPrimary, flex: 2 }} onClick={goNext}>다음 단계 →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>3단계 · 파일 업로드 및 최종 확인</div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>과제 파일 업로드 *</label>
                  <label style={{
                    display: 'block', border: `1.5px dashed ${form.assignmentFile ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 12, padding: 28, textAlign: 'center', color: 'var(--subtext)',
                    fontSize: 13, cursor: 'pointer', transition: 'border-color .15s', background: 'var(--bg)',
                  }}>
                    <input type="file" accept=".pdf,.doc,.docx,.hwp,.ppt,.pptx,.zip,.py,.ipynb" style={{ display: 'none' }} onChange={e => update('assignmentFile', e.target.files?.[0] ?? null)} />
                    {form.assignmentFile
                      ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✅ {form.assignmentFile.name}</span>
                      : <>📂 과제 파일을 클릭하여 선택<br /><span style={{ fontSize: 11 }}>PDF, DOC, HWP, PPT, ZIP, Python · 최대 50MB</span></>
                    }
                  </label>
                </div>

                {/* 업로드 요약 */}
                <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14, fontSize: 13, color: 'var(--subtext)', lineHeight: 1.8 }}>
                  <strong style={{ color: 'var(--text)' }}>{form.title || '(제목 없음)'}</strong><br />
                  {form.school} · {form.department} · 점수 수준 {form.grade || '미선택'}
                  {form.hasFeedback ? ' · 교수 피드백 포함' : ''}
                </div>

                {/* 예상 포인트 */}
                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(4,120,87,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 20 }}>
                  💰 기본 획득 포인트: <strong style={{ fontSize: 16 }}>+30P</strong>
                  <span style={{ fontSize: 12, marginLeft: 6 }}>(우수과제 인정 시 최대 +100P)</span>
                </div>

                {error && <ErrorBox msg={error} />}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnGhost} onClick={() => setStep(2)}>← 이전</button>
                  <button style={{ ...btnPrimary, flex: 2, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? '업로드 중...' : '✅ 업로드 완료'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>
      {msg}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--subtext)', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
  color: 'var(--text)', borderRadius: 8, padding: '10px 14px',
  fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  display: 'block', width: '100%', padding: 13, borderRadius: 10,
  fontSize: 15, fontWeight: 700, background: 'var(--primary)', color: '#fff',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s',
}

const btnGhost: React.CSSProperties = {
  flex: 1, padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 600,
  background: 'none', border: '1.5px solid var(--border)', color: 'var(--text)',
  cursor: 'pointer', fontFamily: 'inherit',
}
