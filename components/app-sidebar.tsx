'use client'

import type { User } from '@supabase/supabase-js'
import type { Collection } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bookmark,
  Star,
  FolderPlus,
  LogOut,
  Trash2,
  ChevronLeft,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  user: User
  collections: Collection[]
  activeCollection: string | null
  showFavorites: boolean
  bookmarkCount: number
  getCollectionCount: (id: string) => number
  onSelectAll: () => void
  onSelectFavorites: () => void
  onSelectCollection: (id: string) => void
  onAddCollection: () => void
  onDeleteCollection: (id: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function AppSidebar({
  user,
  collections,
  activeCollection,
  showFavorites,
  bookmarkCount,
  getCollectionCount,
  onSelectAll,
  onSelectFavorites,
  onSelectCollection,
  onAddCollection,
  onDeleteCollection,
  isOpen,
  onToggle,
}: AppSidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Bookmark className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">Smart Bookmark</span>
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-1">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Library
          </p>
          <button
            onClick={onSelectAll}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
              !activeCollection && !showFavorites
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <span className="flex items-center gap-2.5">
              <LayoutGrid className="h-4 w-4" />
              All Bookmarks
            </span>
            <span className="text-xs text-muted-foreground">{bookmarkCount}</span>
          </button>
          <button
            onClick={onSelectFavorites}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
              showFavorites
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <span className="flex items-center gap-2.5">
              <Star className="h-4 w-4" />
              Favorites
            </span>
          </button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              Collections
            </p>
            <button
              onClick={onAddCollection}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={cn(
                  'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
                  activeCollection === collection.id
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <button
                  onClick={() => onSelectCollection(collection.id)}
                  className="flex flex-1 items-center gap-2.5 text-left"
                >
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: collection.color }}
                  />
                  <span className="truncate">{collection.name}</span>
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {getCollectionCount(collection.id)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteCollection(collection.id)
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {collections.length === 0 && (
              <p className="px-2.5 py-4 text-center text-xs text-muted-foreground/50">
                No collections yet
              </p>
            )}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between rounded-lg px-2 py-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || 'User'}
                className="h-7 w-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                {(user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user.user_metadata?.full_name || user.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
