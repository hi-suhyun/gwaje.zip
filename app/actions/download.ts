'use server'

import { createClient } from '@/lib/supabase/server'

export async function confirmDownloadAction(assignmentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, point_cost, file_url')
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { error: '과제를 찾을 수 없습니다.' }

  // 이미 다운로드한 경우 바로 URL 반환
  const { data: existing } = await supabase
    .from('downloads')
    .select('id')
    .eq('user_id', user.id)
    .eq('assignment_id', assignmentId)
    .maybeSingle()

  if (existing) {
    return { url: await buildSignedUrl(supabase, assignment.file_url) }
  }

  // 포인트 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (!profile || profile.points < assignment.point_cost) {
    return { error: '포인트가 부족합니다. 과제를 업로드하거나 포인트를 충전하세요.' }
  }

  // 포인트 차감
  const { error: pointError } = await supabase.rpc('adjust_points', {
    p_user_id: user.id,
    p_amount: -assignment.point_cost,
    p_type: 'download',
    p_ref_assignment_id: assignmentId,
  })
  if (pointError) return { error: '포인트 처리 중 오류가 발생했습니다.' }

  // 다운로드 기록 + 카운트 증가
  await Promise.all([
    supabase.from('downloads').insert({ user_id: user.id, assignment_id: assignmentId }),
    supabase.rpc('increment_download_count', { p_assignment_id: assignmentId }),
  ])

  return { url: await buildSignedUrl(supabase, assignment.file_url) }
}

export async function getProfileAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, points')
    .eq('id', user.id)
    .single()

  return profile
}

async function buildSignedUrl(supabase: Awaited<ReturnType<typeof createClient>>, filePath: string) {
  const { data, error } = await supabase.storage
    .from('assignments')
    .createSignedUrl(filePath, 60)

  if (error || !data) return null
  return data.signedUrl
}
