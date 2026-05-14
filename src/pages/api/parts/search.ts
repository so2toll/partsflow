/**
 * Parts Search API
 *
 * Mock endpoint for parts search functionality.
 * Returns part results with supplier information for MVP.
 *
 * POST /api/parts/search
 */

import type { APIRoute } from 'astro';
import { supplierRepository } from '../../../../lib/db/repositories';

export const prerender = false;

// Mock part database for MVP
const MOCK_PARTS = [
  {
    id: 'part-001',
    name: 'Brake Booster Assembly',
    partNumber: 'BB-1234',
    brand: 'Bosch',
    category: 'Brakes',
    price: 189.99,
    image: '/images/parts/brake-booster.jpg',
    description: 'Power brake booster assembly for various vehicles',
  },
  {
    id: 'part-002',
    name: 'Alternator 120A',
    partNumber: 'ALT-5678',
    brand: 'Denso',
    category: 'Electrical',
    price: 249.99,
    image: '/images/parts/alternator.jpg',
    description: 'Remanufactured alternator 120 amp output',
  },
  {
    id: 'part-003',
    name: 'Water Pump',
    partNumber: 'WP-9012',
    brand: 'Airtex',
    category: 'Cooling System',
    price: 89.99,
    image: '/images/parts/water-pump.jpg',
    description: 'Premium water pump with gasket',
  },
  {
    id: 'part-004',
    name: 'Starter Motor',
    partNumber: 'STR-3456',
    brand: 'Bosch',
    category: 'Electrical',
    price: 179.99,
    image: '/images/parts/starter.jpg',
    description: 'Remanufactured starter motor',
  },
  {
    id: 'part-005',
    name: 'Radiator',
    partNumber: 'RAD-7890',
    brand: 'Spectra Premium',
    category: 'Cooling System',
    price: 159.99,
    image: '/images/parts/radiator.jpg',
    description: 'Aluminum radiator with plastic tanks',
  },
  {
    id: 'part-006',
    name: 'Brake Caliper (Front)',
    partNumber: 'BC-2345',
    brand: 'Raybestos',
    category: 'Brakes',
    price: 119.99,
    image: '/images/parts/brake-caliper.jpg',
    description: 'Loaded brake caliper with pads',
  },
  {
    id: 'part-007',
    name: 'Fuel Pump Module',
    partNumber: 'FPM-6789',
    brand: 'Delphi',
    category: 'Fuel System',
    price: 139.99,
    image: '/images/parts/fuel-pump.jpg',
    description: 'Complete fuel pump module assembly',
  },
  {
    id: 'part-008',
    name: 'Shocks and Struts (Pair)',
    partNumber: 'SHK-0123',
    brand: 'Monroe',
    category: 'Suspension',
    price: 149.99,
    image: '/images/parts/shocks.jpg',
    description: 'Quick-Strut assembly complete with spring',
  },
];

// Mock inventory with random availability
const getAvailability = () => {
  const options = ['In Stock', 'Low Stock', 'Out of Stock', 'Same Day', 'Next Day'];
  return options[Math.floor(Math.random() * options.length)];
};

// Mock distance calculation
const getDistance = () => {
  return Math.floor(Math.random() * 15) + 1; // 1-15 miles
};

// Mock ETA calculation
const getEta = (distance: number) => {
  return Math.floor(distance * 5) + 5; // 5-80 minutes
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query, category, brand } = body;

    // Get suppliers from database
    const suppliers = await supplierRepository.findActive();

    if (suppliers.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No suppliers available. Please seed suppliers first.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Filter parts based on query
    let results = MOCK_PARTS;

    if (query) {
      const searchLower = query.toLowerCase();
      results = results.filter(
        (part) =>
          part.name.toLowerCase().includes(searchLower) ||
          part.partNumber.toLowerCase().includes(searchLower) ||
          part.brand.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      results = results.filter((part) => part.category === category);
    }

    if (brand) {
      results = results.filter((part) => part.brand === brand);
    }

    // Enrich results with supplier info
    const enrichedResults = results.map((part) => {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const distance = getDistance();
      const availability = getAvailability();

      return {
        ...part,
        availability,
        supplier: {
          id: supplier.id,
          name: supplier.displayName,
          distance,
          eta: availability === 'Out of Stock' ? null : getEta(distance),
        },
      };
    });

    return new Response(
      JSON.stringify({
        results: enrichedResults,
        total: enrichedResults.length,
        query,
        filters: {
          category,
          brand,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PartsSearch] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to search parts',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
