import { useEffect } from "react";
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import mapImage from "./assets/nobackHD.png";
// Fix for default marker icon in React Leaflet
// @ts-ignore
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type CoordArray = [number, number];
type CoordObject = { lat: number; lng: number } | { latitude?: number; longitude?: number } | { x?: number; y?: number };

interface MapMessageProps {
  locationName: string;
  coordinates: CoordArray | CoordObject | null | undefined;
  // optional props to tune bounds if needed
  imageBounds?: L.LatLngBoundsExpression;
  maxClamp?: number;
}

const DefaultBounds: L.LatLngBoundsExpression = [
  [0, 0],
  [1000, 1000],
];

// controller to recenter when coords change
const MapController = ({ coords }: { coords: CoordArray }) => {
  const map = useMap();
  useEffect(() => {
    if (!coords || coords.length !== 2) return;
    // use setView to immediately center or flyTo for animation
    try {
      map.flyTo(coords, Math.max(map.getZoom(), 1), { duration: 1.2 });
    } catch (err) {
      // fallback
      map.setView(coords, Math.max(map.getZoom(), 1));
    }
  }, [coords, map]);
  return null;
};

function normalizeToTuple(raw: any, maxClamp = 3000): CoordArray | null {
  if (!raw) return null;

  // if already an array [y,x] or [lat,lng]
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = Number(raw[0]);
    const b = Number(raw[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [clamp(a, 0, maxClamp), clamp(b, 0, maxClamp)];
    }
    return null;
  }

  // object shapes: {lat,lng} or {latitude,longitude} or {x,y}
  if (typeof raw === "object") {
    const lat = Number((raw.lat ?? raw.latitude ?? raw.y) as any);
    const lng = Number((raw.lng ?? raw.longitude ?? raw.x) as any);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [clamp(lat, 0, maxClamp), clamp(lng, 0, maxClamp)];
    }
  }

  // if it's two numeric args packed in string "10,20"
  if (typeof raw === "string" && raw.includes(",")) {
    const parts = raw.split(",").map((s) => Number(s.trim()));
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return [clamp(parts[0], 0, maxClamp), clamp(parts[1], 0, maxClamp)];
    }
  }

  return null;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function MapMessage({
  locationName,
  coordinates,
  imageBounds = DefaultBounds,
  maxClamp = 3000,
}: MapMessageProps) {
  // normalize coordinates into tuple [y, x]
  const tuple = normalizeToTuple(coordinates, maxClamp);

  // debug logs to help see what was passed
  useEffect(() => {
    console.debug("[MapMessage] raw coords:", coordinates, "normalized:", tuple);
  }, [coordinates, tuple]);

  // fallback center if coords invalid — choose center of image bounds
  const fallbackCenter: CoordArray = (() => {
    try {
      const b = imageBounds as L.LatLngBoundsExpression;
      if (Array.isArray(b) && b.length >= 2) {
        const y0 = Number((b[0] as any)[0]);
        const x0 = Number((b[0] as any)[1]);
        const y1 = Number((b[1] as any)[0]);
        const x1 = Number((b[1] as any)[1]);
        const cy = Number.isFinite(y0) && Number.isFinite(y1) ? (y0 + y1) / 2 : 500;
        const cx = Number.isFinite(x0) && Number.isFinite(x1) ? (x0 + x1) / 2 : 500;
        return [cy, cx];
      }
    } catch (err) {
      // ignore
    }
    return [500, 500];
  })();

  // Flip Y coordinate to match admin coordinate system (origin at top-left)
  const flippedMarker = tuple ? [1000 - tuple[0], tuple[1]] as CoordArray : null;
  const center = flippedMarker ?? fallbackCenter;

  return (
    <div className="w-60 h-48 rounded-lg overflow-hidden border border-border mt-2 relative z-2">
      <MapContainer
        crs={L.CRS.Simple}
        bounds={imageBounds}
        center={center}
        zoom={1}
        minZoom={-1}
        maxZoom={4}
        scrollWheelZoom={false}
        className="w-full h-full bg-slate-100"
        attributionControl={false}
      >
        <ImageOverlay url={mapImage} bounds={imageBounds} />
        {/* only render marker if tuple is good */}
        {flippedMarker ? (
          <Marker position={flippedMarker}>
            <Popup>{locationName}</Popup>
          </Marker>
        ) : null}
        <MapController coords={center} />
      </MapContainer>
    </div>
  );
}
