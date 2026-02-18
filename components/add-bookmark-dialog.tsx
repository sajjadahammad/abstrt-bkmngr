'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  collections: Collection[]
  activeCollection: string | null
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  userId,
  collections,
  activeCollection,
}: AddBookmarkDialogProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [collectionId, setCollectionId] = useState<string>(activeCollection || '')
  const [tags, setTags] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  async function fetchMetadata(inputUrl: string) {
    if (!inputUrl) return
    setFetching(true)
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title && !title) setTitle(data.title)
        if (data.description && !description) setDescription(data.description)
        if (data.ogImage) setOgImage(data.ogImage)
      }
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url || !title) {
      toast.error('URL and title are required')
      return
    }

    setLoading(true)
    const supabase = createClient()

    let faviconUrl: string | null = null
    try {
      const domain = new URL(url).origin
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      // ignore
    }

    const { error } = await supabase.from('bookmarks').insert({
      user_id: userId,
      url,
      title,
      description: description || null,
      collection_id: collectionId || null,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      favicon_url: faviconUrl,
      og_image_url: ogImage || null,
    })

    setLoading(false)

    if (error) {
      toast.error('Failed to add bookmark')
    } else {
      toast.success('Bookmark added')
      resetForm()
      onOpenChange(false)
    }
  }

  function resetForm() {
    setUrl('')
    setTitle('')
    setDescription('')
    setCollectionId(activeCollection || '')
    setTags('')
    setOgImage('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Bookmark</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-url" className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <input
              id="bookmark-url"
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => fetchMetadata(url)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-title" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              Title
              {fetching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </label>
            <input
              id="bookmark-title"
              type="text"
              required
              placeholder="My Bookmark"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-desc" className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              id="bookmark-desc"
              placeholder="A brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-collection" className="text-xs font-medium text-muted-foreground">
              Collection (optional)
            </label>
            <select
              id="bookmark-collection"
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
            <label htmlFor="bookmark-tags" className="text-xs font-medium text-muted-foreground">
              Tags (comma separated, optional)
            </label>
            <input
              id="bookmark-tags"
              type="text"
              placeholder="design, inspiration, dev"
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
                Adding...
              </>
            ) : (
              'Add Bookmark'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
