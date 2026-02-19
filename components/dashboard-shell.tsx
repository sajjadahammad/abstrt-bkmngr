'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Bookmark, Collection } from '@/lib/types'
import { AppSidebar } from '@/components/app-sidebar'
import { BookmarkGrid } from '@/components/bookmark-grid'
import { BookmarkHeader } from '@/components/bookmark-header'
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog'
import { AddCollectionDialog } from '@/components/add-collection-dialog'
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useBookmarkSubscription } from '@/hooks/use-bookmark-subscription'
import { useCollectionSubscription } from '@/hooks/use-collection-subscription'
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<{ type: 'bookmark' | 'collection'; id: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  // Real-time subscriptions using custom hooks
  useBookmarkSubscription({
    userId: user.id,
    onInsert: (bookmark: Bookmark) => {
      setBookmarks((prev) => {
        if (prev.some((item) => item.id === bookmark.id)) {
          return prev
        }
        return [bookmark, ...prev]
      })
    },
    onUpdate: (bookmark: Bookmark) => {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmark.id ? bookmark : b))
      )
    },
    onDelete: (bookmarkId: string) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
    },
    onError: (error: Error) => {
      console.error('Bookmark subscription error:', error)
      toast.error('Connection issue. Reconnecting...')
    },
  })

  useCollectionSubscription({
    userId: user.id,
    onInsert: (collection: Collection) => {
      setCollections((prev) => {
        if (prev.some((item) => item.id === collection.id)) {
          return prev
        }
        return [...prev, collection]
      })
    },
    onUpdate: (collection: Collection) => {
      setCollections((prev) =>
        prev.map((c) => (c.id === collection.id ? collection : c))
      )
    },
    onDelete: (collectionId: string) => {
      setCollections((prev) => prev.filter((c) => c.id !== collectionId))
      // Update bookmarks that belonged to deleted collection
      setBookmarks((prev) =>
        prev.map((bookmark) =>
          bookmark.collection_id === collectionId
            ? { ...bookmark, collection_id: null }
            : bookmark
        )
      )
      // Reset active collection if it was deleted
      if (activeCollection === collectionId) {
        setActiveCollection(null)
        setShowFavorites(false)
      }
    },
    onError: (error: Error) => {
      console.error('Collection subscription error:', error)
      toast.error('Connection issue. Reconnecting...')
    },
  })

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

  const handleDeleteBookmark = (id: string) => {
    setPendingDelete({ type: 'bookmark', id })
  }

  const executeDeleteBookmark = async (id: string) => {
    setDeleteLoading(true)

    // Optimistic update
    const previousBookmarks = bookmarks
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
    setDeletingIds((prev) => new Set(prev).add(id))

    const supabase = createClient()
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    setDeletingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setDeleteLoading(false)
    setPendingDelete(null)

    if (error) {
      toast.error('Failed to delete bookmark')
      setBookmarks(previousBookmarks) // Rollback
    }
  }

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const nextFavorite = !isFavorite

    // Optimistic update
    const previousBookmarks = bookmarks
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, is_favorite: nextFavorite }
          : bookmark
      )
    )

    const supabase = createClient()
    const { error } = await supabase
      .from('bookmarks')
      .update({ is_favorite: nextFavorite })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to update favorite')
      setBookmarks(previousBookmarks) // Rollback
    }
  }

  const handleDeleteCollection = (id: string) => {
    setPendingDelete({ type: 'collection', id })
  }

  const executeDeleteCollection = async (id: string) => {
    setDeleteLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    setDeleteLoading(false)
    setPendingDelete(null)

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
          userId={user.id}
          collections={collections}
        />
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={
          pendingDelete?.type === 'collection'
            ? 'Delete Collection'
            : 'Delete Bookmark'
        }
        description={
          pendingDelete?.type === 'collection'
            ? 'This will delete the collection. Bookmarks inside will be moved to "All Bookmarks".'
            : 'Are you sure you want to delete this bookmark? This action cannot be undone.'
        }
        loading={deleteLoading}
        onConfirm={() => {
          if (!pendingDelete) return
          if (pendingDelete.type === 'bookmark') {
            executeDeleteBookmark(pendingDelete.id)
          } else {
            executeDeleteCollection(pendingDelete.id)
          }
        }}
      />
    </div>
  )
}
