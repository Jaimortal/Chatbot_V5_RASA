import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import MapMessage from "./MapMessage";
import { cn } from "@/lib/utils";
import { mockBackend, generateId, type ChatMessage } from "@/lib/mockApi";
import type { UserPrivileges } from "@/types/admin";

// Helper for Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition;

interface ChatWindowProps {
  onClose: () => void;
  isOpen: boolean;
}

 async function fetchUserPrivileges(): Promise<UserPrivileges> {
   try {
     const res = await fetch("/api/privileges");
     const json = await res.json();
     if (json?.success && json?.data) return json.data as UserPrivileges;
   } catch (err) {
     // ignore
   }
   return { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true };
 }

// Convert backend responses → ChatMessage[]
function convertResponseToMessages(response: any): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Normal text answer
  if (response.answer) {
    const answerText = Array.isArray(response.answer)
      ? response.answer.join("\n")
      : response.answer;

    messages.push({
      id: generateId(),
      text: answerText,
      sender: "bot",
      type: "text",
      timestamp: new Date(),
    });
  }

  // Map message
  if (response.mapData) {
    messages.push({
      id: generateId(),
      text: "",
      sender: "bot",
      type: "map",
      mapData: response.mapData,
      timestamp: new Date(),
    });
  }

  return messages;
}

export default function ChatWindow({ onClose, isOpen }: ChatWindowProps) {
  const { data: privileges = { chatEnabled: true, audioInputEnabled: true, mapAccessEnabled: true } } = useQuery({
    queryKey: ["privileges"],
    queryFn: fetchUserPrivileges,
    staleTime: 0,
    refetchInterval: 5000,
    enabled: isOpen
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hi there! I'm your virtual concierge. Ask me where to find shops, food, or restrooms! (Pwede ra mag Binisaya)",
      sender: "bot",
      type: "text",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ((!privileges.chatEnabled || !privileges.audioInputEnabled) && isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
    }
  }, [privileges.chatEnabled, privileges.audioInputEnabled, isListening]);

  // Test backend on mount
  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log("Testing backend connection...");
        const testResponse = await mockBackend.sendMessage("test");
        console.log("Backend response:", testResponse);
      } catch (error) {
        console.error("Backend test failed:", error);
      }
    };
    
    if (isOpen) {
      testBackend();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        // Auto-send the voice input after a brief delay
        setTimeout(() => {
          handleSend(transcript);
        }, 300);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!privileges.chatEnabled || !privileges.audioInputEnabled) {
      return;
    }
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      setInputValue(""); // Clear previous input
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        setIsListening(false);
      }
    }
  };

  const handleSend = async (text: string) => {
    if (!privileges.chatEnabled) {
      return;
    }
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // User message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: "user",
      type: "text",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await mockBackend.sendMessage(trimmedText);
      
      // Convert bot response to correct message types
      const botMessages = convertResponseToMessages(response);
      
      // Add a small delay to simulate typing
      setTimeout(() => {
        setMessages((prev) => [...prev, ...botMessages]);
        setIsTyping(false);
      }, 800);
      
    } catch (error) {
      console.error("Failed to get response", error);
      
      const errorMsg: ChatMessage = {
        id: generateId(),
        text: "Oops! Something went wrong. Please try again.",
        sender: "bot",
        type: "text",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground shadow-sm shrink-0" style={{backgroundColor: '#001C38'}}>
        <div className="flex items-center gap-2" >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="font-semibold text-sm">Buksu Chatbot</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-primary-foreground/80 hover:text-white hover:bg-white/10"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                )}
              >
                {/* Normal text */}
                {msg.type === "text" && (
                  <p className="leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </p>
                )}

                {/* Map message */}
                {msg.type === "map" && msg.mapData && (
                  privileges.mapAccessEnabled ? (
                    <MapMessage
                      locationName={msg.mapData.locationName}
                      coordinates={msg.mapData.coordinates}
                    />
                  ) : (
                    <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                      Map is not accessible right now.
                    </div>
                  )
                )}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start w-full"
            >
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-background shrink-0 gap-2 flex items-center">
        {privileges.chatEnabled ? (
          <>
            {privileges.audioInputEnabled ? (
              <Button
                variant={isListening ? "destructive" : "secondary"}
                size="icon"
                className="rounded-full shrink-0 h-10 w-10 transition-all duration-300"
                onClick={toggleListening}
                disabled={isTyping}
              >
                <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
              </Button>
            ) : null}

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary/20 transition-all"
              disabled={isTyping || isListening}
            />

            <Button
              onClick={() => handleSend(inputValue)}
              size="icon"
              disabled={!inputValue.trim() || isTyping || isListening}
              className="rounded-full shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="w-full text-center text-sm text-muted-foreground py-2">
            Chat is currently disabled.
          </div>
        )}
      </div>
    </div>
  );
}