'use client'

import { useState } from 'react'
import type { Bookmark } from '@/lib/types'
import { Star, Trash2, ExternalLink, Pencil, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onEdit: (bookmark: Bookmark) => void
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).origin
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

function getDomainColor(url: string) {
  const domain = getDomainFromUrl(url)
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 50%, 25%)`
}

export function BookmarkCard({ bookmark, onDelete, onToggleFavorite, onEdit }: BookmarkCardProps) {
  const [imgError, setImgError] = useState(false)
  const faviconUrl = bookmark.favicon_url || getFaviconUrl(bookmark.url)
  const domain = getDomainFromUrl(bookmark.url)

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* OG Image / Color Block */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[16/9] overflow-hidden"
      >
        {bookmark.og_image_url && !imgError ? (
          <img
            src={bookmark.og_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: getDomainColor(bookmark.url) }}
          >
            <Globe className="h-10 w-10 text-foreground/20" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 flex items-start justify-end gap-1.5 bg-gradient-to-b from-black/40 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(bookmark.id, bookmark.is_favorite)
            }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md bg-black/40 backdrop-blur-sm transition-colors',
              bookmark.is_favorite ? 'text-yellow-400' : 'text-foreground/80 hover:text-yellow-400'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', bookmark.is_favorite && 'fill-current')} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(bookmark)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-foreground/80 backdrop-blur-sm transition-colors hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(bookmark.id)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-foreground/80 backdrop-blur-sm transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </a>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start gap-2.5">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="mt-0.5 h-4 w-4 rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link flex items-center gap-1"
            >
              <h3 className="truncate text-sm font-medium text-foreground group-hover/link:text-primary">
                {bookmark.title}
              </h3>
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
            </a>
            <p className="truncate text-xs text-muted-foreground">{domain}</p>
          </div>
        </div>

        {bookmark.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">
            {bookmark.description}
          </p>
        )}

        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
