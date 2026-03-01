/**
 * ROPA Suite 4: Strategic Reasoning Engine
 * 
 * Tools for:
 * - Goal-to-Plan Converter: natural language objective → tactical plan
 * - Resource Manager: design multichannel strategy with asset generation
 * - Calendar Scheduler: autonomous campaign scheduling and execution
 * - Budget allocation optimizer
 * 
 * This is the highest-level cognitive suite, orchestrating all other suites.
 * Feeds into ROPA Global Context for cross-module strategic decisions.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { salesCampaigns, ivyClients, emailDrafts } from "../drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";
import { createRopaLog, recordRopaMetric, recordRopaLearning } from "./ropa-db";

// ============ TYPES ============

export interface StrategicGoal {
  id: string;
  objective: string; // Natural language: "Aumentar ventas 15% este Q3"
  timeframe: string;
  kpis: Array<{ name: string; target: number; current: number; unit: string }>;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  createdAt: string;
}

export interface TacticalPlan {
  goalId: string;
  objective: string;
  phases: Array<{
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    channels: string[];
    actions: Array<{
      action: string;
      responsible: string; // 'ROPA' | 'Human' | 'Agent'
      deadline: string;
      status: 'pending' | 'in_progress' | 'completed';
      dependencies: string[];
    }>;
    budget: number;
    expectedOutcome: string;
  }>;
  totalBudget: number;
  estimatedROI: number;
  riskAssessment: string;
  successCriteria: string[];
}

export interface ResourceAllocation {
  channels: Array<{
    channel: string;
    budgetPercentage: number;
    budgetAmount: number;
    expectedReach: number;
    expectedConversions: number;
    assets: string[];
  }>;
  totalBudget: number;
  timeline: string;
  assetsNeeded: Array<{
    type: string;
    description: string;
    channel: string;
    status: 'needed' | 'in_progress' | 'ready';
  }>;
}

export interface CampaignCalendar {
  entries: Array<{
    date: string;
    time: string;
    channel: string;
    action: string;
    company: string;
    campaign: string;
    status: 'scheduled' | 'executing' | 'completed' | 'failed';
    autoExecute: boolean;
  }>;
  nextAction: {
    date: string;
    description: string;
    autoApproved: boolean;
  };
}

export interface BudgetOptimization {
  currentAllocation: Record<string, number>;
  optimizedAllocation: Record<string, number>;
  expectedImprovement: number;
  reasoning: string;
  recommendations: string[];
}

// ============ HELPER ============

async function logSuite(tool: string, level: "info" | "warn" | "error", msg: string, meta?: any) {
  await createRopaLog({ taskId: undefined, level, message: `[StrategicEngine:${tool}] ${msg}`, metadata: meta });
}

// ============ SUITE 4 TOOLS ============

export const strategicReasoningTools = {

  // ---- Tool 1: Goal-to-Plan Converter ----
  async convertGoalToPlan(params: {
    objective: string; // Natural language: "Aumentar ventas 15% este Q3"
    companyName?: string;
    budget?: number;
    timeframe?: string;
    constraints?: string[];
    currentMetrics?: Record<string, number>;
  }): Promise<{ success: boolean; plan?: TacticalPlan; error?: string }> {
    await logSuite('convertGoalToPlan', 'info', `Converting goal to plan: "${params.objective}"`);

    try {
      // Gather context from DB
      const db = await getDb();
      let companyCount = 0;
      let campaignCount = 0;

      if (db) {
        try {
          const companies = await db.select().from(ivyClients);
          companyCount = companies.length;
          const campaigns = await db.select().from(salesCampaigns);
          campaignCount = campaigns.length;
        } catch {}
      }

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un estratega de marketing B2B de alto nivel. SIEMPRE responde en español.
Convierte un objetivo en lenguaje natural en un plan táctico completo y ejecutable.

Responde SOLO con JSON válido:
{
  "goalId": "goal_timestamp",
  "objective": "objetivo original",
  "phases": [
    {
      "id": 1,
      "name": "Nombre de la fase",
      "description": "Descripción detallada",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "channels": ["email", "linkedin", "phone"],
      "actions": [
        {
          "action": "Descripción de la acción",
          "responsible": "ROPA" | "Human",
          "deadline": "YYYY-MM-DD",
          "status": "pending",
          "dependencies": []
        }
      ],
      "budget": 1000,
      "expectedOutcome": "Resultado esperado"
    }
  ],
  "totalBudget": 5000,
  "estimatedROI": 250,
  "riskAssessment": "Evaluación de riesgos",
  "successCriteria": ["criterio1", "criterio2"]
}

Reglas:
- Cada fase debe tener acciones concretas y medibles
- Asignar "ROPA" a acciones automatizables (emails, análisis, reportes)
- Asignar "Human" a acciones que requieren decisión humana (aprobaciones, reuniones)
- Las fechas deben ser realistas y secuenciales
- El presupuesto debe distribuirse proporcionalmente al impacto esperado`
          },
          {
            role: 'user',
            content: `Objetivo: ${params.objective}
Empresa: ${params.companyName || 'Todas las empresas'}
Presupuesto disponible: ${params.budget ? `$${params.budget}` : 'No definido'}
Plazo: ${params.timeframe || '3 meses'}
Restricciones: ${params.constraints?.join(', ') || 'Ninguna especificada'}
Métricas actuales: ${params.currentMetrics ? JSON.stringify(params.currentMetrics) : 'No disponibles'}

Contexto de la plataforma:
- Empresas activas: ${companyCount}
- Campañas existentes: ${campaignCount}
- Canales disponibles: email, teléfono, SMS, LinkedIn
- Capacidades ROPA: generación de emails, A/B testing, análisis predictivo, CRM sync`
          }
        ]
      });

      const content = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const plan: TacticalPlan = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      // Ensure goalId
      if (!plan.goalId) plan.goalId = `goal_${Date.now()}`;

      await recordRopaMetric({
        metricName: 'strategic_plan_created',
        value: plan.phases?.length || 0,
        unit: 'phases',
        tags: { objective: params.objective.substring(0, 50) }
      });

      await recordRopaLearning({
        category: 'strategic_plans',
        pattern: `Goal: "${params.objective}" → ${plan.phases?.length || 0} phases, ROI: ${plan.estimatedROI}%`,
        frequency: 1,
      });

      return { success: true, plan };
    } catch (error: any) {
      await logSuite('convertGoalToPlan', 'error', error.message);
      return { success: false, error: error.message };
    }
  },

  // ---- Tool 2: Design Multichannel Strategy ----
  async designMultichannelStrategy(params: {
    companyName: string;
    objective: string;
    budget: number;
    channels?: string[];
    targetAudience?: string;
    duration?: string;
  }): Promise<{ success: boolean; allocation?: ResourceAllocation; error?: string }> {
    await logSuite('designMultichannelStrategy', 'info', `Designing multichannel strategy for ${params.companyName}`);

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un estratega de marketing multicanal B2B. SIEMPRE responde en español.
Diseña una estrategia multicanal con asignación de recursos. Responde SOLO con JSON:
{
  "channels": [
    {
      "channel": "email",
      "budgetPercentage": 40,
      "budgetAmount": 2000,
      "expectedReach": 5000,
      "expectedConversions": 150,
      "assets": ["email template", "landing page"]
    }
  ],
  "totalBudget": 5000,
  "timeline": "descripción del timeline",
  "assetsNeeded": [
    {
      "type": "email_template",
      "description": "Template de email para campaña de introducción",
      "channel": "email",
      "status": "needed"
    }
  ]
}

Canales disponibles: email, phone, sms, linkedin, webinar, content_marketing
Optimiza la distribución para maximizar ROI según el objetivo.`
          },
          {
            role: 'user',
            content: `Empresa: ${params.companyName}
Objetivo: ${params.objective}
Presupuesto total: $${params.budget}
Canales preferidos: ${params.channels?.join(', ') || 'Todos disponibles'}
Audiencia: ${params.targetAudience || 'Decisores B2B'}
Duración: ${params.duration || '3 meses'}`
          }
        ]
      });

      const content = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const allocation: ResourceAllocation = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      return { success: true, allocation };
    } catch (error: any) {
      await logSuite('designMultichannelStrategy', 'error', error.message);
      return { success: false, error: error.message };
    }
  },

  // ---- Tool 3: Generate Campaign Calendar ----
  async generateCampaignCalendar(params: {
    companyName: string;
    plan?: TacticalPlan;
    startDate?: string;
    weeks?: number;
  }): Promise<{ success: boolean; calendar?: CampaignCalendar; error?: string }> {
    await logSuite('generateCampaignCalendar', 'info', `Generating campaign calendar for ${params.companyName}`);

    try {
      const startDate = params.startDate || new Date().toISOString().split('T')[0];
      const weeks = params.weeks || 4;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un planificador de campañas de marketing. SIEMPRE responde en español.
Genera un calendario de ejecución de campañas. Responde SOLO con JSON:
{
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "channel": "email",
      "action": "Enviar email de introducción",
      "company": "nombre empresa",
      "campaign": "nombre campaña",
      "status": "scheduled",
      "autoExecute": true
    }
  ],
  "nextAction": {
    "date": "YYYY-MM-DD",
    "description": "Próxima acción a ejecutar",
    "autoApproved": false
  }
}

Reglas:
- Distribuir acciones a lo largo de las semanas
- No más de 3 acciones por día
- Emails preferiblemente martes-jueves 9:00-11:00
- Llamadas lunes y viernes 10:00-12:00
- SMS solo para seguimiento urgente
- autoExecute=true para acciones que ROPA puede hacer solo
- autoExecute=false para acciones que necesitan aprobación humana`
          },
          {
            role: 'user',
            content: `Empresa: ${params.companyName}
Fecha inicio: ${startDate}
Duración: ${weeks} semanas
${params.plan ? `Plan estratégico: ${params.plan.phases?.map(p => p.name).join(', ')}` : 'Sin plan previo - generar calendario estándar de prospección'}`
          }
        ]
      });

      const content = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const calendar: CampaignCalendar = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      return { success: true, calendar };
    } catch (error: any) {
      await logSuite('generateCampaignCalendar', 'error', error.message);
      return { success: false, error: error.message };
    }
  },

  // ---- Tool 4: Optimize Budget Allocation ----
  async optimizeBudget(params: {
    currentAllocation: Record<string, number>;
    totalBudget: number;
    performanceData?: Record<string, { spend: number; conversions: number; revenue: number }>;
    objective?: string;
  }): Promise<{ success: boolean; optimization?: BudgetOptimization; error?: string }> {
    await logSuite('optimizeBudget', 'info', 'Optimizing budget allocation');

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un optimizador de presupuesto de marketing. SIEMPRE responde en español.
Analiza la distribución actual y sugiere una optimización. Responde SOLO con JSON:
{
  "currentAllocation": {"email": 2000, "phone": 1000},
  "optimizedAllocation": {"email": 2500, "phone": 800},
  "expectedImprovement": 15,
  "reasoning": "Explicación de la optimización",
  "recommendations": ["recomendación1", "recomendación2"]
}

Principios de optimización:
- Reasignar presupuesto de canales de bajo rendimiento a alto rendimiento
- Mantener diversificación mínima (no eliminar canales completamente)
- Considerar estacionalidad y fatiga de audiencia
- Priorizar canales con mejor ratio conversión/costo`
          },
          {
            role: 'user',
            content: `Presupuesto total: $${params.totalBudget}
Distribución actual: ${JSON.stringify(params.currentAllocation)}
Datos de rendimiento: ${params.performanceData ? JSON.stringify(params.performanceData) : 'No disponibles'}
Objetivo: ${params.objective || 'Maximizar conversiones'}`
          }
        ]
      });

      const content = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const optimization: BudgetOptimization = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      return { success: true, optimization };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // ---- Tool 5: Autonomous Execution Decision ----
  async makeAutonomousDecision(params: {
    context: string;
    pendingActions: Array<{ action: string; risk: 'low' | 'medium' | 'high'; impact: string }>;
    daysSinceLastApproval: number;
    autoApproveThreshold: number; // days (default 3)
  }): Promise<{
    success: boolean;
    decisions: Array<{
      action: string;
      approved: boolean;
      reason: string;
      executionPlan: string;
    }>;
    escalateToHuman: boolean;
    message: string;
  }> {
    await logSuite('makeAutonomousDecision', 'info', `Making autonomous decision (${params.daysSinceLastApproval} days since last approval)`);

    const threshold = params.autoApproveThreshold || 3;
    const autoApproveEnabled = params.daysSinceLastApproval >= threshold;

    const decisions = params.pendingActions.map(action => {
      // Low risk actions can always be auto-approved
      if (action.risk === 'low') {
        return {
          action: action.action,
          approved: true,
          reason: 'Acción de bajo riesgo - aprobada automáticamente',
          executionPlan: `Ejecutar inmediatamente: ${action.action}`,
        };
      }

      // Medium risk: auto-approve only if threshold exceeded
      if (action.risk === 'medium' && autoApproveEnabled) {
        return {
          action: action.action,
          approved: true,
          reason: `Sin respuesta del usuario en ${params.daysSinceLastApproval} días (umbral: ${threshold}). Aprobación autónoma activada.`,
          executionPlan: `Ejecutar con monitorización: ${action.action}`,
        };
      }

      // High risk: never auto-approve, always escalate
      if (action.risk === 'high') {
        return {
          action: action.action,
          approved: false,
          reason: 'Acción de alto riesgo - requiere aprobación humana explícita',
          executionPlan: 'Esperando aprobación del usuario',
        };
      }

      return {
        action: action.action,
        approved: false,
        reason: 'Esperando aprobación del usuario',
        executionPlan: 'Pendiente',
      };
    });

    const approvedCount = decisions.filter(d => d.approved).length;
    const escalateToHuman = decisions.some(d => !d.approved);

    await recordRopaMetric({
      metricName: 'autonomous_decisions',
      value: approvedCount,
      unit: 'approved_actions',
      tags: { daysSinceApproval: String(params.daysSinceLastApproval), autoApproveEnabled: String(autoApproveEnabled) }
    });

    return {
      success: true,
      decisions,
      escalateToHuman,
      message: autoApproveEnabled
        ? `⚡ Modo autónomo activado (${params.daysSinceLastApproval} días sin respuesta). ${approvedCount}/${decisions.length} acciones aprobadas automáticamente.`
        : `🔒 Modo supervisado. ${approvedCount}/${decisions.length} acciones aprobadas (solo bajo riesgo).`,
    };
  },

  // ---- Tool 6: Generate Strategic Report ----
  async generateStrategicReport(params: {
    companyName?: string;
    period?: string;
    includeForecasts?: boolean;
  }): Promise<{ success: boolean; report: string; error?: string }> {
    await logSuite('generateStrategicReport', 'info', `Generating strategic report for ${params.companyName || 'all companies'}`);

    try {
      const db = await getDb();
      let companyCount = 0;
      let campaignCount = 0;
      let draftCount = 0;

      if (db) {
        try {
          const companies = await db.select().from(ivyClients);
          companyCount = companies.length;
          const campaigns = await db.select().from(salesCampaigns);
          campaignCount = campaigns.length;
          const drafts = await db.select().from(emailDrafts);
          draftCount = drafts.length;
        } catch {}
      }

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un consultor estratégico de marketing B2B. SIEMPRE responde en español.
Genera un informe estratégico ejecutivo con análisis, insights y recomendaciones.
El informe debe ser profesional, conciso y accionable.
Incluye secciones: Resumen Ejecutivo, Análisis de Situación, KPIs, Oportunidades, Riesgos, Plan de Acción.`
          },
          {
            role: 'user',
            content: `Genera un informe estratégico para: ${params.companyName || 'Todas las empresas'}
Período: ${params.period || 'Último mes'}
Incluir pronósticos: ${params.includeForecasts ? 'Sí' : 'No'}

Datos de la plataforma:
- Empresas activas: ${companyCount}
- Campañas totales: ${campaignCount}
- Borradores de email: ${draftCount}
- Canales activos: Email, Teléfono, SMS, LinkedIn`
          }
        ]
      });

      const report = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : 'Error generando informe');
      return { success: true, report };
    } catch (error: any) {
      return { success: false, report: '', error: error.message };
    }
  },

  // ---- Tool 7: Evaluate Plan Progress ----
  async evaluatePlanProgress(params: {
    plan: TacticalPlan;
    currentDate?: string;
  }): Promise<{
    success: boolean;
    progress: {
      overallCompletion: number;
      phaseProgress: Array<{ phase: string; completion: number; onTrack: boolean }>;
      blockers: string[];
      recommendations: string[];
    };
  }> {
    await logSuite('evaluatePlanProgress', 'info', `Evaluating plan progress for goal: ${params.plan.goalId}`);

    const currentDate = params.currentDate || new Date().toISOString().split('T')[0];
    const phaseProgress = (params.plan.phases || []).map(phase => {
      const totalActions = phase.actions?.length || 0;
      const completedActions = (phase.actions || []).filter(a => a.status === 'completed').length;
      const completion = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

      return {
        phase: phase.name,
        completion,
        onTrack: completion >= 50 || new Date(phase.endDate) > new Date(currentDate),
      };
    });

    const overallCompletion = phaseProgress.length > 0
      ? Math.round(phaseProgress.reduce((sum, p) => sum + p.completion, 0) / phaseProgress.length)
      : 0;

    const blockers = phaseProgress
      .filter(p => !p.onTrack)
      .map(p => `Fase "${p.phase}" retrasada (${p.completion}% completado)`);

    return {
      success: true,
      progress: {
        overallCompletion,
        phaseProgress,
        blockers,
        recommendations: blockers.length > 0
          ? ['Reasignar recursos a fases retrasadas', 'Considerar reducir alcance de fases bloqueadas', 'Escalar a equipo humano para desbloquear']
          : ['Plan en curso según lo previsto', 'Continuar monitorización automática'],
      },
    };
  },

  // ---- Tool 8: Auto-Generate Campaign Assets ----
  async autoGenerateAssets(params: {
    companyName: string;
    campaignName: string;
    channels: string[];
    tone?: string;
    product?: string;
  }): Promise<{
    success: boolean;
    assets: Array<{
      channel: string;
      type: string;
      content: string;
      status: 'generated' | 'needs_review';
    }>;
  }> {
    await logSuite('autoGenerateAssets', 'info', `Auto-generating assets for ${params.campaignName}`);

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un creador de contenido de marketing B2B multicanal. SIEMPRE responde en español.
Genera assets de marketing para cada canal solicitado. Responde SOLO con JSON:
{
  "assets": [
    {
      "channel": "email",
      "type": "email_template",
      "content": "Asunto: ...\n\nCuerpo del email...",
      "status": "generated"
    },
    {
      "channel": "linkedin",
      "type": "post",
      "content": "Texto del post de LinkedIn...",
      "status": "generated"
    },
    {
      "channel": "sms",
      "type": "sms_message",
      "content": "Mensaje SMS (max 160 chars)...",
      "status": "generated"
    },
    {
      "channel": "phone",
      "type": "call_script",
      "content": "Script de llamada...",
      "status": "needs_review"
    }
  ]
}

Cada asset debe ser profesional, personalizado para la empresa y coherente con el tono de la campaña.`
          },
          {
            role: 'user',
            content: `Empresa: ${params.companyName}
Campaña: ${params.campaignName}
Canales: ${params.channels.join(', ')}
Tono: ${params.tone || 'Profesional y cercano'}
Producto/Servicio: ${params.product || 'Servicios B2B'}`
          }
        ]
      });

      const content = (typeof response.choices[0].message.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      return { success: true, assets: parsed.assets || [] };
    } catch (error: any) {
      return { success: true, assets: [] };
    }
  },
};

export default strategicReasoningTools;
