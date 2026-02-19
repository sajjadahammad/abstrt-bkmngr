'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Bookmark, Collection } from '@/lib/types'
import { AppSidebar } from '@/components/app-sidebar'
import { BookmarkGrid } from '@/components/bookmark-grid'
import { BookmarkHeader } from '@/components/bookmark-header'
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog'
import { AddCollectionDialog } from '@/components/add-collection-dialog'
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog'
import { toast } from 'sonner'

interface DashboardShellProps {
  user: User
  initialBookmarks: Bookmark[]
  initialCollections: Collection[]
}

export function DashboardShell({ user, initialBookmarks, initialCollections }: DashboardShellProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)
  const [addCollectionOpen, setAddCollectionOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const openAddBookmarkDialog = useCallback(() => {
    requestAnimationFrame(() => setAddBookmarkOpen(true))
  }, [])

  const handleBookmarkCreated = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((item) => item.id === bookmark.id)) {
        return prev
      }
      return [bookmark, ...prev]
    })
  }, [])

  const handleCollectionCreated = useCallback((collection: Collection) => {
    setCollections((prev) => {
      if (prev.some((item) => item.id === collection.id)) {
        return prev
      }
      return [...prev, collection]
    })
  }, [])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const bookmarkChannel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => {
              const nextBookmark = payload.new as Bookmark
              if (prev.some((item) => item.id === nextBookmark.id)) {
                return prev
              }
              return [nextBookmark, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b))
            )
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== (payload.old as Bookmark).id))
          }
        }
      )
      .subscribe()

    const collectionChannel = supabase
      .channel('collections-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCollections((prev) => {
              const nextCollection = payload.new as Collection
              if (prev.some((item) => item.id === nextCollection.id)) {
                return prev
              }
              return [...prev, nextCollection]
            })
          } else if (payload.eventType === 'UPDATE') {
            setCollections((prev) =>
              prev.map((c) => (c.id === (payload.new as Collection).id ? (payload.new as Collection) : c))
            )
          } else if (payload.eventType === 'DELETE') {
            setCollections((prev) => prev.filter((c) => c.id !== (payload.old as Collection).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(bookmarkChannel)
      supabase.removeChannel(collectionChannel)
    }
  }, [user.id])

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (showFavorites && !bookmark.is_favorite) return false
    if (activeCollection && bookmark.collection_id !== activeCollection) return false
    if (activeCollection === null && !showFavorites) {
      // "All Bookmarks" - show everything
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.tags.some((t) => t.toLowerCase().includes(query))
      )
    }
    return true
  })

  const getCollectionCount = useCallback(
    (collectionId: string) => {
      return bookmarks.filter((b) => b.collection_id === collectionId).length
    },
    [bookmarks]
  )

  const handleDeleteBookmark = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to delete bookmark')
      return
    }

    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
  }

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const supabase = createClient()
    const nextFavorite = !isFavorite
    const { error } = await supabase
      .from('bookmarks')
      .update({ is_favorite: nextFavorite })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to update favorite')
      return
    }

    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              is_favorite: nextFavorite,
            }
          : bookmark
      )
    )
  }

  const handleDeleteCollection = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to delete collection')
      return
    }

    setCollections((prev) => prev.filter((collection) => collection.id !== id))
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.collection_id === id
          ? {
              ...bookmark,
              collection_id: null,
            }
          : bookmark
      )
    )

    if (activeCollection === id) {
      setActiveCollection(null)
      setShowFavorites(false)
    }
  }

  const activeCollectionData = collections.find((c) => c.id === activeCollection)

  const headerTitle = showFavorites
    ? 'Favorites'
    : activeCollectionData
      ? activeCollectionData.name
      : 'All Bookmarks'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        user={user}
        collections={collections}
        activeCollection={activeCollection}
        showFavorites={showFavorites}
        bookmarkCount={bookmarks.length}
        getCollectionCount={getCollectionCount}
        onSelectAll={() => {
          setActiveCollection(null)
          setShowFavorites(false)
        }}
        onSelectFavorites={() => {
          setShowFavorites(true)
          setActiveCollection(null)
        }}
        onSelectCollection={(id) => {
          setActiveCollection(id)
          setShowFavorites(false)
        }}
        onAddCollection={() => setAddCollectionOpen(true)}
        onDeleteCollection={handleDeleteCollection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <BookmarkHeader
          title={headerTitle}
          count={filteredBookmarks.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddBookmark={openAddBookmarkDialog}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          onDelete={handleDeleteBookmark}
          onToggleFavorite={handleToggleFavorite}
          onEdit={setEditingBookmark}
        />
      </main>

      <AddBookmarkDialog
        open={addBookmarkOpen}
        onOpenChange={setAddBookmarkOpen}
        userId={user.id}
        collections={collections}
        activeCollection={activeCollection}
        onBookmarkCreated={handleBookmarkCreated}
      />

      <AddCollectionDialog
        open={addCollectionOpen}
        onOpenChange={setAddCollectionOpen}
        userId={user.id}
        onCollectionCreated={handleCollectionCreated}
      />

      {editingBookmark && (
        <EditBookmarkDialog
          open={!!editingBookmark}
          onOpenChange={(open) => !open && setEditingBookmark(null)}
          bookmark={editingBookmark}
          collections={collections}
        />
      )}
    </div>
  )
}
