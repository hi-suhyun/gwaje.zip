# 과제.zip

> 대학생 과제 공유 플랫폼 — 선배들의 A+ 노하우를 내 것으로

**서비스 주소**: https://gwajezip.vercel.app

---

## 서비스 개요

`과제.zip`은 성적 인증 기반의 대학생 과제 공유 플랫폼입니다.

- 과제를 업로드하면 포인트를 받고, 포인트로 다른 과제를 다운로드합니다.
- 성적표 이미지를 업로드해 운영자 검수를 통과하면 최종 업로드됩니다.
- 학과·과목·교수명 검색, 북마크, 다운로드 이력 관리 등 기능을 제공합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router), TypeScript, React 19 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Deployment | Vercel |
| Analytics | Google Analytics 4, Google Apps Script + Google Sheets |
| Styling | Tailwind CSS, inline styles |

---

## 로컬 실행 방법

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정 (https://supabase.com)

### 1. 저장소 클론

```bash
git clone https://github.com/hi-suhyun/gwaje.zip.git
cd gwaje.zip
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Supabase 프로젝트 설정

1. https://supabase.com 에서 새 프로젝트 생성
2. **SQL Editor**에서 `supabase/schema.sql` 전체 내용을 복사·실행
3. **Storage**에서 버킷 2개 생성 (schema.sql 하단에 INSERT 문 포함):
   - `assignments` — 과제 파일 저장
   - `transcripts` — 성적표 파일 저장
4. Supabase 대시보드 → Project Settings → API에서 다음 값 확인:
   - `Project URL`
   - `anon public` key

### 4. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Google Apps Script 웹 앱 URL (없으면 방문자 추적 비활성화)
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/...
```

### 5. 관리자 계정 설정

1. 로컬 서버 실행 후 `/auth`에서 회원가입
2. Supabase SQL Editor에서 아래 쿼리로 관리자 권한 부여:

```sql
UPDATE profiles SET is_admin = true WHERE email = '본인이메일@example.com';
```

추가로 아래 SQL을 실행해야 관리자가 미승인 과제를 조회할 수 있습니다 (성적표 조회 정책은 `schema.sql`에 포함되어 있음):

```sql
-- 관리자 전용 RLS 정책
CREATE POLICY "관리자 전체 과제 조회" ON assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 6. 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속합니다.

> DB가 비어 있어도 mock 데이터가 자동으로 표시됩니다.

---

## 주요 기능 및 경로

| 경로 | 설명 |
|------|------|
| `/` | 메인 — 히어로 섹션, 과제 탐색, 포인트/우수과제 설명 |
| `/intro` | 서비스 소개 페이지 |
| `/auth` | 회원가입 / 로그인 |
| `/upload` | 과제 업로드 (2단계: 기본정보 → 파일 업로드) |
| `/assignments/[id]` | 과제 상세 페이지 |
| `/profile` | 내 프로필 — 포인트, 업로드 목록, 포인트 내역, 회원탈퇴 |
| `/admin` | 관리자 페이지 — 과제 검수 승인/거절 (관리자 전용) |

---

## 포인트 제도

| 활동 | 포인트 |
|------|--------|
| 가입 보너스 | +50P |
| 과제 업로드 (승인 시) | +30P |
| 우수과제 인증 (성적표 검수 통과) | 추가 +50P |
| 교수 피드백 포함 | 추가 +20P |
| 과제 다운로드 | -10P |

---

## 데이터베이스 구조

`supabase/schema.sql`에 전체 DDL이 정의되어 있습니다.

```
profiles           — 사용자 프로필, 포인트 잔액
assignments        — 업로드된 과제
downloads          — 다운로드 이력 (중복 방지)
bookmarks          — 북마크
point_transactions — 포인트 변동 내역
```

회원가입 시 자동으로 프로필이 생성되고 50P가 지급되는 DB 트리거(`handle_new_user`)가 포함되어 있습니다.

---

## Vercel 배포 방법

```bash
npm install -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_GAS_ENDPOINT
vercel --prod
```

---

## Google Apps Script 연동 (방문자 추적)

방문자 데이터는 Google Sheets + Google Apps Script로 수집됩니다.

1. Google Sheets에서 시트 2개 생성 (1행에 아래 컬럼 헤더 입력):
   - `visitors`: `id` / `landingUrl` / `ip` / `referer` / `time_stamp` / `utm` / `device`
   - `tab_final`: `id` / `email` / `advice`
2. 확장 프로그램 → Apps Script → GAS 코드 붙여넣기 → 배포 (웹 앱, 액세스: **모든 사용자**)
3. 배포 URL을 `NEXT_PUBLIC_GAS_ENDPOINT` 환경변수에 설정

UTM 파라미터 지원: `gwajezip.vercel.app?utm=everytime` 형태로 채널별 유입 분석 가능

---

## 프로젝트 구조

```
gwaje.zip/
├── app/
│   ├── page.tsx              # 메인 (히어로 + 탐색)
│   ├── intro/page.tsx        # 서비스 소개
│   ├── auth/page.tsx         # 로그인/회원가입
│   ├── upload/page.tsx       # 과제 업로드
│   ├── assignments/[id]/     # 과제 상세
│   ├── profile/page.tsx      # 내 프로필
│   ├── admin/page.tsx        # 관리자 검수
│   ├── api/ip/route.ts       # IP 조회 API
│   └── actions/              # Server Actions
│       ├── download.ts
│       ├── admin.ts
│       └── profile.ts
├── components/
│   ├── Nav.tsx
│   ├── AssignmentCard.tsx
│   ├── DownloadModal.tsx
│   └── Tracking.tsx          # GA4 + GAS 방문자 추적
├── lib/
│   ├── gtag.ts               # GA4 이벤트 트래킹 헬퍼
│   ├── supabase/             # Supabase 클라이언트
│   └── mock-data.ts          # DB 없을 때 폴백 데이터
├── supabase/
│   └── schema.sql            # 전체 DB 스키마
└── types/
    └── index.ts
```
