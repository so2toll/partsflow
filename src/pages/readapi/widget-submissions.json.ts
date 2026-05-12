import type { APIRoute } from 'astro';

// For demo - in production this would come from database
const demoSubmissions = [
  {
    id: 'widget_demo_123',
    clientId: 'demo-client',
    formType: 'tax-form',
    data: {
      fullName: 'John Doe',
      ssn: '***-**-1234',
      address: '123 Main St\nNew York, NY 10001',
      filingStatus: 'single',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    },
    status: 'submitted',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    reviewStatus: 'pending',
    reviewedAt: null,
    reviewedBy: null,
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ipAddress: '192.168.1.100',
      referer: 'https://client-portal.com/tax-forms'
    }
  },
  {
    id: 'widget_demo_124',
    clientId: 'demo-client',
    formType: 'benefits-app',
    data: {
      fullName: 'Jane Smith',
      ssn: '***-**-5678',
      address: '456 Oak Ave\nLos Angeles, CA 90210',
      benefitType: 'unemployment',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    },
    status: 'submitted',
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    reviewStatus: 'approved',
    reviewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    reviewedBy: 'admin@yourcompany.com',
    metadata: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      ipAddress: '10.0.0.50',
      referer: 'https://benefits-portal.com/apply'
    }
  },
  {
    id: 'widget_demo_125',
    clientId: 'acme-corp',
    formType: 'permit-request',
    data: {
      fullName: 'Bob Johnson',
      businessName: 'Bob\'s Auto Shop',
      address: '789 Industrial Blvd\nChicago, IL 60601',
      permitType: 'business-license',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    },
    status: 'submitted',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    reviewStatus: 'pending',
    reviewedAt: null,
    reviewedBy: null,
    metadata: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ipAddress: '172.16.0.10',
      referer: 'https://city-permits.com/business'
    }
  }
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const status = url.searchParams.get('status');
    
    // In production, fetch from database
    // For demo, return demo data
    let submissions = demoSubmissions;
    
    // Filter by client if specified
    if (clientId) {
      submissions = submissions.filter(sub => sub.clientId === clientId);
    }
    
    // Filter by status if specified
    if (status) {
      submissions = submissions.filter(sub => sub.reviewStatus === status);
    }
    
    // Sort by submission date (newest first)
    submissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    
    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch submissions'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};