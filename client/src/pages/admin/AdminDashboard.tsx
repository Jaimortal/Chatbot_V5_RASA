import { useState, useEffect, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchResponses, 
  saveResponse as saveResponseApi, 
  fetchLocations,
  saveLocation as saveLocationApi,
  deleteLocationApi,
  fetchUserPrivilegesAdmin,
  saveUserPrivilegesAdmin
} from "@/lib/adminApi";
import type { ResponseData, Location, UserPrivileges } from "@/types/admin";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Save, MessageSquare, Shield, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveMap from "@/components/InteractiveMap";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAuth();

  const DEFAULT_PRIVILEGES: UserPrivileges = {
    chatEnabled: true,
    audioInputEnabled: true,
    mapAccessEnabled: true
  };
  
  // --- Filter States ---
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // --- Responses Query ---
  const { data: responses = [] } = useQuery({
    queryKey: ["responses"],
    queryFn: fetchResponses
  });

  // --- Locations Query ---
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations
  });

  // --- User Privileges Query ---
  const { data: fetchedPrivileges } = useQuery({
    queryKey: ["userPrivileges"],
    queryFn: fetchUserPrivilegesAdmin
  });

  const [privileges, setPrivileges] = useState<UserPrivileges>(DEFAULT_PRIVILEGES);

  useEffect(() => {
    if (fetchedPrivileges) {
      setPrivileges(fetchedPrivileges);
    }
  }, [fetchedPrivileges]);

  // --- Filter Logic ---
  const filteredResponses = responses.filter(response => {
    const matchesCategory = categoryFilter === "all" || response.category === categoryFilter;
    const matchesSearch = searchTerm === "" || 
      (response.intent && response.intent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.category && response.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // --- Get Unique Categories ---
  const categories = Array.from(new Set(responses.map(r => r.category).filter(Boolean)));

  // --- Mutations ---
  const saveResponseMutation = useMutation({
    mutationFn: (response: ResponseData) => saveResponseApi(response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      toast({ title: "Response Saved", description: "The chatbot response has been updated." });
    }
  });

  const saveLocationMutation = useMutation({
    mutationFn: (location: Location) => saveLocationApi(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: "Location Saved" });
    }
  });

  const savePrivilegesMutation = useMutation({
    mutationFn: (p: UserPrivileges) => saveUserPrivilegesAdmin(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPrivileges"] });
      toast({ title: "Privileges Updated" });
    },
    onError: () => {
      toast({ title: "Failed to update privileges", variant: "destructive" });
    }
  });

  const handlePrivilegeToggle = (key: keyof UserPrivileges, checked: boolean) => {
    const updated: UserPrivileges = {
      ...privileges,
      [key]: checked
    };
    setPrivileges(updated);
    savePrivilegesMutation.mutate(updated);
  };

  // --- UI ---

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage chatbot responses and map locations</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => window.open('/', '_blank')}>Open Chat Demo</Button>
             <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
               <LogOut className="h-4 w-4" />
               Logout
             </Button>
          </div>
        </div>

        <Tabs defaultValue="responses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="privileges" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              User Privileges
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="responses" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col items-start space-y-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <div>
                    <CardTitle>Chatbot Responses</CardTitle>
                    <CardDescription>Manage chatbot responses and their location data</CardDescription>
                  </div>
                  <ResponseDialog onSave={saveResponseMutation.mutate} />
                </div>
                
                {/* Filters */}
                <div className="flex flex-row gap-4 w-full">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by intent or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Has Map Data</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.intent}>
                        <TableCell className="font-medium">{response.intent}</TableCell>
                        <TableCell>{response.category}</TableCell>
                        <TableCell>
                          <span className={response.responses?.mapData ? "text-blue-600 font-medium" : "text-gray-500"}>
                            {response.responses?.mapData ? "YES" : "NO"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                             <ResponseDialog 
                                response={response} 
                                onSave={saveResponseMutation.mutate} 
                                trigger={<Button variant="ghost" size="icon"><Edit2 className="h-4 w-4"/></Button>}
                             />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredResponses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No responses found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privileges" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Privileges</CardTitle>
                <CardDescription>Enable or disable user features in the chat widget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-1">
                    <Label>User Chat</Label>
                    <p className="text-sm text-muted-foreground">Allow users to send messages</p>
                  </div>
                  <Switch
                    checked={privileges.chatEnabled}
                    onCheckedChange={(checked) => handlePrivilegeToggle("chatEnabled", checked)}
                    disabled={savePrivilegesMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-1">
                    <Label>Audio Input</Label>
                    <p className="text-sm text-muted-foreground">Show or hide the microphone input</p>
                  </div>
                  <Switch
                    checked={privileges.audioInputEnabled}
                    onCheckedChange={(checked) => handlePrivilegeToggle("audioInputEnabled", checked)}
                    disabled={savePrivilegesMutation.isPending}
                  />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-1">
                    <Label>Map Access</Label>
                    <p className="text-sm text-muted-foreground">Allow users to view maps in responses</p>
                  </div>
                  <Switch
                    checked={privileges.mapAccessEnabled}
                    onCheckedChange={(checked) => handlePrivilegeToggle("mapAccessEnabled", checked)}
                    disabled={savePrivilegesMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

// --- Dialog Components ---

function ResponseDialog({ response, onSave, trigger }: { 
  response?: ResponseData, 
  onSave: (r: ResponseData) => void, 
  trigger?: React.ReactNode 
}) {
  const isEdit = !!response;
  const [open, setOpen] = useState(false);
  const uploadId = useId();

  type LocationDraft = {
    locationName: string;
    coordinates: [number, number];
  };

  const normalizeAnswer = (answer: ResponseData["responses"]["answer"] | undefined) => {
    if (!answer) return { en: [""], ceb: [""] };
    if (Array.isArray(answer)) return { en: answer, ceb: [""] };
    const record = answer as Record<string, string[]>;
    return {
      en: Array.isArray(record.en) ? record.en : [""],
      ceb: Array.isArray(record.ceb) ? record.ceb : [""]
    };
  };

  const normalizeMapData = (mapData: ResponseData["responses"]["mapData"] | undefined): LocationDraft[] => {
    if (!mapData) return [];
    if (Array.isArray(mapData)) {
      return mapData
        .map((md) => ({
          locationName: md?.locationName || "Location",
          coordinates: (md?.coordinates || [500, 500]) as [number, number],
        }))
        .filter((md) => Array.isArray(md.coordinates) && md.coordinates.length === 2);
    }

    return [
      {
        locationName: mapData.locationName || "Location",
        coordinates: (mapData.coordinates || [500, 500]) as [number, number],
      },
    ];
  };

  const getInitialFormData = (): Partial<ResponseData> => {
    if (response) {
      const existingImages = Array.isArray(response.responses?.imageUrls)
        ? response.responses.imageUrls
        : (response.responses?.imageUrl ? [response.responses.imageUrl] : []);

      return {
        ...response,
        responses: {
          ...response.responses,
          answer: normalizeAnswer(response.responses?.answer),
          follow_up: Array.isArray(response.responses?.follow_up) ? response.responses.follow_up : [],
          context_slots: response.responses?.context_slots || {},
          imageUrl: response.responses?.imageUrl || "",
          imageUrls: existingImages
        }
      };
    }

    return {
      intent: "",
      category: "",
      sub_category: "",
      responses: {
        answer: { en: [""], ceb: [""] },
        follow_up: [],
        context_slots: {},
        imageUrl: "",
        imageUrls: []
      },
      metadata: {
        source: "admin"
      }
    };
  };

  const [formData, setFormData] = useState<Partial<ResponseData>>(getInitialFormData());
  const [selectedLab, setSelectedLab] = useState<string>("1");
  const [hasMapData, setHasMapData] = useState(normalizeMapData(response?.responses?.mapData).length > 0);
  const [locations, setLocations] = useState<LocationDraft[]>(normalizeMapData(response?.responses?.mapData));

  useEffect(() => {
    if (open) {
      const initial = getInitialFormData();
      setFormData(initial);
      const initialLocations = normalizeMapData(response?.responses?.mapData);
      setHasMapData(initialLocations.length > 0);
      setLocations(initialLocations);

      if ((initial as any)?.laboratories) {
        const keys = Object.keys((initial as any).laboratories || {});
        if (keys.length > 0) {
          setSelectedLab(keys.sort()[0]);
        }
      }
    }
  }, [open, response]);

  const handleSubmit = () => {
    const normalizedAnswer = normalizeAnswer(formData.responses?.answer);

    const normalizedImages = Array.isArray(formData.responses?.imageUrls)
      ? formData.responses!.imageUrls!.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
      : [];

    const normalizedLocations = locations
      .map((l) => ({
        locationName: (l.locationName || "Location").trim() || "Location",
        coordinates: l.coordinates,
        mapId: "main_map",
      }))
      .filter((l) => Array.isArray(l.coordinates) && l.coordinates.length === 2);

    const finalResponse: ResponseData = {
      ...formData,
      responses: {
        ...formData.responses!,
        answer: normalizedAnswer,
        imageUrls: normalizedImages,
        imageUrl: normalizedImages[0] || formData.responses?.imageUrl || "",
        mapData: hasMapData
          ? (
              normalizedLocations.length > 1
                ? normalizedLocations
                : normalizedLocations[0] || {
                    locationName: "Location",
                    coordinates: [500, 500],
                    mapId: "main_map",
                  }
            )
          : undefined,
      }
    } as ResponseData;
    
    onSave(finalResponse);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4"/> Add Response</Button>}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[1050px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{response ? "Edit Response" : "New Response"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Intent Name</Label>
            <Input 
              value={formData.intent} 
              onChange={e => setFormData({...formData, intent: e.target.value})} 
              placeholder="e.g. get_wifi_access" 
              disabled={isEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Input 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
              placeholder="e.g. ICT" 
              disabled={isEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label>Sub Category</Label>
            <Input 
              value={formData.sub_category} 
              onChange={e => setFormData({...formData, sub_category: e.target.value})} 
              placeholder="e.g. services" 
              disabled={isEdit}
            />
          </div>
          <div className="grid gap-2">
            <Label>Response Answer (English)</Label>
            <Textarea 
              value={
                (() => {
                  const a = normalizeAnswer(formData.responses?.answer);
                  return Array.isArray(a.en) ? a.en.join("\n") : "";
                })()
              } 
              onChange={e => setFormData({
                ...formData, 
                responses: {
                  ...formData.responses!,
                  answer: {
                    ...normalizeAnswer(formData.responses?.answer),
                    en: e.target.value.split("\n")
                  }
                }
              })} 
              placeholder="Enter English response text (one per line)"
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label>Response Answer (Bisaya)</Label>
            <Textarea
              value={
                (() => {
                  const a = normalizeAnswer(formData.responses?.answer);
                  return Array.isArray(a.ceb) ? a.ceb.join("\n") : "";
                })()
              }
              onChange={e => setFormData({
                ...formData,
                responses: {
                  ...formData.responses!,
                  answer: {
                    ...normalizeAnswer(formData.responses?.answer),
                    ceb: e.target.value.split("\n")
                  }
                }
              })}
              placeholder="Enter Bisaya response text (one per line)"
              rows={4}
            />
          </div>
          <div className="grid gap-2">
            <Label>Follow Up Questions (optional)</Label>
            <Textarea 
              value={
                Array.isArray(formData.responses?.follow_up) 
                  ? formData.responses.follow_up.join("\n") 
                  : ""
              } 
              onChange={e => setFormData({
                ...formData, 
                responses: {
                  ...formData.responses!,
                  follow_up: e.target.value.split("\n").filter(Boolean)
                }
              })} 
              placeholder="Enter follow up questions (one per line)"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Images (optional)</Label>
            <div className="grid gap-2">
              {(formData.responses?.imageUrls || []).map((url, idx) => (
                <div key={`img-${idx}`} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const next = [...(formData.responses?.imageUrls || [])];
                      next[idx] = e.target.value;
                      setFormData({
                        ...formData,
                        responses: {
                          ...formData.responses!,
                          imageUrls: next,
                          imageUrl: next[0] || "",
                        },
                      });
                    }}
                    placeholder="Paste an image URL or base64 data URL"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const next = (formData.responses?.imageUrls || []).filter((_, i) => i !== idx);
                      setFormData({
                        ...formData,
                        responses: {
                          ...formData.responses!,
                          imageUrls: next,
                          imageUrl: next[0] || "",
                        },
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = [...(formData.responses?.imageUrls || []), ""];
                    setFormData({
                      ...formData,
                      responses: {
                        ...formData.responses!,
                        imageUrls: next,
                        imageUrl: next[0] || "",
                      },
                    });
                  }}
                >
                  Add Image URL
                </Button>

                <input
                  id={`upload-${uploadId}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = typeof reader.result === "string" ? reader.result : "";
                        if (!result) return;
                        setFormData((prev) => {
                          const existing = prev.responses?.imageUrls || [];
                          const next = [...existing, result];
                          return {
                            ...prev,
                            responses: {
                              ...prev.responses!,
                              imageUrls: next,
                              imageUrl: next[0] || "",
                            },
                          };
                        });
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                />
                <Label
                  htmlFor={`upload-${uploadId}`}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold shadow-sm hover:bg-accent cursor-pointer"
                >
                  Choose Images
                </Label>
              </div>

              {(formData.responses?.imageUrls || []).filter(Boolean).length > 0 ? (
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {(formData.responses?.imageUrls || []).filter(Boolean).slice(0, 4).map((src, idx) => (
                      <img
                        key={`preview-${idx}`}
                        src={src}
                        alt="Preview"
                        className="max-h-40 rounded border object-contain"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasMapData"
              checked={hasMapData}
              onChange={(e) => setHasMapData(e.target.checked)}
            />
            <Label htmlFor="hasMapData">Include location data</Label>
          </div>
          {hasMapData && (
            <div className="grid gap-2">
              <Label>Locations on Map</Label>
              <div className="grid gap-4">
                {locations.map((loc, idx) => (
                  <div key={`loc-${idx}`} className="rounded-md border p-3 grid gap-3">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={loc.locationName}
                        onChange={(e) => {
                          const next = [...locations];
                          next[idx] = { ...next[idx], locationName: e.target.value };
                          setLocations(next);
                        }}
                        placeholder="Location name"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setLocations((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </Button>
                    </div>

                    <InteractiveMap
                      initialCoordinates={loc.coordinates}
                      onCoordinatesChange={(coords) => {
                        const next = [...locations];
                        next[idx] = { ...next[idx], coordinates: coords };
                        setLocations(next);
                      }}
                      width={550}
                      height={450}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setLocations((prev) => ([...prev, { locationName: "Location", coordinates: [500, 500] }]))}
                >
                  Add Location
                </Button>
              </div>
            </div>
          )}

          {/* ComLab laboratory editor (for locate_comlab) */}
          {(formData.intent === "locate_comlab" || response?.intent === "locate_comlab") && (
            <div className="grid gap-3 rounded-md border p-4">
              <Label className="font-semibold">ComLab Laboratories (1-12)</Label>

              <div className="grid gap-2">
                <Label>Choose ComLab</Label>
                <Select value={selectedLab} onValueChange={setSelectedLab}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ComLab" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                      <SelectItem key={n} value={n}>
                        {`ComLab ${n}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const labs = ((formData as any).laboratories || {}) as any;
                const lab = (labs[selectedLab] || {}) as any;
                const labImages: string[] = Array.isArray(lab.images)
                  ? lab.images
                  : (lab.image ? [lab.image] : []);
                const labCoords: [number, number] = Array.isArray(lab.coordinates) && lab.coordinates.length === 2
                  ? lab.coordinates
                  : [500, 500];
                const labMapId = lab.map_id || lab.mapId || "main_map";
                const labLocationName = lab.locationName || `ComLab ${selectedLab}`;

                return (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Location Name</Label>
                      <Input
                        value={labLocationName}
                        onChange={(e) => {
                          const nextLabs = { ...labs, [selectedLab]: { ...lab, locationName: e.target.value } };
                          setFormData({ ...formData, laboratories: nextLabs } as any);
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>ComLab Answer (English) - one per line</Label>
                      <Textarea
                        value={Array.isArray(lab.en) ? lab.en.join("\n") : ""}
                        onChange={(e) => {
                          const nextLabs = { ...labs, [selectedLab]: { ...lab, en: e.target.value.split("\n") } };
                          setFormData({ ...formData, laboratories: nextLabs } as any);
                        }}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>ComLab Answer (Bisaya) - one per line</Label>
                      <Textarea
                        value={Array.isArray(lab.ceb) ? lab.ceb.join("\n") : ""}
                        onChange={(e) => {
                          const nextLabs = { ...labs, [selectedLab]: { ...lab, ceb: e.target.value.split("\n") } };
                          setFormData({ ...formData, laboratories: nextLabs } as any);
                        }}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Images for this ComLab</Label>
                      <div className="grid gap-2">
                        {labImages.map((url, idx) => (
                          <div key={`lab-img-${idx}`} className="flex gap-2">
                            <Input
                              value={url}
                              onChange={(e) => {
                                const next = [...labImages];
                                next[idx] = e.target.value;
                                const nextLabs = { ...labs, [selectedLab]: { ...lab, images: next, image: next[0] || "" } };
                                setFormData({ ...formData, laboratories: nextLabs } as any);
                              }}
                              placeholder="Paste image URL/base64"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const next = labImages.filter((_, i) => i !== idx);
                                const nextLabs = { ...labs, [selectedLab]: { ...lab, images: next, image: next[0] || "" } };
                                setFormData({ ...formData, laboratories: nextLabs } as any);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const next = [...labImages, ""];
                            const nextLabs = { ...labs, [selectedLab]: { ...lab, images: next, image: next[0] || "" } };
                            setFormData({ ...formData, laboratories: nextLabs } as any);
                          }}
                        >
                          Add Image URL
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Map ID</Label>
                      <Input
                        value={labMapId}
                        onChange={(e) => {
                          const nextLabs = { ...labs, [selectedLab]: { ...lab, map_id: e.target.value } };
                          setFormData({ ...formData, laboratories: nextLabs } as any);
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Pin on Map</Label>
                      <InteractiveMap
                        initialCoordinates={labCoords}
                        onCoordinatesChange={(coords) => {
                          const nextLabs = { ...labs, [selectedLab]: { ...lab, coordinates: coords } };
                          setFormData({ ...formData, laboratories: nextLabs } as any);
                        }}
                        width={550}
                        height={450}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LocationDialog({ location, onSave, trigger }: { 
  location?: Location, 
  onSave: (l: Location) => void, 
  trigger?: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const [locationName, setLocationName] = useState(location?.name || "");
  const [mapCoordinates, setMapCoordinates] = useState<[number, number]>(
    location?.coordinates || [500, 500]
  );

  const handleSubmit = () => {
    const newLocation: Location = {
      name: locationName,
      coordinates: mapCoordinates,
      mapImage: location?.mapImage || "/generated_map.png",
      id: location?.id || `loc_${Date.now()}`
    };
    
    onSave(newLocation);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4"/> Add Location</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "New Location"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Location Name</Label>
            <Input 
              value={locationName} 
              onChange={e => setLocationName(e.target.value)} 
              placeholder="e.g. ICT Office" 
            />
          </div>
          <div className="grid gap-2">
            <Label>Location on Map</Label>
            <InteractiveMap
              initialCoordinates={mapCoordinates}
              onCoordinatesChange={setMapCoordinates}
              width={600}
              height={600}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
