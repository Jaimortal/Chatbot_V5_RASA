export interface Intent {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  category: string;
  type: 'text' | 'map';
  linkedLocationId?: string;
}

export interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [y, x] format
  mapImage: string;
}

export interface ResponseData {
  intent: string;
  category: string;
  sub_category: string;
  responses: {
    answer: string[] | Record<string, string[]>;
    imageUrl?: string;
    imageUrls?: string[];
    mapData?: {
      locationName: string;
      coordinates: [number, number];
      mapId: string;
    } | Array<{
      locationName: string;
      coordinates: [number, number];
      mapId: string;
    }>;
    follow_up?: string[];
    context_slots?: Record<string, any>;
  };
  laboratories?: Record<
    string,
    {
      en?: string[];
      ceb?: string[];
      image?: string;
      images?: string[];
      coordinates?: [number, number] | number[];
      map_id?: string;
      mapId?: string;
    }
  >;
  metadata: {
    source: string;
    author?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export interface UserPrivileges {
  chatEnabled: boolean;
  audioInputEnabled: boolean;
  mapAccessEnabled: boolean;
  autoTranslateEnabled: boolean;
}
