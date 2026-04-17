export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  text: string
  created_at: string
  profiles?: Profile
}
