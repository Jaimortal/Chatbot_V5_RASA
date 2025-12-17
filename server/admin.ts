import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ResponseData, Location, ApiResponse, UserPrivileges } from '../client/src/types/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const RESPONSES_FILE = path.join(__dirname, '..', 'rasa', 'actions', 'responses.json');
const LOCATIONS_FILE = path.join(DATA_DIR, 'locations.json');
const PRIVILEGES_FILE = path.join(DATA_DIR, 'user_privileges.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_PRIVILEGES: UserPrivileges = {
  chatEnabled: true,
  audioInputEnabled: true,
  mapAccessEnabled: true
};

// Read responses from responses.json
export async function getResponses(): Promise<ResponseData[]> {
  try {
    const data = await fs.readFile(RESPONSES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading responses:', error);
    return [];
  }
}

// Write responses to responses.json
export async function saveResponses(responses: ResponseData[]): Promise<boolean> {
  try {
    await fs.writeFile(RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving responses:', error);
    return false;
  }
}

// Read locations from locations.json
export async function getLocations(): Promise<Location[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(LOCATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.locations || [];
  } catch (error) {
    console.error('Error reading locations:', error);
    return [];
  }
}

// Write locations to locations.json
export async function saveLocations(locations: Location[]): Promise<boolean> {
  try {
    await ensureDataDir();
    await fs.writeFile(LOCATIONS_FILE, JSON.stringify({ locations }, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving locations:', error);
    return false;
  }
}

export async function getUserPrivileges(): Promise<UserPrivileges> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRIVILEGES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_PRIVILEGES,
      ...(parsed || {})
    };
  } catch (error) {
    return { ...DEFAULT_PRIVILEGES };
  }
}

export async function saveUserPrivileges(privileges: UserPrivileges): Promise<boolean> {
  try {
    await ensureDataDir();
    await fs.writeFile(PRIVILEGES_FILE, JSON.stringify(privileges, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving user privileges:', error);
    return false;
  }
}

export async function upsertUserPrivileges(privileges: UserPrivileges): Promise<ApiResponse> {
  try {
    const success = await saveUserPrivileges(privileges);
    return {
      success,
      message: success ? 'Privileges saved successfully' : 'Failed to save privileges',
      data: privileges
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error saving privileges: ' + error
    };
  }
}

// Add or update a response
export async function upsertResponse(responseData: ResponseData): Promise<ApiResponse> {
  try {
    const responses = await getResponses();
    const existingIndex = responses.findIndex(r => r.intent === responseData.intent);
    
    if (existingIndex >= 0) {
      const existing = responses[existingIndex];
      responses[existingIndex] = {
        ...existing,
        ...responseData,
        intent: existing.intent,
        category: existing.category,
        sub_category: existing.sub_category,
      };
    } else {
      responses.push(responseData);
    }
    
    const success = await saveResponses(responses);
    return {
      success,
      message: success ? 'Response saved successfully' : 'Failed to save response',
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error saving response: ' + error
    };
  }
}

// Delete a response
export async function deleteResponse(intent: string): Promise<ApiResponse> {
  return {
    success: false,
    message: 'Deleting intents is disabled.'
  };
}

// Add or update a location
export async function upsertLocation(location: Location): Promise<ApiResponse> {
  try {
    const locations = await getLocations();
    const existingIndex = locations.findIndex(l => l.id === location.id);
    
    if (existingIndex >= 0) {
      locations[existingIndex] = location;
    } else {
      locations.push(location);
    }
    
    const success = await saveLocations(locations);
    return {
      success,
      message: success ? 'Location saved successfully' : 'Failed to save location',
      data: location
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error saving location: ' + error
    };
  }
}

// Delete a location
export async function deleteLocation(id: string): Promise<ApiResponse> {
  try {
    const locations = await getLocations();
    const filteredLocations = locations.filter(l => l.id !== id);
    
    const success = await saveLocations(filteredLocations);
    return {
      success,
      message: success ? 'Location deleted successfully' : 'Failed to delete location'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error deleting location: ' + error
    };
  }
}
