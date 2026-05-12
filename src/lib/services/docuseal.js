const DOCUSEAL_API_URL = import.meta.env.DOCUSEAL_API_URL || 'https://api.docuseal.com';
const DOCUSEAL_EMBED_URL = import.meta.env.DOCUSEAL_EMBED_URL || 'https://docuseal.com';
const DOCUSEAL_API_KEY = import.meta.env.DOCUSEAL_API_KEY;

// Helper to determine if using cloud or self-hosted version
const isCloudVersion = () => DOCUSEAL_API_URL.includes('docuseal.com');

// Helper to get the correct API endpoint
const getApiEndpoint = (path) => {
  // Cloud version doesn't need /api prefix
  if (isCloudVersion()) {
    return `${DOCUSEAL_API_URL}${path}`;
  }
  // Self-hosted version needs /api prefix
  return `${DOCUSEAL_API_URL}/api${path}`;
};

// Helper to get the correct embed URL
const getEmbedUrl = () => {
  // If DOCUSEAL_EMBED_URL is explicitly set, use it
  if (import.meta.env.DOCUSEAL_EMBED_URL) {
    return DOCUSEAL_EMBED_URL;
  }
  // For cloud, use docuseal.com for embeds
  if (isCloudVersion()) {
    return 'https://docuseal.com';
  }
  // For self-hosted, use the same URL as API
  return DOCUSEAL_API_URL;
};

export async function listTemplates() {
  if (!DOCUSEAL_API_KEY) {
    console.warn('DocuSeal API key not configured. Using mock templates for testing.');
    return [
      {
        id: '1622775',
        slug: 'UeDzaa2NyWJtuY',
        name: 'Test PDF Template',
        description: 'Your configured test template',
        fields: ['name', 'email', 'signature'],
        submitters: [{ name: 'First Party', uuid: 'mock-uuid' }]
      },
      {
        id: 'mock_template_1',
        slug: 'mock_slug_1',
        name: 'Government Benefits Application',
        description: 'Standard benefits application form',
        fields: ['name', 'email', 'address', 'signature'],
        submitters: [{ name: 'First Party', uuid: 'mock-uuid' }]
      },
      {
        id: 'mock_template_2', 
        slug: 'mock_slug_2',
        name: 'Victim Compensation Form',
        description: 'Crime victim compensation request',
        fields: ['victim_name', 'incident_date', 'signature'],
        submitters: [{ name: 'First Party', uuid: 'mock-uuid' }]
      }
    ];
  }

  try {
    const response = await fetch(getApiEndpoint('/templates'), {
      method: 'GET',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`DocuSeal API error: ${response.statusText}`);
    }

    const result = await response.json();
    const templates = result.data || result; // Handle both paginated and direct response
    
    // Format templates for our UI
    return templates.map(template => ({
      id: template.id,
      slug: template.slug,
      name: template.name,
      description: template.description || '',
      fields: template.fields || [],
      folder: template.folder_name || 'General',
      submitters: template.submitters || []
    }));
  } catch (error) {
    console.error('DocuSeal API error:', error);
    throw error;
  }
}

export async function getTemplateDetails(templateId) {
  if (!DOCUSEAL_API_KEY) {
    return {
      id: templateId,
      name: 'Mock Template',
      fields: [
        { name: 'full_name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'signature', type: 'signature', required: true }
      ],
      submitters: [
        { name: 'First Party', uuid: 'mock-uuid' }
      ]
    };
  }

  try {
    const response = await fetch(getApiEndpoint(`/templates/${templateId}`), {
      method: 'GET',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`DocuSeal API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('DocuSeal API error:', error);
    throw error;
  }
}

export async function createSubmission({ templateId, signerData, metadata }) {
  if (!DOCUSEAL_API_KEY) {
    console.warn('DocuSeal API key not configured. Using mock data for MVP testing.');
    
    // If using your specific template ID, return the correct URL
    if (templateId === '1622775') {
      return {
        submissionId: 'mock_sub_' + Date.now(),
        signerSlug: 'UeDzaa2NyWJtuY',
        embedUrl: `${getEmbedUrl()}/d/UeDzaa2NyWJtuY`
      };
    }
    
    return {
      submissionId: 'mock_sub_' + Date.now(),
      signerSlug: 'mock_signer_' + Date.now(),
      embedUrl: `${getEmbedUrl()}/demo/embed`
    };
  }
  
  const payload = {
    template_id: templateId,
    send_email: false,
    submitters: [
      {
        email: signerData.email,
        name: signerData.name,
        role: signerData.role || 'First Party' // Use template role or default
      }
    ]
  };
  
  console.log('DocuSeal Submission Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(getApiEndpoint('/submissions'), {
      method: 'POST',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`DocuSeal API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('DocuSeal API Response:', JSON.stringify(result, null, 2));
    
    // DocuSeal might return different response structure
    const submitters = result.submitters || result.data?.submitters || [];
    const submitter = submitters[0];
    
    if (!submitter) {
      console.error('DocuSeal response structure:', result);
      throw new Error(`No submitter returned from DocuSeal. Response: ${JSON.stringify(result)}`);
    }
    
    return {
      submissionId: result.id,
      signerSlug: submitter.slug,
      embedUrl: `${getEmbedUrl()}/s/${submitter.slug}`,
      submitters: submitters
    };
  } catch (error) {
    console.error('DocuSeal API error:', error);
    throw error;
  }
}

export async function getSubmissionStatus(submissionId) {
  if (!DOCUSEAL_API_KEY) {
    return {
      status: 'completed',
      completedAt: new Date().toISOString(),
      documentUrl: `${getEmbedUrl()}/demo/document.pdf`
    };
  }
  
  try {
    const response = await fetch(getApiEndpoint(`/submissions/${submissionId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DOCUSEAL_API_KEY}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`DocuSeal API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      status: result.status,
      completedAt: result.completed_at,
      documentUrl: result.documents?.[0]?.url
    };
  } catch (error) {
    console.error('DocuSeal API error:', error);
    throw error;
  }
}

export function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) {
    console.warn('Webhook secret not configured');
    return true;
  }
  
  const crypto = globalThis.crypto || require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}