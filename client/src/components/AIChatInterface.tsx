import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Building,
  Mail,
  Users,
  BarChart3,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export default function AIChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // tRPC mutations and queries
  const sendMessageMutation = trpc.aiChat.sendMessage.useMutation();
  const { data: historyData } = trpc.aiChat.getHistory.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: quickActionsData } = trpc.aiChat.getQuickActions.useQuery(undefined, {
    enabled: isOpen,
  });
  const clearHistoryMutation = trpc.aiChat.clearHistory.useMutation();

  // Load conversation history
  useEffect(() => {
    if (historyData?.history && messages.length === 0) {
      const loadedMessages = historyData.history.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(),
      }));
      setMessages(loadedMessages);
    }
  }, [historyData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      textareaRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        message: inputValue,
        companyId: historyData?.companyId,
      });

      const aiMessage: Message = {
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Show action result if any
      if (result.action) {
        if (result.action.success) {
          toast.success(result.action.message || "Action completed successfully");
        } else {
          toast.error(result.action.message || "Action failed");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
      setMessages([]);
      toast.success("Conversation cleared");
    } catch (error) {
      toast.error("Failed to clear conversation");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      building: Building,
      mail: Mail,
      users: Users,
      chart: BarChart3,
    };
    return icons[iconName] || Sparkles;
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 shadow-2xl border-2 z-50 transition-all ${
        isMinimized
          ? "w-80 h-16"
          : "w-[480px] h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Ivy-Orchestrator</h3>
            {!isMinimized && (
              <p className="text-xs opacity-90">Your AI Campaign Manager</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 text-purple-500" />
                <h4 className="font-semibold text-lg mb-2">
                  Welcome to Ivy-Orchestrator
                </h4>
                <p className="text-sm max-w-xs">
                  I can help you create campaigns, manage contacts, and monitor
                  metrics. Just ask me in natural language!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && quickActionsData?.actions && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActionsData.actions.slice(0, 4).map((action: QuickAction) => {
                  const IconComponent = getIconComponent(action.icon);
                  return (
                    <Badge
                      key={action.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleQuickAction(action.prompt)}
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {action.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Shift+Enter for new line)"
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                {messages.length > 0 && (
                  <Button
                    onClick={handleClearHistory}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by Ivy.AI • Press Enter to send
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
