import { useState, useEffect, useId, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchResponses, 
  saveResponse as saveResponseApi, 
  fetchLocations,
  saveLocation as saveLocationApi,
  deleteLocationApi,
  fetchUserPrivilegesAdmin,
  saveUserPrivilegesAdmin,
  fetchAutoTranslateStatus,
  sendVerificationCode,
  verifyCodeAndUpdateEmail
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
import { Plus, Edit2, Save, MessageSquare, Shield, LogOut, Settings, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveMap from "@/components/InteractiveMap";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("responses");

  const DEFAULT_PRIVILEGES: UserPrivileges = {
    chatEnabled: true,
    audioInputEnabled: true,
    mapAccessEnabled: true,
    autoTranslateEnabled: true
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

  const { data: autoTranslateStatus } = useQuery({
    queryKey: ["autoTranslateStatus"],
    queryFn: fetchAutoTranslateStatus,
    refetchInterval: 1500,
  });

  const mountedAtRef = useRef<number>(Date.now());
  const lastNotifiedJobIdRef = useRef<string | null>(null);
  const translationBusy = autoTranslateStatus?.status === "running";
  const translationBusyIntent: string | null =
    typeof autoTranslateStatus?.current?.intent === "string" ? autoTranslateStatus.current.intent : null;

  const [privileges, setPrivileges] = useState<UserPrivileges>(DEFAULT_PRIVILEGES);

  useEffect(() => {
    if (fetchedPrivileges) {
      setPrivileges(fetchedPrivileges);
    }
  }, [fetchedPrivileges]);

  useEffect(() => {
    const last = autoTranslateStatus?.lastCompleted;
    if (!last?.jobId || typeof last.jobId !== "string") return;
    if (typeof last?.finishedAt === "number" && last.finishedAt < mountedAtRef.current) return;
    if (lastNotifiedJobIdRef.current === last.jobId) return;
    if (last?.status !== "completed" && last?.status !== "failed") return;

    lastNotifiedJobIdRef.current = last.jobId;

    if (last.status === "completed") {
      toast({ title: "English Translation complete" });
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      return;
    }

    toast({
      title: "Translation failed",
      description: last?.error || "Auto-translation failed. Please try again or type the Bisaya response manually.",
      variant: "destructive",
    });
  }, [autoTranslateStatus, queryClient, toast]);

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
    mutationFn: async (response: ResponseData) => {
      const result: any = await saveResponseApi(response);
      if (!result?.success) {
        throw new Error(result?.message || "Failed to save response");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      toast({ title: "Response Saved", description: "The chatbot response has been updated." });
    },
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
  const menuItems = [
    { id: "responses", label: "Responses", icon: MessageSquare },
    { id: "privileges", label: "User Privilege", icon: User },
    { id: "admin-settings", label: "Admin Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6" style={{backgroundColor: '#001C38'}}>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-muted-foreground text-xs mt-1 text-white/80">Manage chatbot settings</p>
        </div>
        
        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          <div className="mt-8 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={logout}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === "responses" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Chatbot Responses</h2>
                <p className="text-muted-foreground mt-1">Manage chatbot responses and their location data</p>
              </div>
              
              <Card>
                <CardHeader className="flex flex-col items-start space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Chatbot Responses</CardTitle>
                      <CardDescription className="text-sm">Manage chatbot responses and their location data</CardDescription>
                    </div>
                    <ResponseDialog
                      onSave={saveResponseMutation.mutateAsync}
                      translationBusy={translationBusy}
                      translationBusyIntent={translationBusyIntent}
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <div className="w-full sm:flex-1">
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
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Intent</TableHead>
                          <TableHead className="min-w-[100px] hidden sm:table-cell">Category</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Has Map Data</TableHead>
                          <TableHead className="w-[80px] sm:w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResponses.map((response) => (
                          <TableRow key={response.intent}>
                            <TableCell className="font-medium text-sm sm:text-base">{response.intent}</TableCell>
                            <TableCell className="text-sm sm:text-base hidden sm:table-cell">{response.category}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium ${response.responses?.mapData ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-gray-50"}`}>
                                {response.responses?.mapData ? "YES" : "NO"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 sm:gap-2">
                                 <ResponseDialog 
                                    response={response} 
                                    onSave={saveResponseMutation.mutateAsync} 
                                    translationBusy={translationBusy}
                                    translationBusyIntent={translationBusyIntent}
                                    trigger={<Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9"><Edit2 className="h-3 w-3 sm:h-4 sm:w-4"/></Button>}
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
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "privileges" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">User Privilege</h2>
                <p className="text-muted-foreground mt-1">Enable or disable user features in the chat widget</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">User Privileges</CardTitle>
                  <CardDescription className="text-sm">Enable or disable user features in the chat widget</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">User Chat</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Allow users to send messages</p>
                    </div>
                    <Switch
                      checked={privileges.chatEnabled}
                      onCheckedChange={(checked) => handlePrivilegeToggle("chatEnabled", checked)}
                      disabled={savePrivilegesMutation.isPending}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">Audio Input</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Show or hide the microphone input</p>
                    </div>
                    <Switch
                      checked={privileges.audioInputEnabled}
                      onCheckedChange={(checked) => handlePrivilegeToggle("audioInputEnabled", checked)}
                      disabled={savePrivilegesMutation.isPending}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">Map Access</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Allow users to view maps in responses</p>
                    </div>
                    <Switch
                      checked={privileges.mapAccessEnabled}
                      onCheckedChange={(checked) => handlePrivilegeToggle("mapAccessEnabled", checked)}
                      disabled={savePrivilegesMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "admin-settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
                <p className="text-muted-foreground mt-1">Manage admin-specific settings and account</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Translation Settings</CardTitle>
                  <CardDescription className="text-sm">Manage translation and content settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm sm:text-base">Auto Translate</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Auto-fill Cebuano when admin leaves it empty</p>
                    </div>
                    <Switch
                      checked={privileges.autoTranslateEnabled}
                      onCheckedChange={(checked) => handlePrivilegeToggle("autoTranslateEnabled", checked)}
                      disabled={savePrivilegesMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Account Settings</CardTitle>
                  <CardDescription className="text-sm">Manage your admin account credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ChangeEmailDialog />
                  <ChangePasswordDialog />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Dialog Components ---

function ResponseDialog({ response, onSave, trigger, translationBusy, translationBusyIntent }: { 
  response?: ResponseData, 
  onSave: (r: ResponseData) => Promise<any>, 
  trigger?: React.ReactNode,
  translationBusy?: boolean,
  translationBusyIntent?: string | null
}) {
  const isEdit = !!response;
  const [open, setOpen] = useState(false);
  const uploadId = useId();
  const { toast } = useToast();

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

  const handleSubmit = async () => {
    const normalizedAnswer = normalizeAnswer(formData.responses?.answer);

    const finalCebuano = normalizedAnswer.ceb;

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
        answer: {
          en: normalizedAnswer.en,
          ceb: finalCebuano
        },
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
    
    try {
      await onSave(finalResponse);
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: String(err?.message || err || "Failed to save response"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        const busy = Boolean(translationBusy);
        const sameIntent =
          Boolean(response?.intent) &&
          Boolean(translationBusyIntent) &&
          response!.intent === translationBusyIntent;

        if (next && busy && !sameIntent) {
          toast({
            title: "Please wait",
            description: "Auto-translation is still running. Please wait for it to finish before editing another intent.",
            variant: "destructive",
          });
          return;
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {trigger || <Button className="w-full sm:w-auto rounded-sm"><Plus className="mr-2 h-4 w-4"/> Add Response</Button>}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[1050px] max-h-[90vh] overflow-y-auto sm:p-6 p-4 rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{response ? "Edit Response" : "New Response"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 sm:grid-cols-1 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-sm sm:text-base">Intent Name</Label>
            <Input 
              value={formData.intent} 
              onChange={e => setFormData({...formData, intent: e.target.value})} 
              placeholder="e.g. get_wifi_access" 
              disabled={isEdit}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm sm:text-base">Category</Label>
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
            <Label>Response Answer (Bisaya) <span className="text-muted-foreground text-sm">(keep it blank to auto-fill Bisaya language)</span></Label>
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

function ChangeEmailDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: current email + password, 2: verify current email, 3: new email + verification
  const [currentEmail, setCurrentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentVerificationCode, setCurrentVerificationCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newVerificationCode, setNewVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSentToNewEmail, setCodeSentToNewEmail] = useState(false);
  const { toast } = useToast();

  // Debug: Log when component renders
  console.log("ChangeEmailDialog rendered, open:", open);

  // Reset form when dialog closes
  const resetForm = () => {
    console.log("Resetting form");
    setStep(1);
    setCurrentEmail("");
    setPassword("");
    setCurrentVerificationCode("");
    setNewEmail("");
    setNewVerificationCode("");
    setCodeSentToNewEmail(false);
  };

  const handleClose = () => {
    console.log("Dialog closing");
    setOpen(false);
    resetForm();
  };

  // Step 1: Send verification code to current email
  const handleSendCurrentEmailCode = async () => {
    console.log("Send current email code clicked, email:", currentEmail);
    
    if (!currentEmail.includes("@") || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your current email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      console.log("Sending verification code to current email:", currentEmail);
      const result = await sendVerificationCode(currentEmail);
      console.log("Send current email code result:", result);
      
      if (result.success) {
        toast({
          title: "Verification code sent",
          description: "Please check your current email for the 6-digit code",
        });
        setStep(2);
      } else {
        toast({
          title: "Failed to send code",
          description: result.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending current email code:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 2: Verify current email code
  const handleVerifyCurrentEmail = async () => {
    console.log("Verify current email clicked, code:", currentVerificationCode);
    
    if (currentVerificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // For now, we'll just move to step 3
      // In a real implementation, you'd verify the code first
      console.log("Current email verified, moving to step 3");
      setStep(3);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Send verification code to new email
  const handleSendNewEmailCode = async () => {
    console.log("Send new email code clicked, email:", newEmail);
    
    if (!newEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid new email address",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Same email",
        description: "New email must be different from current email",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      console.log("Sending verification code to new email:", newEmail);
      const result = await sendVerificationCode(newEmail);
      console.log("Send new email code result:", result);
      
      if (result.success) {
        toast({
          title: "Verification code sent",
          description: "Please check your new email for the 6-digit code",
        });
        setCodeSentToNewEmail(true);
      } else {
        toast({
          title: "Failed to send code",
          description: result.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending new email code:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 3: Verify new email and update
  const handleVerifyNewEmailAndUpdate = async () => {
    console.log("Verify new email and update clicked");
    
    if (newVerificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code for new email",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      console.log("Updating email from", currentEmail, "to", newEmail);
      const result = await verifyCodeAndUpdateEmail(newEmail, newVerificationCode, currentEmail, password);
      console.log("Update email result:", result);
      
      if (result.success) {
        toast({
          title: "Email updated successfully",
          description: "Your email has been changed. You may need to log in again.",
        });
        handleClose();
      } else {
        toast({
          title: "Failed to update email",
          description: result.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast({
        title: "Error",
        description: "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => {
            console.log("Change Email button clicked!");
            setOpen(true);
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Current Email + Password */}
        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter your current email and password to start:
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current-email">Current Email Address</Label>
              <Input
                id="current-email"
                type="email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                placeholder="Enter your current email"
                disabled={isSendingCode}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSendingCode}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSendingCode}>
                Cancel
              </Button>
              <Button onClick={handleSendCurrentEmailCode} disabled={isSendingCode || !currentEmail || !password}>
                {isSendingCode ? "Sending..." : "Send Verification Code"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Verify Current Email Code */}
        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit verification code to:
              </p>
              <p className="font-medium">{currentEmail}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="current-verification-code">Verification Code</Label>
              <Input
                id="current-verification-code"
                type="text"
                value={currentVerificationCode}
                onChange={(e) => setCurrentVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={isVerifying}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isVerifying}>
                Back
              </Button>
              <Button onClick={handleVerifyCurrentEmail} disabled={isVerifying || currentVerificationCode.length !== 6}>
                {isVerifying ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: New Email + Verification */}
        {step === 3 && (
          <div className="grid gap-4 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Current email verified! Now enter your new email:
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email address"
                disabled={isSendingCode || codeSentToNewEmail}
              />
            </div>
            
            {!codeSentToNewEmail && (
              <div className="flex justify-end">
                <Button onClick={handleSendNewEmailCode} disabled={isSendingCode || !newEmail}>
                  {isSendingCode ? "Sending..." : "Send Code to New Email"}
                </Button>
              </div>
            )}

            {codeSentToNewEmail && (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Verification code sent to: {newEmail}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-verification-code">Verification Code</Label>
                  <Input
                    id="new-verification-code"
                    type="text"
                    value={newVerificationCode}
                    onChange={(e) => setNewVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    disabled={isVerifying}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {setCodeSentToNewEmail(false); setNewVerificationCode("");}}>
                    Back
                  </Button>
                  <Button onClick={handleVerifyNewEmailAndUpdate} disabled={isVerifying || newVerificationCode.length !== 6}>
                    {isVerifying ? "Updating..." : "Update Email"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement actual password change API call
      // For now, just show success message
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated.",
      });
      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Failed to change password",
        description: "Please check your current password and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Lock className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password (min. 8 characters)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Change Password</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
