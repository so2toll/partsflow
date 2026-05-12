import { atom, map } from 'nanostores';

export const sessions = map({});

export const currentSessionId = atom(null);

export function createSession(sessionData) {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  
  const session = {
    sessionId,
    agentId: sessionData.agentId,
    customerId: sessionData.customerId || 'customer_' + Date.now(),
    status: 'initiated',
    sessionType: sessionData.sessionType || 'browser', // PDF vs browser session type
    widgetUserRole: sessionData.widgetUserRole, // Store widget user role at root level
    formData: sessionData.customerData,
    templateId: sessionData.templateId, // Store template ID at root level
    templateSlug: sessionData.templateSlug, // Store template slug for PDF sessions
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
      // Merge incoming metadata with defaults
      ...(sessionData.metadata || {}),
      // Default values (don't overwrite if already provided)
      ipAddress: sessionData.metadata?.ipAddress || null,
      userAgent: sessionData.metadata?.userAgent || null,
      device: sessionData.metadata?.device || null
    }
  };
  
  const currentSessions = sessions.get();
  console.log('Session Store - Creating session:', sessionId);
  console.log('Session Store - Before creation, existing sessions:', Object.keys(currentSessions));

  sessions.set({
    ...currentSessions,
    [sessionId]: session
  });

  console.log('Session Store - After creation, total sessions:', Object.keys(sessions.get()).length);
  return session;
}

export function getSession(sessionId) {
  const currentSessions = sessions.get();
  return currentSessions[sessionId];
}

export function updateSession(sessionId, updates) {
  const currentSessions = sessions.get();
  const session = currentSessions[sessionId];
  
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
  
  sessions.set({
    ...currentSessions,
    [sessionId]: updatedSession
  });
  
  return updatedSession;
}

export function listSessions() {
  return Object.values(sessions.get());
}