/**
 * SSE Manager
 *
 * Event-driven Server-Sent Events manager.
 * Tracks connected clients and broadcasts events to specific channels.
 *
 * @lib/sse/sseManager
 * @version 0.1.0
 */

import { ReadableStream } from 'stream/web';

export interface SSEClient {
  id: string;
  userId: string;
  role: string;
  channel: string;
  controller: ReadableStreamDefaultController<any>;
  connectedAt: Date;
}

export interface SSEMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a new SSE client
   */
  register(client: SSEClient): string {
    const clientId = `${client.channel}_${client.userId}_${Date.now()}`;
    this.clients.set(clientId, client);

    // Set up heartbeat for this client
    const heartbeatInterval = setInterval(() => {
      try {
        if (client.controller) {
          client.controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
        }
      } catch (error) {
        console.log(`[SSE Manager] Heartbeat failed for ${clientId}, removing client`);
        this.unregister(clientId);
      }
    }, 30000); // 30 seconds

    this.heartbeatIntervals.set(clientId, heartbeatInterval);

    return clientId;
  }

  /**
   * Unregister an SSE client
   */
  unregister(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`[SSE Manager] Client disconnected: ${client.channel} (${clientId.slice(0, 20)}...)`);
    }

    this.clients.delete(clientId);

    // Clear heartbeat interval
    const interval = this.heartbeatIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(clientId);
    }
  }

  /**
   * Broadcast a message to all clients on a specific channel
   */
  broadcast(channel: string, message: SSEMessage): void {
    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    // Only log important broadcasts, not every single one
    if (message.type !== 'heartbeat') {
      console.log(`[SSE Manager] Broadcasting '${message.type}' to '${channel}'`);
    }

    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.channel === channel) {
        try {
          client.controller.enqueue(`data: ${JSON.stringify(messageWithTimestamp)}\n\n`);
          sentCount++;
        } catch (error) {
          console.error(`[SSE Manager] Failed to send to client ${clientId}:`, error);
          this.unregister(clientId);
        }
      }
    }

    if (message.type !== 'heartbeat') {
      console.log(`[SSE Manager] Sent to ${sentCount} clients on '${channel}'`);
    }
  }

  /**
   * Get count of connected clients on a channel
   */
  getClientCount(channel: string): number {
    return Array.from(this.clients.values()).filter(c => c.channel === channel).length;
  }

  /**
   * Get all connected clients count
   */
  getTotalClientCount(): number {
    return this.clients.size;
  }
}

// Singleton instance
export const sseManager = new SSEManager();

/**
 * Helper: Broadcast driver status update
 */
export function broadcastDriverStatus(driverId: string, status: string, driverData?: any): void {
  sseManager.broadcast('driver-status', {
    type: 'driver_status_update',
    data: {
      driverId,
      status,
      ...driverData,
    },
  });
}

/**
 * Helper: Broadcast new order
 */
export function broadcastNewOrder(order: any): void {
  sseManager.broadcast('new-orders', {
    type: 'new_order',
    data: order,
  });
}

/**
 * Helper: Broadcast order status update
 */
export function broadcastOrderStatus(orderId: string, status: string, orderData?: any): void {
  sseManager.broadcast('order-status', {
    type: 'order_status_update',
    data: {
      orderId,
      status,
      ...orderData,
    },
  });
}
