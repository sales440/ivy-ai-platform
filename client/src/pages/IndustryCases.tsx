import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ShoppingCart, Cpu, Stethoscope, GraduationCap,
  Wrench, TrendingUp, Mail, Phone, MessageCircle, Target,
  CheckCircle2, ArrowRight, Zap, BarChart3, Users, Bot
} from "lucide-react";

interface IndustryCase {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  headline: string;
  challenge: string;
  ropaApproach: string[];
  channels: string[];
  results: { metric: string; value: string; description: string }[];
  emailExample: string;
  callScriptExample: string;
}

const cases: IndustryCase[] = [
  {
    id: "b2b-saas",
    name: "B2B SaaS",
    icon: Cpu,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    headline: "ROPA convierte demos en contratos anuales",
    challenge: "Los ciclos de venta de SaaS son largos (30-90 días). Los SDRs se pierden en seguimientos manuales y los leads se enfrían.",
    ropaApproach: [
      "ROPA analiza el perfil de la empresa objetivo y genera secuencias de emails ultra-personalizados con casos de uso específicos de su industria",
      "Detecta cuando un lead abre 2+ emails sin responder y activa una llamada saliente automática con script generado por IA",
      "Integra con LinkedIn para enviar mensajes de conexión coordinados con la secuencia de email",
      "Genera reportes semanales de pipeline con probabilidad de cierre por lead"
    ],
    channels: ["Email (Outlook)", "LinkedIn", "Llamadas Twilio", "WhatsApp Business"],
    results: [
      { metric: "Tasa de respuesta", value: "+340%", description: "vs secuencias manuales" },
      { metric: "Tiempo a primera demo", value: "-60%", description: "de 14 días a 5.5 días" },
      { metric: "Leads calificados/mes", value: "47", description: "por campaña activa" }
    ],
    emailExample: "Asunto: [Empresa] + [Tu SaaS] = $X ahorrados en Q1\n\nHola [Nombre],\n\nVi que [Empresa] acaba de levantar una Serie A. Felicitaciones.\n\nEn ese momento, el 73% de los equipos de ventas como el tuyo empiezan a escalar SDRs — lo cual cuesta $8,000-12,000/mes por persona antes de que generen su primer deal.\n\nNuestros clientes en [industria similar] reemplazaron ese costo con [Tu SaaS] y cerraron 3x más deals en 60 días.\n\n¿15 minutos esta semana para mostrarte los números?",
    callScriptExample: "Buenos días [Nombre], soy [Tu nombre] de [Empresa]. Le escribí hace unos días sobre cómo [Empresa similar] aumentó su pipeline en 3x. ¿Tiene 2 minutos? Quiero compartirle un dato específico de su industria que creo le va a interesar."
  },
  {
    id: "ecommerce",
    name: "E-Commerce / Retail",
    icon: ShoppingCart,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    headline: "ROPA reactiva clientes dormidos y aumenta el LTV",
    challenge: "El 68% de los clientes de e-commerce compran solo una vez. La reactivación manual es ineficiente y los carritos abandonados se pierden.",
    ropaApproach: [
      "ROPA segmenta automáticamente la base de clientes por comportamiento de compra y genera campañas de reactivación personalizadas",
      "Detecta patrones de abandono de carrito y activa secuencias de recuperación en las primeras 2 horas",
      "Genera contenido de email con productos específicos basado en el historial de navegación",
      "Coordina campañas de SMS y email para fechas clave (Black Friday, Navidad, cumpleaños del cliente)"
    ],
    channels: ["Email (SendGrid)", "SMS (Twilio)", "WhatsApp", "Push Notifications"],
    results: [
      { metric: "Recuperación de carritos", value: "28%", description: "tasa de recuperación promedio" },
      { metric: "LTV incremento", value: "+85%", description: "en clientes reactivados" },
      { metric: "ROI de campaña", value: "12:1", description: "por cada $1 invertido" }
    ],
    emailExample: "Asunto: [Nombre], tu [Producto] todavía está aquí 🛒\n\nHola [Nombre],\n\nNotamos que dejaste [Producto] en tu carrito hace 2 horas.\n\nSabemos que las decisiones de compra toman tiempo. Por eso te reservamos tu unidad por las próximas 24 horas.\n\nAdemás, como cliente frecuente, tienes acceso a nuestro 10% de descuento exclusivo: ROPA10\n\n[Ver mi carrito →]",
    callScriptExample: "Hola [Nombre], le llamo de [Tienda]. Vimos que estuvo revisando [Producto] y quería asegurarme de que tuviera toda la información. ¿Tuvo alguna pregunta sobre el producto que pueda resolver?"
  },
  {
    id: "servicios-profesionales",
    name: "Servicios Profesionales",
    icon: Wrench,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    headline: "ROPA llena la agenda de consultores y agencias",
    challenge: "Los consultores y agencias dependen del boca a boca. Sin un sistema de prospección activo, el pipeline es impredecible.",
    ropaApproach: [
      "ROPA identifica empresas que están contratando para roles que tu servicio puede cubrir (señal de compra)",
      "Genera propuestas de valor ultra-específicas basadas en el problema que la empresa está intentando resolver",
      "Ejecuta seguimientos automáticos post-propuesta con contenido de valor (casos de estudio, ROI calculators)",
      "Programa recordatorios de seguimiento y genera scripts de llamada para cada etapa del pipeline"
    ],
    channels: ["Email (Outlook)", "LinkedIn", "Llamadas Twilio", "Propuestas PDF automáticas"],
    results: [
      { metric: "Propuestas enviadas/mes", value: "35+", description: "vs 8-10 manuales" },
      { metric: "Tasa de cierre", value: "22%", description: "vs 8% industria promedio" },
      { metric: "Tiempo de prospección", value: "-75%", description: "liberado para delivery" }
    ],
    emailExample: "Asunto: [Empresa] está contratando 3 [Rol] — hay una forma más eficiente\n\nHola [Nombre],\n\nVi que [Empresa] publicó 3 posiciones de [Rol] esta semana. Eso me dice que están escalando [Área].\n\nTrabajamos con [Empresa similar] cuando estaban en la misma situación. En lugar de contratar, implementamos un sistema que entregó los mismos resultados en 60 días a 40% del costo.\n\n¿Le interesa ver cómo lo hicimos?",
    callScriptExample: "Buenos días [Nombre], vi que [Empresa] está en proceso de expansión en [Área]. Trabajo con empresas en esa etapa y tengo un caso específico de [Empresa similar] que creo le va a resultar muy relevante. ¿Tiene 10 minutos?"
  },
  {
    id: "manufactura",
    name: "Manufactura / Industrial",
    icon: Building2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    headline: "ROPA abre puertas en empresas donde el email no llega",
    challenge: "En manufactura, los compradores no responden emails genéricos. Los ciclos de venta son de 6-18 meses y requieren múltiples stakeholders.",
    ropaApproach: [
      "ROPA mapea el organigrama de la empresa objetivo e identifica al decisor real (no solo el contacto inicial)",
      "Genera contenido técnico específico: ROI calculators, comparativas de eficiencia, casos de estudio del sector",
      "Coordina campañas paralelas a múltiples contactos de la misma empresa (multi-threading)",
      "Detecta señales de compra (visitas a página de precios, descargas de catálogos) y activa seguimiento inmediato"
    ],
    channels: ["Email técnico", "Llamadas directas", "LinkedIn B2B", "WhatsApp ejecutivo"],
    results: [
      { metric: "Reuniones agendadas", value: "+180%", description: "con decisores reales" },
      { metric: "Ciclo de venta", value: "-35%", description: "reducción promedio" },
      { metric: "Deal size promedio", value: "$85K", description: "por oportunidad cerrada" }
    ],
    emailExample: "Asunto: Reducción de 23% en tiempo de ciclo para [Proceso] en [Industria]\n\nEstimado [Nombre],\n\nEn [Empresa similar] implementamos [Solución] en su línea de [Proceso] y lograron reducir el tiempo de ciclo de 47 a 36 minutos — un ahorro de $340,000 anuales.\n\nSé que [Empresa] opera en condiciones similares. ¿Le interesa ver el caso completo con los números específicos?",
    callScriptExample: "Buenos días Ingeniero [Nombre], le llamo de [Empresa]. Trabajamos con [Cliente referencia] en su planta de [Ciudad] y logramos [Resultado específico]. Quería compartirle brevemente cómo lo hicimos porque creo que aplica directamente a [Empresa]."
  },
  {
    id: "salud",
    name: "Salud y Bienestar",
    icon: Stethoscope,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    headline: "ROPA llena consultorios y clínicas con pacientes calificados",
    challenge: "Las clínicas y consultorios dependen de referencias y Google Ads costosos. La retención de pacientes es baja y los recordatorios son manuales.",
    ropaApproach: [
      "ROPA genera campañas de reactivación para pacientes que no han visitado en 6+ meses",
      "Crea secuencias educativas de email que posicionan al médico como autoridad en su especialidad",
      "Automatiza recordatorios de citas y seguimientos post-consulta para mejorar adherencia",
      "Genera campañas de referidos con incentivos para pacientes actuales"
    ],
    channels: ["Email personalizado", "SMS recordatorios", "WhatsApp", "Llamadas de seguimiento"],
    results: [
      { metric: "Reactivación de pacientes", value: "31%", description: "de pacientes inactivos" },
      { metric: "No-shows reducidos", value: "-65%", description: "con recordatorios automáticos" },
      { metric: "Nuevos pacientes/mes", value: "+18", description: "via campañas de referidos" }
    ],
    emailExample: "Asunto: [Nombre], su chequeo anual está pendiente\n\nHola [Nombre],\n\nHan pasado 8 meses desde su última visita. En [Especialidad], recomendamos una revisión cada 6 meses para [Beneficio específico].\n\nTenemos disponibilidad esta semana. ¿Le agendamos?\n\n[Ver disponibilidad →]",
    callScriptExample: "Hola [Nombre], le llamo del consultorio del Dr. [Nombre]. Vimos que tiene pendiente su revisión de [Especialidad] y queríamos avisarle que tenemos un espacio disponible esta semana. ¿Le viene bien el jueves a las 10?"
  },
  {
    id: "educacion",
    name: "Educación y Capacitación",
    icon: GraduationCap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    headline: "ROPA convierte prospectos en estudiantes inscritos",
    challenge: "Las instituciones educativas tienen ventanas de inscripción cortas. Los prospectos comparan múltiples opciones y el seguimiento manual es insuficiente.",
    ropaApproach: [
      "ROPA detecta cuando un prospecto visita la página de inscripción y activa una secuencia de nurturing inmediata",
      "Genera comparativas personalizadas basadas en el perfil del prospecto (carrera, presupuesto, modalidad)",
      "Coordina seguimientos de consejeros académicos con contexto completo del prospecto",
      "Activa campañas de urgencia en los últimos 7 días antes del cierre de inscripciones"
    ],
    channels: ["Email nurturing", "WhatsApp", "Llamadas de consejeros", "SMS urgencia"],
    results: [
      { metric: "Tasa de inscripción", value: "+45%", description: "vs proceso manual" },
      { metric: "Tiempo de decisión", value: "-40%", description: "de 21 días a 12.5 días" },
      { metric: "Costo por inscripción", value: "-55%", description: "vs campañas de ads" }
    ],
    emailExample: "Asunto: [Nombre], tu lugar en [Programa] está reservado por 48 horas\n\nHola [Nombre],\n\nGracias por tu interés en [Programa]. Revisé tu perfil y creo que eres un candidato ideal para la generación de [Fecha].\n\nTenemos 3 lugares disponibles y quiero asegurarme de que uno sea tuyo. ¿Puedes confirmar tu inscripción antes del viernes?\n\nAdemás, como prospecto calificado, tienes acceso a nuestra beca de $[Monto].",
    callScriptExample: "Hola [Nombre], soy [Nombre] de [Institución]. Vi que revisaste el programa de [Curso] y quería responder cualquier pregunta que tengas. Muchos estudiantes en tu situación se preguntan sobre [Objeción común]. ¿Eso es algo que te preocupa?"
  }
];

export default function IndustryCases() {
  const [selectedCase, setSelectedCase] = useState<IndustryCase>(cases[0]);
  const [showEmailExample, setShowEmailExample] = useState(false);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      {/* Header */}
      <div className="border-b border-[#1e2d4a] bg-[#0f1629]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="text-cyan-400 font-bold text-xl cursor-pointer">Ivy.AI</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm">Casos de Uso por Industria</span>
          </div>
          <Link href="/ropa-v2">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Bot className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 mb-4">ROPA™ Framework</Badge>
          <h1 className="text-4xl font-bold text-white mb-4">
            ROPA genera ventas en <span className="text-cyan-400">cualquier industria</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            El mismo motor de IA que usa Lumio AI para proyectos de $50,000+, disponible para tu empresa desde el día 1.
            Sin consultores. Sin meses de implementación.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Industry Selector */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Selecciona tu industria</p>
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCase(c); setShowEmailExample(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedCase.id === c.id
                    ? `${c.bgColor} ${c.borderColor}`
                    : 'bg-[#0f1629] border-[#1e2d4a] hover:bg-[#1a2540]'
                }`}
              >
                <c.icon className={`w-4 h-4 flex-shrink-0 ${selectedCase.id === c.id ? c.color : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${selectedCase.id === c.id ? 'text-white' : 'text-gray-400'}`}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          {/* Case Detail */}
          <div className="lg:col-span-3 space-y-6">
            {/* Headline */}
            <Card className={`${selectedCase.bgColor} ${selectedCase.borderColor} border`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${selectedCase.bgColor} border ${selectedCase.borderColor}`}>
                    <selectedCase.icon className={`w-6 h-6 ${selectedCase.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedCase.name}</h2>
                    <p className={`text-lg font-medium ${selectedCase.color}`}>{selectedCase.headline}</p>
                    <p className="text-gray-400 text-sm mt-2">{selectedCase.challenge}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="grid grid-cols-3 gap-4">
              {selectedCase.results.map((r, i) => (
                <Card key={i} className="bg-[#0f1629] border-[#1e2d4a]">
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${selectedCase.color}`}>{r.value}</p>
                    <p className="text-white text-sm font-medium mt-1">{r.metric}</p>
                    <p className="text-gray-500 text-xs mt-1">{r.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ROPA Approach */}
            <Card className="bg-[#0f1629] border-[#1e2d4a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Cómo ROPA trabaja en {selectedCase.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCase.ropaApproach.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${selectedCase.bgColor} border ${selectedCase.borderColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`text-xs font-bold ${selectedCase.color}`}>{i + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className="bg-[#0f1629] border-[#1e2d4a]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Canales que ROPA orquesta simultáneamente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.channels.map((channel, i) => (
                    <Badge key={i} variant="outline" className={`${selectedCase.borderColor} ${selectedCase.color} text-sm`}>
                      {channel}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Example */}
            <Card className="bg-[#0f1629] border-[#1e2d4a]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4 text-blue-400" />
                    Ejemplo de email generado por ROPA
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEmailExample(!showEmailExample)}
                    className="border-[#2a3a5c] text-gray-400 hover:text-white text-xs"
                  >
                    {showEmailExample ? 'Ocultar' : 'Ver ejemplo'}
                  </Button>
                </div>
              </CardHeader>
              {showEmailExample && (
                <CardContent>
                  <div className="bg-[#1a2540] rounded-lg p-4 border border-[#2a3a5c]">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedCase.emailExample}
                    </pre>
                  </div>
                  <div className="mt-4 p-3 bg-[#1a2540] rounded-lg border border-[#2a3a5c]">
                    <p className="text-xs text-green-400 font-medium mb-2">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Script de llamada de seguimiento:
                    </p>
                    <p className="text-xs text-gray-300 italic">{selectedCase.callScriptExample}</p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* CTA */}
            <div className={`p-6 rounded-xl border ${selectedCase.bgColor} ${selectedCase.borderColor} text-center`}>
              <h3 className="text-white font-bold text-lg mb-2">
                ¿Listo para que ROPA trabaje en {selectedCase.name}?
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Crea tu primera campaña en menos de 5 minutos. Sin configuración técnica.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/ropa-v2">
                  <Button className={`bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white`}>
                    <Zap className="w-4 h-4 mr-2" />
                    Empezar con ROPA
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-[#2a3a5c] text-gray-300 hover:bg-[#1a2540]">
                    Ver Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
