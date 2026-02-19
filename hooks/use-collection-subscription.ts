import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseCollectionSubscriptionOptions {
  userId: string
  onInsert?: (collection: Collection) => void
  onUpdate?: (collection: Collection) => void
  onDelete?: (collectionId: string) => void
  onError?: (error: Error) => void
}

export function useCollectionSubscription({
  userId,
  onInsert,
  onUpdate,
  onDelete,
  onError,
}: UseCollectionSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const handleError = useCallback(
    (error: Error) => {
      console.error('Collection subscription error:', error)
      onError?.(error)

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          console.log(`Attempting to reconnect collection subscription (attempt ${reconnectAttemptsRef.current})`)
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
      .channel(`collections-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const collection = payload.new as Collection
              onInsert?.(collection)
            } else if (payload.eventType === 'UPDATE') {
              const collection = payload.new as Collection
              onUpdate?.(collection)
            } else if (payload.eventType === 'DELETE') {
              const collection = payload.old as Collection
              onDelete?.(collection.id)
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
          console.log('Collection subscription active')
          reconnectAttemptsRef.current = 0
        } else if (status === 'CHANNEL_ERROR') {
          handleError(new Error(err?.message || 'Channel error'))
        } else if (status === 'TIMED_OUT') {
          handleError(new Error('Subscription timed out'))
        } else if (status === 'CLOSED') {
          console.log('Collection subscription closed')
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
