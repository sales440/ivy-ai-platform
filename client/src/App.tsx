import React, { useState } from 'react';
import { Terminal, Activity, Send, Plus, X, User, Briefcase, Calendar, LayoutDashboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Route, Switch, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import MetaAgentDashboard from "./pages/MetaAgent";
import superjson from "superjson";

// --- tRPC Setup ---
const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "http://localhost:8000/trpc",
      // transformer: superjson, // Enable if backend uses superjson
    }),
  ],
  transformer: superjson,
});

// --- Cyberpunk Styles ---
const styles = {
  appContainer: "flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#bc13fe] selection:text-white",
  header: "bg-[#111111]/90 border-b border-[#333] p-4 flex justify-between items-center backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
  headerTitle: "text-2xl font-bold tracking-widest text-white flex items-center gap-2 font-mono",
  headerStatus: "font-mono text-[#00f3ff] text-sm tracking-widest flex items-center gap-2",
  mainLayout: "flex flex-1 p-4 gap-4 overflow-hidden",
  panel: "bg-[#111111] border border-[#333] rounded-lg p-4 flex flex-col shadow-2xl relative overflow-hidden",
  kanbanArea: "flex-[3] flex flex-col min-w-0",
  chatArea: "flex-1 flex flex-col min-w-[350px] max-w-[450px]",
  column: "bg-[#161616] p-4 rounded-md min-w-[280px] flex flex-col flex-1 border border-[#222] mr-4 last:mr-0 transition-colors hover:border-[#333]",
  card: "bg-[#222] p-4 mt-3 border-l-[3px] shadow-lg hover:bg-[#2a2a2a] transition-all cursor-pointer group relative overflow-hidden active:scale-95 active:shadow-inner",
  msgUser: "bg-[#bc13fe] text-white p-3 rounded-tr-none rounded-lg self-end max-w-[85%] break-words shadow-[0_2px_10px_rgba(188,19,254,0.3)] text-sm font-medium",
  msgBot: "text-[#00f3ff] font-mono border-l-2 border-[#00f3ff] p-3 bg-[#00f3ff]/5 self-start max-w-[90%] break-words text-sm shadow-[0_0_15px_rgba(0,243,255,0.1)]",
  modalOverlay: "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200",
  modalContent: "bg-[#111111] border border-[#333] p-6 rounded-lg w-[600px] max-w-[90vw] shadow-[0_0_50px_rgba(188,19,254,0.2)] animate-in zoom-in-95 duration-200 relative",
  input: "bg-black border-[#333] text-white focus-visible:ring-[#bc13fe] placeholder:text-gray-600",
  label: "text-[#888] text-xs font-bold uppercase tracking-wider mb-1 block",
};

// --- Types ---
interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

interface Company {
  id: string;
  name: string;
  context: string;
  stage: 'investigacion' | 'activa' | 'negociacion';
  package: 'Full Cover' | 'Sales Hunter' | 'Customer Care';
}

const INITIAL_COMPANIES: Company[] = [
  { id: 'c1', name: 'Tesla Berlin', context: 'Análisis de expansión', stage: 'investigacion', package: 'Full Cover' },
  { id: 'c2', name: 'SpaceX', context: 'Contrato logística', stage: 'investigacion', package: 'Sales Hunter' },
  { id: 'c3', name: 'Banco Santander', context: 'Email Sequence #2', stage: 'activa', package: 'Customer Care' },
  { id: 'c4', name: 'Fagor Automation', context: 'Cierre Q4', stage: 'negociacion', package: 'Full Cover' },
];

// --- Components ---

function DraggableCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: company.id,
    data: company,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  let highlightColor = '#bc13fe';
  if (company.stage === 'activa') highlightColor = '#00f3ff';
  if (company.stage === 'negociacion') highlightColor = '#22c55e';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.card} ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}`}
      onClick={onClick}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: highlightColor, boxShadow: `0 0 10px ${highlightColor}` }}
      />
      <h4 className="font-bold text-base group-hover:text-white transition-colors">{company.name}</h4>
      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        <Activity size={10} color={highlightColor} /> {company.context}
      </p>
    </div>
  );
}

function DroppableColumn({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? 'bg-[#1a1a1a] border-[#bc13fe]/50 shadow-[inset_0_0_20px_rgba(188,19,254,0.1)]' : ''}`}
    >
      <small className="text-[#888] font-bold tracking-wider mb-2 flex justify-between items-center">
        {title} <span className="text-[#333] text-[10px] bg-[#111] px-2 py-0.5 rounded-full">{React.Children.count(children)}</span>
      </small>
      <div className="flex-1 flex flex-col gap-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}

// --- Main App / Kanban View ---

function KanbanView() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'bot', text: 'ROPA ONLINE. Sistemas nominales. Esperando instrucciones.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // New Client Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientContext, setNewClientContext] = useState('');
  const [newClientPackage, setNewClientPackage] = useState<'Full Cover' | 'Sales Hunter' | 'Customer Care'>('Full Cover');

  // --- Handlers ---

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    const newMsgs: Message[] = [...messages, { id: Date.now().toString(), sender: 'user', text: userMsg }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      console.log("Enviando mensaje al núcleo ROPA:", userMsg);
      const res = await axios.post('http://localhost:8000/api/chat', { message: userMsg });

      const botResponse = res.data.response || "Comando recibido, pero sin respuesta textual.";

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: botResponse }]);
    } catch (e) {
      console.error("Error de conexión:", e);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: '⚠️ ERROR DE CONEXIÓN CON NÚCLEO (backend offline o error 500).' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      // Si over.id es una columna, movemos ahí.
      if (['investigacion', 'activa', 'negociacion'].includes(over.id.toString())) {
        setCompanies(items => items.map(c => {
          if (c.id === active.id) {
            return { ...c, stage: over.id as any };
          }
          return c;
        }));

        // Opcional: Notificar a ROPA del cambio
        axios.post('http://localhost:8000/api/kanban/move', {
          company: companies.find(c => c.id === active.id)?.name,
          stage: over.id
        }).then(res => {
          if (res.data.ropa_advice) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: `[AUTO] ${res.data.ropa_advice}` }]);
          }
        }).catch(err => console.error("No se pudo notificar a ROPA", err));
      }
    }
  };

  const handleStartCampaign = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: `Iniciando generación de campaña para ${selectedCompany.name}...` }]);
    setSelectedCompany(null);

    try {
      const res = await axios.post('http://localhost:8000/api/campaign/generate', {
        company: selectedCompany.name,
        context: selectedCompany.context,
        package: selectedCompany.package
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: res.data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "⚠️ Error generando campaña." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClientName) return;
    const newCompany: Company = {
      id: Date.now().toString(),
      name: newClientName,
      context: newClientContext || 'Nuevo Prospecto',
      stage: 'investigacion',
      package: newClientPackage
    };
    setCompanies([...companies, newCompany]);
    setNewClientName('');
    setNewClientContext('');
    setNewClientPackage('Full Cover');
    setIsNewClientOpen(false);

    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: `Nuevo objetivo identificado: ${newCompany.name} (Paquete: ${newCompany.package}). Analizando viabilidad...` }]);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/company/analyze', {
        company: newCompany.name,
        stage: 'investigacion',
        package: newCompany.package
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: res.data.response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          IVY.AI <Activity size={20} className="text-[#00f3ff] animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          {/* Navigation Button */}
          <Link href="/meta-agent">
            <Button variant="outline" className="border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/10">
              <LayoutDashboard className="w-4 h-4 mr-2" /> META-AGENT DASHBOARD
            </Button>
          </Link>
          <div className={styles.headerStatus}>
            <div className="h-2 w-2 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_10px_#00f3ff]" />
            STATUS: AUTONOMOUS
          </div>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <DndContext onDragEnd={handleDragEnd}>
          <div className={`${styles.panel} ${styles.kanbanArea}`}>
            <div className="flex justify-between items-center border-b border-[#333] pb-4 mb-4">
              <h3 className="font-mono text-[#888] flex items-center gap-2">
                <Terminal size={16} /> PIPELINE DE VENTAS
              </h3>
              <Button
                onClick={() => setIsNewClientOpen(true)}
                className="bg-[#222] hover:bg-[#333] text-[#00f3ff] border border-[#00f3ff]/30 text-xs font-mono"
              >
                <Plus size={14} className="mr-1" /> NUEVO CLIENTE
              </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto h-full pb-2">
              <DroppableColumn id="investigacion" title="INVESTIGACIÓN">
                {companies.filter(c => c.stage === 'investigacion').map(c => (
                  <DraggableCard key={c.id} company={c} onClick={() => setSelectedCompany(c)} />
                ))}
              </DroppableColumn>
              <DroppableColumn id="activa" title="CAMPAÑA ACTIVA">
                {companies.filter(c => c.stage === 'activa').map(c => (
                  <DraggableCard key={c.id} company={c} onClick={() => setSelectedCompany(c)} />
                ))}
              </DroppableColumn>
              <DroppableColumn id="negociacion" title="NEGOCIACIÓN">
                {companies.filter(c => c.stage === 'negociacion').map(c => (
                  <DraggableCard key={c.id} company={c} onClick={() => setSelectedCompany(c)} />
                ))}
              </DroppableColumn>
            </div>
          </div>
        </DndContext>

        {/* CHAT AREA */}
        <div className={`${styles.panel} ${styles.chatArea}`}>
          <div className="flex items-center gap-2 mb-4 text-[#888] font-mono text-xs border-b border-[#333] pb-2">
            <Terminal size={14} /> ROPA_CONSOLE_V2
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 mb-4 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={m.sender === 'bot' ? styles.msgBot : styles.msgUser}>
                {m.sender === 'bot' ? <span className="text-xs font-bold block mb-1 opacity-50">&gt; SYSTEM//ROPA:</span> : null}
                {m.text}
              </div>
            ))}
            {loading && (
              <div className={styles.msgBot}>
                <span className="animate-pulse">_ PROCESANDO...</span>
              </div>
            )}
            <div id="scroll-anchor"></div>
          </div>

          <div className="flex gap-2 mt-auto">
            <Input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Instruye a ROPA..."
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              className="bg-[#00f3ff] text-black hover:bg-[#00c2cc] font-bold shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all hover:scale-105"
              disabled={loading}
            >
              <Send size={16} /> CMD
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE EMPRESA */}
      {selectedCompany && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCompany(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-[#333] pb-4">
              <div>
                <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                  <Briefcase className="text-[#bc13fe]" /> {selectedCompany.name}
                </h2>
                <p className="text-[#888] text-sm mt-1 uppercase tracking-widest">{selectedCompany.id}</p>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-[#666] hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={styles.label}>Estado Actual</label>
                <div className="bg-[#222] p-2 rounded text-[#00f3ff] font-mono border border-[#333]">
                  {selectedCompany.stage.toUpperCase()}
                </div>
              </div>
              <div>
                <label className={styles.label}>Contexto</label>
                <div className="bg-[#222] p-2 rounded text-gray-300 border border-[#333]">
                  {selectedCompany.context}
                </div>
              </div>
              <div className="col-span-2">
                <label className={styles.label}>Paquete Contratado</label>
                <div className="bg-[#222] p-2 rounded text-[#bc13fe] font-mono border border-[#333] tracking-widest text-xs">
                  {selectedCompany.package.toUpperCase()}
                </div>
              </div>
              <div className="col-span-2">
                <label className={styles.label}>Historial de Interacciones</label>
                <div className="bg-[#161616] p-4 rounded h-32 overflow-y-auto text-sm text-gray-400 font-mono border border-[#333]">
                  <p>&gt; Sistema inicializado para objetivo.</p>
                  <p>&gt; Análisis de mercado completado.</p>
                  <p>&gt; Oportunidad detectada: Alta.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" className="border-[#333] text-gray-400 hover:text-white hover:bg-[#222]">Archivar</Button>
              <Button className="bg-[#bc13fe] hover:bg-[#a010d8] text-white" onClick={handleStartCampaign}>Iniciar Campaña</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {isNewClientOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewClientOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold font-mono text-white mb-6 flex items-center gap-2">
              <User className="text-[#00f3ff]" /> NUEVO OBJETIVO
            </h2>

            <div className="space-y-4">
              <div>
                <label className={styles.label}>Nombre de la Empresa</label>
                <Input
                  className={styles.input}
                  placeholder="Ej: Cyberdyne Systems"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>Contexto / Notas</label>
                <Input
                  className={styles.input}
                  placeholder="Ej: Posible contrato de IA"
                  value={newClientContext}
                  onChange={e => setNewClientContext(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.label}>Paquete de Agentes</label>
                <select
                  className={`${styles.input} w-full p-2 outline-none rounded-md`}
                  value={newClientPackage}
                  onChange={e => setNewClientPackage(e.target.value as any)}
                >
                  <option value="Full Cover">Full Cover (Todos los Agentes)</option>
                  <option value="Sales Hunter">Sales Hunter (Solo Ventas Outbound)</option>
                  <option value="Customer Care">Customer Care (Soporte & Retención)</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setIsNewClientOpen(false)}>Cancelar</Button>
              <Button className="bg-[#00f3ff] text-black hover:bg-[#00c2cc] font-bold" onClick={handleAddClient}>
                Confirmar Objetivo
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={KanbanView} />
          <Route path="/meta-agent" component={MetaAgentDashboard} />
        </Switch>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
