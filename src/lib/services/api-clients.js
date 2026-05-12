// API Client Management Service
// Handles client credential storage and validation

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// JSON file storage for development persistence
const CLIENT_DATA_FILE = path.join(process.cwd(), 'src/data/api-clients.json');

// In-memory cache for performance
let clients = new Map();
let isLoaded = false;

// Load clients from JSON file
function loadClients() {
  if (isLoaded) return;
  
  try {
    if (fs.existsSync(CLIENT_DATA_FILE)) {
      const data = fs.readFileSync(CLIENT_DATA_FILE, 'utf8');
      const clientData = JSON.parse(data);
      
      clientData.clients.forEach(client => {
        clients.set(client.clientId, client);
      });
      
      console.log(`Loaded ${clientData.clients.length} API clients from JSON file`);
    } else {
      console.warn('API clients JSON file not found, starting with empty client list');
    }
  } catch (error) {
    console.error('Error loading API clients:', error);
  }
  
  isLoaded = true;
}

// Save clients to JSON file
function saveClients() {
  try {
    const clientData = {
      clients: Array.from(clients.values())
    };
    
    // Ensure directory exists
    const dir = path.dirname(CLIENT_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(CLIENT_DATA_FILE, JSON.stringify(clientData, null, 2));
    console.log('API clients saved to JSON file');
  } catch (error) {
    console.error('Error saving API clients:', error);
  }
}

export class ApiClientService {
  
  // Get all clients
  static getAllClients() {
    loadClients(); // Ensure data is loaded
    return Array.from(clients.values());
  }
  
  // Get client by ID
  static getClient(clientId) {
    loadClients(); // Ensure data is loaded
    return clients.get(clientId) || null;
  }
  
  // Validate client credentials
  static validateClient(clientId, clientSecret) {
    loadClients(); // Ensure data is loaded
    const client = clients.get(clientId);
    if (!client) {
      return { valid: false, error: 'Client not found' };
    }
    
    if (client.status !== 'active') {
      return { valid: false, error: 'Client is not active' };
    }
    
    if (client.clientSecret !== clientSecret) {
      return { valid: false, error: 'Invalid client secret' };
    }
    
    return { valid: true, client };
  }
  
  // Create new client
  static createClient(clientData) {
    loadClients(); // Ensure data is loaded
    const { name, allowedDomains = [], webhookUrl = null, branding = {} } = clientData;
    
    if (!name) {
      throw new Error('Client name is required');
    }
    
    // Generate client ID (slug from name)
    const clientId = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if client already exists
    if (clients.has(clientId)) {
      throw new Error('Client with this name already exists');
    }
    
    // Generate client secret
    const clientSecret = 'sk_' + 
      (process.env.NODE_ENV === 'production' ? 'live' : 'test') + '_' +
      crypto.randomBytes(16).toString('hex');
    
    const client = {
      clientId,
      clientSecret,
      name,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
      settings: {
        webhookUrl,
        branding: {
          primaryColor: branding.primaryColor || '#1976d2',
          logo: branding.logo || null,
          ...branding
        }
      }
    };
    
    clients.set(clientId, client);
    saveClients(); // Save to JSON file
    
    console.log('Created new API client:', clientId);
    return client;
  }
  
  // Update client
  static updateClient(clientId, updates) {
    loadClients(); // Ensure data is loaded
    const client = clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Allow updates to specific fields
    const allowedUpdates = ['name', 'allowedDomains', 'status', 'settings'];
    const updatedClient = { ...client };
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'settings') {
          updatedClient.settings = { ...client.settings, ...updates.settings };
        } else {
          updatedClient[key] = updates[key];
        }
      }
    });
    
    updatedClient.updatedAt = new Date().toISOString();
    
    clients.set(clientId, updatedClient);
    saveClients(); // Save to JSON file
    
    console.log('Updated API client:', clientId);
    return updatedClient;
  }
  
  // Revoke client (deactivate)
  static revokeClient(clientId) {
    loadClients(); // Ensure data is loaded
    const client = clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    client.status = 'revoked';
    client.revokedAt = new Date().toISOString();
    
    clients.set(clientId, client);
    saveClients(); // Save to JSON file
    
    console.log('Revoked API client:', clientId);
    return client;
  }
  
  // Regenerate client secret
  static regenerateSecret(clientId) {
    loadClients(); // Ensure data is loaded
    const client = clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Generate new secret
    const newSecret = 'sk_' + 
      (process.env.NODE_ENV === 'production' ? 'live' : 'test') + '_' +
      crypto.randomBytes(16).toString('hex');
    
    client.clientSecret = newSecret;
    client.secretRegeneratedAt = new Date().toISOString();
    
    clients.set(clientId, client);
    saveClients(); // Save to JSON file
    
    console.log('Regenerated secret for API client:', clientId);
    return client;
  }
  
  // Record client usage
  static recordUsage(clientId) {
    loadClients(); // Ensure data is loaded
    const client = clients.get(clientId);
    if (client) {
      client.usageCount = (client.usageCount || 0) + 1;
      client.lastUsed = new Date().toISOString();
      clients.set(clientId, client);
      saveClients(); // Save to JSON file
    }
  }
  
  // Get client statistics
  static getClientStats() {
    loadClients(); // Ensure data is loaded
    const allClients = Array.from(clients.values());
    return {
      totalClients: allClients.length,
      activeClients: allClients.filter(c => c.status === 'active').length,
      revokedClients: allClients.filter(c => c.status === 'revoked').length,
      totalUsage: allClients.reduce((sum, c) => sum + (c.usageCount || 0), 0)
    };
  }
}

// Export individual functions for backward compatibility
export const getAllClients = ApiClientService.getAllClients;
export const getClient = ApiClientService.getClient;
export const validateClient = ApiClientService.validateClient;
export const createClient = ApiClientService.createClient;
export const updateClient = ApiClientService.updateClient;
export const revokeClient = ApiClientService.revokeClient;