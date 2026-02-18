export interface Bookmark {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  url: string
  description: string | null
  favicon_url: string | null
  og_image_url: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  created_at: string
  updated_at: string
}
