'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'

export default function IntroPage() {
  return (
    <>
      <Nav />

      {/* PAGE HERO */}
      <div style={{
        background: 'linear-gradient(160deg, #EEF0FF 0%, #F6F8FF 60%, #fff 100%)',
        padding: '72px 24px 64px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
          fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
          marginBottom: 20, letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          서비스 소개
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.2 }}>
          과제.zip, <span style={{ color: 'var(--primary)' }}>이렇게</span> 사용하세요
        </h1>
        <p style={{ fontSize: 18, color: 'var(--subtext)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
          선배들의 A+ 노하우를 참고하고, 내 과제를 공유해 포인트를 모으는 대학생 전용 플랫폼입니다.
        </p>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 14, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            이용 방법
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.25 }}>
            3단계로 시작하는<br />스마트한 과제
          </h2>
          <p style={{ fontSize: 16, color: 'var(--subtext)', lineHeight: 1.7, maxWidth: 560, marginBottom: 52 }}>
            복잡한 가입 절차 없이 학교 이메일 하나로 시작하세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }} className="steps-grid">
            {[
              {
                icon: '📤', num: 1, title: '과제 업로드',
                desc: '완성한 과제 파일, 발표자료, 코드를 업로드하고 과목명, 받은 학점, 교수자 피드백을 함께 기록하세요.',
              },
              {
                icon: '🔍', num: 2, title: '검색 & 탐색',
                desc: '과목명, 전공, 키워드, 대학교 등으로 필요한 레퍼런스를 빠르게 검색하고 우수 과제 큐레이션을 확인하세요.',
              },
              {
                icon: '💡', num: 3, title: '참고 & 성장',
                desc: '선배들의 구조와 접근 방식을 참고해 더 높은 수준의 결과물을 만들고, 인사이트를 나누세요.',
              },
            ].map(step => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, background: 'var(--primary-light)', borderRadius: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, margin: '0 auto 20px',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  width: 36, height: 36, background: 'var(--primary)', color: '#fff',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, margin: '0 auto 16px',
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--subtext)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{
            display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary-dark)',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
            marginBottom: 14, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            주요 기능
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.25 }}>
            과제 공유를 넘어<br />학습 생태계를 만듭니다
          </h2>
          <p style={{ fontSize: 16, color: 'var(--subtext)', lineHeight: 1.7, maxWidth: 560, marginBottom: 52 }}>
            단순한 파일 보관함이 아닌, 대학생들의 지식이 쌓이는 살아있는 플랫폼을 경험하세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="features-grid">
            {[
              { icon: '📁', title: '다양한 형식 지원', desc: 'PDF, Word, PPT, 코드 파일 등 모든 형식의 과제 결과물을 업로드할 수 있어요.' },
              { icon: '🔍', title: '스마트 검색', desc: '과목명, 전공, 학교, 학점, 키워드 등 다양한 필터로 딱 원하는 레퍼런스를 찾을 수 있어요.' },
              { icon: '🏆', title: '우수 과제 큐레이션', desc: '성적 인증을 통해 검증된 과제들을 모아 높은 수준의 레퍼런스를 쉽게 발견하세요.' },
              { icon: '⭐', title: '성적 인증 시스템', desc: '성적표 업로드로 A+ 과제를 인증하고 우수과제 배지와 추가 포인트 보상을 받으세요.' },
              { icon: '🔖', title: '북마크 & 컬렉션', desc: '마음에 드는 과제를 저장하고 나만의 레퍼런스 라이브러리를 만드세요.' },
            ].map(feat => (
              <FeatureCard key={feat.title} icon={feat.icon} title={feat.title} desc={feat.desc} />
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #4046C8 0%, #5B6CF9 50%, #7C6CF9 100%)',
        padding: '88px 24px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.2 }}>
          지금 바로 시작해보세요
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.8)', marginBottom: 36, lineHeight: 1.65 }}>
          선배들의 A+ 노하우를 참고해<br />더 빠르게, 더 높은 수준으로 성장하세요.
        </p>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', color: 'var(--primary-dark)', border: 'none', borderRadius: 14,
          padding: '16px 32px', fontSize: 16, fontWeight: 800, textDecoration: 'none',
          transition: 'transform .15s, box-shadow .2s',
        }}>
          ← 과제 탐색하러 가기
        </Link>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#0F1024', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#4B5563', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ fontSize: 18, fontWeight: 900, color: '#fff', textDecoration: 'none' }}>
            과제<span style={{ color: 'var(--primary)' }}>.zip</span>
          </Link>
          <span>© 2025 과제.zip. 본 서비스는 가설 검증 목적의 프로토타입입니다.</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .features-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 20, padding: '32px 28px',
      border: '1.5px solid transparent',
      transition: 'border-color .2s, box-shadow .2s, transform .2s',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--primary)'
        el.style.boxShadow = '0 12px 40px rgba(91,108,249,.12)'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'transparent'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 18 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}
