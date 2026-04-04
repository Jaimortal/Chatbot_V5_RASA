import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMapSettings, saveMapSettings, type MapSettings, type MapData } from "@/lib/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Upload, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminMapSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const { data: mapSettings } = useQuery({
    queryKey: ["mapSettings"],
    queryFn: fetchMapSettings,
  });

  const saveMutation = useMutation({
    mutationFn: saveMapSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapSettings"] });
      toast({ title: "Map Settings Saved" });
    },
    onError: () => {
      toast({ title: "Failed to save map settings", variant: "destructive" });
    }
  });

  const maps = mapSettings?.maps || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (maps.length >= 2) {
      toast({ title: "Limit reached", description: "You can only have 2 maps. Delete one first.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.url) {
        const newMap: MapData = {
          id: data.id || `map_${Date.now()}`,
          url: data.url,
          active: maps.length === 0, // Auto-activate if it's the only one
          name: file.name
        };
        saveMutation.mutate({ maps: [...maps, newMap] });
      } else {
        toast({ title: "Upload Failed", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSetActive = (id: string) => {
    const updatedMaps = maps.map(m => ({ ...m, active: m.id === id }));
    saveMutation.mutate({ maps: updatedMaps });
  };

  const handleDelete = async (id: string) => {
    const mapToDelete = maps.find(m => m.id === id);
    if (!mapToDelete) return;

    // Delete image from server
    if (mapToDelete.url.startsWith('/api/images/')) {
      try {
        const token = localStorage.getItem("adminToken");
        await fetch(`/api/admin/images/${mapToDelete.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Failed to delete from server", e);
      }
    }

    const updatedMaps = maps.filter(m => m.id !== id);
    // If we deleted the active one, activate the remaining one
    if (mapToDelete.active && updatedMaps.length > 0) {
      updatedMaps[0].active = true;
    }

    saveMutation.mutate({ maps: updatedMaps });
  };

  const activeMap = maps.find(m => m.active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Change Map</CardTitle>
        <CardDescription className="text-sm">Upload or change the interactive map background. Maximum 2 maps allowed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {maps.length >= 2 && (
          <Alert variant="default">
            <AlertDescription>You have reached the limit of 2 maps. Please delete one to upload a new map.</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="map-upload"
            onChange={handleFileUpload}
            disabled={isUploading || maps.length >= 2}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById("map-upload")?.click()}
            disabled={isUploading || maps.length >= 2}
            className="w-full sm:w-auto"
          >
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload New Map
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {maps.map(map => (
            <Card key={map.id} className={map.active ? "border-primary" : ""}>
              <div className="relative aspect-video bg-muted border-b flex items-center justify-center overflow-hidden">
                <img src={map.url} alt={map.name || "Map"} className="object-contain w-full h-full" />
                {map.active && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium truncate text-sm mb-3" title={map.name}>{map.name || "Custom Map"}</div>
                <div className="flex gap-2">
                  {!map.active && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSetActive(map.id)}>
                      Set Active
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" className={map.active ? "flex-1" : ""} onClick={() => handleDelete(map.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {maps.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
              <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
              <p>No maps uploaded yet.</p>
              <p className="text-sm">Upload a map. Using fallback grid.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
