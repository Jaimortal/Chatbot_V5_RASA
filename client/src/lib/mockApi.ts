import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sendMessageToRasa } from "./rasaData"; // Your live Rasa API

// --- Utilities ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple ID generator
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Types ---
export type MessageType = "text" | "map";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  type: MessageType;
  timestamp: Date;
  mapData?: {
    locationName: string;
    coordinates: { lat: number; lng: number }; // Changed from [number, number]
  };
}

// Interface for the response format expected by ChatWindow
interface BackendResponse {
  answer?: string | string[];
  mapData?: {
    locationName: string;
    coordinates: { lat: number; lng: number };
  };
}

// --- Backend Adapter for Rasa ---
class RasaBackend {
  private lastTopic: string | null = null;

  // This method now returns a BackendResponse object instead of ChatMessage[]
  async sendMessage(text: string): Promise<BackendResponse> {
    try {
      const responses = await sendMessageToRasa(text);
      
      // Combine all text responses
      let combinedText = "";
      let mapData: any = null;

      responses.forEach((r: any) => {
        // Extract text
        if (r.text) {
          combinedText += r.text + "\n";
        }

        // Extract custom data (follow_up, map, etc.)
        if (r.custom) {
          if (r.custom.follow_up) {
            combinedText += "\n" + r.custom.follow_up.join("\n") + "\n";
          }
          
          // Check for map data in custom response
          if (r.custom.mapData) {
            mapData = {
              locationName: r.custom.mapData.locationName || "Location",
              coordinates: Array.isArray(r.custom.mapData.coordinates) 
                ? { lat: r.custom.mapData.coordinates[0], lng: r.custom.mapData.coordinates[1] }
                : r.custom.mapData.coordinates
            };
          }
          
          // Also check for direct map property
          if (r.custom.map) {
            mapData = {
              locationName: r.custom.map.locationName || "Location",
              coordinates: Array.isArray(r.custom.map.coordinates) 
                ? { lat: r.custom.map.coordinates[0], lng: r.custom.map.coordinates[1] }
                : r.custom.map.coordinates
            };
          }
        }

        // Check for buttons that might contain location info
        if (r.buttons && Array.isArray(r.buttons)) {
          r.buttons.forEach((btn: any) => {
            if (btn.payload && btn.payload.includes("location")) {
              // Extract location from button payload
              // You can customize this based on your Rasa button structure
            }
          });
        }
      });

      // Clean up text
      combinedText = combinedText.trim();

      // Build response object
      const response: BackendResponse = {
        answer: combinedText || "I received your message but got an empty response."
      };

      // Add map data if available
      if (mapData) {
        response.mapData = mapData;
      }

      // If no map data from Rasa, check if the query implies a location
      if (!mapData && this.isLocationQuery(text)) {
        // Add default map data for location queries
        response.mapData = {
          locationName: "General Location",
          coordinates: { lat: 10.297, lng: 123.897 }
        };
      }

      return response;

    } catch (err) {
      console.error("Error sending message to Rasa:", err);
      return {
        answer: "Sorry, there was an error connecting to the AI backend. Please try again."
      };
    }
  }

  // Helper to detect location-related queries
  private isLocationQuery(text: string): boolean {
    const locationKeywords = [
      'where', 'location', 'map', 'directions', 'find', 'locate',
      'near', 'close to', 'around', 'place', 'spot', 'area',
      'shop', 'store', 'mall', 'restaurant', 'food', 'eat',
      'restroom', 'toilet', 'cr', 'bathroom', 'washroom',
      'entrance', 'exit', 'gate', 'door', 'elevator', 'escalator',
      'parking', 'car', 'vehicle', 'atm', 'bank', 'money',
      'information', 'help desk', 'concierge', 'security'
    ];
    
    const lowerText = text.toLowerCase();
    return locationKeywords.some(keyword => lowerText.includes(keyword));
  }
}

// --- Export instance and utility ---
export const mockBackend = new RasaBackend();
export type { ChatMessage };

// Helper function for ChatWindow to convert responses
export function convertRasaResponseToMessages(rasaResponses: any[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  rasaResponses.forEach((response) => {
    let text = response.text || "";
    
    if (response.custom?.follow_up) {
      text += "\n\n" + response.custom.follow_up.join("\n");
    }
    
    messages.push({
      id: generateId(),
      text: text,
      sender: "bot",
      type: "text",
      timestamp: new Date()
    });
    
    // Handle map data if present
    if (response.custom?.map) {
      messages.push({
        id: generateId(),
        text: "",
        sender: "bot",
        type: "map",
        timestamp: new Date(),
        mapData: {
          locationName: response.custom.map.locationName || "Location",
          coordinates: Array.isArray(response.custom.map.coordinates)
            ? { lat: response.custom.map.coordinates[0], lng: response.custom.map.coordinates[1] }
            : response.custom.map.coordinates || { lat: 0, lng: 0 }
        }
      });
    }
  });
  
  return messages;
}