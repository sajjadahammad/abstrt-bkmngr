import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bookmark } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseBookmarkSubscriptionOptions {
  userId: string;
  onInsert?: (bookmark: Bookmark) => void;
  onUpdate?: (bookmark: Bookmark) => void;
  onDelete?: (bookmarkId: string) => void;
  onError?: (error: Error) => void;
}

export function useBookmarkSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: UseBookmarkSubscriptionOptions) {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onErrorRef = useRef(onError);

  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    console.log(`Setting up bookmark subscription for user: ${userId}`);

    const channel: RealtimeChannel = supabase
      .channel(`public:bookmarks:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          console.log("RECEIVED BOOKMARK EVENT:", payload);
          try {
            // For DELETE events, payload.new is null. We must use payload.old
            // RLS ensures we only receive rows we are allowed to see.
            if (payload.eventType === "INSERT") {
              onInsertRef.current?.(payload.new as Bookmark);
            } else if (payload.eventType === "UPDATE") {
              onUpdateRef.current?.(payload.new as Bookmark);
            } else if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string })?.id;
              if (oldId) {
                onDeleteRef.current?.(oldId);
              }
            }
          } catch (error) {
            console.error("Bookmark subscription handler error:", error);
            onErrorRef.current?.(error as Error);
          }
        },
      )
      .subscribe((status, err) => {
        console.log("Bookmark subscription status:", status, err);
        if (status === "SUBSCRIBED") {
          console.log("Bookmark subscription successfully established");
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            "Bookmark channel error details:",
            JSON.stringify(err, null, 2),
          );
          onErrorRef.current?.(new Error(err?.message || "Channel error"));
        }
      });

    return () => {
      console.log("Cleaning up bookmark subscription");
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
