'use client'

import type { Bookmark } from '@/lib/types'
import { BookmarkCard } from '@/components/bookmark-card'
import { Bookmark as BookmarkIcon } from 'lucide-react'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onEdit: (bookmark: Bookmark) => void
}

export function BookmarkGrid({ bookmarks, onDelete, onToggleFavorite, onEdit }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <BookmarkIcon className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No bookmarks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click the "New" button to add your first bookmark.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}
