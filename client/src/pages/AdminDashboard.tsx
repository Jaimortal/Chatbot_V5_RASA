import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockBackend, type Intent, type Location } from "@/lib/mockApi";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Save, Map as MapIcon, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // --- Intents Query ---
  const { data: intents = [] } = useQuery({
    queryKey: ["intents"],
    queryFn: () => mockBackend.getIntents()
  });

  // --- Locations Query ---
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => mockBackend.getLocations()
  });

  // --- Mutations ---
  const saveIntentMutation = useMutation({
    mutationFn: (intent: Intent) => mockBackend.saveIntent(intent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intents"] });
      toast({ title: "Intent Saved", description: "The chatbot response has been updated." });
    }
  });

  const deleteIntentMutation = useMutation({
    mutationFn: (id: string) => mockBackend.deleteIntent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intents"] });
      toast({ title: "Intent Deleted", variant: "destructive" });
    }
  });

  const saveLocationMutation = useMutation({
    mutationFn: (location: Location) => mockBackend.saveLocation(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: "Location Saved" });
    }
  });

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
          </div>
        </div>

        <Tabs defaultValue="intents" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="intents" className="flex gap-2 items-center"><MessageSquare className="h-4 w-4"/> Responses</TabsTrigger>
            <TabsTrigger value="locations" className="flex gap-2 items-center"><MapIcon className="h-4 w-4"/> Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="intents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chat Intents</CardTitle>
                  <CardDescription>Define how the bot responds to specific keywords</CardDescription>
                </div>
                <IntentDialog onSave={saveIntentMutation.mutate} locations={locations} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent Name</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Response Type</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intents.map((intent) => (
                      <TableRow key={intent.id}>
                        <TableCell className="font-medium">{intent.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {intent.keywords.map(k => (
                              <span key={k} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{k}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={intent.type === 'map' ? "text-blue-600 font-medium" : ""}>
                            {intent.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                             <IntentDialog 
                                intent={intent} 
                                onSave={saveIntentMutation.mutate} 
                                locations={locations}
                                trigger={<Button variant="ghost" size="icon"><Edit2 className="h-4 w-4"/></Button>}
                             />
                             <Button variant="ghost" size="icon" onClick={() => deleteIntentMutation.mutate(intent.id)}>
                               <Trash2 className="h-4 w-4 text-destructive"/>
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Map Locations</CardTitle>
                  <CardDescription>Manage points of interest on the map</CardDescription>
                </div>
                <LocationDialog onSave={saveLocationMutation.mutate} />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location Name</TableHead>
                      <TableHead>Coordinates (Y, X)</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell className="font-mono text-xs">{loc.coordinates.join(', ')}</TableCell>
                        <TableCell>
                          <LocationDialog 
                            location={loc}
                            onSave={saveLocationMutation.mutate}
                            trigger={<Button variant="ghost" size="icon"><Edit2 className="h-4 w-4"/></Button>}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

// --- Dialog Components ---

function IntentDialog({ intent, onSave, locations, trigger }: { intent?: Intent, onSave: (i: Intent) => void, locations: Location[], trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Intent>>(intent || {
    name: "",
    keywords: [],
    response: "",
    category: "General",
    type: "text"
  });
  const [keywordInput, setKeywordInput] = useState(intent?.keywords.join(", ") || "");

  const handleSubmit = () => {
    onSave({
      ...formData,
      keywords: keywordInput.split(",").map(k => k.trim()).filter(Boolean),
      id: intent?.id || "" // ID handled by backend if empty
    } as Intent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4"/> Add Intent</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{intent ? "Edit Intent" : "New Intent"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Find Restroom" />
          </div>
          <div className="grid gap-2">
            <Label>Keywords (comma separated)</Label>
            <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} placeholder="cr, restroom, toilet" />
          </div>
          <div className="grid gap-2">
             <Label>Response Type</Label>
             <Select 
               value={formData.type} 
               onValueChange={(val: any) => setFormData({...formData, type: val})}
             >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="map">Map Location</SelectItem>
              </SelectContent>
             </Select>
          </div>
          
          {formData.type === "text" ? (
             <div className="grid gap-2">
               <Label>Bot Response</Label>
               <Textarea value={formData.response} onChange={e => setFormData({...formData, response: e.target.value})} />
             </div>
          ) : (
            <>
             <div className="grid gap-2">
               <Label>Bot Response (Intro text)</Label>
               <Input value={formData.response} onChange={e => setFormData({...formData, response: e.target.value})} />
             </div>
             <div className="grid gap-2">
                <Label>Linked Location</Label>
                <Select 
                  value={formData.linkedLocationId} 
                  onValueChange={(val) => setFormData({...formData, linkedLocationId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LocationDialog({ location, onSave, trigger }: { location?: Location, onSave: (l: Location) => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>(location || {
    name: "",
    coordinates: [500, 500],
    mapImage: "/generated_map.png"
  });

  const handleSubmit = () => {
    onSave({
      ...formData,
      id: location?.id || ""
    } as Location);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button><Plus className="mr-2 h-4 w-4"/> Add Location</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "New Location"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Y Coordinate (0-1000)</Label>
              <Input 
                type="number" 
                value={formData.coordinates?.[0]} 
                onChange={e => setFormData({
                  ...formData, 
                  coordinates: [parseInt(e.target.value) || 0, formData.coordinates?.[1] || 0]
                })} 
              />
            </div>
            <div className="grid gap-2">
              <Label>X Coordinate (0-1000)</Label>
              <Input 
                 type="number" 
                 value={formData.coordinates?.[1]} 
                 onChange={e => setFormData({
                   ...formData, 
                   coordinates: [formData.coordinates?.[0] || 0, parseInt(e.target.value) || 0]
                 })} 
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
