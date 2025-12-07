/**
 * Email Nurturing Sequences for Marketing Leads
 * Automated email campaigns based on lead stage and score
 */

export interface EmailTemplate {
  subject: string;
  body: string;
  delayDays: number;
}

/**
 * Awareness Stage Sequence (Lead Score <40)
 * Goal: Educate about costs of SDRs and introduce IA as solution
 */
export const awarenessSequence: EmailTemplate[] = [
  {
    subject: "Tu Whitepaper: El Costo Oculto de la Fuerza de Ventas Humana",
    delayDays: 0,
    body: `Hola {{name}},

Gracias por descargar nuestro whitepaper sobre el costo real de los equipos de SDRs.

Aquí está tu copia: {{whitepaper_url}}

**3 Insights Clave que Descubrirás:**

1. **El costo real de un SDR es 2-3x el salario base** - La mayoría de empresas subestiman dramáticamente el TCO (Total Cost of Ownership) de sus equipos de ventas.

2. **La rotación del 35-40% anual cuesta $25K-$35K por posición** - Y este costo se repite cada 2.5-3 años para cada SDR.

3. **Los agentes de IA pueden reducir estos costos en 80-85%** - Con mejor consistencia y escalabilidad que equipos humanos.

¿Curioso sobre cuánto podrías ahorrar específicamente?

Usa nuestra calculadora gratuita: {{calculator_url}}

Saludos,
{{sender_name}}
Ivy.AI Platform

P.D. Si tienes preguntas sobre el whitepaper, simplemente responde este email.`,
  },
  {
    subject: "¿Leíste el whitepaper? Aquí está lo que otros están haciendo",
    delayDays: 7,
    body: `Hola {{name}},

Hace una semana te envié nuestro whitepaper sobre costos de SDRs.

Quería compartirte lo que otras empresas están haciendo después de leerlo:

**Caso de Estudio: TechCorp (Serie B)**
- Situación inicial: 8 SDRs, $1.1M costo anual, 45% rotación
- Implementación: 6 agentes de IA + 2 SDRs senior
- Resultado: $762K ahorrado en año 1, 60% más pipeline

**Caso de Estudio: GrowthCo (Mid-Market)**
- Situación inicial: 15 SDRs, $1.9M costo anual, 38% rotación
- Implementación: 12 agentes de IA + 3 SDRs senior
- Resultado: $1.2M ahorrado en año 1, 45% más reuniones agendadas

¿Qué tienen en común estas empresas?

Todas empezaron calculando su ahorro potencial específico.

**Calcula tu ahorro en 2 minutos:** {{calculator_url}}

Saludos,
{{sender_name}}
Ivy.AI Platform`,
  },
  {
    subject: "La rotación de SDRs te está costando más de lo que piensas",
    delayDays: 14,
    body: `Hola {{name}},

Déjame compartirte una estadística que sorprende a la mayoría de líderes de ventas:

**El costo real de reemplazar un SDR es $25,000-$35,000.**

Esto incluye:
- Reclutamiento: $8,000
- Onboarding: $5,000
- Rampa perdida: $12,000
- Conocimiento perdido: $10,000+

Con una rotación promedio del 35-40% anual, si tienes 10 SDRs, estás gastando **$87,500-$140,000 anuales** solo en mantener el headcount constante.

**Y esto es ANTES de considerar:**
- Salarios y beneficios
- Infraestructura (CRM, herramientas, espacio)
- Management overhead

¿Qué pasaría si pudieras eliminar completamente este costo?

Los agentes de IA no renuncian. No necesitan onboarding. No tienen rampa.

**Descubre tu ahorro específico:** {{calculator_url}}

O si prefieres una conversación directa, agenda una demo personalizada: {{demo_url}}

Saludos,
{{sender_name}}
Ivy.AI Platform`,
  },
];

/**
 * Consideration Stage Sequence (Lead Score 40-69)
 * Goal: Show ROI proof and guide toward demo
 */
export const considerationSequence: EmailTemplate[] = [
  {
    subject: "{{name}}, vi que calculaste tu ahorro potencial",
    delayDays: 0,
    body: `Hola {{name}},

Vi que usaste nuestra calculadora de ROI y descubriste que podrías ahorrar aproximadamente **{{estimated_savings}}** anuales.

Eso es significativo.

Pero entiendo que ver números en una calculadora es diferente a ver cómo funciona en la realidad.

**Déjame mostrarte cómo 3 empresas lograron estos ahorros:**

**1. TechCorp (SaaS, Serie B):**
- Ahorro proyectado: $762K
- Ahorro real año 1: $762K (100% del objetivo)
- Bonus inesperado: 60% más pipeline

**2. GrowthCo (Professional Services):**
- Ahorro proyectado: $1.2M
- Ahorro real año 1: $1.1M (92% del objetivo)
- Bonus inesperado: Escalaron de 50 a 150 prospectos/día sin contratar

**3. ScaleCo (E-commerce B2B):**
- Ahorro proyectado: $340K
- Ahorro real año 1: $378K (111% del objetivo)
- Bonus inesperado: Consistencia del 100% en calidad de llamadas

¿Notas el patrón? **Todos alcanzaron o superaron sus proyecciones.**

¿Quieres ver cómo se vería esto específicamente para {{company}}?

**Agenda una demo personalizada (45 minutos):** {{demo_url}}

En la demo te mostraré:
✓ Análisis detallado de tu TCO actual
✓ Agentes de IA en acción (llamadas reales, emails, secuencias)
✓ Plan de implementación específico para tu equipo
✓ Proyecciones de ROI personalizadas

Saludos,
{{sender_name}}
Ivy.AI Platform

P.D. Las demos se llenan rápido. Agenda en las próximas 48h para asegurar un slot esta semana.`,
  },
  {
    subject: "Cómo implementar agentes de IA sin despedir a tu equipo",
    delayDays: 5,
    body: `Hola {{name}},

La pregunta #1 que recibo después de que alguien ve los números:

**"¿Tengo que despedir a mi equipo de SDRs?"**

La respuesta corta: **No.**

La respuesta larga: Hay un camino mucho mejor.

**El Modelo Híbrido (Lo que recomendamos):**

**Fase 1 (Mes 1-2): Piloto Paralelo**
- Mantén tu equipo actual intacto
- Agrega 2-3 agentes de IA trabajando en paralelo
- Compara resultados lado a lado
- Costo: Mínimo, sin riesgo

**Fase 2 (Mes 3-4): Optimización**
- Identifica qué tareas los agentes hacen mejor (prospección inicial, seguimiento, cualificación)
- Identifica qué tareas los humanos hacen mejor (cierre de deals complejos, relaciones estratégicas)
- Redistribuye responsabilidades

**Fase 3 (Mes 5-6): Escala**
- Promociona tus mejores SDRs a roles senior (Account Executives, Team Leads)
- Reemplaza posiciones junior con agentes de IA
- Resultado: Equipo más fuerte, costos menores, mejor moral

**Fase 4 (Mes 7+): Transformación**
- Attrition natural maneja la transición
- No despidos, solo no reemplazos
- En 12-18 meses, tienes el equipo óptimo

**Caso Real: TechCorp**
- Empezaron con 8 SDRs
- Hoy tienen 2 SDRs senior + 6 agentes de IA
- Los 2 SDRs senior ganan 40% más que antes
- Moral del equipo mejoró (menos trabajo repetitivo)
- Pipeline creció 60%

¿Quieres ver el roadmap específico para {{company}}?

**Agenda demo:** {{demo_url}}

Saludos,
{{sender_name}}
Ivy.AI Platform`,
  },
  {
    subject: "Última oportunidad: Demo personalizada de Ivy.AI",
    delayDays: 10,
    body: `Hola {{name}},

He intentado contactarte un par de veces sobre Ivy.AI.

Entiendo que estás ocupado, así que seré breve:

**Si tu empresa tiene desafíos con:**
- Costos crecientes de SDRs
- Rotación alta (30%+)
- Dificultad para escalar prospección
- Inconsistencia en calidad de llamadas

**Entonces deberías ver esta demo.**

**Lo que verás en 45 minutos:**
1. Tu ahorro específico (basado en tu equipo actual)
2. Agentes de IA en acción (llamadas reales, no demos fake)
3. Plan de implementación sin riesgo (piloto de 30 días)

**Lo que NO verás:**
- Presión de ventas
- Pitch genérico
- Promesas exageradas

Solo datos, casos reales, y una propuesta honesta.

**Agenda aquí:** {{demo_url}}

O si prefieres, responde este email con tu disponibilidad y yo coordino.

Saludos,
{{sender_name}}
Ivy.AI Platform

P.D. Si no estás interesado, responde "No gracias" y no te contactaré más. Sin resentimientos.`,
  },
];

/**
 * Decision Stage Sequence (Lead Score 70+)
 * Goal: Close the deal with urgency and social proof
 */
export const decisionSequence: EmailTemplate[] = [
  {
    subject: "{{name}}, recibimos tu solicitud de demo",
    delayDays: 0,
    body: `Hola {{name}},

Gracias por solicitar una demo de Ivy.AI.

Nuestro equipo revisará tu información y te contactará en las próximas **24 horas** para coordinar.

Mientras tanto, aquí hay algunos recursos que te pueden interesar:

**📊 Casos de Estudio Relevantes:**
- TechCorp (SaaS, Serie B): Ahorró $762K en año 1
- GrowthCo (Professional Services): Ahorró $1.2M en año 1
- ScaleCo (E-commerce B2B): Ahorró $378K en año 1

**📖 Guía de Implementación:**
Cómo hacer la transición de SDRs humanos a agentes de IA en 4 fases (sin despidos)

**🎥 Video: Agentes de IA en Acción**
Ve llamadas reales de prospección manejadas por nuestros agentes

**¿Preguntas urgentes?**

Llámanos directamente: +1 (234) 567-890
O responde este email

Nos vemos pronto,
{{sender_name}}
Ivy.AI Platform

P.D. Prepara estas preguntas para la demo:
1. ¿Cuál es tu mayor desafío con prospección actual?
2. ¿Qué métricas usas para medir éxito de SDRs?
3. ¿Cuál es tu timeline ideal de implementación?`,
  },
  {
    subject: "Confirmación: Demo de Ivy.AI el {{demo_date}}",
    delayDays: 2,
    body: `Hola {{name}},

Confirmando nuestra demo personalizada:

**📅 Fecha:** {{demo_date}}
**⏰ Hora:** {{demo_time}}
**🔗 Link:** {{demo_link}}
**⏱️ Duración:** 45 minutos

**Agenda de la Demo:**

**Parte 1 (10 min): Tu Situación Actual**
- Revisaremos tu equipo actual de SDRs
- Calcularemos tu TCO real
- Identificaremos áreas de optimización

**Parte 2 (20 min): Agentes de IA en Acción**
- Verás llamadas reales de prospección
- Verás secuencias de email automatizadas
- Verás dashboard de analytics en tiempo real

**Parte 3 (10 min): Tu Plan de Implementación**
- Diseñaremos roadmap específico para {{company}}
- Proyectaremos tu ROI personalizado
- Discutiremos piloto sin riesgo de 30 días

**Parte 4 (5 min): Q&A Abierto**
- Todas tus preguntas respondidas

**Para maximizar el valor de la demo, trae:**
- Datos de tu equipo actual (# SDRs, costos, métricas)
- Stakeholders clave (VP Sales, CFO, etc.)
- Preguntas específicas sobre tu situación

**Nos vemos el {{demo_date}}!**

{{sender_name}}
Ivy.AI Platform

P.D. Si necesitas reagendar, responde este email o llama al +1 (234) 567-890`,
  },
];

/**
 * Helper function to replace template variables
 */
export function renderEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return rendered;
}

/**
 * Get appropriate sequence based on lead stage
 */
export function getSequenceForStage(
  stage: "awareness" | "consideration" | "decision"
): EmailTemplate[] {
  switch (stage) {
    case "awareness":
      return awarenessSequence;
    case "consideration":
      return considerationSequence;
    case "decision":
      return decisionSequence;
    default:
      return awarenessSequence;
  }
}
