'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark, Collection } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark
  collections: Collection[]
}

export function EditBookmarkDialog({
  open,
  onOpenChange,
  bookmark,
  collections,
}: EditBookmarkDialogProps) {
  const [url, setUrl] = useState(bookmark.url)
  const [title, setTitle] = useState(bookmark.title)
  const [description, setDescription] = useState(bookmark.description || '')
  const [collectionId, setCollectionId] = useState<string>(bookmark.collection_id || '')
  const [tags, setTags] = useState(bookmark.tags.join(', '))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url || !title) {
      toast.error('URL and title are required')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('bookmarks')
      .update({
        url,
        title,
        description: description || null,
        collection_id: collectionId || null,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookmark.id)

    setLoading(false)

    if (error) {
      toast.error('Failed to update bookmark')
    } else {
      toast.success('Bookmark updated')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Bookmark</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-url" className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <input
              id="edit-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-title" className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-desc" className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-collection" className="text-xs font-medium text-muted-foreground">
              Collection
            </label>
            <select
              id="edit-collection"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-tags" className="text-xs font-medium text-muted-foreground">
              Tags (comma separated)
            </label>
            <input
              id="edit-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
