import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Brain, Target, TrendingUp, Mail, Phone, Linkedin,
  MessageSquare, CheckCircle, ArrowRight, Play, Star,
  BarChart3, Globe, Shield, Clock, Users, ChevronDown,
  Sparkles, Bot, Workflow, LineChart, Building2, ShoppingBag,
  Briefcase, Factory, X, Send
} from "lucide-react";

// ─── ROPA Framework Steps ──────────────────────────────────────────────────
const ROPA_STEPS = [
  {
    id: "01",
    name: "Reconocimiento",
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    desc: "ROPA analiza el perfil de la empresa, industria, competidores y buyer persona para construir una estrategia de ventas personalizada.",
    bullets: ["Análisis de ICP (Ideal Customer Profile)", "Mapeo de competidores", "Identificación de canales óptimos"]
  },
  {
    id: "02",
    name: "Orquestación",
    icon: Workflow,
    color: "from-cyan-500 to-blue-600",
    desc: "ROPA diseña la secuencia de contacto multicanal: cuándo, cómo y por qué canal contactar a cada prospecto.",
    bullets: ["Secuencias de email automatizadas", "Timing óptimo por industria", "Priorización de leads por score"]
  },
  {
    id: "03",
    name: "Producción",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-600",
    desc: "ROPA genera contenido de ventas profesional con IA: emails HTML, scripts de llamada, mensajes de LinkedIn y WhatsApp.",
    bullets: ["Emails HTML de 4,000+ caracteres", "Scripts de llamada personalizados", "Mensajes multicanal adaptados"]
  },
  {
    id: "04",
    name: "Acción",
    icon: Send,
    color: "from-orange-500 to-red-500",
    desc: "ROPA ejecuta las campañas a través de los canales configurados, usando los workflows de n8n dedicados por empresa.",
    bullets: ["Envío via Outlook/Gmail dedicado", "Llamadas automáticas via Twilio", "Posts en LinkedIn programados"]
  },
  {
    id: "05",
    name: "Análisis",
    icon: LineChart,
    color: "from-pink-500 to-rose-600",
    desc: "ROPA monitorea resultados cada 30 minutos, detecta problemas y propone optimizaciones sin intervención humana.",
    bullets: ["Loop autónomo cada 30 minutos", "Alertas de campañas en riesgo", "Recomendaciones de optimización con IA"]
  }
];

// ─── Pricing Plans ─────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "$299",
    period: "/mes",
    tagline: "Para empresas que inician con ventas automatizadas",
    color: "border-slate-700",
    accent: "text-slate-300",
    features: [
      "1 empresa-cliente",
      "3 campañas activas",
      "500 emails/mes",
      "ROPA Framework completo",
      "Emails HTML generados por IA",
      "Monitor de campañas",
      "Soporte por email"
    ],
    cta: "Empezar gratis 14 días",
    highlight: false
  },
  {
    name: "Growth",
    price: "$799",
    period: "/mes",
    tagline: "Para agencias y equipos de ventas en crecimiento",
    color: "border-cyan-500",
    accent: "text-cyan-400",
    features: [
      "5 empresas-cliente",
      "Campañas ilimitadas",
      "5,000 emails/mes",
      "Voice AI (llamadas automáticas)",
      "AI Search semántico",
      "Dashboard de ROI",
      "Workflows n8n aislados por empresa",
      "Soporte prioritario"
    ],
    cta: "Empezar gratis 14 días",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "$1,999",
    period: "/mes",
    tagline: "Para operaciones de ventas a escala",
    color: "border-violet-500",
    accent: "text-violet-400",
    features: [
      "Empresas-cliente ilimitadas",
      "Emails ilimitados",
      "Voice AI + LinkedIn AI",
      "Google Drive integrado",
      "API pública",
      "SLA 99.9% uptime",
      "Onboarding dedicado",
      "Soporte 24/7"
    ],
    cta: "Hablar con ventas",
    highlight: false
  }
];

// ─── Industry Use Cases ─────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    icon: ShoppingBag,
    name: "E-commerce & Retail",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    problem: "Carritos abandonados, baja retención, alto CAC",
    solution: "ROPA genera secuencias de recuperación de carrito, emails de reactivación y campañas de upsell personalizadas por segmento de cliente.",
    metric: "↑ 34% tasa de recuperación de carrito"
  },
  {
    icon: Briefcase,
    name: "B2B SaaS",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    problem: "Ciclos de venta largos, demos que no convierten, churn silencioso",
    solution: "ROPA orquesta secuencias de outreach frío, nurturing de leads y campañas de expansión de cuentas con contenido técnico generado por IA.",
    metric: "↑ 28% conversión de trial a pago"
  },
  {
    icon: Building2,
    name: "Servicios Profesionales",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    problem: "Dependencia de referidos, pipeline impredecible, propuestas genéricas",
    solution: "ROPA genera propuestas personalizadas, secuencias de seguimiento post-reunión y campañas de reactivación de clientes inactivos.",
    metric: "↑ 41% tasa de cierre de propuestas"
  },
  {
    icon: Factory,
    name: "Manufactura & Industrial",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    problem: "Ventas reactivas, sin estrategia de outreach, dependencia de distribuidores",
    solution: "ROPA identifica oportunidades de upgrade, genera campañas de mantenimiento preventivo y ejecuta outreach técnico personalizado por tipo de maquinaria.",
    metric: "↑ 52% en contratos de servicio recurrente"
  }
];

// ─── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "PET LIFE 360",
    role: "E-commerce de mascotas, USA",
    text: "ROPA generó nuestra primera campaña de outreach en menos de 5 minutos. Los emails son completamente personalizados y profesionales — algo que antes nos tomaba días.",
    stars: 5,
    metric: "3 campañas activas, 0 horas de trabajo manual"
  },
  {
    name: "FAGOR Automation",
    role: "Manufactura CNC, Global",
    text: "Necesitábamos una solución que entendiera la complejidad técnica de nuestros productos. ROPA generó contenido de ventas que nuestro equipo no hubiera podido escribir mejor.",
    stars: 5,
    metric: "7 líneas de campaña activas, emails desde jcrobledo@fagor-automation.com"
  }
];

// ─── Demo Modal ─────────────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runDemo = async () => {
    if (!company || !industry) return;
    setGenerating(true);
    setStep(1);
    // Simulate ROPA generating strategy
    await new Promise(r => setTimeout(r, 2000));
    setStep(2);
    await new Promise(r => setTimeout(r, 1500));
    setStep(3);
    setResult(`✅ Estrategia generada para ${company}

📊 **Análisis completado:**
• Industria: ${industry}
• Canales recomendados: Email (primario), LinkedIn (secundario), Llamadas (seguimiento)
• Frecuencia óptima: 3 touchpoints/semana durante 4 semanas

📧 **Secuencia de emails generada:**
• Email 1 (Día 1): Introducción de valor — "¿Cómo ${company} puede aumentar ventas un 30% con IA?"
• Email 2 (Día 4): Caso de éxito relevante para ${industry}
• Email 3 (Día 8): Propuesta de demo personalizada

📞 **Script de llamada:**
"Buenos días, le llamo de ${company}. Vi que están en ${industry} y quería compartir cómo empresas similares están usando IA para generar leads automáticamente..."

🎯 **ROI proyectado:** $45,000 en nuevos contratos en 90 días`);
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d1117] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Demo en Vivo — ROPA Super Meta-Agent</h3>
              <p className="text-slate-400 text-sm">Genera una estrategia de campaña real en 30 segundos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Nombre de tu empresa</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Ej: TechVentas México"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Industria</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Selecciona tu industria</option>
                  <option value="E-commerce">E-commerce & Retail</option>
                  <option value="B2B SaaS">B2B SaaS</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Manufactura">Manufactura & Industrial</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Finanzas">Finanzas & Seguros</option>
                </select>
              </div>

              {generating && (
                <div className="space-y-3 py-4">
                  {["Analizando perfil de empresa...", "Generando estrategia multicanal...", "Creando secuencia de emails con IA..."].map((msg, i) => (
                    <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i < step ? "opacity-100" : "opacity-30"}`}>
                      {i < step ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      <span className="text-slate-300 text-sm">{msg}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={runDemo}
                disabled={!company || !industry || generating}
                className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold py-3 rounded-xl"
              >
                {generating ? "ROPA está trabajando..." : "Generar estrategia con ROPA →"}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-600">
                <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono leading-relaxed">{result}</pre>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => { setResult(null); setStep(0); setCompany(""); setIndustry(""); }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Probar otra empresa
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 text-white"
                >
                  Crear mi cuenta gratis →
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [showDemo, setShowDemo] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [counter, setCounter] = useState({ companies: 0, emails: 0, campaigns: 0 });
  const [lang, setLang] = useState<'es' | 'en'>(() => (localStorage.getItem('ivy_lang') as 'es' | 'en') || 'es');
  const heroRef = useRef<HTMLDivElement>(null);

  const t = {
    navFramework: lang === 'en' ? 'Framework' : 'Framework',
    navSolutions: lang === 'en' ? 'Solutions' : 'Soluciones',
    navPricing: lang === 'en' ? 'Pricing' : 'Precios',
    navDemo: lang === 'en' ? 'Demo' : 'Demo',
    navIndustries: lang === 'en' ? 'Industries' : 'Industrias',
    navLogin: lang === 'en' ? 'Sign in' : 'Iniciar sesión',
    navCta: lang === 'en' ? 'See free demo' : 'Ver demo gratis',
    heroBadge: lang === 'en' ? 'ROPA™ Super Meta-Agent — Powered by AI' : 'ROPA™ Super Meta-Agent — Powered by AI',
    heroTitle1: lang === 'en' ? 'The autonomous sales agent' : 'El agente de ventas',
    heroTitle2: lang === 'en' ? 'that never sleeps' : 'autónomo que nunca duerme',
    heroSub: lang === 'en'
      ? 'Ivy.AI with ROPA orchestrates complete multichannel sales campaigns — emails, calls, LinkedIn — generated by AI and executed automatically. No consultants. No waiting. From day 1.'
      : 'Ivy.AI con ROPA orquesta campañas de ventas multicanal completas — emails, llamadas, LinkedIn — generadas por IA y ejecutadas automáticamente. Sin consultores. Sin esperas. Desde el día 1.',
    heroCta1: lang === 'en' ? 'See ROPA in action — Free' : 'Ver ROPA en acción — Gratis',
    heroCta2: lang === 'en' ? 'Access dashboard' : 'Acceder al dashboard',
    statsCompanies: lang === 'en' ? 'Active companies' : 'Empresas activas',
    statsEmails: lang === 'en' ? 'Emails sent' : 'Emails enviados',
    statsCampaigns: lang === 'en' ? 'Campaigns generated' : 'Campañas generadas',
  };

  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    setLang(next);
    localStorage.setItem('ivy_lang', next);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animated counters
  useEffect(() => {
    const targets = { companies: 127, emails: 48500, campaigns: 342 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter({
        companies: Math.floor(targets.companies * eased),
        emails: Math.floor(targets.emails * eased),
        campaigns: Math.floor(targets.campaigns * eased)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "bg-[#050508]/95 backdrop-blur-md border-b border-slate-800" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Ivy<span className="text-cyan-400">.AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#framework" className="text-slate-400 hover:text-white text-sm transition-colors">{t.navFramework}</a>
            <a href="#soluciones" className="text-slate-400 hover:text-white text-sm transition-colors">{t.navSolutions}</a>
            <a href="#precios" className="text-slate-400 hover:text-white text-sm transition-colors">{t.navPricing}</a>
            <a href="#demo" className="text-slate-400 hover:text-white text-sm transition-colors">{t.navDemo}</a>
            <a href="/industrias" className="text-slate-400 hover:text-white text-sm transition-colors">{t.navIndustries}</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className={`text-xs font-bold transition-colors ${lang === 'es' ? 'text-cyan-400' : 'text-slate-500'}`}>ES</span>
              <span className="text-slate-600 text-xs">/</span>
              <span className={`text-xs font-bold transition-colors ${lang === 'en' ? 'text-cyan-400' : 'text-slate-500'}`}>EN</span>
            </button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/ropa-v2")}
              className="text-slate-300 hover:text-white text-sm hidden md:flex"
            >
              {t.navLogin}
            </Button>
            <Button
              onClick={() => setShowDemo(true)}
              className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-sm px-4 py-2 rounded-lg font-medium"
            >
              {t.navCta}
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 px-4 py-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {t.heroBadge}
          </Badge>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            {t.heroTitle1}<br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => setShowDemo(true)}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold px-8 py-4 rounded-xl text-lg group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              {t.heroCta1}
            </Button>
            <Button
              onClick={() => setLocation("/ropa-v2")}
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-white px-8 py-4 rounded-xl text-lg bg-transparent"
            >
              {t.heroCta2}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: counter.companies, suffix: "+", label: t.statsCompanies },
              { value: counter.emails.toLocaleString(), suffix: "", label: t.statsEmails },
              { value: counter.campaigns, suffix: "+", label: t.statsCampaigns }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-slate-600" />
        </div>
      </section>

      {/* ── ROPA Framework ── */}
      <section id="framework" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/30">
              ROPA™ Framework
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              5 fases. <span className="text-violet-400">1 agente autónomo.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              El ROPA™ Framework es la metodología propietaria de Ivy.AI para orquestar campañas de ventas 
              completas sin intervención humana. Cada empresa-cliente tiene su propio ciclo aislado.
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/20 via-cyan-500/40 to-pink-500/20 -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {ROPA_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative group">
                    <div className="bg-slate-900/80 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40">
                      <div className="text-slate-600 text-xs font-mono mb-3">{step.id}</div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{step.name}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                      <ul className="space-y-1.5">
                        {step.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-slate-500">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Ivy.AI vs Consulting ── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Ivy.AI vs <span className="text-slate-500">Consultoría de IA tradicional</span>
            </h2>
            <p className="text-slate-400">La diferencia entre pagar por tiempo humano y pagar por resultados automatizados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consulting */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-6">Consultoría de IA tradicional</div>
              {[
                ["⏳", "50-90 días para entregar el primer agente"],
                ["💰", "$30,000-$100,000 por proyecto"],
                ["👥", "Requiere equipo humano para mantenimiento"],
                ["🔒", "El agente es tuyo pero no lo puedes operar solo"],
                ["📊", "Sin métricas en tiempo real"],
                ["🚫", "No escala sin contratar más consultores"]
              ].map(([icon, text], i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <span className="text-xl">{icon}</span>
                  <span className="text-slate-400 text-sm">{text as string}</span>
                </div>
              ))}
            </div>

            {/* Ivy.AI */}
            <div className="bg-gradient-to-br from-cyan-950/50 to-violet-950/50 border border-cyan-500/30 rounded-2xl p-8">
              <div className="text-cyan-400 font-bold text-sm uppercase tracking-wider mb-6">Ivy.AI con ROPA™</div>
              {[
                ["⚡", "Operacional desde el día 1 — sin esperas"],
                ["💳", "$299-$1,999/mes — sin costos ocultos"],
                ["🤖", "ROPA trabaja autónomamente 24/7"],
                ["🎛️", "Dashboard completo que tú controlas"],
                ["📈", "Métricas en tiempo real cada 30 minutos"],
                ["♾️", "Escala infinita — agrega empresas en segundos"]
              ].map(([icon, text], i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <span className="text-xl">{icon}</span>
                  <span className="text-slate-200 text-sm">{text as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industry Use Cases ── */}
      <section id="soluciones" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Casos de Uso por Industria
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              ROPA entiende <span className="text-emerald-400">tu industria</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              No es un agente genérico. ROPA adapta su estrategia, contenido y canales al contexto específico de cada industria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {INDUSTRIES.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div
                  key={i}
                  onClick={() => setActiveIndustry(i)}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 ${
                    activeIndustry === i
                      ? `${ind.bg} border-opacity-100`
                      : "bg-slate-900/50 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${ind.bg} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${ind.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">{ind.name}</h3>
                      <p className="text-slate-500 text-sm mb-3">
                        <span className="text-red-400">Problema:</span> {ind.problem}
                      </p>
                      {activeIndustry === i && (
                        <>
                          <p className="text-slate-300 text-sm mb-3 leading-relaxed">{ind.solution}</p>
                          <div className={`inline-flex items-center gap-2 text-sm font-bold ${ind.color}`}>
                            <TrendingUp className="w-4 h-4" />
                            {ind.metric}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">
            ROPA ejecuta en <span className="text-cyan-400">todos los canales</span>
          </h2>
          <p className="text-slate-400 mb-12">Un solo agente. Múltiples canales. Coordinación perfecta.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Mail, name: "Email", desc: "HTML profesional generado por IA, enviado desde tu dominio", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
              { icon: Phone, name: "Voice AI", desc: "Llamadas automáticas con script personalizado via Twilio", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { icon: Linkedin, name: "LinkedIn", desc: "Mensajes directos y posts programados automáticamente", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { icon: MessageSquare, name: "WhatsApp", desc: "Seguimiento conversacional via WhatsApp Business API", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" }
            ].map((ch, i) => {
              const Icon = ch.icon;
              return (
                <div key={i} className={`rounded-2xl p-6 border ${ch.bg} text-center`}>
                  <Icon className={`w-8 h-8 ${ch.color} mx-auto mb-3`} />
                  <h3 className="text-white font-bold mb-2">{ch.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{ch.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
                <div className="flex mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-base leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">{t.name}</div>
                    <div className="text-slate-500 text-sm">{t.role}</div>
                  </div>
                  <div className="text-emerald-400 text-xs font-medium text-right max-w-[140px]">{t.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precios" className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-pink-500/10 text-pink-400 border-pink-500/30">
              Precios transparentes
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Sin contratos. <span className="text-pink-400">Sin sorpresas.</span>
            </h2>
            <p className="text-slate-400 text-lg">14 días gratis en todos los planes. Cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 border ${plan.color} ${
                  plan.highlight
                    ? "bg-gradient-to-b from-cyan-950/60 to-violet-950/60 shadow-2xl shadow-cyan-500/10 scale-105"
                    : "bg-slate-900"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white border-0 px-4">
                      Más popular
                    </Badge>
                  </div>
                )}
                <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${plan.accent}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 mb-1">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.tagline}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setLocation("/ropa-v2")}
                  className={`w-full font-semibold py-3 rounded-xl ${
                    plan.highlight
                      ? "bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-950/60 to-violet-950/60 border border-cyan-500/20 rounded-3xl p-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              ROPA está listo para<br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                trabajar por tu empresa
              </span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Empieza hoy. Sin tarjeta de crédito. Sin consultores. ROPA genera tu primera campaña 
              de ventas en menos de 5 minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowDemo(true)}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold px-10 py-4 rounded-xl text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver demo gratis ahora
              </Button>
              <Button
                onClick={() => setLocation("/ropa-v2")}
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-white px-10 py-4 rounded-xl text-lg bg-transparent"
              >
                Ir al dashboard →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-bold">Ivy<span className="text-cyan-400">.AI</span></span>
              <span className="text-slate-600 text-sm ml-2">Powered by ROPA™ Super Meta-Agent</span>
            </div>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                SOC 2 (en proceso)
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                99.9% uptime
              </span>
            </div>
            <div className="text-slate-600 text-sm">© 2026 Ivy.AI. Todos los derechos reservados.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
