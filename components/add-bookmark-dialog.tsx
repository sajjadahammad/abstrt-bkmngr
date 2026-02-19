'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark, Collection } from '@/lib/types'
import {
  bookmarkFormSchema,
  parseTagInput,
  type BookmarkFormValues,
} from '@/lib/validation'
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
  onBookmarkCreated?: (bookmark: Bookmark) => void
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  userId,
  collections,
  activeCollection,
  onBookmarkCreated,
}: AddBookmarkDialogProps) {
  const [ogImage, setOgImage] = useState('')
  const [fetching, setFetching] = useState(false)
  const {
    register,
    reset,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    mode: 'onBlur',
    defaultValues: {
      url: '',
      title: '',
      description: '',
      collectionId: activeCollection || '',
      tags: '',
    },
  })

  useEffect(() => {
    if (open) {
      setValue('collectionId', activeCollection || '')
    }
  }, [activeCollection, open, setValue])

  const urlField = register('url')
  const titleField = register('title')
  const descriptionField = register('description')
  const collectionField = register('collectionId')
  const tagsField = register('tags')

  async function fetchMetadata(inputUrl: string) {
    if (!inputUrl.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.title && !getValues('title').trim()) {
          setValue('title', data.title, { shouldDirty: true, shouldValidate: true })
        }
        if (data.description && !getValues('description').trim()) {
          setValue('description', data.description, { shouldDirty: true, shouldValidate: true })
        }
        if (data.ogImage) setOgImage(data.ogImage)
      }
    } catch {
      // silently fail
    } finally {
      setFetching(false)
    }
  }

  async function onSubmit(values: BookmarkFormValues) {
    const supabase = createClient()
    const trimmedUrl = values.url.trim()
    const trimmedTitle = values.title.trim()
    const trimmedDescription = values.description.trim()

    let faviconUrl: string | null = null
    try {
      const domain = new URL(trimmedUrl).origin
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      // ignore
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: trimmedUrl,
        title: trimmedTitle,
        description: trimmedDescription || null,
        collection_id: values.collectionId || null,
        tags: parseTagInput(values.tags),
        favicon_url: faviconUrl,
        og_image_url: ogImage || null,
      })
      .select('*')
      .single()

    if (error || !data) {
      toast.error('Failed to add bookmark')
    } else {
      onBookmarkCreated?.(data as Bookmark)
      toast.success('Bookmark added')
      resetForm()
      onOpenChange(false)
    }
  }

  function resetForm() {
    reset({
      url: '',
      title: '',
      description: '',
      collectionId: activeCollection || '',
      tags: '',
    })
    setOgImage('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Bookmark</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-url" className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <input
              id="bookmark-url"
              type="url"
              required
              placeholder="https://example.com"
              {...urlField}
              onBlur={(e) => {
                urlField.onBlur(e)
                void fetchMetadata(e.target.value)
              }}
              aria-invalid={!!errors.url}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
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
              {...titleField}
              aria-invalid={!!errors.title}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-desc" className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              id="bookmark-desc"
              placeholder="A brief description..."
              {...descriptionField}
              rows={2}
              aria-invalid={!!errors.description}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bookmark-collection" className="text-xs font-medium text-muted-foreground">
              Collection (optional)
            </label>
            <select
              id="bookmark-collection"
              {...collectionField}
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
              {...tagsField}
              aria-invalid={!!errors.tags}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.tags && (
              <p className="text-xs text-destructive">{errors.tags.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
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
