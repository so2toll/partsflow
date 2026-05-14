/**
 * Dispatch Management Component
 *
 * React component for admin dispatch management with order assignment.
 *
 * @component components/admin/DispatchManagementComponent
 * @version 0.1.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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

interface Driver {
  id: string;
  userId: string;
  name: string;
  status: 'offline' | 'available' | 'on_delivery' | 'suspended';
  currentLat: number | null;
  currentLng: number | null;
}

interface ActiveDelivery {
  order: Order;
  driver: Driver;
  eta: number;
}

interface Stats {
  unassignedOrders: number;
  availableDrivers: number;
  activeDeliveries: number;
  avgResponseTime: number;
}

interface Props {
  unassignedOrders: Order[];
  availableDrivers: Driver[];
  activeDeliveries: ActiveDelivery[];
  stats: Stats | null;
}

export default function DispatchManagementComponent({
  unassignedOrders: initialUnassignedOrders,
  availableDrivers: initialAvailableDrivers,
  activeDeliveries: initialActiveDeliveries,
  stats,
}: Props) {
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>(initialUnassignedOrders);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>(initialAvailableDrivers);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>(initialActiveDeliveries);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-neutral-200 text-neutral-600';
      case 'dispatched':
        return 'bg-info-100 text-info-700';
      case 'picked_up':
        return 'bg-warning-100 text-warning-700';
      case 'en_route':
        return 'bg-primary-100 text-primary-700';
      case 'delivered':
        return 'bg-success-100 text-success-700';
      case 'confirmed':
        return 'bg-success-500 text-white';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getWaitingTime = (order: Order) => {
    const now = Date.now();
    const created = new Date(order.createdAt).getTime();
    const diff = Math.floor((now - created) / 60000);
    return diff;
  };

  const handleAssignDriver = (order: Order) => {
    setSelectedOrder(order);
    setSelectedDriver('');
    setShowAssignModal(true);
  };

  const handleAutoAssign = async () => {
    if (!selectedOrder) return;

    setAutoAssigning(true);

    try {
      const response = await fetch('/api/admin/dispatch/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh data
        window.location.reload();
      } else {
        alert('Failed to auto-assign driver');
      }
    } catch (error) {
      console.error('Auto-assign error:', error);
      alert('Failed to auto-assign driver');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedOrder || !selectedDriver) {
      alert('Please select a driver');
      return;
    }

    setAssigning(true);

    try {
      const response = await fetch('/api/admin/dispatch/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          driverId: selectedDriver,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh data
        window.location.reload();
      } else {
        alert('Failed to assign driver');
      }
    } catch (error) {
      console.error('Assign error:', error);
      alert('Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-headline-lg font-bold text-neutral-600 mb-2">
            Dispatch Management
          </h1>
          <p className="text-body-md text-neutral-400">
            Assign orders to drivers and monitor fleet operations
          </p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-priority-p0">
                    {stats.unassignedOrders}
                  </p>
                  <p className="text-label-sm text-neutral-500">Unassigned Orders</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-success-500">
                    {stats.availableDrivers}
                  </p>
                  <p className="text-label-sm text-neutral-500">Available Drivers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-info-500">
                    {stats.activeDeliveries}
                  </p>
                  <p className="text-label-sm text-neutral-500">Active Deliveries</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-headline-lg font-bold text-primary-500">
                    {stats.avgResponseTime}m
                  </p>
                  <p className="text-label-sm text-neutral-500">Avg Response Time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Unassigned Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {unassignedOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-body-md text-neutral-400">No unassigned orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded-full text-label-sm font-semibold ${getPriorityColor(
                                order.priority
                              )}`}
                            >
                              {order.priority}
                            </span>
                            <span className="text-label-sm text-neutral-500">
                              {getWaitingTime(order)}m waiting
                            </span>
                          </div>
                          <h3 className="text-body-md font-semibold text-neutral-600">
                            {order.partName}
                          </h3>
                          <p className="text-label-sm text-neutral-400">
                            {order.partNumber} • {order.supplierName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignDriver(order)}
                        className="w-full btn btn-primary btn-sm"
                      >
                        Assign Driver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Drivers */}
          <Card>
            <CardHeader>
              <CardTitle>Available Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {availableDrivers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-body-md text-neutral-400">No available drivers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="border border-neutral-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-body-md font-semibold text-neutral-600">
                          {driver.name}
                        </h3>
                        <p className="text-label-sm text-neutral-400">
                          {driver.status === 'available' ? '🟢 Available' : '⚪ Offline'}
                        </p>
                      </div>
                      <div className="text-label-sm text-neutral-500">
                        Ready for assignments
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {activeDeliveries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-body-md text-neutral-400">No active deliveries</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-4 py-3 text-left text-label-md font-semibold text-neutral-500">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-label-md font-semibold text-neutral-500">
                        Driver
                      </th>
                      <th className="px-4 py-3 text-left text-label-md font-semibold text-neutral-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-label-md font-semibold text-neutral-500">
                        ETA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDeliveries.map((delivery) => (
                      <tr key={delivery.order.id} className="border-b border-neutral-100">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-body-md font-medium text-neutral-600">
                              {delivery.order.partName}
                            </p>
                            <p className="text-label-sm text-neutral-400">
                              {delivery.order.partNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-body-md text-neutral-600">{delivery.driver.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-label-md font-medium ${getStatusColor(
                              delivery.order.status
                            )}`}
                          >
                            {getStatusLabel(delivery.order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-body-md text-neutral-600">
                          {delivery.eta} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Assign Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Info */}
                <div className="border-b border-neutral-200 pb-4">
                  <p className="text-label-sm text-neutral-500 mb-1">Order</p>
                  <p className="text-body-md font-semibold text-neutral-600">
                    {selectedOrder.partName}
                  </p>
                  <p className="text-label-sm text-neutral-400">
                    {selectedOrder.partNumber} • {selectedOrder.supplierName}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                      selectedOrder.priority
                    )}`}
                  >
                    {selectedOrder.priority}
                  </span>
                </div>

                {/* Driver Selection */}
                <div>
                  <label htmlFor="driver" className="block text-label-md text-neutral-500 mb-2">
                    Select Driver
                  </label>
                  <select
                    id="driver"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a driver...</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-Assign Button */}
                <button
                  onClick={handleAutoAssign}
                  disabled={autoAssigning}
                  className="w-full btn btn-secondary"
                >
                  {autoAssigning ? 'Finding nearest driver...' : 'Auto-Assign (Nearest)'}
                </button>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedOrder(null);
                      setSelectedDriver('');
                    }}
                    className="flex-1 btn btn-secondary"
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualAssign}
                    disabled={!selectedDriver || assigning}
                    className="flex-1 btn btn-primary"
                  >
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
