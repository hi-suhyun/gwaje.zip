'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMyProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, assignmentsRes, txRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('assignments').select('id, title, subject, grade, is_published, is_verified, download_count, created_at')
      .eq('uploader_id', user.id).order('created_at', { ascending: false }),
    supabase.from('point_transactions').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  return {
    profile: profileRes.data,
    assignments: assignmentsRes.data ?? [],
    transactions: txRes.data ?? [],
  }
}

export async function updateNickname(nickname: string) {
  const trimmed = nickname.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
    return { error: '닉네임은 2~20자로 입력해주세요.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase.from('profiles')
    .update({ nickname: trimmed })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 업로드한 과제 파일들 스토리지에서 삭제
  const { data: assignments } = await supabase
    .from('assignments')
    .select('file_url, transcript_url')
    .eq('uploader_id', user.id)

  if (assignments && assignments.length > 0) {
    const fileUrls = assignments.map(a => a.file_url).filter(Boolean)
    const transcriptUrls = assignments.map(a => a.transcript_url).filter(Boolean) as string[]

    if (fileUrls.length > 0) {
      await supabase.storage.from('assignments').remove(fileUrls)
    }
    if (transcriptUrls.length > 0) {
      await supabase.storage.from('transcripts').remove(transcriptUrls)
    }
  }

  // auth.users 삭제 (cascade로 profiles, assignments 등 자동 삭제)
  const { error } = await supabase.rpc('delete_user')
  if (error) return { error: error.message }

  return { success: true }
}
