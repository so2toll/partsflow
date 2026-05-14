/**
 * Orders List Component
 *
 * React component for displaying orders list with filters and pagination.
 *
 * @component components/shop/OrdersListComponent
 * @version 0.1.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';

interface Order {
  id: string;
  partName: string;
  partNumber: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'dispatched' | 'picked_up' | 'en_route' | 'delivered' | 'confirmed' | 'cancelled' | 'failed';
  createdAt: string;
  totalCents: number;
  supplierName: string;
}

interface Props {
  orders: Order[];
  total: number;
  organizationId: string;
}

export default function OrdersListComponent({ orders: initialOrders, total, organizationId }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !order.partName.toLowerCase().includes(query) &&
        !order.partNumber.toLowerCase().includes(query) &&
        !order.id.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / limit);
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

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
      case 'cancelled':
        return 'bg-danger-100 text-danger-700';
      case 'failed':
        return 'bg-danger-500 text-white';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const handleRowClick = (orderId: string) => {
    window.location.href = `/app/orders/${orderId}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-neutral-600 mb-2">
          Orders
        </h1>
        <p className="text-body-md text-neutral-400">
          Manage your parts delivery orders
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="status" className="block text-label-md text-neutral-500 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="picked_up">Picked Up</option>
                <option value="en_route">En Route</option>
                <option value="delivered">Delivered</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="priority" className="block text-label-md text-neutral-500 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priorities</option>
                <option value="P0">P0 Emergency</option>
                <option value="P1">P1 Urgent</option>
                <option value="P2">P2 Standard</option>
                <option value="P3">P3 Scheduled</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search" className="block text-label-md text-neutral-500 mb-2">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Part name, number, or order ID..."
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {paginatedOrders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="px-6 py-4 text-left text-label-md font-semibold text-neutral-500">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-label-md font-semibold text-neutral-500">
                      Part
                    </th>
                    <th className="px-6 py-4 text-left text-label-md font-semibold text-neutral-500">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-label-md font-semibold text-neutral-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-label-md font-semibold text-neutral-500">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-label-md font-semibold text-neutral-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-body-md text-neutral-600">
                        {order.id.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-body-md font-medium text-neutral-600">
                            {order.partName}
                          </div>
                          <div className="text-label-sm text-neutral-400">
                            {order.partNumber} • {order.supplierName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-label-md font-semibold ${getPriorityColor(
                            order.priority
                          )}`}
                        >
                          {order.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-label-md font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-md text-neutral-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-body-md font-semibold text-neutral-600 text-right">
                        ${(order.totalCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-headline-md font-semibold text-neutral-500 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </p>
            <p className="text-body-md text-neutral-400 mb-6">
              {orders.length === 0
                ? 'Create your first order to get started'
                : 'Try adjusting your filters'}
            </p>
            {orders.length === 0 && (
              <a
                href="/app/parts/search"
                className="inline-block btn btn-primary"
              >
                Search for Parts
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredOrders.length > limit && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-body-md text-neutral-400">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-body-md text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
