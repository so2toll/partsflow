/**
 * useSSE Hook
 *
 * React hook for Server-Sent Events (SSE) real-time updates.
 *
 * @hooks lib/hooks/useSSE
 * @version 0.1.0
 */

import { useEffect, useState, useRef } from 'react';

interface SSEMessage {
  type: string;
  data?: any;
  message?: string;
}

interface UseSSEOptions {
  endpoint: string;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
}

export function useSSE({ endpoint, onMessage, onError }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Use refs to store callbacks to prevent effect re-running on every render
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    // Check if EventSource is supported (not available during SSR)
    if (typeof EventSource === 'undefined') {
      console.log('[useSSE] EventSource not supported');
      return;
    }

    // Prevent duplicate connections
    if (eventSourceRef.current) {
      console.log(`[useSSE] Connection to ${endpoint} already exists, skipping`);
      return;
    }

    console.log(`[useSSE] Connecting to ${endpoint}`);
    const eventSource = new EventSource(endpoint);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`[useSSE] Connected to ${endpoint}`);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SSEMessage;
        // Only log important events, not every heartbeat
        if (message.type !== 'heartbeat') {
          console.log(`[useSSE] ${endpoint}: ${message.type}`);
        }
        setLastMessage(message);

        if (onMessageRef.current) {
          onMessageRef.current(message);
        }
      } catch (error) {
        console.error(`[useSSE] Error parsing message from ${endpoint}:`, error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`[useSSE] Error from ${endpoint}:`, error);
      setIsConnected(false);

      if (onErrorRef.current) {
        onErrorRef.current(error);
      }

      // EventSource will automatically attempt to reconnect
    };

    return () => {
      console.log(`[useSSE] Disconnecting from ${endpoint}`);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [endpoint]); // Only depend on endpoint, not callbacks

  return {
    isConnected,
    lastMessage,
  };
}

/**
 * Hook for driver status SSE updates
 */
export function useDriverStatusSSE(onMessage?: (message: SSEMessage) => void) {
  return useSSE({
    endpoint: '/api/sse/driver-status',
    onMessage,
    onError: (error) => {
      console.error('[DriverStatusSSE] Error:', error);
    },
  });
}

/**
 * Hook for order status SSE updates
 */
export function useOrderStatusSSE(onMessage?: (message: SSEMessage) => void) {
  return useSSE({
    endpoint: '/api/sse/order-status',
    onMessage,
    onError: (error) => {
      console.error('[OrderStatusSSE] Error:', error);
    },
  });
}

/**
 * Hook for new orders SSE updates
 */
export function useNewOrdersSSE(onMessage?: (message: SSEMessage) => void) {
  return useSSE({
    endpoint: '/api/sse/new-orders',
    onMessage,
    onError: (error) => {
      console.error('[NewOrdersSSE] Error:', error);
    },
  });
}
