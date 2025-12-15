/**
 * Browser session storage utilities for temporary user-specific data.
 * Data is cleared when the page/tab is closed or refreshed.
 */

interface SessionData {
  chatHistory?: string[];
  userPreferences?: {
    theme?: 'light' | 'dark';
    language?: string;
  };
  temporaryFlags?: Record<string, boolean>;
  analytics?: {
    sessionStart: number;
    messagesSent: number;
    voiceInputUsed: boolean;
    mapAccessed: boolean;
  };
}

const SESSION_KEY = 'buksu_chat_session';

/**
 * Get session data, initializing defaults if needed.
 */
export function getSessionData(): SessionData {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to parse session data:', error);
  }
  
  // Initialize with defaults
  const defaults: SessionData = {
    chatHistory: [],
    userPreferences: {
      theme: 'light',
      language: 'en'
    },
    temporaryFlags: {},
    analytics: {
      sessionStart: Date.now(),
      messagesSent: 0,
      voiceInputUsed: false,
      mapAccessed: false
    }
  };
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(defaults));
  } catch (error) {
    console.warn('Failed to initialize session data:', error);
  }
  
  return defaults;
}

/**
 * Update session data with partial changes.
 */
export function updateSessionData(updates: Partial<SessionData>): void {
  try {
    const current = getSessionData();
    const updated = { ...current, ...updates };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to update session data:', error);
  }
}

/**
 * Add a message to chat history.
 */
export function addChatMessage(message: string): void {
  const data = getSessionData();
  const history = data.chatHistory || [];
  history.push(message);
  
  // Keep only last 50 messages to prevent bloat
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  
  updateSessionData({ chatHistory: history });
  
  // Update analytics
  const analytics = data.analytics || {
    sessionStart: Date.now(),
    messagesSent: 0,
    voiceInputUsed: false,
    mapAccessed: false
  };
  analytics.messagesSent = (analytics.messagesSent || 0) + 1;
  updateSessionData({ analytics });
}

/**
 * Record that voice input was used.
 */
export function recordVoiceInputUsage(): void {
  const data = getSessionData();
  const analytics = data.analytics || {
    sessionStart: Date.now(),
    messagesSent: 0,
    voiceInputUsed: false,
    mapAccessed: false
  };
  analytics.voiceInputUsed = true;
  updateSessionData({ analytics });
}

/**
 * Record that map was accessed.
 */
export function recordMapAccess(): void {
  const data = getSessionData();
  const analytics = data.analytics || {
    sessionStart: Date.now(),
    messagesSent: 0,
    voiceInputUsed: false,
    mapAccessed: false
  };
  analytics.mapAccessed = true;
  updateSessionData({ analytics });
}

/**
 * Set a temporary flag (cleared on refresh).
 */
export function setTemporaryFlag(key: string, value: boolean): void {
  const data = getSessionData();
  const flags = data.temporaryFlags || {};
  flags[key] = value;
  updateSessionData({ temporaryFlags: flags });
}

/**
 * Get a temporary flag value.
 */
export function getTemporaryFlag(key: string): boolean {
  const data = getSessionData();
  return data.temporaryFlags?.[key] || false;
}

/**
 * Update user preferences.
 */
export function updateUserPreferences(prefs: Partial<SessionData['userPreferences']>): void {
  const data = getSessionData();
  const current = data.userPreferences || {};
  updateSessionData({ userPreferences: { ...current, ...prefs } });
}

/**
 * Get session duration in seconds.
 */
export function getSessionDuration(): number {
  const data = getSessionData();
  const start = data.analytics?.sessionStart || Date.now();
  return Math.floor((Date.now() - start) / 1000);
}

/**
 * Clear all session data.
 */
export function clearSessionData(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear session data:', error);
  }
}
