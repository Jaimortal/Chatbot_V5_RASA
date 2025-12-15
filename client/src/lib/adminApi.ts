import type { ResponseData, Location, ApiResponse, UserPrivileges } from '@/types/admin';

const API_BASE = '/api/admin';

// Response API functions
export async function fetchResponses(): Promise<ResponseData[]> {
  try {
    const response = await fetch(`${API_BASE}/responses`);
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE}/locations`);
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting location:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function fetchUserPrivilegesAdmin(): Promise<UserPrivileges> {
  try {
    const response = await fetch(`${API_BASE}/privileges`);
    const result: ApiResponse = await response.json();
    return result.success
      ? (result.data as UserPrivileges)
      : { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true };
  } catch (error) {
    console.error('Error fetching privileges:', error);
    return { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true };
  }
}

export async function saveUserPrivilegesAdmin(privileges: UserPrivileges): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/privileges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(privileges),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving privileges:', error);
    return { success: false, message: 'Network error' };
  }
}
