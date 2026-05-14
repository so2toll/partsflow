/**
 * Order Detail Component
 *
 * React component for displaying order details with status timeline and SLA tracking.
 *
 * @component components/shop/OrderDetailComponent
 * @version 0.1.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Order {
  id: string;
  partName: string;
  partNumber: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'dispatched' | 'picked_up' | 'en_route' | 'delivered' | 'confirmed' | 'cancelled' | 'failed';
  deliveryAddress: string;
  totalCents: number;
  deliveryFeeCents: number;
  slaTargetAt: string;
  deliveredAt: string | null;
  supplierName: string;
  driverId: string | null;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  order: Order | null;
  organizationId: string;
  userId: string;
}

export default function OrderDetailComponent({ order, organizationId, userId }: Props) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    minutes: number;
    seconds: number;
    status: 'ahead' | 'on_track' | 'at_risk' | 'overdue';
  } | null>(null);

  // SLA Timer countdown
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'confirmed') {
      return;
    }

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const slaTarget = new Date(order.slaTargetAt).getTime();
      const diff = slaTarget - now;

      if (diff < 0) {
        return {
          minutes: 0,
          seconds: 0,
          status: 'overdue' as const,
        };
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      let status: 'ahead' | 'on_track' | 'at_risk' | 'overdue';
      if (diff < 10 * 60 * 1000) {
        status = 'at_risk';
      } else if (diff < 30 * 60 * 1000) {
        status = 'on_track';
      } else {
        status = 'ahead';
      }

      return { minutes, seconds, status };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-headline-md font-semibold text-neutral-500 mb-2">
              Order not found
            </p>
            <p className="text-body-md text-neutral-400 mb-6">
              The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <a href="/app/orders" className="btn btn-primary">
              Back to Orders
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
      case 'cancelled':
        return 'bg-danger-100 text-danger-700';
      case 'failed':
        return 'bg-danger-500 text-white';
      default:
        return 'bg-neutral-100 text-neutral-600';
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

  const getPriorityLabel = (priority: string) => {
    const labels = {
      P0: 'Emergency',
      P1: 'Urgent',
      P2: 'Standard',
      P3: 'Scheduled',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getStatusTimelineStep = (status: string) => {
    const steps = ['pending', 'dispatched', 'picked_up', 'en_route', 'delivered', 'confirmed'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusTimelineStep(order.status);

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to cancel order. Please try again.');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <a
            href="/app/orders"
            className="text-body-md text-primary-500 hover:text-primary-600 mb-2 inline-block"
          >
            ← Back to Orders
          </a>
          <h1 className="text-headline-lg font-bold text-neutral-600">
            Order {order.id.slice(0, 12)}...
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-4 py-2 rounded-full text-label-md font-semibold ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
          {(order.status === 'pending' || order.status === 'dispatched') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-secondary px-4 py-2"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* SLA Timer Panel */}
      {timeRemaining && order.status !== 'delivered' && order.status !== 'confirmed' && (
        <Card className={`mb-6 border-2 ${
          timeRemaining.status === 'overdue'
            ? 'border-danger-500 bg-danger-50'
            : timeRemaining.status === 'at_risk'
            ? 'border-warning-500 bg-warning-50'
            : 'border-success-500 bg-success-50'
        }`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-md font-semibold text-neutral-600 mb-1">
                  {timeRemaining.status === 'overdue'
                    ? 'Order is Overdue'
                    : timeRemaining.status === 'at_risk'
                    ? 'Approaching SLA Deadline'
                    : 'On Track for SLA'}
                </h3>
                <p className="text-body-md text-neutral-500">
                  {timeRemaining.status === 'overdue'
                    ? 'This order has exceeded its delivery time target'
                    : `SLA Target: ${formatDateTime(order.slaTargetAt)}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-headline-lg font-bold text-neutral-600">
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
                <p className="text-label-sm text-neutral-500">time remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-headline-md font-semibold text-neutral-600">
                    {order.partName}
                  </h3>
                  <p className="text-body-md text-neutral-400">
                    {order.partNumber} • {order.supplierName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-label-sm text-neutral-500 mb-1">Priority</p>
                    <span
                      className={`px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                        order.priority
                      )}`}
                    >
                      {order.priority} {getPriorityLabel(order.priority)}
                    </span>
                  </div>
                  <div>
                    <p className="text-label-sm text-neutral-500 mb-1">Order Placed</p>
                    <p className="text-body-md text-neutral-600">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-label-sm text-neutral-500 mb-1">Delivery Address</p>
                  <p className="text-body-md text-neutral-600">{order.deliveryAddress}</p>
                </div>

                {order.deliveredAt && (
                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-label-sm text-neutral-500 mb-1">Delivered At</p>
                    <p className="text-body-md text-neutral-600">
                      {formatDateTime(order.deliveredAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {[
                  { key: 'pending', label: 'Pending', icon: '📋' },
                  { key: 'dispatched', label: 'Dispatched', icon: '🚗' },
                  { key: 'picked_up', label: 'Picked Up', icon: '📦' },
                  { key: 'en_route', label: 'En Route', icon: '📍' },
                  { key: 'delivered', label: 'Delivered', icon: '✅' },
                  { key: 'confirmed', label: 'Confirmed', icon: '👍' },
                ].map((step, index) => {
                  const isActive = index <= currentStep;
                  const isCurrent = index === currentStep;

                  return (
                    <div key={step.key} className="flex items-start mb-6 last:mb-0">
                      <div className="flex flex-col items-center mr-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            isActive
                              ? isCurrent
                                ? 'bg-primary-500 text-white'
                                : 'bg-success-500 text-white'
                              : 'bg-neutral-200 text-neutral-400'
                          }`}
                        >
                          {step.icon}
                        </div>
                        {index < 5 && (
                          <div
                            className={`w-0.5 h-12 mt-2 ${
                              index < currentStep ? 'bg-success-500' : 'bg-neutral-200'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-body-md font-medium ${
                            isActive ? 'text-neutral-600' : 'text-neutral-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-label-sm text-neutral-500">Current status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Price Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-body-md">
                  <span className="text-neutral-400">Parts</span>
                  <span className="text-neutral-600">
                    ${((order.totalCents - order.deliveryFeeCents) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-neutral-400">Delivery</span>
                  <span className="text-neutral-600">
                    ${(order.deliveryFeeCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-headline-md font-bold pt-3 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="text-primary-500">
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          {order.driverId && (
            <Card>
              <CardHeader>
                <CardTitle>Driver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-label-sm text-neutral-500 mb-1">Name</p>
                    <p className="text-body-md text-neutral-600">{order.driverName || 'Assigned'}</p>
                  </div>
                  {order.driverPhone && (
                    <div>
                      <p className="text-label-sm text-neutral-500 mb-1">Phone</p>
                      <p className="text-body-md text-neutral-600">
                        <a href={`tel:${order.driverPhone}`} className="text-primary-500">
                          {order.driverPhone}
                        </a>
                      </p>
                    </div>
                  )}
                  {order.driverVehicle && (
                    <div>
                      <p className="text-label-sm text-neutral-500 mb-1">Vehicle</p>
                      <p className="text-body-md text-neutral-600">{order.driverVehicle}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Support */}
          <Card>
            <CardContent className="py-6">
              <p className="text-body-md text-neutral-400 mb-4">
                Need help with this order?
              </p>
              <a href="/support" className="btn btn-secondary w-full">
                Contact Support
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Cancel Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-body-md text-neutral-400">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>

                <div>
                  <label htmlFor="reason" className="block text-label-md text-neutral-500 mb-2">
                    Reason for cancellation
                  </label>
                  <select
                    id="reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a reason...</option>
                    <option value="no_longer_needed">No longer needed</option>
                    <option value="found_elsewhere">Found elsewhere</option>
                    <option value="incorrect_part">Incorrect part ordered</option>
                    <option value="delay_too_long">Delay too long</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    className="flex-1 btn btn-secondary"
                    disabled={cancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={!cancelReason || cancelling}
                    className="flex-1 btn btn-primary bg-danger-500 hover:bg-danger-600"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
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
