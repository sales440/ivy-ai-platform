import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Sparkles,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

export default function RopaLanding() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(true);

  // Mock kanban data
  const kanbanColumns = [
    {
      id: "idea",
      title: "Ideas",
      color: "bg-slate-700",
      items: [
        { id: 1, title: "LinkedIn Campaign Q1", type: "campaign", priority: "high" },
        { id: 2, title: "Email Sequence - Enterprise", type: "campaign", priority: "medium" },
      ],
    },
    {
      id: "planning",
      title: "Planning",
      color: "bg-blue-700",
      items: [
        { id: 3, title: "Cold Outreach Strategy", type: "campaign", priority: "high" },
        { id: 4, title: "Webinar Promotion", type: "content", priority: "low" },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "bg-yellow-700",
      items: [
        { id: 5, title: "LinkedIn Ads Campaign", type: "campaign", priority: "high" },
        { id: 6, title: "Email Nurture Sequence", type: "campaign", priority: "medium" },
      ],
    },
    {
      id: "review",
      title: "Review",
      color: "bg-purple-700",
      items: [{ id: 7, title: "Q4 Campaign Analysis", type: "report", priority: "medium" }],
    },
    {
      id: "published",
      title: "Published",
      color: "bg-green-700",
      items: [
        { id: 8, title: "Holiday Campaign 2024", type: "campaign", priority: "high" },
        { id: 9, title: "Product Launch Email", type: "content", priority: "medium" },
      ],
    },
  ];

  const { data: chatHistory, refetch: refetchChat } = trpc.ropa.getChatHistory.useQuery();

  const sendChatMutation = trpc.ropa.sendChatMessage.useMutation({
    onSuccess: () => {
      refetchChat();
      setMessage("");
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sendChatMutation.mutate({ message });
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-500/10 text-red-500 border-red-500/30";
    if (priority === "medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    return "bg-green-500/10 text-green-500 border-green-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-indigo-900/50 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-indigo-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  ROPA
                </h1>
                <p className="text-xs text-slate-400">Autonomous AI Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="border-indigo-500/50 hover:bg-indigo-500/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by 129 AI Tools
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Meet <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ROPA</span>
            <br />
            Your Autonomous Sales Agent
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            ROPA gestiona campañas de ventas 24/7, analiza mercados, optimiza estrategias y genera resultados
            automáticamente. Trabaja de forma autónoma o colabora contigo en tiempo real.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with ROPA
            </Button>
            <Button size="lg" variant="outline" className="border-indigo-500/50 hover:bg-indigo-500/10">
              View Capabilities
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-indigo-900/30">
              <p className="text-3xl font-bold text-indigo-400">129</p>
              <p className="text-sm text-slate-400">AI Tools</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-indigo-900/30">
              <p className="text-3xl font-bold text-green-400">24/7</p>
              <p className="text-sm text-slate-400">Autonomous</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-indigo-900/30">
              <p className="text-3xl font-bold text-purple-400">99.9%</p>
              <p className="text-sm text-slate-400">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Mode Toggle */}
      <section className="container mx-auto px-6 mb-12">
        <Card className="bg-slate-900/50 border-indigo-900/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Operating Mode
                </CardTitle>
                <CardDescription>Choose how ROPA works for you</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={autonomousMode ? "default" : "outline"}
                  onClick={() => setAutonomousMode(true)}
                  className={autonomousMode ? "bg-indigo-600" : "border-indigo-500/50"}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Autonomous
                </Button>
                <Button
                  variant={!autonomousMode ? "default" : "outline"}
                  onClick={() => setAutonomousMode(false)}
                  className={!autonomousMode ? "bg-indigo-600" : "border-indigo-500/50"}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Human-Guided
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-indigo-950/30 rounded-lg border border-indigo-900/30">
                <div className="flex items-start gap-3 mb-3">
                  <Zap className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Autonomous Mode</h3>
                    <p className="text-sm text-slate-400">
                      ROPA works independently, making decisions, creating campaigns, and optimizing strategies without
                      human intervention. You receive reports and can override anytime.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Auto-optimization
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    24/7 monitoring
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Proactive alerts
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-purple-950/30 rounded-lg border border-purple-900/30">
                <div className="flex items-start gap-3 mb-3">
                  <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Human-Guided Mode</h3>
                    <p className="text-sm text-slate-400">
                      ROPA suggests actions and waits for your approval. You can chat with ROPA, request changes, and
                      collaborate in real-time through natural language.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Approval workflow
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Natural language
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Full control
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Chat + Kanban Section */}
      <section className="container mx-auto px-6 mb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Window */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-indigo-900/30 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  Chat with ROPA
                </CardTitle>
                <CardDescription>Interact in natural language (Spanish/English)</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4 mb-4">
                  {chatHistory && chatHistory.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 border border-slate-700"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Streamdown>{msg.content}</Streamdown>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Bot className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="font-medium mb-2">Start a conversation</p>
                        <p className="text-sm">
                          Try: "Create a LinkedIn campaign for B2B SaaS"
                          <br />
                          or "Show me campaign performance"
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask ROPA anything..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-500"
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting || !message.trim()} size="icon">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-indigo-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Campaign Management Board
                </CardTitle>
                <CardDescription>Drag & drop campaigns between stages (managed by ROPA or you)</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                    {kanbanColumns.map((column) => (
                      <div key={column.id} className="w-64 flex-shrink-0">
                        <div className={`${column.color} rounded-t-lg px-3 py-2 flex items-center justify-between`}>
                          <h3 className="font-semibold text-sm">{column.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {column.items.length}
                          </Badge>
                        </div>
                        <div className="bg-slate-800/50 rounded-b-lg p-3 space-y-3 min-h-[400px]">
                          {column.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-indigo-500/50 transition-colors cursor-move"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{item.title}</h4>
                                <Badge variant="outline" className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {item.type}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  2 days
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What ROPA Can Do</h2>
          <p className="text-xl text-slate-400">129 specialized tools working together</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Target,
              title: "Campaign Management",
              description: "Create, optimize, and manage multi-channel sales campaigns automatically",
              tools: 25,
            },
            {
              icon: Brain,
              title: "Market Intelligence",
              description: "Analyze markets, competitors, and trends in real-time",
              tools: 20,
            },
            {
              icon: TrendingUp,
              title: "Analytics & BI",
              description: "Track KPIs, generate reports, and predict outcomes",
              tools: 22,
            },
            {
              icon: Sparkles,
              title: "IvyCall Training",
              description: "Train AI agents for voice calls and customer interactions",
              tools: 15,
            },
            {
              icon: CheckCircle2,
              title: "Security & Compliance",
              description: "Ensure data protection and regulatory compliance",
              tools: 12,
            },
            {
              icon: Zap,
              title: "Automation & Scheduler",
              description: "Schedule tasks, workflows, and automated actions",
              tools: 15,
            },
          ].map((capability, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-indigo-900/30 hover:border-indigo-500/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-indigo-600/10 flex items-center justify-center mb-3">
                  <capability.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <CardTitle className="text-lg">{capability.title}</CardTitle>
                <CardDescription>{capability.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{capability.tools} tools</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Sales?</h2>
            <p className="text-xl mb-8 text-indigo-100">
              Start using ROPA today and let AI handle your sales operations 24/7
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with ROPA Now
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-900/50 bg-slate-950/50 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>ROPA v3.1 • Part of {APP_TITLE}</p>
            <p>Powered by 129 AI Tools • 99.9% Uptime</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
