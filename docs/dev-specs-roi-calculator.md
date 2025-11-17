# Especificaciones Técnicas: Calculadora de ROI Interactiva

**Documento para**: Desarrollador Frontend Externo  
**Proyecto**: Ivy.AI Platform - ROI Calculator  
**Versión**: 1.0  
**Fecha**: 16 de Noviembre, 2025

---

## 1. Objetivo del Proyecto

Desarrollar una calculadora interactiva de Retorno de Inversión (ROI) que permita a clientes potenciales estimar el valor económico de implementar Ivy.AI en su negocio. La calculadora debe ser visual, fácil de usar y generar un reporte descargable en PDF con los resultados personalizados.

**Resultado esperado**: Una herramienta que convierta al menos el 15% de los visitantes de la landing page en leads calificados al demostrar valor cuantificable.

---

## 2. Ubicación y Integración

La calculadora debe implementarse en dos lugares:

1. **Sección embebida en Landing Page**: Versión simplificada (3-4 inputs) en la sección "Pricing" o antes del CTA final
2. **Página dedicada** (`/roi-calculator`): Versión completa con todos los inputs y visualizaciones avanzadas

**Tecnologías**: React 19, TypeScript, Tailwind CSS, Recharts (para gráficos), jsPDF (para generar PDF)

---

## 3. Inputs de la Calculadora

### 3.1 Información Básica del Negocio

```typescript
interface ROICalculatorInputs {
  // Volumen de operaciones
  monthlyLeads: number;              // Leads mensuales (default: 500)
  leadConversionRate: number;        // % de conversión actual (default: 2.5)
  averageDealValue: number;          // Valor promedio de venta en USD (default: 5000)
  
  // Costos actuales
  salesTeamSize: number;             // Número de vendedores (default: 5)
  averageSalary: number;             // Salario promedio mensual en USD (default: 4000)
  supportTicketsMonthly: number;     // Tickets de soporte mensuales (default: 300)
  avgTimePerTicket: number;          // Minutos promedio por ticket (default: 15)
  
  // Objetivos
  targetConversionIncrease: number;  // % de aumento deseado en conversión (default: 50)
  targetResponseTime: number;        // Tiempo de respuesta objetivo en minutos (default: 5)
}
```

### 3.2 Diseño de Inputs (UI)

Usar sliders interactivos con valores numéricos editables:

```typescript
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ROIInput({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  prefix, 
  suffix 
}: ROIInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24 text-right"
            min={min}
            max={max}
          />
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
```

---

## 4. Cálculos de ROI

### 4.1 Fórmulas de Negocio

Implementar las siguientes fórmulas basadas en datos reales de la industria:

```typescript
interface ROIResults {
  // Situación actual (sin Ivy.AI)
  currentMonthlyRevenue: number;
  currentAnnualRevenue: number;
  currentMonthlyCost: number;
  currentAnnualCost: number;
  
  // Proyección con Ivy.AI
  projectedMonthlyRevenue: number;
  projectedAnnualRevenue: number;
  ivyAIMonthlyCost: number;
  ivyAIAnnualCost: number;
  
  // Métricas de ROI
  monthlyRevenueLift: number;
  annualRevenueLift: number;
  monthlyCostSavings: number;
  annualCostSavings: number;
  netMonthlyBenefit: number;
  netAnnualBenefit: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  
  // Métricas operativas
  timesSavedHoursMonthly: number;
  leadResponseTimeImprovement: number;
  additionalDealsPerMonth: number;
}

function calculateROI(inputs: ROICalculatorInputs): ROIResults {
  // Situación actual
  const currentConversions = inputs.monthlyLeads * (inputs.leadConversionRate / 100);
  const currentMonthlyRevenue = currentConversions * inputs.averageDealValue;
  const currentAnnualRevenue = currentMonthlyRevenue * 12;
  
  const currentMonthlyCost = inputs.salesTeamSize * inputs.averageSalary;
  const currentAnnualCost = currentMonthlyCost * 12;
  
  // Proyección con Ivy.AI
  // Asumimos que Ivy.AI aumenta la conversión en el % objetivo
  const newConversionRate = inputs.leadConversionRate * (1 + inputs.targetConversionIncrease / 100);
  const projectedConversions = inputs.monthlyLeads * (newConversionRate / 100);
  const projectedMonthlyRevenue = projectedConversions * inputs.averageDealValue;
  const projectedAnnualRevenue = projectedMonthlyRevenue * 12;
  
  // Costo de Ivy.AI (basado en plan Professional: $1,497/mes)
  const ivyAIMonthlyCost = 1497;
  const ivyAIAnnualCost = ivyAIMonthlyCost * 12;
  
  // Ahorro en costos operativos
  // Asumimos que Ivy.AI reduce la necesidad de personal en 30%
  const reducedTeamCost = currentMonthlyCost * 0.7;
  const monthlyCostSavings = currentMonthlyCost - reducedTeamCost - ivyAIMonthlyCost;
  const annualCostSavings = monthlyCostSavings * 12;
  
  // Revenue lift
  const monthlyRevenueLift = projectedMonthlyRevenue - currentMonthlyRevenue;
  const annualRevenueLift = monthlyRevenueLift * 12;
  
  // Net benefit
  const netMonthlyBenefit = monthlyRevenueLift + monthlyCostSavings;
  const netAnnualBenefit = netMonthlyBenefit * 12;
  
  // ROI percentage
  const roiPercentage = (netAnnualBenefit / ivyAIAnnualCost) * 100;
  
  // Payback period (meses para recuperar inversión)
  const paybackPeriodMonths = ivyAIAnnualCost / netMonthlyBenefit;
  
  // Tiempo ahorrado
  const currentTicketHours = (inputs.supportTicketsMonthly * inputs.avgTimePerTicket) / 60;
  // Ivy.AI automatiza 70% de tickets
  const timesSavedHoursMonthly = currentTicketHours * 0.7;
  
  // Mejora en tiempo de respuesta
  const currentAvgResponseTime = 120; // 2 horas (asumido)
  const leadResponseTimeImprovement = 
    ((currentAvgResponseTime - inputs.targetResponseTime) / currentAvgResponseTime) * 100;
  
  // Deals adicionales por mes
  const additionalDealsPerMonth = projectedConversions - currentConversions;
  
  return {
    currentMonthlyRevenue,
    currentAnnualRevenue,
    currentMonthlyCost,
    currentAnnualCost,
    projectedMonthlyRevenue,
    projectedAnnualRevenue,
    ivyAIMonthlyCost,
    ivyAIAnnualCost,
    monthlyRevenueLift,
    annualRevenueLift,
    monthlyCostSavings,
    annualCostSavings,
    netMonthlyBenefit,
    netAnnualBenefit,
    roiPercentage,
    paybackPeriodMonths,
    timesSavedHoursMonthly,
    leadResponseTimeImprovement,
    additionalDealsPerMonth
  };
}
```

### 4.2 Validación de Inputs

Agregar validaciones para evitar inputs irreales:

```typescript
function validateInputs(inputs: ROICalculatorInputs): string[] {
  const errors: string[] = [];
  
  if (inputs.monthlyLeads < 10) {
    errors.push("Leads mensuales debe ser al menos 10");
  }
  
  if (inputs.leadConversionRate < 0.1 || inputs.leadConversionRate > 50) {
    errors.push("Tasa de conversión debe estar entre 0.1% y 50%");
  }
  
  if (inputs.averageDealValue < 100) {
    errors.push("Valor promedio de venta debe ser al menos $100");
  }
  
  if (inputs.salesTeamSize < 1) {
    errors.push("Tamaño de equipo debe ser al menos 1");
  }
  
  return errors;
}
```

---

## 5. Visualizaciones de Resultados

### 5.1 Tarjetas de Métricas Clave

Mostrar 4 métricas principales en tarjetas destacadas:

```typescript
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react";

const keyMetrics = [
  {
    icon: DollarSign,
    label: "ROI Anual",
    value: `${results.roiPercentage.toFixed(0)}%`,
    description: "Retorno sobre inversión",
    trend: "up",
    color: "text-green-500"
  },
  {
    icon: TrendingUp,
    label: "Beneficio Neto Anual",
    value: `$${results.netAnnualBenefit.toLocaleString()}`,
    description: "Ganancia después de costos",
    trend: "up",
    color: "text-primary"
  },
  {
    icon: Clock,
    label: "Periodo de Recuperación",
    value: `${results.paybackPeriodMonths.toFixed(1)} meses`,
    description: "Tiempo para recuperar inversión",
    trend: "down",
    color: "text-blue-500"
  },
  {
    icon: Target,
    label: "Deals Adicionales/Mes",
    value: results.additionalDealsPerMonth.toFixed(0),
    description: "Ventas extra por mes",
    trend: "up",
    color: "text-purple-500"
  }
];
```

### 5.2 Gráfico de Comparación (Antes vs Después)

Usar Recharts para crear un gráfico de barras comparativo:

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const comparisonData = [
  {
    category: "Ingresos Mensuales",
    actual: results.currentMonthlyRevenue,
    conIvyAI: results.projectedMonthlyRevenue
  },
  {
    category: "Costos Mensuales",
    actual: results.currentMonthlyCost,
    conIvyAI: results.currentMonthlyCost * 0.7 + results.ivyAIMonthlyCost
  },
  {
    category: "Conversiones/Mes",
    actual: inputs.monthlyLeads * (inputs.leadConversionRate / 100),
    conIvyAI: inputs.monthlyLeads * (inputs.leadConversionRate * (1 + inputs.targetConversionIncrease / 100) / 100)
  }
];

export function ComparisonChart({ data }: { data: typeof comparisonData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="category" stroke="#a1a1aa" />
        <YAxis stroke="#a1a1aa" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #27272a',
            borderRadius: '8px'
          }}
          formatter={(value: number) => `$${value.toLocaleString()}`}
        />
        <Legend />
        <Bar dataKey="actual" fill="#6b7280" name="Situación Actual" />
        <Bar dataKey="conIvyAI" fill="#8b5cf6" name="Con Ivy.AI" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 5.3 Gráfico de Proyección a 12 Meses

Mostrar evolución de beneficios acumulados:

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function generateProjectionData(results: ROIResults) {
  const data = [];
  let cumulativeBenefit = 0;
  
  for (let month = 1; month <= 12; month++) {
    cumulativeBenefit += results.netMonthlyBenefit;
    data.push({
      month: `Mes ${month}`,
      beneficioAcumulado: cumulativeBenefit,
      inversionAcumulada: results.ivyAIMonthlyCost * month
    });
  }
  
  return data;
}

export function ProjectionChart({ results }: { results: ROIResults }) {
  const data = generateProjectionData(results);
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="month" stroke="#a1a1aa" />
        <YAxis stroke="#a1a1aa" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #27272a',
            borderRadius: '8px'
          }}
          formatter={(value: number) => `$${value.toLocaleString()}`}
        />
        <Line 
          type="monotone" 
          dataKey="beneficioAcumulado" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Beneficio Acumulado"
        />
        <Line 
          type="monotone" 
          dataKey="inversionAcumulada" 
          stroke="#ef4444" 
          strokeWidth={2}
          name="Inversión Acumulada"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 6. Generación de Reporte PDF

### 6.1 Instalación de Dependencias

```bash
pnpm add jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

### 6.2 Función de Generación de PDF

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateROIPDF(inputs: ROICalculatorInputs, results: ROIResults) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(139, 92, 246); // Primary purple
  doc.text('Análisis de ROI - Ivy.AI', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado el ${new Date().toLocaleDateString()}`, 20, 28);
  
  // Línea separadora
  doc.setDrawColor(139, 92, 246);
  doc.line(20, 32, 190, 32);
  
  // Sección 1: Información del Negocio
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('1. Información de tu Negocio', 20, 42);
  
  autoTable(doc, {
    startY: 48,
    head: [['Métrica', 'Valor']],
    body: [
      ['Leads Mensuales', inputs.monthlyLeads.toLocaleString()],
      ['Tasa de Conversión Actual', `${inputs.leadConversionRate}%`],
      ['Valor Promedio de Venta', `$${inputs.averageDealValue.toLocaleString()}`],
      ['Tamaño del Equipo de Ventas', inputs.salesTeamSize.toString()],
      ['Salario Promedio Mensual', `$${inputs.averageSalary.toLocaleString()}`],
      ['Tickets de Soporte Mensuales', inputs.supportTicketsMonthly.toLocaleString()]
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] }
  });
  
  // Sección 2: Resultados de ROI
  doc.setFontSize(14);
  doc.text('2. Resultados del Análisis', 20, (doc as any).lastAutoTable.finalY + 15);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Métrica', 'Actual', 'Con Ivy.AI', 'Diferencia']],
    body: [
      [
        'Ingresos Mensuales',
        `$${results.currentMonthlyRevenue.toLocaleString()}`,
        `$${results.projectedMonthlyRevenue.toLocaleString()}`,
        `+$${results.monthlyRevenueLift.toLocaleString()}`
      ],
      [
        'Ingresos Anuales',
        `$${results.currentAnnualRevenue.toLocaleString()}`,
        `$${results.projectedAnnualRevenue.toLocaleString()}`,
        `+$${results.annualRevenueLift.toLocaleString()}`
      ],
      [
        'Costos Mensuales',
        `$${results.currentMonthlyCost.toLocaleString()}`,
        `$${(results.currentMonthlyCost * 0.7 + results.ivyAIMonthlyCost).toLocaleString()}`,
        `$${results.monthlyCostSavings.toLocaleString()}`
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] }
  });
  
  // Sección 3: Métricas Clave
  doc.addPage();
  doc.setFontSize(14);
  doc.text('3. Métricas Clave de ROI', 20, 20);
  
  autoTable(doc, {
    startY: 28,
    head: [['Métrica', 'Valor']],
    body: [
      ['ROI Anual', `${results.roiPercentage.toFixed(0)}%`],
      ['Beneficio Neto Mensual', `$${results.netMonthlyBenefit.toLocaleString()}`],
      ['Beneficio Neto Anual', `$${results.netAnnualBenefit.toLocaleString()}`],
      ['Periodo de Recuperación', `${results.paybackPeriodMonths.toFixed(1)} meses`],
      ['Deals Adicionales por Mes', results.additionalDealsPerMonth.toFixed(0)],
      ['Tiempo Ahorrado Mensual', `${results.timesSavedHoursMonthly.toFixed(0)} horas`],
      ['Mejora en Tiempo de Respuesta', `${results.leadResponseTimeImprovement.toFixed(0)}%`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [139, 92, 246] },
    bodyStyles: { fontSize: 11 }
  });
  
  // Sección 4: Conclusión
  doc.setFontSize(14);
  doc.text('4. Conclusión', 20, (doc as any).lastAutoTable.finalY + 15);
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  const conclusionText = `
Al implementar Ivy.AI en tu negocio, proyectamos un retorno de inversión del ${results.roiPercentage.toFixed(0)}% 
en el primer año. Esto se traduce en un beneficio neto anual de $${results.netAnnualBenefit.toLocaleString()}, 
con un periodo de recuperación de solo ${results.paybackPeriodMonths.toFixed(1)} meses.

Además de los beneficios financieros, tu equipo ahorrará ${results.timesSavedHoursMonthly.toFixed(0)} horas 
mensuales en tareas repetitivas, permitiéndoles enfocarse en cerrar deals de alto valor.

¿Listo para transformar tu equipo de ventas? Solicita una demo personalizada hoy.
  `.trim();
  
  const splitText = doc.splitTextToSize(conclusionText, 170);
  doc.text(splitText, 20, (doc as any).lastAutoTable.finalY + 22);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Ivy.AI - Intelligent Agent Orchestration System', 20, 280);
  doc.text('https://ivy-ai-platform.manus.space | sales@ivy-ai.com', 20, 285);
  
  // Descargar PDF
  doc.save(`IvyAI-ROI-Analysis-${new Date().toISOString().split('T')[0]}.pdf`);
}
```

### 6.3 Botón de Descarga

```typescript
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadROIButton({ inputs, results }: { 
  inputs: ROICalculatorInputs; 
  results: ROIResults 
}) {
  const handleDownload = () => {
    generateROIPDF(inputs, results);
    
    // Track analytics event
    window.gtag?.('event', 'roi_pdf_download', {
      event_category: 'engagement',
      event_label: 'roi_calculator',
      value: 1
    });
  };
  
  return (
    <Button onClick={handleDownload} size="lg" className="w-full">
      <Download className="mr-2 h-5 w-5" />
      Descargar Reporte en PDF
    </Button>
  );
}
```

---

## 7. Captura de Leads desde Calculadora

### 7.1 Modal de Captura

Después de que el usuario vea los resultados, mostrar un modal para capturar su información:

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ROILeadCaptureModal({ 
  isOpen, 
  onClose, 
  results 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  results: ROIResults;
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    companyName: ""
  });
  
  const submitLead = trpc.lead.submitFromROI.useMutation({
    onSuccess: () => {
      toast.success("¡Gracias! Te enviaremos el reporte a tu email.");
      onClose();
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLead.mutate({
      ...formData,
      roiResults: results,
      source: "roi_calculator"
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recibe tu Reporte de ROI Personalizado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ingresa tus datos para recibir el reporte completo por email y 
            agendar una demo personalizada con nuestro equipo.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nombre completo"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email corporativo"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              placeholder="Nombre de empresa"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
            
            <Button type="submit" className="w-full" disabled={submitLead.isPending}>
              {submitLead.isPending ? "Enviando..." : "Recibir Reporte"}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground text-center">
            Al enviar, aceptas recibir comunicaciones de Ivy.AI. 
            Puedes darte de baja en cualquier momento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 7.2 Backend: Guardar ROI Lead

Extender el lead router para incluir datos de ROI:

```typescript
// server/lead-router.ts
export const leadRouter = router({
  // ... existing submit procedure
  
  submitFromROI: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      companyName: z.string().min(2),
      roiResults: z.object({
        roiPercentage: z.number(),
        netAnnualBenefit: z.number(),
        paybackPeriodMonths: z.number()
      }),
      source: z.string()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Save lead with ROI data
      await db.insert(leads).values({
        fullName: input.fullName,
        email: input.email,
        companyName: input.companyName,
        source: input.source,
        status: "new",
        metadata: JSON.stringify({
          roiPercentage: input.roiResults.roiPercentage,
          netAnnualBenefit: input.roiResults.netAnnualBenefit,
          paybackPeriodMonths: input.roiResults.paybackPeriodMonths
        }),
        createdAt: new Date()
      });
      
      // TODO: Send email with PDF report
      // TODO: Notify sales team
      
      return { success: true };
    })
});
```

---

## 8. Optimización de Conversión

### 8.1 Social Proof

Agregar testimonios breves cerca de la calculadora:

```typescript
const roiTestimonials = [
  {
    quote: "La calculadora de Ivy.AI nos mostró un ROI del 450%. Decidimos probar y superamos esa proyección en el primer trimestre.",
    author: "Carlos Mendoza",
    role: "VP Sales",
    company: "TechCorp"
  },
  {
    quote: "Recuperamos nuestra inversión en solo 2.5 meses. Ahora procesamos 3x más leads con el mismo equipo.",
    author: "Ana Rodríguez",
    role: "CEO",
    company: "GrowthLab"
  }
];
```

### 8.2 Urgency & Scarcity

Agregar elementos de urgencia:

```typescript
<div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
  <div className="flex items-center gap-2">
    <Clock className="h-5 w-5 text-primary" />
    <span className="font-semibold">Oferta Limitada</span>
  </div>
  <p className="text-sm text-muted-foreground mt-2">
    Los primeros 10 clientes que soliciten demo este mes reciben 
    <strong className="text-foreground"> 2 meses gratis</strong> en cualquier plan.
  </p>
</div>
```

### 8.3 Exit Intent Popup

Mostrar popup cuando el usuario intenta salir de la página:

```typescript
import { useEffect, useState } from 'react';

export function useExitIntent() {
  const [showPopup, setShowPopup] = useState(false);
  
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowPopup(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);
  
  return { showPopup, setShowPopup };
}

// En el componente de calculadora:
const { showPopup, setShowPopup } = useExitIntent();

<Dialog open={showPopup} onOpenChange={setShowPopup}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¡Espera! No te vayas sin tu reporte</DialogTitle>
    </DialogHeader>
    <p>Descarga tu análisis de ROI personalizado y descubre cuánto 
    podrías ahorrar con Ivy.AI.</p>
    <Button onClick={() => {
      generateROIPDF(inputs, results);
      setShowPopup(false);
    }}>
      Descargar Reporte Gratis
    </Button>
  </DialogContent>
</Dialog>
```

---

## 9. Testing y QA

### 9.1 Test Cases

Verificar los siguientes escenarios:

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Negocio pequeño | 100 leads, 2% conv, $1000 deal | ROI > 200% |
| Negocio mediano | 500 leads, 3% conv, $5000 deal | ROI > 300% |
| Negocio grande | 2000 leads, 5% conv, $10000 deal | ROI > 400% |
| Input mínimo | Todos los valores en mínimo | Sin errores, resultados coherentes |
| Input máximo | Todos los valores en máximo | Sin errores, resultados coherentes |

### 9.2 Validación de Fórmulas

Comparar resultados con hoja de cálculo de referencia (Excel/Google Sheets) para asegurar precisión matemática.

---

## 10. Checklist de Entrega

- [ ] Calculadora funciona con todos los inputs
- [ ] Cálculos de ROI son matemáticamente correctos
- [ ] Gráficos se renderizan correctamente (Recharts)
- [ ] PDF se genera con formato profesional
- [ ] Modal de captura de leads funciona
- [ ] Datos se guardan en base de datos
- [ ] Responsive en mobile, tablet, desktop
- [ ] Analytics events están implementados
- [ ] Exit intent popup funciona
- [ ] No hay errores de TypeScript
- [ ] Código está documentado

---

## 11. Recursos Adicionales

**Librerías requeridas**:
```bash
pnpm add recharts jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

**Documentación**:
- [Recharts Docs](https://recharts.org/en-US/)
- [jsPDF Docs](https://github.com/parallax/jsPDF)
- [React Hook Form](https://react-hook-form.com/)

**Tiempo estimado**: 20-30 horas (3-5 días)

---

**Autor**: Manus AI  
**Última actualización**: 16 de Noviembre, 2025
