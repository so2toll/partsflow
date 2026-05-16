/**
 * Parts Search Component
 *
 * React component for parts search with filters and order creation modal.
 *
 * @component components/shop/PartsSearchComponent
 * @version 0.1.0
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Supplier {
  id: string;
  name: string;
  displayName: string;
  address: string;
  phone: string;
  isActive: boolean;
}

interface Part {
  id: string;
  name: string;
  partNumber: string;
  brand: string;
  category: string;
  price: number;
  image: string;
  description: string;
  availability: string;
  supplier: {
    id: string;
    name: string;
    distance: number;
    eta: number | null;
  };
}

interface Props {
  suppliers: Supplier[];
  organizationId: string;
  userId: string;
}

export default function PartsSearchComponent({ suppliers, organizationId, userId }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPriority, setOrderPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState('');

  const categories = ['Brakes', 'Electrical', 'Cooling System', 'Suspension', 'Fuel System'];

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/parts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (part: Part) => {
    setSelectedPart(part);
    setShowOrderModal(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedPart) return;

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: selectedPart.id,
          partNumber: selectedPart.partNumber,
          partName: selectedPart.name,
          supplierId: selectedPart.supplier.id,
          supplierName: selectedPart.supplier.name,
          price: selectedPart.price,
          priority: orderPriority,
          deliveryAddress: orderDeliveryAddress,
        }),
      });

      const data = await response.json();

      if (data.orderId) {
        window.location.href = `/app/orders/${data.orderId}`;
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  const getAvailabilityColor = (availability: string) => {
    if (availability === 'In Stock' || availability === 'Same Day') return 'text-success-500';
    if (availability === 'Low Stock') return 'text-warning-500';
    if (availability === 'Out of Stock') return 'text-danger-500';
    return 'text-info-500';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-neutral-600 mb-2">
          Parts Search
        </h1>
        <p className="text-body-md text-neutral-400">
          Search for parts and place orders for delivery
        </p>
      </div>

      {/* Search Helper Card */}
      <Card className="mb-6 bg-info-50 border-info-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="text-info-500 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-label-md font-semibold text-info-700 mb-1">
                Parts Search Tips
              </h3>
              <ul className="text-body-sm text-info-600 space-y-1">
                <li>• <strong>Part names:</strong> brake, alternator, water pump, starter, radiator, fuel pump, shocks</li>
                <li>• <strong>Part numbers:</strong> BB-1234, ALT-5678, WP-9012, STR-3456, RAD-7890, etc.</li>
                <li>• <strong>Brands:</strong> Bosch, Denso, Airtex, Raybestos, Delphi, Monroe</li>
                <li>• <strong>Categories:</strong> Brakes, Electrical, Cooling System, Fuel System, Suspension</li>
              </ul>
              <p className="text-body-sm text-info-600 mt-2">
                <strong>After searching:</strong> Click "Order for Delivery" to create an order → Admins will see it in Dispatch → Drivers can accept and deliver
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-label-md text-neutral-500 mb-2">
                  Search parts
                </label>
                <input
                  id="search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Part name, number, or VIN..."
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="w-48">
                <label htmlFor="category" className="block text-label-md text-neutral-500 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary px-8 py-3"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-headline-md font-semibold text-neutral-600 mb-4">
            Results ({results.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((part) => (
              <Card key={part.id} className="hover:shadow-card-hover transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{part.name}</CardTitle>
                      <p className="text-label-sm text-neutral-400 mt-1">
                        {part.brand} | {part.partNumber}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Price and Availability */}
                    <div className="flex items-center justify-between">
                      <span className="text-headline-md font-bold text-primary-500">
                        ${part.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-label-md font-semibold ${getAvailabilityColor(
                          part.availability
                        )}`}
                      >
                        {part.availability}
                      </span>
                    </div>

                    {/* Supplier Info */}
                    <div className="border-t border-neutral-300 pt-4">
                      <p className="text-label-sm text-neutral-400 mb-2">
                        {part.supplier.name}
                      </p>
                      <div className="flex items-center gap-4 text-label-sm text-neutral-500">
                        <span>{part.supplier.distance} mi away</span>
                        {part.supplier.eta && (
                          <span>~{part.supplier.eta} min delivery</span>
                        )}
                      </div>
                    </div>

                    {/* Order Button */}
                    {part.availability !== 'Out of Stock' && (
                      <button
                        onClick={() => handleOrderClick(part)}
                        className="w-full btn btn-primary"
                      >
                        Order for Delivery
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-body-md text-neutral-400">No parts found. Try a different search.</p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!loading && results.length === 0 && !query && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-body-md text-neutral-400 mb-4">
              Search for parts by name, number, or VIN
            </p>
            <p className="text-body-md text-neutral-500">
              We&apos;ll search across {suppliers.length} local suppliers
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Confirmation Modal */}
      {showOrderModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Confirm Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Part Summary */}
                <div className="border-b border-neutral-300 pb-4">
                  <h3 className="text-headline-md font-semibold text-neutral-600 mb-2">
                    {selectedPart.name}
                  </h3>
                  <p className="text-body-md text-neutral-400">
                    {selectedPart.brand} | {selectedPart.partNumber}
                  </p>
                  <p className="text-body-md text-neutral-500 mt-2">
                    Supplier: {selectedPart.supplier.name}
                  </p>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-label-md text-neutral-500 mb-2">
                    Delivery Priority
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'P0', label: 'P0 Emergency', fee: 55, sla: '≤30 min' },
                      { value: 'P1', label: 'P1 Urgent', fee: 38, sla: '30-45 min' },
                      { value: 'P2', label: 'P2 Standard', fee: 22, sla: '45-60 min' },
                      { value: 'P3', label: 'P3 Scheduled', fee: 16, sla: '2 hr window' },
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setOrderPriority(priority.value as any)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          orderPriority === priority.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        <div className="font-semibold text-sm">{priority.label}</div>
                        <div className="text-label-sm text-neutral-500 mt-1">
                          ${priority.fee} delivery • {priority.sla}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label htmlFor="address" className="block text-label-md text-neutral-500 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    id="address"
                    value={orderDeliveryAddress}
                    onChange={(e) => setOrderDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Price Summary */}
                <div className="border-t border-neutral-300 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-body-md">
                      <span className="text-neutral-400">Part Price</span>
                      <span className="text-neutral-600">${selectedPart.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-body-md">
                      <span className="text-neutral-400">Delivery Fee</span>
                      <span className="text-neutral-600">
                        $
                        {orderPriority === 'P0'
                          ? '55.00'
                          : orderPriority === 'P1'
                          ? '38.00'
                          : orderPriority === 'P2'
                          ? '22.00'
                          : '16.00'}
                      </span>
                    </div>
                    <div className="flex justify-between text-headline-md font-bold">
                      <span>Total</span>
                      <span className="text-primary-500">
                        $
                        {(
                          selectedPart.price +
                          (orderPriority === 'P0'
                            ? 55
                            : orderPriority === 'P1'
                            ? 38
                            : orderPriority === 'P2'
                            ? 22
                            : 16)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={!orderDeliveryAddress}
                    className="flex-1 btn btn-primary"
                  >
                    Place Order
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
