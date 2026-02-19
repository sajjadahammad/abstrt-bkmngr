'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { updateBookmark } from '@/services/bookmark-service'
import type { Bookmark, Collection } from '@/lib/types'
import {
  bookmarkFormSchema,
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

interface EditBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Bookmark
  userId: string
  collections: Collection[]
  onBookmarkUpdated: (bookmark: Bookmark) => void
}

function bookmarkToFormValues(bookmark: Bookmark): BookmarkFormValues {
  return {
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description || '',
    collectionId: bookmark.collection_id || '',
    tags: bookmark.tags.join(', '),
  }
}

export function EditBookmarkDialog({
  open,
  onOpenChange,
  bookmark,
  userId,
  collections,
  onBookmarkUpdated,
}: EditBookmarkDialogProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    mode: 'onBlur',
    defaultValues: bookmarkToFormValues(bookmark),
  })

  useEffect(() => {
    reset(bookmarkToFormValues(bookmark))
  }, [bookmark, reset])

  async function onSubmit(values: BookmarkFormValues) {
    try {
      const data = await updateBookmark(userId, bookmark.id, {
        url: values.url,
        title: values.title,
        description: values.description,
        collectionId: values.collectionId,
        tags: values.tags,
      })

      if (data) onBookmarkUpdated(data)
      toast.success('Bookmark updated')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Bookmark</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-url" className="text-xs font-medium text-muted-foreground">
              URL
            </label>
            <input
              id="edit-url"
              type="url"
              required
              {...register('url')}
              aria-invalid={!!errors.url}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-title" className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              required
              {...register('title')}
              aria-invalid={!!errors.title}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-desc" className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              id="edit-desc"
              {...register('description')}
              rows={2}
              aria-invalid={!!errors.description}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-collection" className="text-xs font-medium text-muted-foreground">
              Collection
            </label>
            <select
              id="edit-collection"
              {...register('collectionId')}
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
              {...register('tags')}
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
