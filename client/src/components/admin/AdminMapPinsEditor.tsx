/**
 * AdminMapPinsEditor
 * ──────────────────
 * A reusable map+pins editor component for admin modals.
 * Left: canvas map with overlaid controls (zoom in/out, place pin, reset)
 * Right: pins sidebar (list + add/remove)
 *
 * Coordinates use [y, x] format in 0–1000 scale (same as chatbot)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminPin {
  name: string;
  /** [y, x] format — matches chatbot display */
  coordinates: [number, number];
}

interface AdminMapPinsEditorProps {
  /** [y, x] main pin coordinate */
  mainCoords: [number, number];
  /** All named pins */
  pins: AdminPin[];
  onMainCoordsChange: (c: [number, number]) => void;
  onPinsChange: (pins: AdminPin[]) => void;
  /** Show the main single-pin controls (for General / Super Intent — one location per topic) */
  showMainPin?: boolean;
  /** Map display size (canvas) */
  mapSize?: number;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const PIN_COLOURS = [
  "#2563eb","#dc2626","#16a34a","#ea580c","#9333ea",
  "#0891b2","#be185d","#ca8a04","#4f46e5","#0f766e",
];

function pinColour(idx: number) {
  return PIN_COLOURS[idx % PIN_COLOURS.length];
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawPin(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  colour: string,
  label?: string
) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(sx + 1, sy + 13, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(sx, sy - 7, 9, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.moveTo(sx - 9, sy - 7);
  ctx.lineTo(sx, sy + 12);
  ctx.lineTo(sx + 9, sy - 7);
  ctx.closePath();
  ctx.fill();

  // White centre dot
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(sx, sy - 7, 3, 0, Math.PI * 2);
  ctx.fill();

  // Label badge
  if (label) {
    ctx.font = "bold 9px system-ui";
    const w = ctx.measureText(label).width + 8;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    const bx = sx + 12;
    const by = sy - 14;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, 13, 3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, bx + 4, by + 10);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminMapPinsEditor({
  mainCoords,
  pins,
  onMainCoordsChange,
  onPinsChange,
  showMainPin = true,
  mapSize = 420,
}: AdminMapPinsEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Zoom / pan
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // Interaction mode
  const [mode, setMode] = useState<"view" | "place-main" | "place-pin">("view");

  // Pending-pin name (typed before placing)
  const [pendingPinName, setPendingPinName] = useState("");

  // Load map image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => { mapImgRef.current = img; setImgLoaded(true); };
    img.onerror = () => setImgLoaded(true); // draw grid as fallback
    img.src = "/nobackHD.png";
  }, []);

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = mapSize;
    const H = mapSize;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Pan+zoom context
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(zoom, zoom);

    // Map image or grid fallback
    if (mapImgRef.current) {
      ctx.drawImage(mapImgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 0.5 / zoom;
      for (let x = 0; x <= W; x += W / 10) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += H / 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    ctx.restore();

    // Helper: convert [y, x] 0-1000 → screen coords (accounts for zoom+pan)
    const toScreen = (coords: [number, number]) => ({
      sx: tx + (coords[1] / 1000) * W * zoom,
      sy: ty + (coords[0] / 1000) * H * zoom,
    });

    // Draw named pins
    pins.forEach((pin, i) => {
      if (!pin.coordinates) return;
      const { sx, sy } = toScreen(pin.coordinates);
      drawPin(ctx, sx, sy, pinColour(i + 1), pin.name || `Pin ${i + 1}`);
    });

    // Draw main pin (blue) on top
    if (showMainPin) {
      const { sx, sy } = toScreen(mainCoords);
      drawPin(ctx, sx, sy, "#2563eb");
      // small "Main" label
      ctx.font = "bold 9px system-ui";
      ctx.fillStyle = "rgba(37,99,235,0.85)";
      ctx.beginPath();
      ctx.roundRect(sx + 12, sy - 14, 38, 13, 3);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText("Main", sx + 16, sy - 5);
    }
  }, [mainCoords, pins, zoom, tx, ty, imgLoaded, showMainPin, mapSize]);

  useEffect(() => { draw(); }, [draw]);

  // ── Zoom helpers ──────────────────────────────────────────────────────────

  const doZoom = useCallback((factor: number, mx = mapSize / 2, my = mapSize / 2) => {
    setZoom(prev => {
      const next = Math.min(8, Math.max(0.5, prev * factor));
      setTx(prevTx => mx - (mx - prevTx) * (next / prev));
      setTy(prevTy => my - (my - prevTy) * (next / prev));
      return next;
    });
  }, [mapSize]);

  // Ctrl+Scroll zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    doZoom(e.deltaY < 0 ? 1.15 : 0.87, mx, my);
  }, [doZoom]);

  // ── Mouse interactions ────────────────────────────────────────────────────

  const toMapCoords = (clientX: number, clientY: number): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const mapX = (cx - tx) / zoom / mapSize * 1000;
    const mapY = (cy - ty) / zoom / mapSize * 1000;
    return [Math.round(Math.max(0, Math.min(1000, mapY))), Math.round(Math.max(0, Math.min(1000, mapX)))];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "view") return;
    isDragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    setTx(dragOrigin.current.tx + dx);
    setTy(dragOrigin.current.ty + dy);
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = toMapCoords(e.clientX, e.clientY);
    if (mode === "place-main") {
      onMainCoordsChange(coords);
      setMode("view");
    } else if (mode === "place-pin") {
      const newPin: AdminPin = {
        name: pendingPinName.trim() || `Pin ${pins.length + 1}`,
        coordinates: coords,
      };
      onPinsChange([...pins, newPin]);
      setPendingPinName("");
      setMode("view");
    }
  };

  const handleReset = () => {
    setZoom(1); setTx(0); setTy(0);
  };

  // ── Cursor ──────────────────────────────────────────────────────────────

  const cursor = mode !== "view" ? "crosshair" : isDragging.current ? "grabbing" : "grab";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-3 h-full">
      {/* ── LEFT: Map canvas ── */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0" style={{ width: mapSize, height: mapSize }}>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={mapSize}
          height={mapSize}
          style={{ width: mapSize, height: mapSize, display: "block", cursor }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* ──── Overlaid HUD — LEFT side ──── */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {/* Zoom In */}
          <button
            onClick={() => doZoom(1.25)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
            title="Zoom In (Ctrl+Scroll)"
          >
            <ZoomIn className="h-4 w-4 text-gray-700" />
          </button>
          {/* Zoom Out */}
          <button
            onClick={() => doZoom(0.8)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
            title="Zoom Out (Ctrl+Scroll)"
          >
            <ZoomOut className="h-4 w-4 text-gray-700" />
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-300 mx-1" />

          {/* Place Main Pin — only when showMainPin */}
          {showMainPin && (
            <button
              onClick={() => setMode(mode === "place-main" ? "view" : "place-main")}
              className={`w-8 h-8 rounded-lg shadow flex items-center justify-center transition-colors border ${
                mode === "place-main"
                  ? "bg-blue-600 border-blue-700 text-white"
                  : "bg-white/90 backdrop-blur border-gray-200 hover:bg-white text-gray-700"
              }`}
              title={mode === "place-main" ? "Click map to place Main pin" : "Place Main Pin"}
            >
              📍
            </button>
          )}

          {/* Place Named Pin */}
          <button
            onClick={() => setMode(mode === "place-pin" ? "view" : "place-pin")}
            className={`w-8 h-8 rounded-lg shadow flex items-center justify-center transition-colors border ${
              mode === "place-pin"
                ? "bg-orange-500 border-orange-600 text-white"
                : "bg-white/90 backdrop-blur border-gray-200 hover:bg-white text-gray-700"
            }`}
            title={mode === "place-pin" ? "Click map to place named pin" : "Place Named Pin"}
          >
            📌
          </button>
        </div>

        {/* ──── Reset — TOP RIGHT ──── */}
        <button
          onClick={handleReset}
          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
          title="Reset zoom & pan"
        >
          <RotateCcw className="h-3.5 w-3.5 text-gray-700" />
        </button>

        {/* ──── Mode HUD banner ──── */}
        {mode !== "view" && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {mode === "place-main" ? "Click to place main pin" : "Click to place named pin"}
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* ── RIGHT: Pins sidebar ── */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Named Pins</p>
          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{pins.length}</span>
        </div>

        {/* Pin name input before placing */}
        {mode === "place-pin" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 space-y-1">
            <Label className="text-[10px] text-orange-700 font-medium">Pin Name (optional)</Label>
            <Input
              value={pendingPinName}
              onChange={e => setPendingPinName(e.target.value)}
              placeholder="e.g. Main entrance"
              className="h-7 text-xs"
              autoFocus
            />
            <p className="text-[10px] text-orange-600">Then click on the map to place</p>
          </div>
        )}

        {/* Add pin button */}
        {mode === "view" && (
          <button
            onClick={() => setMode("place-pin")}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add pin
          </button>
        )}

        {/* Pin list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ scrollbarWidth: "thin" }}>
          {pins.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs border-2 border-dashed rounded-lg">
              <MapPin className="h-5 w-5 mx-auto mb-1 opacity-30" />
              No pins yet
            </div>
          ) : (
            pins.map((pin, i) => (
              <div key={i} className="border rounded-lg p-2 bg-gray-50 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: pinColour(i + 1) }} />
                    <span className="text-xs font-medium text-gray-700 truncate">{pin.name || `Pin ${i + 1}`}</span>
                  </div>
                  <button onClick={() => onPinsChange(pins.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <Label className="text-[10px] text-muted-foreground block mb-0.5">Name</Label>
                    <Input value={pin.name} onChange={e => { const n = [...pins]; n[i] = { ...n[i], name: e.target.value }; onPinsChange(n); }} className="h-6 text-xs px-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <Label className="text-[10px] text-muted-foreground block mb-0.5">Y</Label>
                      <Input type="number" value={pin.coordinates[0]}
                        onChange={e => { const n = [...pins]; n[i] = { ...n[i], coordinates: [Number(e.target.value), n[i].coordinates[1]] }; onPinsChange(n); }}
                        className="h-6 text-xs px-1.5" min={0} max={1000} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground block mb-0.5">X</Label>
                      <Input type="number" value={pin.coordinates[1]}
                        onChange={e => { const n = [...pins]; n[i] = { ...n[i], coordinates: [n[i].coordinates[0], Number(e.target.value)] }; onPinsChange(n); }}
                        className="h-6 text-xs px-1.5" min={0} max={1000} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom info note */}
        <p className="text-[10px] text-muted-foreground border-t pt-1.5 leading-relaxed">
          📍 Coords: <code className="font-mono">[y, x]</code> · 0–1000 scale · Ctrl+Scroll to zoom · Drag map to pan
        </p>
      </div>
    </div>
  );
}
