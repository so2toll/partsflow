/**
 * Driver Dashboard Component
 *
 * React component for driver dashboard with current delivery and available orders.
 *
 * @component components/driver/DriverDashboardComponent
 * @version 0.1.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Driver {
  id: string;
  status: 'offline' | 'available' | 'on_delivery' | 'suspended';
  currentLat: number | null;
  currentLng: number | null;
}

interface Order {
  id: string;
  partName: string;
  partNumber: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: string;
  deliveryAddress: string;
  supplierName: string;
  createdAt: string;
  slaTargetAt: string;
}

interface Stats {
  completedToday: number;
  earningsToday: number;
  averageTime: number;
}

interface Props {
  driver: Driver | null;
  currentDelivery: Order | null;
  availableOrders: Order[];
  stats: Stats | null;
  userId: string;
}

export default function DriverDashboardComponent({
  driver,
  currentDelivery,
  availableOrders,
  stats,
  userId,
}: Props) {
  const [driverStatus, setDriverStatus] = useState(driver?.status || 'offline');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(currentDelivery);
  const [orders, setOrders] = useState<Order[]>(availableOrders);

  const toggleStatus = async () => {
    const newStatus = driverStatus === 'available' ? 'offline' : 'available';
    setUpdatingStatus(true);

    try {
      const response = await fetch('/api/drivers/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setDriverStatus(newStatus);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentOrder(data.order);
        setOrders(orders.filter((o) => o.id !== orderId));
        setDriverStatus('on_delivery');
      } else {
        alert('Failed to accept order');
      }
    } catch (error) {
      console.error('Accept order error:', error);
      alert('Failed to accept order');
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!currentOrder) return;

    try {
      const response = await fetch(`/api/orders/${currentOrder.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentOrder(data.order);

        // If delivered, clear current order and set status to available
        if (newStatus === 'delivered') {
          setCurrentOrder(null);
          setDriverStatus('available');
          // Refresh stats
          window.location.reload();
        }
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update order status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-priority-p0 text-white';
      case 'P1':
        return 'bg-priority-p1 text-white';
      case 'P2':
        return 'bg-priority-p2 text-white';
      case 'P3':
        return 'bg-info-500 text-white';
      default:
        return 'bg-neutral-400 text-white';
    }
  };

  const formatAddress = (address: string) => {
    return address.length > 50 ? address.substring(0, 50) + '...' : address;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getEta = (order: Order) => {
    const slaTarget = new Date(order.slaTargetAt);
    const now = new Date();
    const diff = Math.floor((slaTarget.getTime() - now.getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div className="min-h-screen bg-surface-100 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Status Toggle - Always visible */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-md font-semibold text-neutral-600 mb-1">
                  Your Status
                </h3>
                <p className="text-body-md text-neutral-400">
                  {driverStatus === 'available'
                    ? 'You are available for deliveries'
                    : driverStatus === 'on_delivery'
                    ? 'Currently on a delivery'
                    : 'You are offline'}
                </p>
              </div>
              <button
                onClick={toggleStatus}
                disabled={updatingStatus || driverStatus === 'on_delivery'}
                className={`relative w-20 h-10 rounded-full transition-colors ${
                  driverStatus === 'available' ? 'bg-success-500' : 'bg-neutral-300'
                } ${driverStatus === 'on_delivery' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-md transition-transform ${
                    driverStatus === 'available' ? 'left-11' : 'left-1'
                  }`}
                />
                <span className="sr-only">
                  {driverStatus === 'available' ? 'Available' : 'Offline'}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Current Delivery */}
        {currentOrder && (
          <Card className="mb-6 border-2 border-primary-500">
            <CardHeader className="bg-primary-50">
              <CardTitle>Current Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order Details */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-headline-md font-semibold text-neutral-600">
                        {currentOrder.partName}
                      </h3>
                      <p className="text-body-md text-neutral-400">
                        {currentOrder.partNumber} • {currentOrder.supplierName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                        currentOrder.priority
                      )}`}
                    >
                      {currentOrder.priority}
                    </span>
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-4">
                  <div className="border-l-4 border-info-500 pl-4 py-2 bg-info-50 rounded-r">
                    <p className="text-label-sm text-neutral-500 mb-1">Pickup Location</p>
                    <p className="text-body-md font-medium text-neutral-600">
                      {currentOrder.supplierName}
                    </p>
                  </div>

                  <div className="border-l-4 border-success-500 pl-4 py-2 bg-success-50 rounded-r">
                    <p className="text-label-sm text-neutral-500 mb-1">Delivery Address</p>
                    <p className="text-body-md font-medium text-neutral-600">
                      {formatAddress(currentOrder.deliveryAddress)}
                    </p>
                    <a
                      href={`https://maps.google.com/?daddr=${encodeURIComponent(
                        currentOrder.deliveryAddress
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary-500 hover:text-primary-600 mt-2"
                    >
                      📍 Navigate
                    </a>
                  </div>
                </div>

                {/* Status Updates */}
                <div>
                  <p className="text-label-sm text-neutral-500 mb-3">Update Status</p>
                  <div className="grid grid-cols-2 gap-3">
                    {currentOrder.status === 'dispatched' && (
                      <button
                        onClick={() => updateOrderStatus('picked_up')}
                        className="btn btn-primary py-4 text-body-md"
                      >
                        📦 Picked Up
                      </button>
                    )}
                    {currentOrder.status === 'picked_up' && (
                      <button
                        onClick={() => updateOrderStatus('en_route')}
                        className="btn btn-primary py-4 text-body-md"
                      >
                        🚗 En Route
                      </button>
                    )}
                    {(currentOrder.status === 'en_route' || currentOrder.status === 'picked_up') && (
                      <button
                        onClick={() => updateOrderStatus('delivered')}
                        className="btn btn-success py-4 text-body-md bg-success-500 hover:bg-success-600"
                      >
                        ✅ Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* ETA */}
                <div className="text-center py-3 bg-warning-50 rounded">
                  <p className="text-label-sm text-neutral-500 mb-1">ETA</p>
                  <p className="text-headline-md font-bold text-warning-700">
                    {getEta(currentOrder)} min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Orders Queue */}
        {driverStatus === 'available' && !currentOrder && orders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-headline-lg font-bold text-neutral-600 mb-4">
              Available Orders
            </h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-2 border-primary-200">
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                              order.priority
                            )}`}
                          >
                            {order.priority}
                          </span>
                          <span className="text-label-sm text-neutral-500">
                            ETA: {getEta(order)} min
                          </span>
                        </div>
                        <h3 className="text-headline-md font-semibold text-neutral-600 mb-1">
                          {order.partName}
                        </h3>
                        <p className="text-body-md text-neutral-400">
                          {order.partNumber} • {order.supplierName}
                        </p>
                        <p className="text-body-md text-neutral-500 mt-2">
                          📍 {formatAddress(order.deliveryAddress)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => acceptOrder(order.id)}
                      className="w-full btn btn-primary py-4 text-body-md"
                    >
                      Accept Delivery
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Orders */}
        {driverStatus === 'available' && !currentOrder && orders.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <p className="text-headline-md font-semibold text-neutral-500 mb-2">
                No orders available
              </p>
              <p className="text-body-md text-neutral-400">
                You&apos;re all caught up! We&apos;ll notify you when new orders come in.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Offline Message */}
        {driverStatus === 'offline' && !currentOrder && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <p className="text-headline-md font-semibold text-neutral-500 mb-2">
                You are offline
              </p>
              <p className="text-body-md text-neutral-400 mb-6">
                Toggle your status to available to receive orders
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-primary-500">
                    {stats.completedToday}
                  </p>
                  <p className="text-label-sm text-neutral-500">Deliveries</p>
                </div>
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-success-500">
                    ${stats.earningsToday.toFixed(2)}
                  </p>
                  <p className="text-label-sm text-neutral-500">Earnings</p>
                </div>
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-info-500">
                    {stats.averageTime}m
                  </p>
                  <p className="text-label-sm text-neutral-500">Avg Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Action Bar - Sticky for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 md:hidden">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                driverStatus === 'available' ? 'bg-success-500' : 'bg-neutral-300'
              }`}
            />
            <span className="text-body-md font-medium text-neutral-600">
              {driverStatus === 'available' ? 'Available' : 'Offline'}
            </span>
          </div>
          {currentOrder && (
            <button
              onClick={() => updateOrderStatus('delivered')}
              className="btn btn-success bg-success-500 hover:bg-success-600"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
