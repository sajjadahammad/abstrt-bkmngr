import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseBookmarkSubscriptionOptions {
  userId: string
  onInsert?: (bookmark: Bookmark) => void
  onUpdate?: (bookmark: Bookmark) => void
  onDelete?: (bookmarkId: string) => void
  onError?: (error: Error) => void
}

export function useBookmarkSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: UseBookmarkSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const handleError = useCallback(
    (error: Error) => {
      console.error('Bookmark subscription error:', error)
      onError?.(error)

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          console.log(`Attempting to reconnect bookmark subscription (attempt ${reconnectAttemptsRef.current})`)
          // The useEffect will handle reconnection when dependencies change
        }, delay)
      }
    },
    [onError]
  )

  useEffect(() => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      return
    }

    const supabase = createClient()
    
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const bookmark = payload.new as Bookmark
              onInsert?.(bookmark)
            } else if (payload.eventType === 'UPDATE') {
              const bookmark = payload.new as Bookmark
              onUpdate?.(bookmark)
            } else if (payload.eventType === 'DELETE') {
              const bookmark = payload.old as Bookmark
              onDelete?.(bookmark.id)
            }
            
            // Reset reconnect attempts on successful message
            reconnectAttemptsRef.current = 0
          } catch (error) {
            handleError(error as Error)
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Bookmark subscription active')
          reconnectAttemptsRef.current = 0
        } else if (status === 'CHANNEL_ERROR') {
          handleError(new Error(err?.message || 'Channel error'))
        } else if (status === 'TIMED_OUT') {
          handleError(new Error('Subscription timed out'))
        } else if (status === 'CLOSED') {
          console.log('Bookmark subscription closed')
        }
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, onInsert, onUpdate, onDelete, handleError])

  return {
    isConnected: channelRef.current !== null,
  }
}
