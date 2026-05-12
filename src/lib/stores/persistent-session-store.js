import { promises as fs } from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'src/data/sessions');
const SESSION_FILE_PREFIX = 'session_';
const SESSION_EXPIRY_HOURS = 4;

// Ensure sessions directory exists
async function ensureSessionsDir() {
  try {
    await fs.access(SESSIONS_DIR);
  } catch {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  }
}

// File-based session storage implementation
export class PersistentSessionStore {

  async createSession(sessionData) {
    await ensureSessionsDir();

    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

    const session = {
      sessionId,
      agentId: sessionData.agentId,
      customerId: sessionData.customerId || 'customer_' + Date.now(),
      status: 'initiated',
      sessionType: sessionData.sessionType || 'browser',
      widgetUserRole: sessionData.widgetUserRole,
      formData: sessionData.customerData,
      templateId: sessionData.templateId,
      templateSlug: sessionData.templateSlug,
      docuSeal: {
        submissionId: null,
        templateId: sessionData.templateId,
        signerSlug: null,
        signedAt: null,
        documentUrl: null
      },
      openReplay: {
        sessionId: 'or_' + sessionId,
        projectKey: null,
        replayUrl: null,
        startTime: new Date().toISOString()
      },
      timestamps: {
        created: new Date().toISOString(),
        started: new Date().toISOString(),
        completed: null
      },
      metadata: {
        ...(sessionData.metadata || {}),
        ipAddress: sessionData.metadata?.ipAddress || null,
        userAgent: sessionData.metadata?.userAgent || null,
        device: sessionData.metadata?.device || null
      }
    };

    const sessionFile = path.join(SESSIONS_DIR, `${SESSION_FILE_PREFIX}${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));

    console.log('Persistent Session Store - Created session:', sessionId);
    return session;
  }

  async getSession(sessionId) {
    try {
      const sessionFile = path.join(SESSIONS_DIR, `${SESSION_FILE_PREFIX}${sessionId}.json`);
      const sessionData = await fs.readFile(sessionFile, 'utf8');
      const session = JSON.parse(sessionData);

      // Check if session is expired
      const createdAt = new Date(session.timestamps?.created || Date.now());
      const expiresAt = new Date(createdAt.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
      const isExpired = new Date() > expiresAt;

      if (isExpired) {
        // Clean up expired session
        await this.deleteSession(sessionId);
        console.log('Persistent Session Store - Session expired and deleted:', sessionId);
        return null;
      }

      console.log('Persistent Session Store - Retrieved session:', sessionId);
      return session;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('Persistent Session Store - Session not found:', sessionId);
        return null;
      }
      console.error('Persistent Session Store - Error retrieving session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, updates) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession = {
      ...session,
      ...updates,
      docuSeal: {
        ...session.docuSeal,
        ...(updates.docuSeal || {})
      },
      openReplay: {
        ...session.openReplay,
        ...(updates.openReplay || {})
      },
      timestamps: {
        ...session.timestamps,
        ...(updates.timestamps || {})
      },
      metadata: {
        ...session.metadata,
        ...(updates.metadata || {})
      }
    };

    const sessionFile = path.join(SESSIONS_DIR, `${SESSION_FILE_PREFIX}${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(updatedSession, null, 2));

    console.log('Persistent Session Store - Updated session:', sessionId);
    return updatedSession;
  }

  async deleteSession(sessionId) {
    try {
      const sessionFile = path.join(SESSIONS_DIR, `${SESSION_FILE_PREFIX}${sessionId}.json`);
      await fs.unlink(sessionFile);
      console.log('Persistent Session Store - Deleted session:', sessionId);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Persistent Session Store - Error deleting session:', error);
        throw error;
      }
    }
  }

  async listSessions() {
    try {
      await ensureSessionsDir();
      const files = await fs.readdir(SESSIONS_DIR);
      const sessionFiles = files.filter(file => file.startsWith(SESSION_FILE_PREFIX) && file.endsWith('.json'));

      const sessions = [];
      for (const file of sessionFiles) {
        try {
          const sessionData = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf8');
          const session = JSON.parse(sessionData);

          // Check if session is expired
          const createdAt = new Date(session.timestamps?.created || Date.now());
          const expiresAt = new Date(createdAt.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
          const isExpired = new Date() > expiresAt;

          if (!isExpired) {
            sessions.push(session);
          } else {
            // Clean up expired session
            await fs.unlink(path.join(SESSIONS_DIR, file));
          }
        } catch (error) {
          console.error('Error reading session file:', file, error);
        }
      }

      return sessions;
    } catch (error) {
      console.error('Persistent Session Store - Error listing sessions:', error);
      return [];
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    try {
      await ensureSessionsDir();
      const files = await fs.readdir(SESSIONS_DIR);
      const sessionFiles = files.filter(file => file.startsWith(SESSION_FILE_PREFIX) && file.endsWith('.json'));

      let cleanedCount = 0;
      for (const file of sessionFiles) {
        try {
          const sessionData = await fs.readFile(path.join(SESSIONS_DIR, file), 'utf8');
          const session = JSON.parse(sessionData);

          const createdAt = new Date(session.timestamps?.created || Date.now());
          const expiresAt = new Date(createdAt.getTime() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
          const isExpired = new Date() > expiresAt;

          if (isExpired) {
            await fs.unlink(path.join(SESSIONS_DIR, file));
            cleanedCount++;
          }
        } catch (error) {
          console.error('Error cleaning session file:', file, error);
        }
      }

      if (cleanedCount > 0) {
        console.log(`Persistent Session Store - Cleaned up ${cleanedCount} expired sessions`);
      }
    } catch (error) {
      console.error('Persistent Session Store - Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const persistentSessionStore = new PersistentSessionStore();

// Compatibility wrapper for existing nanostores interface
export function createSession(sessionData) {
  return persistentSessionStore.createSession(sessionData);
}

export function getSession(sessionId) {
  return persistentSessionStore.getSession(sessionId);
}

export function updateSession(sessionId, updates) {
  return persistentSessionStore.updateSession(sessionId, updates);
}

export function listSessions() {
  return persistentSessionStore.listSessions();
}