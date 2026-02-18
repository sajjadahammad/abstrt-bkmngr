'use client'

import { Search, Plus, PanelLeftClose, PanelLeft } from 'lucide-react'

interface BookmarkHeaderProps {
  title: string
  count: number
  searchQuery: string
  onSearchChange: (query: string) => void
  onAddBookmark: () => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function BookmarkHeader({
  title,
  count,
  searchQuery,
  onSearchChange,
  onAddBookmark,
  onToggleSidebar,
  sidebarOpen,
}: BookmarkHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">
            {count} bookmark{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-64 rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        <button
          onClick={onAddBookmark}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </button>
      </div>
    </header>
  )
}
