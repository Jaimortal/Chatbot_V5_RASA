import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllFaqs, saveFaq, deleteFaqApi, fetchBotTopics, BotCategory, BotTopic } from "@/lib/adminApi";
import type { FaqConfig } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Plus, Trash2, Search, Zap, ZapOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminFAQs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFaq, setEditingFaq] = useState<Partial<FaqConfig> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("responses.json");

  // Fetch Faq Configs (DB)
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["adminFaqs"],
    queryFn: fetchAllFaqs
  });

  // Fetch Bot Topics (Parsed from Backend JSON)
  const { data: botCategories = [], isLoading: loadingBotTopics } = useQuery({
    queryKey: ["botTopics"],
    queryFn: fetchBotTopics
  });

  const saveMutation = useMutation({
    mutationFn: saveFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      toast({ title: "FAQ Saved successfully" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to save FAQ", variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaqApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      toast({ title: "FAQ removed successfully" });
    },
    onError: () => toast({ title: "Failed to remove FAQ", variant: "destructive" })
  });

  const toggleEnabled = (faq: FaqConfig, checked: boolean) => {
    saveMutation.mutate({ ...faq, enabled: checked });
  };

  const handleCreateOrEdit = (botTopic: BotTopic, existingFaq?: FaqConfig) => {
    if (existingFaq) {
      setEditingFaq(existingFaq);
    } else {
      setEditingFaq({
        superIntent: botTopic.superIntent,
        topicKey: botTopic.topicKey,
        payload: botTopic.payload,
        displayLabel: botTopic.defaultLabel,
        icon: botTopic.defaultIcon,
        subtitle: "",
        enabled: true,
        sortOrder: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this topic from FAQs?")) {
      deleteMutation.mutate(id);
    }
  };

  if (loadingFaqs || loadingBotTopics) {
    return <div className="text-center py-10 text-muted-foreground animate-pulse">Loading Topics...</div>;
  }

  // Pre-select first tab if no active
  if (!activeTab && botCategories.length > 0) {
    setActiveTab(botCategories[0].id);
  }

  const currentCategory = botCategories.find((c: BotCategory) => c.id === activeTab) || botCategories[0];
  
  let currentTopics = currentCategory?.topics || [];
  if (searchTerm) {
    currentTopics = currentTopics.filter((t: BotTopic) => 
      t.topicKey.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.defaultLabel.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start space-y-4">
          <div className="flex flex-col md:flex-row justify-between w-full gap-4">
            <div>
              <CardTitle className="text-xl">FAQ Editor</CardTitle>
              <CardDescription>Select chatbot topics securely routed to Rasa and add them to the User FAQ Carousel.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto">
              {botCategories.map((cat: BotCategory) => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-sm px-4 py-2">
                  {cat.displayName}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="mb-4 relative max-w-md">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder={`Search topics in ${currentCategory?.displayName || ""}...`}
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9"
               />
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic (Internal)</TableHead>
                    <TableHead>Display Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTopics.map((topic: BotTopic) => {
                    // Match with DB config
                    const existingFaq = faqs.find(f => f.topicKey === topic.topicKey && f.superIntent === topic.superIntent);
                    
                    return (
                      <TableRow key={topic.topicKey}>
                        <TableCell className="max-w-[300px]">
                          <p className="font-mono text-xs font-semibold">{topic.topicKey}</p>
                          <p className="text-[10px] text-muted-foreground truncate" title={topic.payload}>
                            Payload: {topic.payload}
                          </p>
                          {topic.previewResponse && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[280px]" title={topic.previewResponse}>
                              <span className="font-medium">Bot says:</span> {topic.previewResponse}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {existingFaq ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{existingFaq.icon}</span>
                              <div>
                                <p className="font-medium text-sm">{existingFaq.displayLabel}</p>
                                {existingFaq.subtitle && <p className="text-xs text-muted-foreground limit-1-line max-w-[250px] truncate">{existingFaq.subtitle}</p>}
                              </div>
                            </div>
                          ) : (
                            <div className="opacity-50 flex items-center gap-2">
                              <span className="text-lg">{topic.defaultIcon}</span>
                              <p className="font-medium text-sm text-muted-foreground">{topic.defaultLabel}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {existingFaq ? (
                             <Badge variant={existingFaq.enabled ? "default" : "secondary"}>
                               {existingFaq.enabled ? "Active FAQ" : "Disabled FAQ"}
                             </Badge>
                          ) : (
                             <Badge variant="outline" className="text-muted-foreground line-through decoration-muted-foreground/30">
                               Not in FAQ
                             </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {existingFaq ? (
                              <>
                                <Switch 
                                  checked={existingFaq.enabled} 
                                  onCheckedChange={(checked) => toggleEnabled(existingFaq, checked)} 
                                  title="Toggle Visibility"
                                />
                                <Button variant="outline" size="sm" onClick={() => handleCreateOrEdit(topic, existingFaq)}>
                                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(existingFaq.id!)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button variant="default" size="sm" onClick={() => handleCreateOrEdit(topic)}>
                                <Plus className="h-4 w-4 mr-1" /> Add to FAQ
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {currentTopics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No topics matched your search...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFaq?.id ? 'Customize FAQ Card' : 'Add to FAQ'}</DialogTitle>
          </DialogHeader>
          
          {editingFaq && (
             <div className="space-y-4 mt-2">
               <div>
                  <Label>Display Label</Label>
                  <Input 
                    value={editingFaq.displayLabel || ""} 
                    onChange={e => setEditingFaq({...editingFaq, displayLabel: e.target.value})}
                    placeholder="e.g., Enrollment"
                  />
                  <p className="text-xs text-muted-foreground mt-1">What users will see on the button.</p>
               </div>
               
               <div>
                  <Label>Subtitle (Optional)</Label>
                  <Input 
                    value={editingFaq.subtitle || ""} 
                    onChange={e => setEditingFaq({...editingFaq, subtitle: e.target.value})}
                    placeholder="e.g., How to apply for admissions"
                  />
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                    <Label>Icon / Emoji</Label>
                    <Input 
                      value={editingFaq.icon || ""} 
                      onChange={e => setEditingFaq({...editingFaq, icon: e.target.value})}
                      placeholder="e.g., 🎓"
                    />
                 </div>
                 <div className="flex-1">
                    <Label>Sort Order</Label>
                    <Input 
                      type="number"
                      value={editingFaq.sortOrder || 0} 
                      onChange={e => setEditingFaq({...editingFaq, sortOrder: parseInt(e.target.value) || 0})}
                    />
                 </div>
               </div>
               
               <div className="mt-4 bg-muted p-4 rounded-xl border border-primary/10">
                 <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Live Carousel Preview:</Label>
                 <div className="flex flex-col bg-card border text-card-foreground rounded-2xl p-3 shadow-sm text-left items-start max-w-[160px] mx-auto">
                    <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-primary/10 mb-3">
                      <span className="text-xl">{editingFaq.icon || "📄"}</span>
                    </div>
                    <p className="font-semibold text-sm leading-tight text-primary">
                      {editingFaq.displayLabel || "Label"}
                    </p>
                    {editingFaq.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {editingFaq.subtitle}
                      </p>
                    )}
                 </div>
               </div>

               <Button 
                onClick={() => saveMutation.mutate(editingFaq as FaqConfig)}
                className="w-full mt-4"
                disabled={!editingFaq.displayLabel}
               >
                 {editingFaq.id ? "Save Changes" : "Save to FAQs"}
               </Button>
               <p className="text-center text-[10px] text-muted-foreground">
                 System Payload Bound securely to: <code className="bg-muted px-1 py-0.5 rounded text-[9px]">{editingFaq.payload}</code>
               </p>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
