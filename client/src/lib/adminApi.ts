import type { ResponseData, Location, ApiResponse, UserPrivileges, MigrationResult } from '@/types/admin';

const API_BASE = '/api/admin';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const getJsonAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
};

// Response API functions
export async function fetchResponses(): Promise<ResponseData[]> {
  try {
    const response = await fetch(`${API_BASE}/responses`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
}

export async function saveResponse(responseData: ResponseData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/responses`, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(responseData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving response:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function deleteResponseApi(intent: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/responses/${encodeURIComponent(intent)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting response:', error);
    return { success: false, message: 'Network error' };
  }
}

// Location API functions
export async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function saveLocation(locationData: Location): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(locationData),
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('Error saving location:', result);
    }
    return result;
  } catch (error) {
    console.error('Error saving location:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function deleteLocationApi(id: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/locations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting location:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function fetchUserPrivilegesAdmin(): Promise<UserPrivileges> {
  try {
    const response = await fetch(`${API_BASE}/privileges`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse = await response.json();
    return result.success
      ? (result.data as UserPrivileges)
      : { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true, autoTranslateEnabled: true };
  } catch (error) {
    console.error('Error fetching privileges:', error);
    return { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true, autoTranslateEnabled: true };
  }
}

export async function saveUserPrivilegesAdmin(privileges: UserPrivileges): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/privileges`, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(privileges),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving privileges:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function fetchAutoTranslateStatus(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/auto-translate-status`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching auto-translate status:', error);
    return { success: false, message: 'Network error' };
  }
}

// Map Settings API functions
export interface MapData {
  id: string;
  url: string;
  active: boolean;
  name?: string;
}

export interface MapSettings {
  maps: MapData[];
}

export async function fetchMapSettings(): Promise<MapSettings> {
  try {
    const response = await fetch(`/api/map-settings`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse = await response.json();
    return result.success ? result.data : { maps: [] };
  } catch (error) {
    console.error('Error fetching map settings:', error);
    return { maps: [] };
  }
}

export async function saveMapSettings(settings: MapSettings): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/map-settings`, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving map settings:', error);
    return { success: false, message: 'Network error' };
  }
}

// Email verification API functions
export async function sendVerificationCode(email: string): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/email/send-verification', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function verifyCodeAndUpdateEmail(
  newEmail: string,
  verificationCode: string,
  currentEmail: string,
  password: string
): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/email/verify-and-update', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        newEmail,
        verificationCode,
        currentEmail,
        password,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error verifying code and updating email:', error);
    return { success: false, message: 'Network error' };
  }
}

// Password change API function
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Password change failed:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: 'Network error' };
  }
}

// FAQ API functions
export async function fetchAllFaqs(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/faqs`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

export async function fetchActiveFaqs(): Promise<any[]> {
  try {
    const response = await fetch(`/api/faqs`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Error fetching active FAQs:', error);
    return [];
  }
}

export async function saveFaq(faqData: any): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/faqs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(faqData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving FAQ:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function deleteFaqApi(id: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/faqs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, message: 'Network error' };
  }
}

// Bot Topics API
export interface BotTopic {
  topicKey: string;
  payload: string;
  superIntent: string;
  defaultLabel: string;
  defaultIcon: string;
  routingType: string;
  previewResponse?: string;
}

export interface BotCategory {
  id: string; 
  displayName: string;
  sourceFile: string;
  topics: BotTopic[];
}

export async function fetchBotTopics(): Promise<BotCategory[]> {
  try {
    const response = await fetch(`${API_BASE}/bot-topics`, {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.categories || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching bot topics:', error);
    return [];
  }
}

// ─── Super Intents API ────────────────────────────────────────────────────────

export interface SuperIntentMeta {
  file: string;
  intent: string;
  displayName: string;
  topicCount: number;
}

export interface TopicPin {
  name: string;
  lat: number;
  lng: number;
}

export interface TopicData {
  topic: string;
  ui_name: string | null;
  displayName: string;
  responses: { en: string[]; ceb: string[] };
  images: string[];
  map: { lat: number; lng: number } | null;
  pins: TopicPin[];
}

export interface SuperIntentTopicsResult {
  intent: string;
  displayName: string;
  topics: TopicData[];
}

export async function fetchSuperIntents(): Promise<SuperIntentMeta[]> {
  try {
    const response = await fetch(`${API_BASE}/super-intents`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.success ? result.superIntents : [];
  } catch (error) {
    console.error('Error fetching super intents:', error);
    return [];
  }
}

export async function fetchSuperIntentTopics(file: string): Promise<SuperIntentTopicsResult | null> {
  try {
    const response = await fetch(`${API_BASE}/super-intents/${encodeURIComponent(file)}`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    return result.success ? result : null;
  } catch (error) {
    console.error('Error fetching super intent topics:', error);
    return null;
  }
}

export async function updateSuperIntentTopic(
  file: string,
  topicData: {
    topic: string;
    ui_name?: string;
    responses?: { en: string[]; ceb: string[] };
    images?: string[];
    map?: { lat: number; lng: number } | null;
    pins?: TopicPin[];
  }
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/super-intents/${encodeURIComponent(file)}/topic`, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(topicData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating topic:', error);
    return { success: false, message: 'Network error' };
  }
}

// ─── Migration API ────────────────────────────────────────────────────────────

export async function fetchMigrationStatus(): Promise<ApiResponse & { data?: any }> {
  try {
    const response = await fetch(`${API_BASE}/migrate/status`, {
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching migration status:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function migrateResponses(): Promise<MigrationResult> {
  try {
    const response = await fetch(`${API_BASE}/migrate/responses`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error migrating responses:', error);
    return { success: false, message: 'Network error', imported: 0, errors: [] };
  }
}

export async function migrateLocations(): Promise<MigrationResult> {
  try {
    const response = await fetch(`${API_BASE}/migrate/locations`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error migrating locations:', error);
    return { success: false, message: 'Network error', imported: 0, errors: [] };
  }
}

export async function migrateSuperIntents(): Promise<MigrationResult> {
  try {
    const response = await fetch(`${API_BASE}/migrate/super-intents`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error migrating super intents:', error);
    return { success: false, message: 'Network error', imported: 0, errors: [] };
  }
}
export async function syncKnowledgeBaseApi(force: boolean = false): Promise<MigrationResult> {
  try {
    const response = await fetch(`${API_BASE}/migrate/sync?force=${force}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Error syncing knowledge base:', error);
    return { success: false, message: 'Network error', imported: 0, errors: [] };
  }
}
