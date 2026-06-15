-- ============================================================
-- 과제.zip 데이터베이스 스키마
-- ============================================================

-- profiles: auth.users와 1:1 연결, 포인트 잔액 관리
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nickname    text not null,
  points      int  not null default 0,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- assignments: 업로드된 과제
create table assignments (
  id                      uuid primary key default gen_random_uuid(),
  uploader_id             uuid not null references profiles(id) on delete cascade,
  title                   text not null,
  school                  text not null,
  department              text not null,
  subject                 text not null,
  professor               text,
  grade                   text not null check (grade in ('A+', 'A0', 'B+', 'B0', 'other')),
  file_url                text not null,
  transcript_url          text,
  has_professor_feedback  boolean not null default false,
  point_cost              int not null default 10,
  download_count          int not null default 0,
  is_verified             boolean not null default false,
  is_published            boolean not null default false,
  created_at              timestamptz not null default now()
);

-- downloads: 다운로드 이력 (중복 방지용)
create table downloads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  assignment_id  uuid not null references assignments(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, assignment_id)
);

-- bookmarks: 북마크
create table bookmarks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  assignment_id  uuid not null references assignments(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, assignment_id)
);

-- point_transactions: 포인트 변동 내역 (감사 로그)
create table point_transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  amount              int not null,
  type                text not null check (type in (
    'signup_bonus',       -- +50
    'upload_reward',      -- +30
    'excellence_bonus',   -- +50 (A+/A0 검수 통과)
    'feedback_bonus',     -- +20 (교수 피드백 포함)
    'download'            -- -10
  )),
  ref_assignment_id   uuid references assignments(id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table profiles enable row level security;
alter table assignments enable row level security;
alter table downloads enable row level security;
alter table bookmarks enable row level security;
alter table point_transactions enable row level security;

-- profiles
create policy "본인 프로필 조회" on profiles for select using (auth.uid() = id);
create policy "본인 프로필 수정" on profiles for update using (auth.uid() = id);

-- assignments: 공개된 과제는 누구나, 본인 과제는 본인만 전체 접근
create policy "공개 과제 조회" on assignments for select using (is_published = true);
create policy "본인 과제 조회" on assignments for select using (auth.uid() = uploader_id);
create policy "과제 업로드" on assignments for insert with check (auth.uid() = uploader_id);
create policy "본인 과제 수정" on assignments for update using (auth.uid() = uploader_id);

-- downloads
create policy "본인 다운로드 조회" on downloads for select using (auth.uid() = user_id);
create policy "다운로드 기록 삽입" on downloads for insert with check (auth.uid() = user_id);

-- bookmarks
create policy "본인 북마크 조회" on bookmarks for select using (auth.uid() = user_id);
create policy "북마크 추가" on bookmarks for insert with check (auth.uid() = user_id);
create policy "북마크 삭제" on bookmarks for delete using (auth.uid() = user_id);

-- point_transactions
create policy "본인 포인트 내역 조회" on point_transactions for select using (auth.uid() = user_id);

-- ============================================================
-- Functions
-- ============================================================

-- 회원가입 시 프로필 자동 생성 + 가입 보너스 지급
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, nickname, points)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    50
  );

  insert into point_transactions (user_id, amount, type)
  values (new.id, 50, 'signup_bonus');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 포인트 차감/적립 함수 (트랜잭션 안전)
create or replace function adjust_points(
  p_user_id uuid,
  p_amount  int,
  p_type    text,
  p_ref_assignment_id uuid default null
)
returns void language plpgsql security definer as $$
begin
  update profiles set points = points + p_amount where id = p_user_id;

  if not found then
    raise exception 'user not found';
  end if;

  insert into point_transactions (user_id, amount, type, ref_assignment_id)
  values (p_user_id, p_amount, p_type, p_ref_assignment_id);
end;
$$;

-- ============================================================
-- Storage buckets
-- ============================================================

-- Supabase 대시보드에서 생성하거나 아래 SQL 실행
insert into storage.buckets (id, name, public) values ('assignments', 'assignments', false);
insert into storage.buckets (id, name, public) values ('transcripts', 'transcripts', false);

-- 과제 파일: 본인만 업로드, 업로더 본인 또는 다운로드한 사람만 조회 (signed URL 발급용)
create policy "과제 파일 업로드" on storage.objects for insert
  with check (bucket_id = 'assignments' and auth.role() = 'authenticated');

create policy "과제 파일 조회" on storage.objects for select
  using (
    bucket_id = 'assignments' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from downloads
        where downloads.user_id = auth.uid()
          and downloads.assignment_id::text = (storage.foldername(name))[2]
      )
    )
  );

-- 성적표 파일: 본인만 업로드, 본인 또는 관리자만 조회
create policy "성적표 업로드" on storage.objects for insert
  with check (bucket_id = 'transcripts' and auth.role() = 'authenticated');

create policy "성적표 조회" on storage.objects for select
  using (
    bucket_id = 'transcripts' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
  );
