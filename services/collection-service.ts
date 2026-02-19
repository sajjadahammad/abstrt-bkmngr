import { createClient } from "@/lib/supabase/client";
import type { Collection } from "@/lib/types";

export async function createCollection(
  userId: string,
  values: {
    name: string;
    color: string;
  },
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: values.name.trim(),
      color: values.color,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(userId: string, collectionId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  values: {
    name: string;
    color: string;
  },
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("collections")
    .update({
      name: values.name.trim(),
      color: values.color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", collectionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Collection;
}
