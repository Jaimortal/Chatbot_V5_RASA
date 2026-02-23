import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ResponseData, Location, ApiResponse, UserPrivileges } from '../client/src/types/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const RESPONSES_FILE = path.join(__dirname, '..', 'rasa', 'actions', 'responses.json');
const RESPONSES_LOCATION_FILE = path.join(__dirname, '..', 'rasa', 'actions', 'responses_location.json');
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
  mapAccessEnabled: true,
  autoTranslateEnabled: true
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

type LocationFileShape = {
  locations: Record<
    string,
    {
      type?: string;
      building?: string;
      floor?: string;
      coordinates?: [number, number] | number[];
      pins?: Array<{ name?: string; coordinates?: [number, number] | number[] }>;
      map_id?: string;
      mapId?: string;
      responses?: Record<string, any>;
      imageUrls?: string[];
    }
  >;
};

async function readLocationFile(): Promise<LocationFileShape> {
  try {
    const data = await fs.readFile(RESPONSES_LOCATION_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && parsed.locations && typeof parsed.locations === 'object') {
      return parsed as LocationFileShape;
    }
    return { locations: {} };
  } catch (error) {
    console.error('Error reading responses_location.json:', error);
    return { locations: {} };
  }
}

async function writeLocationFile(next: LocationFileShape): Promise<boolean> {
  try {
    let base: any = {};
    try {
      const current = await fs.readFile(RESPONSES_LOCATION_FILE, 'utf-8');
      const parsed = JSON.parse(current);
      if (parsed && typeof parsed === 'object') {
        base = parsed;
      }
    } catch {
      base = {};
    }

    const merged = {
      ...base,
      locations: next.locations || {},
    };

    await fs.writeFile(RESPONSES_LOCATION_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving responses_location.json:', error);
    return false;
  }
}

// Read locations from responses_location.json
export async function getLocations(): Promise<Location[]> {
  try {
    const file = await readLocationFile();
    const locationsMap = file.locations || {};
    return Object.entries(locationsMap).map(([name, value]) => {
      const coordsRaw: any = (value as any)?.coordinates;
      const coords: [number, number] =
        Array.isArray(coordsRaw) && coordsRaw.length === 2
          ? [Number(coordsRaw[0]), Number(coordsRaw[1])]
          : [500, 500];

      const pinsRaw: any = (value as any)?.pins;
      const pins: Array<{ name: string; coordinates: [number, number] }> = Array.isArray(pinsRaw)
        ? pinsRaw
            .map((p: any, idx: number) => {
              const c: any = p?.coordinates;
              const tuple: [number, number] = Array.isArray(c) && c.length === 2
                ? [Number(c[0]), Number(c[1])]
                : coords;
              const n = String(p?.name || "").trim() || `Pin ${idx + 1}`;
              return { name: n, coordinates: tuple };
            })
            .filter((p: any) => Array.isArray(p.coordinates) && p.coordinates.length === 2)
        : [];
      const mapId = (value as any)?.map_id || (value as any)?.mapId || 'main_map';

      const imageUrls = Array.isArray((value as any)?.imageUrls)
        ? (value as any).imageUrls.map((s: any) => String(s)).filter(Boolean)
        : [];

      const responsesRaw: any = (value as any)?.responses;
      const responses =
        responsesRaw && typeof responsesRaw === 'object'
          ? {
              en: Array.isArray(responsesRaw?.en) ? responsesRaw.en : [],
              ceb: Array.isArray(responsesRaw?.ceb) ? responsesRaw.ceb : [],
            }
          : { en: [], ceb: [] };

      return {
        id: name,
        name,
        coordinates: coords,
        mapImage: mapId,
        type: (value as any)?.type,
        building: (value as any)?.building,
        floor: (value as any)?.floor,
        pins,
        responses,
        imageUrls,
      };
    });
  } catch (error) {
    console.error('Error reading locations:', error);
    return [];
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
    const file = await readLocationFile();
    const key = String(location?.id || location?.name || '').trim();
    if (!key) {
      return { success: false, message: 'Location id/name is required' };
    }

    const next = { ...(file.locations || {}) } as any;
    const existing = next[key] || {};

    const nextResponses = {
      en: Array.isArray((location as any)?.responses?.en) ? (location as any).responses.en : (existing.responses?.en || []),
      ceb: Array.isArray((location as any)?.responses?.ceb) ? (location as any).responses.ceb : (existing.responses?.ceb || []),
    };

    const nextImageUrls: string[] = Array.isArray((location as any)?.imageUrls)
      ? (location as any).imageUrls.map((s: any) => String(s).trim()).filter(Boolean)
      : (Array.isArray(existing.imageUrls) ? existing.imageUrls : []);

    const pinsRaw: any = (location as any)?.pins;
    const pinsProvided = Object.prototype.hasOwnProperty.call((location as any) || {}, 'pins');
    const nextPins = Array.isArray(pinsRaw)
      ? pinsRaw
          .map((p: any, idx: number) => {
            const name = String(p?.name || "").trim() || `Pin ${idx + 1}`;
            const c: any = p?.coordinates;
            const coords: [number, number] | null = Array.isArray(c) && c.length === 2
              ? [Number(c[0]), Number(c[1])]
              : null;
            if (!coords) return null;
            return { name, coordinates: coords };
          })
          .filter(Boolean)
      : (Array.isArray(existing.pins) ? existing.pins : []);

    const coordsRaw: any = (location as any)?.coordinates;
    const nextCoords: [number, number] =
      Array.isArray(coordsRaw) && coordsRaw.length === 2
        ? [Number(coordsRaw[0]), Number(coordsRaw[1])]
        : (Array.isArray(existing.coordinates) && existing.coordinates.length === 2
            ? [Number(existing.coordinates[0]), Number(existing.coordinates[1])]
            : [500, 500]);

    const coordsFromPins: [number, number] | null = Array.isArray(nextPins) && nextPins.length > 0
      ? ([Number(nextPins[0].coordinates[0]), Number(nextPins[0].coordinates[1])] as [number, number])
      : null;

    next[key] = {
      ...existing,
      type: (location as any)?.type || existing.type,
      building: (location as any)?.building || existing.building,
      floor: (location as any)?.floor || existing.floor,
      coordinates: coordsFromPins || nextCoords,
      pins: pinsProvided ? nextPins : (Array.isArray(existing.pins) ? existing.pins : nextPins),
      map_id: location.mapImage || existing.map_id || existing.mapId || 'main_map',
      responses: nextResponses,
      imageUrls: nextImageUrls,
    };

    const success = await writeLocationFile({ locations: next });
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
    const file = await readLocationFile();
    const key = String(id || '').trim();
    if (!key) {
      return { success: false, message: 'Location id is required' };
    }

    const next = { ...(file.locations || {}) } as any;
    if (!next[key]) {
      return { success: false, message: 'Location not found' };
    }

    delete next[key];
    const success = await writeLocationFile({ locations: next });
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
