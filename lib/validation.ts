import { z } from 'zod'

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 500
const MAX_TAG_LENGTH = 30
const MAX_TAG_COUNT = 20
const MAX_COLLECTION_NAME_LENGTH = 60

const requiredHttpUrl = z
  .string()
  .trim()
  .min(1, 'URL is required.')
  .url('Enter a valid URL.')
  .refine((value) => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Enter a valid URL starting with http:// or https://.')

export const bookmarkFormSchema = z.object({
  url: requiredHttpUrl,
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or less.`),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less.`
    ),
  collectionId: z.string(),
  tags: z.string(),
})
.superRefine((values, ctx) => {
  const parsedTags = parseTagInput(values.tags)

  if (parsedTags.length > MAX_TAG_COUNT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Use no more than ${MAX_TAG_COUNT} tags.`,
      path: ['tags'],
    })
    return
  }

  if (parsedTags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Each tag must be ${MAX_TAG_LENGTH} characters or less.`,
      path: ['tags'],
    })
  }
})

export const collectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Collection name is required.')
    .max(
      MAX_COLLECTION_NAME_LENGTH,
      `Collection name must be ${MAX_COLLECTION_NAME_LENGTH} characters or less.`
    ),
  color: z.string().trim().min(1, 'Color is required.'),
})

export type BookmarkFormValues = z.infer<typeof bookmarkFormSchema>
export type CollectionFormValues = z.infer<typeof collectionFormSchema>

export function parseTagInput(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
