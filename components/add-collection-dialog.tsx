'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createCollection } from '@/services/collection-service'
import type { Collection } from '@/lib/types'
import {
  collectionFormSchema,
  type CollectionFormValues,
} from '@/lib/validation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AddCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onCollectionCreated?: (collection: Collection) => void
}

const COLORS = [
  '#6366f1',
  '#f43f5e',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

export function AddCollectionDialog({
  open,
  onOpenChange,
  userId,
  onCollectionCreated,
}: AddCollectionDialogProps) {
  const {
    register,
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      color: COLORS[0],
    },
  })
  const selectedColor = watch('color')

  async function onSubmit(values: CollectionFormValues) {
    try {
      const data = await createCollection(userId, {
        name: values.name,
        color: values.color,
      })

      onCollectionCreated?.(data)
      toast.success('Collection created')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create collection:', error)
      toast.error('Failed to create collection')
    }
  }

  function resetForm() {
    reset({
      name: '',
      color: COLORS[0],
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="border-border bg-card sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="collection-name" className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              required
              placeholder="e.g. Design Inspiration"
              {...register('name')}
              aria-invalid={!!errors.name}
              className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <input type="hidden" {...register('color')} />
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setValue('color', c, { shouldDirty: true, shouldValidate: true })
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color.message}</p>
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
                Creating...
              </>
            ) : (
              'Create Collection'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
