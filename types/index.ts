export type Assignment = {
  id: string
  title: string
  school: string
  department: string
  subject: string
  professor: string | null
  grade: 'A+' | 'A0' | 'B+' | 'B0' | 'other'
  file_url: string
  transcript_url: string | null
  has_professor_feedback: boolean
  point_cost: number
  download_count: number
  is_verified: boolean
  is_published: boolean
  uploader_id: string
  created_at: string
}

export type Profile = {
  id: string
  email: string
  nickname: string
  points: number
  created_at: string
}

export type PointTransaction = {
  id: string
  user_id: string
  amount: number
  type: 'signup_bonus' | 'upload_reward' | 'excellence_bonus' | 'feedback_bonus' | 'download'
  ref_assignment_id: string | null
  created_at: string
}

export type Download = {
  id: string
  user_id: string
  assignment_id: string
  created_at: string
}

export type Bookmark = {
  id: string
  user_id: string
  assignment_id: string
  created_at: string
}
