import type { ResponseData, Location, ApiResponse, UserPrivileges } from '@/types/admin';

const API_BASE = '/api/admin';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
      body: JSON.stringify(locationData),
    });
    return await response.json();
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
      headers: getAuthHeaders(),
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
