'use server'

import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: '인증 필요' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { supabase: null, error: '관리자 권한이 없습니다.' }
  return { supabase, error: null }
}

export async function getPendingAssignments() {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return { error, assignments: [] }

  const { data } = await supabase
    .from('assignments')
    .select('*, profiles(nickname, email)')
    .eq('is_published', false)
    .order('created_at', { ascending: false })

  return { assignments: data ?? [] }
}

export async function getTranscriptUrl(transcriptPath: string) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return { error, url: null }

  const { data } = await supabase.storage
    .from('transcripts')
    .createSignedUrl(transcriptPath, 60 * 10)

  return { url: data?.signedUrl ?? null }
}

export async function approveAssignment(assignmentId: string, asExcellent: boolean) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return { error }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('uploader_id, has_professor_feedback, transcript_url')
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { error: '과제를 찾을 수 없습니다.' }

  // 성적 인증 이미지 삭제 (승인 후 불필요, 용량 절약)
  if (assignment.transcript_url) {
    await supabase.storage.from('transcripts').remove([assignment.transcript_url])
  }

  await supabase.from('assignments').update({
    is_published: true,
    is_verified: asExcellent,
    transcript_url: null,
  }).eq('id', assignmentId)

  await supabase.rpc('adjust_points', {
    p_user_id: assignment.uploader_id,
    p_amount: 30,
    p_type: 'upload_reward',
    p_ref_assignment_id: assignmentId,
  })

  if (asExcellent) {
    await supabase.rpc('adjust_points', {
      p_user_id: assignment.uploader_id,
      p_amount: 50,
      p_type: 'excellence_bonus',
      p_ref_assignment_id: assignmentId,
    })

    if (assignment.has_professor_feedback) {
      await supabase.rpc('adjust_points', {
        p_user_id: assignment.uploader_id,
        p_amount: 20,
        p_type: 'feedback_bonus',
        p_ref_assignment_id: assignmentId,
      })
    }
  }

  return { success: true }
}

export async function rejectAssignment(assignmentId: string) {
  const { supabase, error } = await verifyAdmin()
  if (error || !supabase) return { error }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('file_url, transcript_url')
    .eq('id', assignmentId)
    .single()

  if (assignment?.file_url) {
    await supabase.storage.from('assignments').remove([assignment.file_url])
  }
  if (assignment?.transcript_url) {
    await supabase.storage.from('transcripts').remove([assignment.transcript_url])
  }

  await supabase.from('assignments').delete().eq('id', assignmentId)

  return { success: true }
}
