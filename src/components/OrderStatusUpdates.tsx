/**
 * Order Status Updates Component
 *
 * React hook and component for subscribing to real-time order status updates via Server-Sent Events.
 *
 * @example
 * ```tsx
 * // Use the hook in your component
 * function OrderDetail() {
 *   const { status, error, isConnected } = useOrderStatusUpdates('order_123');
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       {error && <p>Error: {error}</p>}
 *       {!isConnected && <p>Connecting...</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  previousStatus?: string;
  timestamp: string;
  message?: string;
  error?: string;
}

export interface UseOrderStatusUpdatesOptions {
  onStatusChange?: (event: OrderStatusEvent) => void;
  onTerminal?: (event: OrderStatusEvent) => void;
  onError?: (error: string) => void;
  reconnectInterval?: number;
  enabled?: boolean;
}

export interface UseOrderStatusUpdatesReturn {
  status: string | null;
  error: string | null;
  isConnected: boolean;
  isTerminal: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

/**
 * React hook for subscribing to order status updates via SSE
 *
 * @param orderId - The order ID to subscribe to
 * @param options - Configuration options
 * @returns Order status state and connection info
 */
export function useOrderStatusUpdates(
  orderId: string,
  options: UseOrderStatusUpdatesOptions = {}
): UseOrderStatusUpdatesReturn {
  const {
    onStatusChange,
    onTerminal,
    onError,
    reconnectInterval = 3000,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Clean up function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    cleanup();

    if (!mountedRef.current || !enabled) {
      return;
    }

    setError(null);

    const connect = () => {
      if (!mountedRef.current || !enabled) {
        return;
      }

      const eventSource = new EventSource(`/api/orders/${orderId}/events`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
      };

      eventSource.addEventListener('connected', (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          setStatus(data.status);
          setIsTerminal(data.status === 'confirmed' || data.status === 'cancelled');
          setLastUpdate(new Date(data.timestamp));
        } catch (err) {
          console.error('[OrderStatusUpdates] Failed to parse connected event:', err);
        }
      });

      eventSource.addEventListener('status_update', (event) => {
        if (!mountedRef.current) return;

        try {
          const data: OrderStatusEvent = JSON.parse(event.data);
          setStatus(data.status);
          setLastUpdate(new Date(data.timestamp));

          const terminal = data.status === 'confirmed' || data.status === 'cancelled';
          setIsTerminal(terminal);

          // Call callbacks
          if (onStatusChange) {
            onStatusChange(data);
          }

          if (terminal && onTerminal) {
            onTerminal(data);
            // Close connection on terminal status
            cleanup();
          }
        } catch (err) {
          console.error('[OrderStatusUpdates] Failed to parse status_update event:', err);
        }
      });

      eventSource.addEventListener('terminal', (event) => {
        if (!mountedRef.current) return;

        try {
          const data: OrderStatusEvent = JSON.parse(event.data);
          setStatus(data.status);
          setIsTerminal(true);
          setLastUpdate(new Date(data.timestamp));

          if (onTerminal) {
            onTerminal(data);
          }

          // Close connection on terminal status
          cleanup();
        } catch (err) {
          console.error('[OrderStatusUpdates] Failed to parse terminal event:', err);
        }
      });

      eventSource.addEventListener('error', (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          const errorMessage = data.error || 'Unknown error';
          setError(errorMessage);

          if (onError) {
            onError(errorMessage);
          }

          // Close connection on error
          cleanup();

          // Attempt to reconnect if not a critical error
          if (data.error !== 'Order not found') {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current && enabled) {
                connect();
              }
            }, reconnectInterval);
          }
        } catch (err) {
          console.error('[OrderStatusUpdates] Failed to parse error event:', err);
          setError('Failed to parse error event');
        }
      });

      eventSource.onerror = (err) => {
        if (!mountedRef.current) return;

        console.error('[OrderStatusUpdates] EventSource error:', err);
        setIsConnected(false);
        setError('Connection lost');

        cleanup();

        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && enabled) {
            connect();
          }
        }, reconnectInterval);
      };
    };

    connect();
  }, [orderId, enabled, reconnectInterval, cleanup, onStatusChange, onTerminal, onError]);

  // Connect when component mounts or orderId/enabled changes
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && orderId) {
      reconnect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [orderId, enabled]); // Only reconnect when orderId or enabled changes

  return {
    status,
    error,
    isConnected,
    isTerminal,
    lastUpdate,
    reconnect,
  };
}

/**
 * OrderStatusUpdates Component
 *
 * A ready-to-use component that displays order status with real-time updates.
 *
 * @example
 * ```tsx
 * <OrderStatusUpdates
 *   orderId="order_123"
 *   onStatusChange={(event) => console.log('Status changed:', event.status)}
 *   onTerminal={(event) => console.log('Order terminal:', event.status)}
 * />
 * ```
 */
interface OrderStatusUpdatesProps {
  orderId: string;
  onStatusChange?: (event: OrderStatusEvent) => void;
  onTerminal?: (event: OrderStatusEvent) => void;
  onError?: (error: string) => void;
  showStatus?: boolean;
  showConnectionStatus?: boolean;
  className?: string;
}

export function OrderStatusUpdates({
  orderId,
  onStatusChange,
  onTerminal,
  onError,
  showStatus = true,
  showConnectionStatus = true,
  className = '',
}: OrderStatusUpdatesProps) {
  const { status, error, isConnected, isTerminal, lastUpdate } = useOrderStatusUpdates(orderId, {
    onStatusChange,
    onTerminal,
    onError,
  });

  if (!showStatus && !showConnectionStatus) {
    return null;
  }

  return (
    <div className={`order-status-updates ${className}`}>
      {showStatus && (
        <div className="status-display">
          <span className="status-label">Status:</span>
          <span className={`status-value status-${status}`}>
            {status || 'Loading...'}
          </span>
          {isTerminal && (
            <span className="terminal-badge">Terminal</span>
          )}
        </div>
      )}

      {showConnectionStatus && (
        <div className="connection-status">
          <span className={`indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="connection-text">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {lastUpdate && (
        <div className="last-update">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
