# Especificaciones Técnicas: Landing Page Pública de Ivy.AI

**Documento para**: Desarrollador Frontend Externo  
**Proyecto**: Ivy.AI Platform - Landing Page de Marketing  
**Versión**: 1.0  
**Fecha**: 16 de Noviembre, 2025

---

## 1. Objetivo del Proyecto

Desarrollar una landing page pública y profesional para la plataforma Ivy.AI que sirva como punto de entrada para clientes potenciales. La página debe comunicar claramente la propuesta de valor, mostrar casos de uso, capturar leads y dirigir tráfico hacia demos y contacto comercial.

**Resultado esperado**: Una página web responsive, optimizada para conversión, que genere al menos 100 leads calificados mensuales en los primeros 3 meses de lanzamiento.

---

## 2. Stack Tecnológico Requerido

La landing page debe integrarse con el proyecto existente de Ivy.AI, que utiliza el siguiente stack:

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Framework frontend |
| TypeScript | 5.x | Lenguaje de programación |
| Tailwind CSS | 4.x | Framework de estilos |
| Vite | 6.x | Build tool |
| tRPC | 11.x | API type-safe para backend |
| Wouter | 3.x | Router de navegación |

**Importante**: La landing page debe crearse como una nueva ruta (`/`) en el proyecto existente, NO como un sitio separado. Esto permite compartir componentes, estilos y autenticación con el dashboard principal.

---

## 3. Estructura de Archivos

Crear los siguientes archivos en el proyecto existente:

```
client/src/pages/
  └── Landing.tsx              # Componente principal de la landing page

client/src/components/landing/
  ├── Hero.tsx                 # Sección hero con CTA principal
  ├── Features.tsx             # Sección de características/beneficios
  ├── UseCases.tsx             # Casos de uso por industria
  ├── Pricing.tsx              # Tabla de precios
  ├── Testimonials.tsx         # Testimonios de clientes
  ├── FAQ.tsx                  # Preguntas frecuentes
  ├── CTASection.tsx           # Call-to-action final
  └── LeadCaptureForm.tsx      # Formulario de captura de leads

server/
  └── lead-router.ts           # Router tRPC para manejar leads
```

**Modificaciones necesarias**:
- Actualizar `client/src/App.tsx` para agregar ruta `/` que renderice `<Landing />`
- Actualizar `server/routers.ts` para importar y registrar `leadRouter`

---

## 4. Diseño Visual y UX

### 4.1 Paleta de Colores

Mantener consistencia con el dashboard existente (tema oscuro profesional):

| Color | Hex | Uso |
|-------|-----|-----|
| Background | `#0a0a0a` | Fondo principal |
| Card Background | `#1a1a1a` | Tarjetas y secciones |
| Primary (Púrpura) | `#8b5cf6` | Botones CTA, acentos |
| Text Primary | `#ffffff` | Títulos y texto principal |
| Text Secondary | `#a1a1aa` | Texto secundario |
| Border | `#27272a` | Bordes y divisores |

### 4.2 Tipografía

- **Fuente principal**: Inter (ya incluida en el proyecto)
- **Títulos H1**: 48px-64px, font-weight: 700
- **Títulos H2**: 36px-48px, font-weight: 600
- **Títulos H3**: 24px-32px, font-weight: 600
- **Párrafos**: 16px-18px, font-weight: 400, line-height: 1.6

### 4.3 Layout Responsive

La página debe ser completamente responsive con breakpoints de Tailwind:

- **Mobile**: < 640px (1 columna)
- **Tablet**: 640px - 1024px (2 columnas)
- **Desktop**: > 1024px (3-4 columnas en grid)

---

## 5. Secciones de la Landing Page

### 5.1 Hero Section

**Objetivo**: Capturar atención en los primeros 3 segundos y comunicar propuesta de valor.

**Elementos requeridos**:
- Título principal (H1): "Automatiza tu Equipo de Ventas con Agentes de IA"
- Subtítulo: Explicación breve (1-2 líneas) de qué hace Ivy.AI
- Dos CTAs principales:
  - Botón primario: "Solicitar Demo Gratuita" (abre formulario modal)
  - Botón secundario: "Ver Video Demo" (scroll a sección de video)
- Imagen/animación: Dashboard de Ivy.AI con agentes activos (screenshot o video loop)
- Badges de confianza: "Usado por 50+ empresas" "4.9/5 estrellas" "SOC 2 Certificado"

**Código de ejemplo** (Hero.tsx):

```typescript
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-card">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Text content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm text-primary">6 Agentes de IA Activos</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Automatiza tu Equipo de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                Ventas con IA
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl">
              Ivy.AI orquesta agentes inteligentes que califican leads, responden tickets 
              y cierran ventas 24/7. Aumenta tu conversión en 300% mientras reduces costos operativos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="group">
                Solicitar Demo Gratuita
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="group">
                <Play className="mr-2 h-4 w-4" />
                Ver Video Demo
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div className="text-sm">
                <div className="font-semibold text-foreground">50+ Empresas</div>
                <div className="text-muted-foreground">Confían en Ivy.AI</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">4.9/5 ⭐</div>
                <div className="text-muted-foreground">Rating promedio</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">SOC 2</div>
                <div className="text-muted-foreground">Certificado</div>
              </div>
            </div>
          </div>

          {/* Right column: Dashboard preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl" />
            <img 
              src="/dashboard-preview.png" 
              alt="Ivy.AI Dashboard" 
              className="relative rounded-lg shadow-2xl border border-border"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 5.2 Features Section

**Objetivo**: Explicar las 3-4 características principales que diferencian a Ivy.AI.

**Características a destacar**:
1. **Orquestación Multi-Agente**: 6 agentes especializados trabajando en equipo
2. **Integración Nativa**: Conecta con CRM, email, Slack en minutos
3. **Analytics en Tiempo Real**: Dashboard con KPIs y métricas de rendimiento
4. **Aprendizaje Continuo**: Los agentes mejoran con cada interacción

**Diseño visual**: Grid de 2x2 (desktop) o 1 columna (mobile), cada feature con icono, título, descripción y link "Saber más →"

### 5.3 Use Cases Section

**Objetivo**: Mostrar aplicaciones concretas por industria.

**Casos de uso a incluir**:

| Industria | Título | Descripción | Agente Principal |
|-----------|--------|-------------|------------------|
| SaaS | Calificación de Leads Automática | Ivy-Prospect analiza cada lead y prioriza los más valiosos | Ivy-Prospect |
| E-commerce | Soporte al Cliente 24/7 | Ivy-Solve responde preguntas y resuelve tickets instantáneamente | Ivy-Solve |
| Servicios Profesionales | Seguimiento de Propuestas | Ivy-Closer envía follow-ups personalizados y cierra deals | Ivy-Closer |
| Agencias | Optimización de Campañas | Ivy-Insight analiza datos y recomienda mejoras | Ivy-Insight |

**Diseño visual**: Tabs horizontales (desktop) o accordion (mobile), cada tab muestra screenshot del agente en acción + métricas de impacto.

### 5.4 Pricing Section

**Objetivo**: Mostrar opciones de pricing claras y fomentar conversión.

**Planes a mostrar** (basados en la guía de ventas):

```typescript
const pricingPlans = [
  {
    name: "Starter",
    price: "$497",
    period: "/mes",
    description: "Perfecto para equipos pequeños que inician con automatización",
    features: [
      "2 agentes activos",
      "500 interacciones/mes",
      "Integraciones básicas (Email, CRM)",
      "Soporte por email",
      "Dashboard de analytics",
      "Reportes semanales"
    ],
    cta: "Comenzar Prueba Gratuita",
    highlighted: false
  },
  {
    name: "Professional",
    price: "$1,497",
    period: "/mes",
    description: "Para empresas que buscan automatización completa",
    features: [
      "6 agentes activos (todos los departamentos)",
      "2,000 interacciones/mes",
      "Todas las integraciones",
      "Soporte prioritario (< 2h respuesta)",
      "Workflows personalizados",
      "API access",
      "Reportes diarios + insights de IA"
    ],
    cta: "Solicitar Demo",
    highlighted: true // Plan recomendado
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Solución white-label para grandes organizaciones",
    features: [
      "Agentes ilimitados",
      "Interacciones ilimitadas",
      "White-label completo",
      "Dominio personalizado",
      "Account manager dedicado",
      "SLA 99.9% uptime",
      "Onboarding personalizado",
      "Soporte 24/7"
    ],
    cta: "Contactar Ventas",
    highlighted: false
  }
];
```

**Diseño visual**: 3 columnas (desktop) con el plan "Professional" destacado visualmente (borde púrpura, badge "Más Popular"). Incluir toggle "Mensual / Anual" que muestre descuento del 20% en plan anual.

### 5.5 Testimonials Section

**Objetivo**: Generar confianza social con testimonios de clientes reales.

**Nota**: Esta sección se desarrollará en detalle en el documento "dev-specs-testimonials.md". Por ahora, dejar un placeholder con 3 testimonios ficticios que el cliente reemplazará con testimonios reales.

**Diseño visual**: Carrusel horizontal con 3 testimonios visibles (desktop) o 1 (mobile). Cada testimonial incluye:
- Foto del cliente
- Nombre y cargo
- Empresa y logo
- Quote (2-3 líneas)
- Rating de estrellas

### 5.6 FAQ Section

**Objetivo**: Responder objeciones comunes y reducir fricción en el proceso de compra.

**Preguntas frecuentes a incluir**:

1. **¿Cuánto tiempo toma implementar Ivy.AI?**
   - Respuesta: "La mayoría de nuestros clientes están operativos en menos de 48 horas. Nuestro equipo de onboarding te guía paso a paso en la configuración de agentes, integración con tus sistemas existentes y entrenamiento inicial. No requieres conocimientos técnicos."

2. **¿Los agentes reemplazan a mi equipo humano?**
   - Respuesta: "No, los agentes de Ivy.AI complementan a tu equipo. Se encargan de tareas repetitivas (calificación de leads, respuestas a preguntas frecuentes, seguimiento automatizado) para que tu equipo se enfoque en cerrar deals de alto valor y construir relaciones con clientes clave."

3. **¿Qué integraciones soportan?**
   - Respuesta: "Ivy.AI se integra nativamente con Salesforce, HubSpot, Pipedrive, Gmail, Outlook, Slack, Intercom, Zendesk y más de 50 plataformas. También ofrecemos API REST para integraciones personalizadas."

4. **¿Cómo garantizan la seguridad de nuestros datos?**
   - Respuesta: "Cumplimos con SOC 2 Type II, GDPR y CCPA. Todos los datos se encriptan en tránsito (TLS 1.3) y en reposo (AES-256). Realizamos auditorías de seguridad trimestrales y ofrecemos SSO enterprise."

5. **¿Puedo cancelar en cualquier momento?**
   - Respuesta: "Sí, no hay contratos de permanencia. Puedes cancelar tu suscripción en cualquier momento desde el dashboard. Ofrecemos reembolso completo si cancelas en los primeros 14 días."

6. **¿Qué tipo de soporte ofrecen?**
   - Respuesta: "Planes Starter incluyen soporte por email (respuesta en 24h). Planes Professional tienen soporte prioritario (respuesta en 2h) vía email y chat. Planes Enterprise incluyen account manager dedicado y soporte 24/7 por teléfono."

**Diseño visual**: Accordion expandible, solo una pregunta abierta a la vez. Incluir botón al final "¿Más preguntas? Habla con un experto →"

### 5.7 CTA Final Section

**Objetivo**: Última oportunidad de conversión antes del footer.

**Elementos**:
- Título: "¿Listo para automatizar tu equipo de ventas?"
- Subtítulo: "Únete a 50+ empresas que ya aumentaron su conversión con Ivy.AI"
- CTA primario: "Solicitar Demo Gratuita"
- CTA secundario: "Hablar con Ventas"
- Background: Gradient púrpura con efecto de partículas animadas

---

## 6. Formulario de Captura de Leads

### 6.1 Campos del Formulario

El formulario modal debe capturar la siguiente información:

```typescript
interface LeadFormData {
  // Información personal
  fullName: string;           // Nombre completo (requerido)
  email: string;              // Email corporativo (requerido)
  phone: string;              // Teléfono (opcional)
  
  // Información de empresa
  companyName: string;        // Nombre de empresa (requerido)
  companySize: string;        // Tamaño: "1-10" | "11-50" | "51-200" | "201-500" | "500+" (requerido)
  industry: string;           // Industria: "SaaS" | "E-commerce" | "Servicios" | "Otro" (requerido)
  
  // Información de interés
  interestedAgents: string[]; // Agentes de interés (checkbox múltiple, opcional)
  monthlyLeads: string;       // Leads mensuales: "<100" | "100-500" | "500-1000" | "1000+" (requerido)
  currentCRM: string;         // CRM actual: "Salesforce" | "HubSpot" | "Pipedrive" | "Otro" | "Ninguno" (opcional)
  
  // Metadata
  source: string;             // Fuente de tráfico (UTM o referrer, auto-capturado)
  message: string;            // Mensaje adicional (opcional, textarea)
}
```

### 6.2 Validaciones

Implementar validaciones en frontend (React Hook Form + Zod) y backend (tRPC):

```typescript
import { z } from "zod";

export const leadFormSchema = z.object({
  fullName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").refine(
    (email) => !email.endsWith("@gmail.com") && !email.endsWith("@yahoo.com"),
    "Por favor usa tu email corporativo"
  ),
  phone: z.string().optional(),
  companyName: z.string().min(2, "Nombre de empresa requerido"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
  industry: z.enum(["SaaS", "E-commerce", "Servicios", "Otro"]),
  interestedAgents: z.array(z.string()).optional(),
  monthlyLeads: z.enum(["<100", "100-500", "500-1000", "1000+"]),
  currentCRM: z.string().optional(),
  source: z.string().optional(),
  message: z.string().max(500).optional()
});
```

### 6.3 Backend: Lead Router

Crear un nuevo router tRPC para manejar leads:

```typescript
// server/lead-router.ts
import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { leads, InsertLead } from "../drizzle/schema";
import { getDb } from "./db";

const leadFormSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  companyName: z.string().min(2),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
  industry: z.enum(["SaaS", "E-commerce", "Servicios", "Otro"]),
  interestedAgents: z.array(z.string()).optional(),
  monthlyLeads: z.enum(["<100", "100-500", "500-1000", "1000+"]),
  currentCRM: z.string().optional(),
  source: z.string().optional(),
  message: z.string().max(500).optional()
});

export const leadRouter = router({
  submit: publicProcedure
    .input(leadFormSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Insert lead into database
      const leadData: InsertLead = {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        companyName: input.companyName,
        companySize: input.companySize,
        industry: input.industry,
        interestedAgents: input.interestedAgents?.join(",") || null,
        monthlyLeads: input.monthlyLeads,
        currentCRM: input.currentCRM || null,
        source: input.source || "direct",
        message: input.message || null,
        status: "new",
        createdAt: new Date()
      };

      await db.insert(leads).values(leadData);

      // TODO: Send notification to sales team
      // TODO: Send confirmation email to lead
      // TODO: Add to CRM via API

      return {
        success: true,
        message: "¡Gracias! Nos pondremos en contacto pronto."
      };
    })
});
```

### 6.4 Schema de Base de Datos

Agregar tabla `leads` en `drizzle/schema.ts`:

```typescript
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companySize: mysqlEnum("companySize", ["1-10", "11-50", "51-200", "201-500", "500+"]).notNull(),
  industry: mysqlEnum("industry", ["SaaS", "E-commerce", "Servicios", "Otro"]).notNull(),
  interestedAgents: text("interestedAgents"), // Comma-separated
  monthlyLeads: mysqlEnum("monthlyLeads", ["<100", "100-500", "500-1000", "1000+"]).notNull(),
  currentCRM: varchar("currentCRM", { length: 100 }),
  source: varchar("source", { length: 255 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "demo_scheduled", "closed_won", "closed_lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
```

Después de agregar el schema, ejecutar:
```bash
pnpm db:push
```

---

## 7. Optimización SEO

### 7.1 Meta Tags

Agregar en `client/index.html`:

```html
<head>
  <title>Ivy.AI - Automatiza tu Equipo de Ventas con Agentes de IA</title>
  <meta name="description" content="Plataforma de orquestación de agentes de IA para ventas. Califica leads, responde tickets y cierra deals 24/7. Aumenta tu conversión en 300%.">
  <meta name="keywords" content="agentes de IA, automatización de ventas, CRM inteligente, lead scoring, chatbot ventas">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Ivy.AI - Automatiza tu Equipo de Ventas con IA">
  <meta property="og:description" content="6 agentes de IA especializados que califican leads, responden tickets y cierran ventas automáticamente.">
  <meta property="og:image" content="https://ivy-ai-platform.manus.space/og-image.png">
  <meta property="og:url" content="https://ivy-ai-platform.manus.space">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Ivy.AI - Automatiza tu Equipo de Ventas con IA">
  <meta name="twitter:description" content="Aumenta tu conversión en 300% con agentes de IA especializados.">
  <meta name="twitter:image" content="https://ivy-ai-platform.manus.space/twitter-card.png">
</head>
```

### 7.2 Structured Data (JSON-LD)

Agregar en el componente `Landing.tsx`:

```typescript
export function Landing() {
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Ivy.AI",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": "497",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "50"
          }
        })}
      </script>
      
      {/* Rest of landing page */}
    </>
  );
}
```

---

## 8. Optimización de Conversión (CRO)

### 8.1 A/B Testing

Implementar variantes para testear:

**Variante A**: CTA "Solicitar Demo Gratuita"  
**Variante B**: CTA "Ver Ivy.AI en Acción"

Usar Google Optimize o similar para trackear conversiones.

### 8.2 Analytics

Integrar Google Analytics 4 y eventos personalizados:

```typescript
// Track CTA clicks
const handleCTAClick = () => {
  window.gtag?.('event', 'cta_click', {
    event_category: 'engagement',
    event_label: 'hero_primary_cta',
    value: 1
  });
  
  // Open form modal
  setShowLeadForm(true);
};

// Track form submission
const handleFormSubmit = async (data: LeadFormData) => {
  window.gtag?.('event', 'lead_submitted', {
    event_category: 'conversion',
    event_label: data.industry,
    value: 1
  });
  
  await trpc.lead.submit.mutate(data);
};

// Track scroll depth
useEffect(() => {
  const handleScroll = () => {
    const scrollPercent = (window.scrollY / document.body.scrollHeight) * 100;
    
    if (scrollPercent > 75) {
      window.gtag?.('event', 'scroll_depth', {
        event_category: 'engagement',
        event_label: '75_percent',
        value: 75
      });
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 8.3 Performance

**Objetivos de rendimiento**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Optimizaciones requeridas**:
- Lazy loading de imágenes (`loading="lazy"`)
- Code splitting por ruta (ya incluido en Vite)
- Comprimir imágenes (WebP format, max 200KB)
- Preload de fuentes críticas
- Minificación de CSS/JS (automático en build)

---

## 9. Checklist de Entrega

Antes de entregar el código, verificar:

- [ ] Todas las secciones (Hero, Features, Use Cases, Pricing, FAQ, CTA) están implementadas
- [ ] Formulario de captura de leads funciona y guarda en base de datos
- [ ] Diseño es 100% responsive (mobile, tablet, desktop)
- [ ] Paleta de colores y tipografía coinciden con el dashboard
- [ ] Meta tags SEO están configurados correctamente
- [ ] Analytics events están implementados
- [ ] Performance score > 90 en Lighthouse
- [ ] No hay errores de TypeScript (`pnpm tsc --noEmit`)
- [ ] No hay errores de ESLint (`pnpm lint`)
- [ ] Código está documentado con comentarios
- [ ] README actualizado con instrucciones de deployment

---

## 10. Recursos Adicionales

**Assets necesarios** (solicitar al cliente):
- Logo de Ivy.AI en alta resolución (SVG preferido)
- Screenshot del dashboard para sección Hero
- Screenshots de cada agente para sección Use Cases
- Logos de clientes para sección de trust badges
- Foto OG image (1200x630px) para redes sociales

**Librerías recomendadas**:
- `framer-motion`: Animaciones suaves (ya incluido en shadcn/ui)
- `react-hook-form`: Manejo de formularios
- `zod`: Validación de schemas
- `lucide-react`: Iconos (ya incluido)

**Documentación de referencia**:
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [tRPC Docs](https://trpc.io/docs)
- [React Hook Form](https://react-hook-form.com/)

---

## 11. Contacto y Soporte

**Dudas técnicas**: Contactar al tech lead del proyecto  
**Dudas de diseño**: Revisar Figma mockups (si están disponibles)  
**Dudas de contenido**: Revisar guía de ventas en `/docs/sales-guide.pdf`

**Tiempo estimado de desarrollo**: 40-60 horas (1-2 semanas a tiempo completo)

---

**Autor**: Manus AI  
**Última actualización**: 16 de Noviembre, 2025
