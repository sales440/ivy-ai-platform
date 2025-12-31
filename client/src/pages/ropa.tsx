import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mic, MicOff, Send, Bot, Sparkles, Volume2, VolumeX, Minimize2, Maximize2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function ROPALanding() {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const sendMessageMutation = trpc.ropa.chat.useMutation();
  const { data: chatHistory = [] } = trpc.ropa.getChatHistory.useQuery();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "es-ES";

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
        toast.error("Error al reconocer voz");
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({ message });
      setMessage("");
    } catch (error) {
      toast.error("Error al enviar mensaje");
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast.error("Reconocimiento de voz no disponible");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-black to-orange-500/10 animate-gradient-shift" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Powered by 129 AI Tools</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            Conoce a{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
              ROPA
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Tu agente de ventas autónomo que trabaja 24/7. Habla con ROPA en lenguaje natural o por voz.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                129
              </div>
              <div className="text-sm text-gray-500 mt-1">Herramientas IA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-sm text-gray-500 mt-1">Autónomo</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="text-sm text-gray-500 mt-1">Uptime</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold px-8 py-6 text-lg"
              onClick={() => {
                const chatWindow = document.getElementById("floating-chat");
                if (chatWindow) {
                  setChatMinimized(false);
                  chatWindow.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <Bot className="w-5 h-5 mr-2" />
              Hablar con ROPA
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500/30 hover:bg-cyan-500/10 text-white font-semibold px-8 py-6 text-lg"
              onClick={() => (window.location.href = "/ropa-dashboard")}
            >
              Ver Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Qué puede hacer{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
              ROPA
            </span>{" "}
            por ti?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Gestión de Campañas",
                description: "Crea, optimiza y ejecuta campañas de marketing automáticamente",
                icon: "📊",
              },
              {
                title: "Inteligencia de Mercado",
                description: "Analiza competidores y tendencias en tiempo real",
                icon: "🔍",
              },
              {
                title: "Analytics & BI",
                description: "Genera reportes y visualizaciones de datos al instante",
                icon: "📈",
              },
              {
                title: "Entrenamiento IvyCall",
                description: "Optimiza scripts de llamadas con IA",
                icon: "📞",
              },
              {
                title: "Seguridad & Compliance",
                description: "Auditorías automáticas y cumplimiento normativo",
                icon: "🔒",
              },
              {
                title: "Automatización",
                description: "Programa tareas y workflows sin código",
                icon: "⚡",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm p-6 hover:border-cyan-500/40 transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Chat Window */}
      <div
        id="floating-chat"
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          chatMinimized ? "w-16 h-16" : "w-96 h-[600px]"
        }`}
      >
        {chatMinimized ? (
          <Button
            onClick={() => setChatMinimized(false)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-2xl shadow-cyan-500/50"
          >
            <Bot className="w-8 h-8" />
          </Button>
        ) : (
          <Card className="w-full h-full bg-gray-900/95 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">ROPA</h3>
                  <p className="text-xs text-gray-400">Agente Autónomo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => (isSpeaking ? stopSpeaking() : null)}
                  className="hover:bg-cyan-500/10"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setChatMinimized(true)}
                  className="hover:bg-cyan-500/10"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-cyan-500" />
                  <p className="text-sm">¡Hola! Soy ROPA. ¿En qué puedo ayudarte hoy?</p>
                </div>
              )}

              {chatHistory.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                        : "bg-gray-800/50 text-gray-200 border border-cyan-500/20"
                    }`}
                  >
                    <Streamdown>{msg.content}</Streamdown>
                    {msg.role === "assistant" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => speakText(msg.content)}
                        className="mt-2 h-6 text-xs hover:bg-cyan-500/10"
                      >
                        <Volume2 className="w-3 h-3 mr-1" />
                        Escuchar
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/50 border border-cyan-500/20 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-cyan-500/20 bg-gray-900/50">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={toggleVoiceInput}
                  className={`border-cyan-500/30 ${
                    isListening
                      ? "bg-orange-500 hover:bg-orange-600 border-orange-500"
                      : "hover:bg-cyan-500/10"
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe o habla con ROPA..."
                  className="flex-1 bg-gray-800/50 border border-cyan-500/20 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
