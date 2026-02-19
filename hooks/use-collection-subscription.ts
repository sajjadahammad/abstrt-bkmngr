import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Collection } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseCollectionSubscriptionOptions {
  userId: string;
  onInsert?: (collection: Collection) => void;
  onUpdate?: (collection: Collection) => void;
  onDelete?: (collectionId: string) => void;
  onError?: (error: Error) => void;
}

export function useCollectionSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: UseCollectionSubscriptionOptions) {
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

    console.log(`Setting up collection subscription for user: ${userId}`);

    const channel: RealtimeChannel = supabase
      .channel(`public:collections:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collections",
        },
        (payload) => {
          console.log("RECEIVED COLLECTION EVENT:", payload);
          try {
            if (payload.eventType === "INSERT") {
              onInsertRef.current?.(payload.new as Collection);
            } else if (payload.eventType === "UPDATE") {
              onUpdateRef.current?.(payload.new as Collection);
            } else if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string })?.id;
              if (oldId) {
                onDeleteRef.current?.(oldId);
              }
            }
          } catch (error) {
            console.error("Collection subscription handler error:", error);
            onErrorRef.current?.(error as Error);
          }
        },
      )
      .subscribe((status, err) => {
        console.log("Collection subscription status:", status, err);
        if (status === "SUBSCRIBED") {
          console.log("Collection subscription successfully established");
        } else if (status === "CHANNEL_ERROR") {
          console.error(
            "Collection channel error details:",
            JSON.stringify(err, null, 2),
          );
          onErrorRef.current?.(new Error(err?.message || "Channel error"));
        }
      });

    return () => {
      console.log("Cleaning up collection subscription");
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
