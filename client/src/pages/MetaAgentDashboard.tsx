import { useState } from "react";
import { 
  Sparkles, Search, TrendingUp, FolderOpen, Plus, 
  ListTodo, X, Maximize2, Minimize2, Send, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_LOGO } from "@/const";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PreviewContent {
  type: "text" | "image" | "links" | "data";
  title: string;
  content: any;
}

export default function MetaAgentDashboard() {
  const [activeSection, setActiveSection] = useState<string>("new-task");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const sidebarItems = [
    { id: "new-task", icon: Sparkles, label: "New Task" },
    { id: "search", icon: Search, label: "Search" },
    { id: "market", icon: TrendingUp, label: "Market" },
    { id: "library", icon: FolderOpen, label: "Library" },
    { id: "new-project", icon: Plus, label: "New Project" },
    { id: "tasks", icon: ListTodo, label: "Tasks" },
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate Meta-Agent response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Procesando tu solicitud...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
    }, 500);
  };

  const clearPreview = () => {
    setPreviewContent(null);
  };

  const clearTasks = () => {
    setSelectedTasks([]);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0A1628] text-white">
      {/* Header */}
      <header className="h-16 border-b border-[#1A3A5C]/30 bg-[#0D1B2A] flex items-center px-6">
        <div className="flex items-center gap-3">
          <img src={APP_LOGO} alt="Ivy.AI" className="h-8 w-8" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] bg-clip-text text-transparent">
            Meta-Agent Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#1A3A5C]/30 bg-[#0A1628] flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      "hover:bg-[#1A3A5C]/50",
                      activeSection === item.id
                        ? "bg-[#1A3A5C] text-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)]"
                        : "text-[#94A3B8]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Tasks Section with Clear Button */}
            {activeSection === "tasks" && (
              <div className="mt-6 p-4 bg-[#0F2847] rounded-lg border border-[#1A3A5C]/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#00D9FF]">Active Tasks</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTasks}
                    className="h-7 text-xs text-[#94A3B8] hover:text-[#00D9FF]"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                {selectedTasks.length === 0 ? (
                  <p className="text-xs text-[#64748B]">
                    No tasks selected. Ask Meta-Agent to show specific company tasks.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedTasks.map((task, idx) => (
                      <li key={idx} className="text-sm text-[#F8FAFC] p-2 bg-[#1A3A5C]/30 rounded">
                        {task}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </ScrollArea>
        </aside>

        {/* Chat Panel */}
        <main className={cn(
          "flex-1 flex flex-col bg-[#0F2847]",
          isPreviewMaximized && "hidden"
        )}>
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-[#00D9FF] mb-4" />
                  <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">
                    Welcome to Meta-Agent
                  </h2>
                  <p className="text-[#94A3B8]">
                    I have 130 tools to help you manage Ivy.AI platform
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-4",
                        msg.role === "user"
                          ? "bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#F8FAFC]"
                          : "bg-[#1A3A5C]/50 border border-[#1A3A5C] text-[#F8FAFC]"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs text-[#64748B] mt-2 block">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Box */}
          <div className="border-t border-[#1A3A5C]/30 p-4 bg-[#0D1B2A]">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-[#94A3B8] hover:text-[#00D9FF]"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Send message to Meta-Agent..."
                className="flex-1 bg-[#0F2847] border-[#1A3A5C] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#00D9FF] focus:ring-[#00D9FF]/20"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-[#00D9FF] to-[#0EA5E9] hover:from-[#00D9FF]/90 hover:to-[#0EA5E9]/90 text-[#0A1628] font-semibold"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </main>

        {/* Preview Panel */}
        <aside className={cn(
          "border-l border-[#1A3A5C]/30 bg-[#1A3A5C] flex flex-col",
          isPreviewMaximized ? "flex-1" : "w-96"
        )}>
          {/* Preview Header */}
          <div className="h-14 border-b border-[#0F2847]/50 flex items-center justify-between px-4 bg-[#0D1B2A]">
            <h3 className="font-semibold text-[#00D9FF]">Preview</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPreview}
                className="h-8 text-[#94A3B8] hover:text-[#00D9FF]"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                className="h-8 text-[#94A3B8] hover:text-[#00D9FF]"
              >
                {isPreviewMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <ScrollArea className="flex-1 p-6">
            {!previewContent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F2847] flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#00D9FF]" />
                </div>
                <p className="text-sm text-[#94A3B8]">
                  Preview will appear here when you request information from Meta-Agent
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-[#F8FAFC]">
                  {previewContent.title}
                </h4>
                <div className="text-sm text-[#94A3B8]">
                  {/* Preview content will be rendered here based on type */}
                  {JSON.stringify(previewContent.content, null, 2)}
                </div>
              </div>
            )}
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
