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
  activeDeliveries: Order[];
  availableOrders: Order[];
  stats: Stats | null;
  userId: string;
}

export default function DriverDashboardComponent({
  driver,
  activeDeliveries: initialActiveDeliveries,
  availableOrders,
  stats,
  userId,
}: Props) {
  // Debug logging
  console.log('[DriverDashboardComponent] Props received:', {
    driverId: driver?.id,
    driverStatus: driver?.status,
    activeDeliveriesCount: initialActiveDeliveries?.length || 0,
    availableOrdersCount: availableOrders?.length,
    timestamp: new Date().toISOString()
  });

  const [driverStatus, setDriverStatus] = useState(driver?.status || 'offline');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orders, setOrders] = useState<Order[]>(availableOrders);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>(initialActiveDeliveries || []);

  // Log when driver prop changes (page load/refresh)
  useEffect(() => {
    console.log('[DriverDashboardComponent] Driver prop changed:', {
      driverId: driver?.id,
      driverStatus: driver?.status,
      localDriverStatus: driverStatus,
      timestamp: new Date().toISOString()
    });
  }, [driver?.id, driver?.status]);

  // Listen for status changes from sidebar (via BroadcastChannel)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('driver-status');
    channel.onmessage = (event) => {
      const { status } = event.data;
      setDriverStatus(status);
    };

    return () => {
      channel.close();
    };
  }, []);

  const toggleStatus = async () => {
    // Check if driver has active deliveries before going offline
    if (driverStatus === 'available' && activeDeliveries.length > 0) {
      const confirmed = confirm(
        `You have ${activeDeliveries.length} active delivery(ies). Are you sure you want to go offline? Complete your deliveries first.`
      );
      if (!confirmed) return;
    }

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

        // Notify other components via BroadcastChannel (client-side only)
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('driver-status');
          channel.postMessage({ status: newStatus });
        }
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
        console.log('[DriverDashboard] Order accepted:', data.order);
        // Add to active deliveries instead of replacing
        setActiveDeliveries([...activeDeliveries, data.order]);
        setOrders(orders.filter((o) => o.id !== orderId));
        // Don't change driver status - allow bulk pickups
      } else {
        const errorData = await response.json();
        alert(`Failed to accept order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Accept order error:', error);
      alert('Failed to accept order');
    }
  };

  const updateOrderStatus = async (newStatus: string, orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[DriverDashboard] Order status updated:', data.order);

        // Update the delivery in activeDeliveries
        setActiveDeliveries(activeDeliveries.map(d =>
          d.id === orderId ? data.order : d
        ));

        // If delivered, remove from active deliveries
        if (newStatus === 'delivered') {
          setActiveDeliveries(activeDeliveries.filter(d => d.id !== orderId));
          // Refresh to get updated stats
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`);
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

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        {/* Driver Profile Header with Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl">
              <span className="material-symbols-outlined">directions_car</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral-700">Marcus D.</h2>
              <p className="text-sm text-neutral-500">Baltimore Zone A</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${driverStatus === 'available' ? 'bg-success-500' : 'bg-neutral-400'}`} />
              <span className="text-sm font-semibold text-success-600">
                {driverStatus === 'available' ? 'Online' : driverStatus === 'offline' ? 'Offline' : 'On Delivery'}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 text-center border border-neutral-200 shadow-sm">
              <p className="text-2xl font-bold text-success-600">${stats?.earningsToday.toFixed(0) || '0'}</p>
              <p className="text-xs text-neutral-500 mt-1">Today's Earnings</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-neutral-200 shadow-sm">
              <p className="text-2xl font-bold text-neutral-700">{stats?.completedToday || '0'}</p>
              <p className="text-xs text-neutral-500 mt-1">Deliveries</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-neutral-200 shadow-sm">
              <p className="text-2xl font-bold text-yellow-600">4.9★</p>
              <p className="text-xs text-neutral-500 mt-1">Rating</p>
            </div>
          </div>

          {/* Status Toggle */}
          <Card className="mt-4">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-headline-md font-semibold text-neutral-600 mb-1">
                    Your Status
                  </h3>
                  <p className="text-body-md text-neutral-400">
                    {driverStatus === 'available'
                      ? `You are available for deliveries${activeDeliveries.length > 0 ? ` (${activeDeliveries.length} active)` : ''}`
                      : 'You are offline'}
                  </p>
                </div>
                <button
                  onClick={toggleStatus}
                  disabled={updatingStatus}
                  className={`relative w-20 h-10 rounded-full transition-colors ${
                    driverStatus === 'available' ? 'bg-success-500' : 'bg-neutral-300'
                  }`}
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
        </div>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-headline-lg font-bold text-neutral-600 mb-4">
              Active Deliveries ({activeDeliveries.length})
            </h2>
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border-2 border-primary-500 bg-white">
                  <CardContent className="py-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-headline-md font-semibold text-neutral-600 mb-1">
                          {delivery.partName}
                        </h3>
                        <p className="text-body-md text-neutral-400">
                          {delivery.partNumber} • {delivery.supplierName}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                          delivery.priority
                        )}`}
                      >
                        {delivery.priority}
                      </span>
                    </div>

                    {/* Delivery Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-500 text-sm">📥</span>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Pickup</p>
                          <p className="text-sm font-medium text-neutral-700">{delivery.supplierName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                          <span className="text-green-500 text-sm">📍</span>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Drop</p>
                          <p className="text-sm font-medium text-neutral-700">{formatAddress(delivery.deliveryAddress)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Updates */}
                    <div className="mb-3">
                      <p className="text-label-sm text-neutral-500 mb-2">
                        Update Status: <span className="font-semibold text-primary-600">{getStatusLabel(delivery.status)}</span>
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {delivery.status === 'dispatched' && (
                          <button
                            onClick={() => updateOrderStatus('picked_up', delivery.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Picked Up
                          </button>
                        )}
                        {delivery.status === 'picked_up' && (
                          <button
                            onClick={() => updateOrderStatus('en_route', delivery.id)}
                            className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            En Route
                          </button>
                        )}
                        {(delivery.status === 'en_route' || delivery.status === 'picked_up') && (
                          <button
                            onClick={() => updateOrderStatus('delivered', delivery.id)}
                            className="bg-success-500 hover:bg-success-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delivered
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ETA and Navigate */}
                    <div className="flex items-center justify-between">
                      <div className="text-center bg-warning-50 px-4 py-2 rounded">
                        <p className="text-xs text-neutral-500">ETA</p>
                        <p className="text-lg font-bold text-warning-700">{getEta(delivery)} min</p>
                      </div>
                      <a
                        href={`https://maps.google.com/?daddr=${encodeURIComponent(
                          delivery.deliveryAddress
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        📍 Navigate
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Orders Queue */}
        {driverStatus === 'available' && orders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-headline-lg font-bold text-neutral-600 mb-4">
              Incoming Jobs
              {activeDeliveries.length > 0 && (
                <span className="text-body-md text-neutral-500 font-normal ml-2">
                  ({activeDeliveries.length} active delivery{activeDeliveries.length > 1 ? 'ies' : ''})
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="border-2 border-orange-500 bg-white">
                  <CardContent className="py-6">
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-label-md font-semibold ${
                              order.priority === 'P0'
                                ? 'bg-red-500 text-white'
                                : order.priority === 'P1'
                                ? 'bg-orange-500 text-white'
                                : 'bg-yellow-500 text-black'
                            }`}
                          >
                            {order.priority === 'P0' ? 'URGENT' : order.priority === 'P1' ? 'PRIORITY' : 'STANDARD'}
                          </span>
                          <span className="text-label-sm text-neutral-500">
                            ETA: {getEta(order)} min
                          </span>
                        </div>
                        <h3 className="text-headline-md font-semibold text-neutral-700 mb-1">
                          {order.partName}
                        </h3>
                        <p className="text-body-md text-neutral-500">
                          {order.partNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success-600">${Math.floor(Math.random() * 20) + 15}</p>
                        <p className="text-xs text-neutral-500">earnings</p>
                      </div>
                    </div>

                    {/* Pickup/Drop */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-500 text-sm">📥</span>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Pickup</p>
                          <p className="text-sm font-medium text-neutral-700">{order.supplierName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                          <span className="text-green-500 text-sm">📍</span>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Drop</p>
                          <p className="text-sm font-medium text-neutral-700">{formatAddress(order.deliveryAddress)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Trip Duration */}
                    <div className="text-right mb-4">
                      <p className="text-xs text-neutral-500">~{getEta(order) * 2} min round trip</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all"
                      >
                        Accept Job
                      </button>
                      <button
                        onClick={() => setOrders(orders.filter((o) => o.id !== order.id))}
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 py-3 px-4 rounded-xl font-semibold transition-all"
                      >
                        Pass
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Orders */}
        {driverStatus === 'available' && activeDeliveries.length === 0 && orders.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <p className="text-headline-md font-semibold text-neutral-500 mb-2">
                No orders available
              </p>
              <p className="text-body-md text-neutral-400">
                You&apos;re all caught up! We&apos;ll notify you when new orders come in.
              </p>
              <p className="text-body-sm text-neutral-300 mt-4">
                💡 Tip: Create a test order from the admin dispatch page
              </p>
            </CardContent>
          </Card>
        )}

        {/* Offline Message */}
        {driverStatus === 'offline' && activeDeliveries.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <p className="text-headline-md font-semibold text-neutral-500 mb-2">
                You are offline
              </p>
              <p className="text-body-md text-neutral-400">
                Toggle your status to available to receive orders
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Deliveries */}
        <div className="mb-6">
          <h2 className="text-headline-lg font-bold text-neutral-700 mb-4">Recent Deliveries</h2>
          <div className="bg-white rounded-xl divide-y divide-neutral-200 border border-neutral-200">
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Alternator – Bosch</p>
                <p className="text-xs text-neutral-500">Precision Imports • 10:12 AM</p>
              </div>
              <p className="text-lg font-bold text-success-600">$22</p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Battery – Optima Red</p>
                <p className="text-xs text-neutral-500">Highlandtown Tire • 9:44 AM</p>
              </div>
              <p className="text-lg font-bold text-success-600">$18</p>
            </div>
          </div>
        </div>

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
            {activeDeliveries.length > 0 && (
              <span className="text-body-sm text-neutral-500">
                ({activeDeliveries.length} active)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
