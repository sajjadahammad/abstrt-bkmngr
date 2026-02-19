import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";
import { parseTagInput } from "@/lib/validation";

export async function createBookmark(
  userId: string,
  values: {
    url: string;
    title: string;
    description: string;
    collectionId: string;
    tags: string;
  },
) {
  const supabase = createClient();
  const trimmedUrl = values.url.trim();
  const trimmedTitle = values.title.trim();
  const trimmedDescription = values.description.trim();

  let faviconUrl: string | null = null;
  try {
    const domain = new URL(trimmedUrl).origin;
    faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    // ignore
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      url: trimmedUrl,
      title: trimmedTitle,
      description: trimmedDescription || null,
      collection_id: values.collectionId || null,
      tags: parseTagInput(values.tags),
      favicon_url: faviconUrl,
      og_image_url: null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Bookmark;
}

export async function updateBookmark(
  userId: string,
  bookmarkId: string,
  values: {
    url: string;
    title: string;
    description: string;
    collectionId: string;
    tags: string;
  },
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .update({
      url: values.url.trim(),
      title: values.title.trim(),
      description: values.description.trim() || null,
      collection_id: values.collectionId || null,
      tags: parseTagInput(values.tags),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookmarkId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Bookmark;
}

export async function deleteBookmark(userId: string, bookmarkId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function toggleFavorite(
  userId: string,
  bookmarkId: string,
  isFavorite: boolean,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .update({ is_favorite: isFavorite })
    .eq("id", bookmarkId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Bookmark;
}
