import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InteractiveMapProps {
  initialCoordinates?: [number, number];
  onCoordinatesChange: (coordinates: [number, number]) => void;
  width?: number;
  height?: number;
}

export default function InteractiveMap({ 
  initialCoordinates = [500, 500], 
  onCoordinatesChange,
  width = 600,
  height = 600 
}: InteractiveMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number]>(initialCoordinates);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
      drawMap();
    };
    img.onerror = () => {
      console.log('Map image not found, using fallback grid');
      drawMap(); // Draw fallback grid
    };
    img.src = '/nobackHD.png'; // Default map image
  }, []);

  useEffect(() => {
    drawMap();
  }, [coordinates, mapImage, scale, offset]);

  // Keep internal coordinates in sync when parent changes initialCoordinates
  useEffect(() => {
    setCoordinates(initialCoordinates);
  }, [initialCoordinates]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply scale and offset transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw map image or fallback grid
    if (mapImage) {
      ctx.drawImage(mapImage, 0, 0, width, height);
    } else {
      // Draw fallback grid
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      
      // Draw grid lines
      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Add grid labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText('(0,0)', 5, 15);
      ctx.fillText(`(${height},${width})`, width - 40, height - 5);
    }

    // Draw pin - convert from 1000x1000 coordinates to canvas coordinates
    const [y, x] = coordinates;
    const canvasX = (x / 1000) * width;
    const canvasY = (y / 1000) * height;
    
    // Draw pin shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(canvasX + 2, canvasY + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw pin
    ctx.fillStyle = '#ef4444'; // Red color
    ctx.beginPath();
    ctx.arc(canvasX, canvasY - 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw pin point
    ctx.beginPath();
    ctx.moveTo(canvasX - 8, canvasY - 5);
    ctx.lineTo(canvasX, canvasY + 10);
    ctx.lineTo(canvasX + 8, canvasY - 5);
    ctx.closePath();
    ctx.fill();

    // Draw pin center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY - 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw delete button if hovering
    if (showDeleteButton) {
      // Draw delete button background
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(canvasX + 15, canvasY - 20, 20, 20);
      
      // Draw X
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvasX + 18, canvasY - 17);
      ctx.lineTo(canvasX + 32, canvasY - 3);
      ctx.moveTo(canvasX + 32, canvasY - 17);
      ctx.lineTo(canvasX + 18, canvasY - 3);
      ctx.stroke();
    }

    ctx.restore();
  };

  const getScreenCoords = (coords: [number, number]) => {
    const [y, x] = coords;
    const canvasX = (x / 1000) * width;
    const canvasY = (y / 1000) * height;
    return {
      screenX: offset.x + canvasX * scale,
      screenY: offset.y + canvasY * scale
    };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on delete button
    if (showDeleteButton) {
      const { screenX, screenY } = getScreenCoords(coordinates);
      
      if (x >= screenX + 15 && x <= screenX + 35 && y >= screenY - 20 && y <= screenY) {
        // Delete pin - set to center or clear coordinates
        const newCoordinates: [number, number] = [500, 500];
        setCoordinates(newCoordinates);
        onCoordinatesChange(newCoordinates);
        setShowDeleteButton(false);
        return;
      }
    }
    
    if (!isPlacingPin) return;

    // Undo pan/zoom to get canvas-space coordinates
    const canvasX = (x - offset.x) / scale;
    const canvasY = (y - offset.y) / scale;

    // Scale to 1000x1000 coordinate system to match user chat map
    const scaledX = Math.round((canvasX / width) * 1000);
    const scaledY = Math.round((canvasY / height) * 1000);

    const newCoordinates: [number, number] = [scaledY, scaledX];
    setCoordinates(newCoordinates);
    onCoordinatesChange(newCoordinates);
    setIsPlacingPin(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if hovering over pin
    const { screenX, screenY } = getScreenCoords(coordinates);
    
    const isHoveringPin = Math.sqrt(Math.pow(x - screenX, 2) + Math.pow(y - (screenY - 5), 2)) <= 15;
    
    if (isHoveringPin && !isPlacingPin) {
      setShowDeleteButton(true);
      canvas.style.cursor = 'pointer';
    } else {
      setShowDeleteButton(false);
      canvas.style.cursor = isPlacingPin ? 'crosshair' : isDragging ? 'grabbing' : 'grab';
    }
    
    // Handle pin dragging
    if (isDraggingPin) {
      const canvasX = (x - offset.x) / scale;
      const canvasY = (y - offset.y) / scale;
      const scaledX = Math.round((canvasX / width) * 1000);
      const scaledY = Math.round((canvasY / height) * 1000);
      const newCoordinates: [number, number] = [scaledY, scaledX];
      setCoordinates(newCoordinates);
      onCoordinatesChange(newCoordinates);
    }
    
    // Handle map panning
    if (!isDragging) return;
    
    const newOffset = {
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    };
    
    setOffset(newOffset);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on pin for dragging
    const { screenX, screenY } = getScreenCoords(coordinates);
    
    const isClickingPin = Math.sqrt(Math.pow(x - screenX, 2) + Math.pow(y - (screenY - 5), 2)) <= 15;
    
    if (isClickingPin && !isPlacingPin) {
      setIsDraggingPin(true);
      return;
    }
    
    if (isPlacingPin) return;
    
    setIsDragging(true);
    setDragStart({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingPin(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsDraggingPin(false);
    setShowDeleteButton(false);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleManualInput = (axis: 'x' | 'y', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(1000, numValue));
    
    const newCoordinates: [number, number] = axis === 'x' 
      ? [coordinates[0], clampedValue]
      : [clampedValue, coordinates[1]];
    
    setCoordinates(newCoordinates);
    onCoordinatesChange(newCoordinates);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Interactive Map</h3>
          <div className="flex gap-2">
            <Button
              variant={isPlacingPin ? "default" : "outline"}
              onClick={() => setIsPlacingPin(!isPlacingPin)}
              size="sm"
            >
              {isPlacingPin ? "Click on map to place pin" : "Place Pin"}
            </Button>
            <Button variant="outline" onClick={handleZoomIn} size="sm">
              Zoom In
            </Button>
            <Button variant="outline" onClick={handleZoomOut} size="sm">
              Zoom Out
            </Button>
            <Button variant="outline" onClick={handleResetZoom} size="sm">
              Reset
            </Button>
          </div>
        </div>

        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`cursor-${isPlacingPin ? 'crosshair' : isDragging ? 'grabbing' : 'grab'}`}
            style={{ 
              width: `${width}px`, 
              height: `${height}px`,
              display: 'block'
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Y Coordinate</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={coordinates[0]}
              onChange={(e) => handleManualInput('y', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">X Coordinate</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={coordinates[1]}
              onChange={(e) => handleManualInput('x', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex justify-between">
          <span>Current coordinates: ({coordinates[0]}, {coordinates[1]})</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </Card>
  );
}
