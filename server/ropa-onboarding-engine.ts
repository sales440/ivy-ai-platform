/**
 * ROPA Autonomous Company Onboarding Engine
 * 
 * Protocol 1: Google Drive ingestion → LLM profile analysis → Auto-campaign generation
 * Protocol 2A: Task decomposition per campaign
 * Protocol 2B: Market Watch alerts + auto-adjust campaigns
 * Protocol 2C: Monitor approval workflow (email/SMS/call drafts)
 * Protocol 3: Calendar sync with drag-and-drop propagation
 * Protocol 4: 24/7 progress monitoring with KPI color coding
 * 
 * Applies to ALL companies: existing (FAGOR, EPM, TechStart) + new (PETLIFE 360)
 */

import { getDb } from "./db";
import { eq, desc, and, sql, like } from "drizzle-orm";
import {
  ivyClients,
  salesCampaigns,
  emailDrafts,
  campaignContent,
} from "../drizzle/schema";
import { generateBrandedEmailHtml, generateBrandedCallScript, generateBrandedSmsTemplate } from "./brand-firewall";
import {
  ropaTasks,
  ropaAlerts,
} from "../drizzle/ropa-schema";
import {
  createRopaTask,
  updateRopaTaskStatus,
  createRopaLog,
  createRopaAlert,
  recordRopaMetric,
  setRopaConfig,
  getRopaConfig,
} from "./ropa-db";
import { invokeLLM } from "./_core/llm";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { notifyOwner } from "./_core/notification";

// ============ TYPES ============

export interface CompanyProfile {
  companyName: string;
  clientId: string;
  industry: string;
  products: string[];
  services: string[];
  targetMarket: string;
  brandVoice: string;
  competitors: string[];
  uniqueSellingPoints: string[];
  documentsSummary: string;
}

export interface CampaignPlan {
  name: string;
  type: "email" | "phone" | "social_media" | "multi_channel";
  channel: string;
  objective: string;
  targetAudience: string;
  timeline: string;
  startDate: Date;
  endDate: Date;
  tasks: TaskPlan[];
  drafts: DraftPlan[];
}

export interface TaskPlan {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  dueDate: Date;
  phase: string;
}

export interface DraftPlan {
  type: "email" | "sms" | "call_script";
  subject: string;
  body: string;
  recipientType: string;
}

export interface OnboardingResult {
  success: boolean;
  companyName: string;
  clientId: string;
  profile: CompanyProfile | null;
  campaignsCreated: number;
  tasksCreated: number;
  draftsCreated: number;
  alertsCreated: number;
  errors: string[];
}

// ============ SAFE DB HELPERS ============

async function safeDbQuery<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`[OnboardingEngine] DB query failed for ${label}:`, err.message?.substring(0, 200));
    return null;
  }
}

async function safeDbMutation<T>(label: string, fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    console.warn(`[OnboardingEngine] DB mutation failed for ${label}:`, err.message?.substring(0, 200));
    if (fallback) {
      try {
        return await fallback();
      } catch (fbErr: any) {
        console.warn(`[OnboardingEngine] Fallback also failed for ${label}:`, fbErr.message?.substring(0, 200));
      }
    }
    return null;
  }
}

// ============ SAFE JSON PARSING HELPER ============

/**
 * Safely parse JSON from LLM responses with sanitization and multiple strategies.
 * Handles: markdown code blocks, trailing commas, truncated JSON, single quotes, etc.
 */
function safeJsonParse<T = any>(raw: string, label: string): T | null {
  if (!raw || typeof raw !== 'string') return null;
  
  // Strategy 1: Clean markdown code blocks and try direct parse
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Strategy 2: Fix common LLM JSON issues
    try {
      // Remove trailing commas before } or ]
      let fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
      // Fix single quotes to double quotes (but not inside strings)
      fixed = fixed.replace(/'/g, '"');
      // Remove control characters
      fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');
      return JSON.parse(fixed);
    } catch (e2) {
      // Strategy 3: Try to extract JSON from surrounding text
      try {
        const startIdx = cleaned.search(/[\[{]/);
        if (startIdx >= 0) {
          const substr = cleaned.substring(startIdx);
          // Try parsing from start char, progressively trimming from end
          try {
            return JSON.parse(substr);
          } catch (_) {
            // Find the last matching bracket and try that substring
            const openChar = substr[0];
            const closeChar = openChar === '{' ? '}' : ']';
            const lastClose = substr.lastIndexOf(closeChar);
            if (lastClose > 0) {
              try {
                return JSON.parse(substr.substring(0, lastClose + 1));
              } catch (__) { /* fall through */ }
            }
          }
        }
      } catch (e3) { /* fall through */ }
      
      // Strategy 4: For truncated JSON, try to close open brackets
      {
        try {
          let truncated = cleaned;
          // Count open/close brackets
          const openBraces = (truncated.match(/{/g) || []).length;
          const closeBraces = (truncated.match(/}/g) || []).length;
          const openBrackets = (truncated.match(/\[/g) || []).length;
          const closeBrackets = (truncated.match(/\]/g) || []).length;
          
          // Remove trailing comma if present
          truncated = truncated.replace(/,\s*$/, '');
          
          // Close missing brackets
          for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}';
          
          return JSON.parse(truncated);
        } catch (e4) {
          console.warn(`[OnboardingEngine] All JSON parse strategies failed for ${label}:`, raw.substring(0, 200));
          return null;
        }
      }
    }
  }
  return null;
}

// ============ PROTOCOL 1: GOOGLE DRIVE INGESTION & PROFILE ANALYSIS ============

/**
 * Read all documents from a company's Google Drive folder and analyze them with LLM
 */
export async function analyzeCompanyFromDrive(clientId: string, companyName: string): Promise<CompanyProfile | null> {
  const taskId = `onboard_analyze_${clientId}_${Date.now()}`;
  
  try {
    await createRopaTask({
      taskId,
      type: "company_analysis",
      status: "running",
      priority: "high",
      input: { clientId, companyName },
    });

    await createRopaLog({
      level: "info",
      message: `[Onboarding] Analyzing company profile from Google Drive: ${companyName} (${clientId})`,
    });

    // Try to read Google Drive documents
    let documentsContent = "";
    try {
      const { getClientFolder, listFolderContents, getFileContent } = await import("./ropa-drive-service");
      
      const folderResult = await getClientFolder(clientId);
      if (folderResult.success && folderResult.folder) {
        // List all files in the company folder recursively
        const filesResult = await listFolderContents(folderResult.folder.id);
        if (filesResult.success && filesResult.files) {
          const textFiles = filesResult.files.filter(f => 
            f.mimeType?.includes("text") || 
            f.mimeType?.includes("document") || 
            f.mimeType?.includes("spreadsheet") ||
            f.mimeType?.includes("pdf") ||
            f.name?.endsWith(".txt") ||
            f.name?.endsWith(".docx") ||
            f.name?.endsWith(".xlsx") ||
            f.name?.endsWith(".csv")
          );

          // Read up to 10 files to avoid token limits
          for (const file of textFiles.slice(0, 10)) {
            try {
              const content = await getFileContent(file.id);
              if (content.success && content.content) {
                documentsContent += `\n\n--- ${file.name} ---\n${content.content.substring(0, 3000)}`;
              }
            } catch (e) {
              console.warn(`[Onboarding] Could not read file ${file.name}`);
            }
          }
        }
      }
    } catch (driveErr: any) {
      console.warn(`[Onboarding] Google Drive access failed for ${clientId}:`, driveErr.message);
    }

    // Also check DB for any stored company info
    const db = await getDb();
    let dbCompanyInfo = "";
    if (db) {
      const company = await safeDbQuery("getCompanyInfo", async () => {
        const [result] = await db.select().from(ivyClients).where(eq(ivyClients.clientId, clientId)).limit(1);
        return result;
      });
      if (company) {
        dbCompanyInfo = `
Company Name: ${(company as any).companyName || (company as any).company_name}
Industry: ${(company as any).industry || "Not specified"}
Contact: ${(company as any).contactName || (company as any).contact_name || "Not specified"}
Email: ${(company as any).contactEmail || (company as any).contact_email || "Not specified"}
Website: ${(company as any).website || "Not specified"}
Notes: ${(company as any).notes || "None"}`;
      }
    }

    // Analyze with LLM
    const analysisPrompt = `Eres un analista de marketing estratégico. Analiza la siguiente información de la empresa y genera un perfil completo.

INFORMACIÓN DE LA EMPRESA:
${dbCompanyInfo}

DOCUMENTOS DE GOOGLE DRIVE:
${documentsContent || "No se encontraron documentos en Google Drive. Genera el perfil basándote en la información disponible y el nombre de la empresa."}

Genera un análisis JSON con esta estructura exacta:
{
  "industry": "Industria principal de la empresa",
  "products": ["Lista de productos principales"],
  "services": ["Lista de servicios principales"],
  "targetMarket": "Descripción del mercado objetivo",
  "brandVoice": "Tono de comunicación recomendado (formal/casual/técnico/etc)",
  "competitors": ["Principales competidores conocidos o probables"],
  "uniqueSellingPoints": ["Puntos de venta únicos"],
  "documentsSummary": "Resumen ejecutivo de toda la información analizada en 2-3 párrafos"
}

Responde SOLO con el JSON, sin markdown ni texto adicional.`;

    let analysisResult: string | null = null;
    
    if (isGeminiConfigured()) {
      analysisResult = await invokeGemini([
        { role: "system", content: "Eres un analista de marketing. Responde solo con JSON válido." },
        { role: "user", content: analysisPrompt },
      ]);
    }
    
    if (!analysisResult) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un analista de marketing. Responde solo con JSON válido." },
          { role: "user", content: analysisPrompt },
        ],
      });
      analysisResult = llmResult?.choices?.[0]?.message?.content || null;
    }

    let profile: CompanyProfile = {
      companyName,
      clientId,
      industry: "General",
      products: [],
      services: [],
      targetMarket: "Mercado general",
      brandVoice: "profesional",
      competitors: [],
      uniqueSellingPoints: [],
      documentsSummary: "Perfil generado automáticamente",
    };

    if (analysisResult) {
      const parsed = safeJsonParse(analysisResult, 'companyProfileAnalysis');
      if (parsed) {
        profile = {
          ...profile,
          industry: parsed.industry || profile.industry,
          products: parsed.products || profile.products,
          services: parsed.services || profile.services,
          targetMarket: parsed.targetMarket || profile.targetMarket,
          brandVoice: parsed.brandVoice || profile.brandVoice,
          competitors: parsed.competitors || profile.competitors,
          uniqueSellingPoints: parsed.uniqueSellingPoints || profile.uniqueSellingPoints,
          documentsSummary: parsed.documentsSummary || profile.documentsSummary,
        };
      }
    }

    // Save profile to company notes
    if (db) {
      const profileSummary = `PERFIL DE EMPRESA (Auto-generado por ROPA)\n\n` +
        `Industria: ${profile.industry}\n` +
        `Productos: ${profile.products.join(", ") || "N/A"}\n` +
        `Servicios: ${profile.services.join(", ") || "N/A"}\n` +
        `Mercado Objetivo: ${profile.targetMarket}\n` +
        `Tono de Marca: ${profile.brandVoice}\n` +
        `Competidores: ${profile.competitors.join(", ") || "N/A"}\n` +
        `USPs: ${profile.uniqueSellingPoints.join(", ") || "N/A"}\n\n` +
        `Resumen: ${profile.documentsSummary}`;

      await safeDbMutation("saveProfile", 
        async () => db.update(ivyClients).set({ notes: profileSummary }).where(eq(ivyClients.clientId, clientId)),
        async () => db.execute(sql`UPDATE ivy_clients SET notes = ${profileSummary} WHERE client_id = ${clientId}`)
      );
    }

    await updateRopaTaskStatus(taskId, "completed", { profile });
    
    await createRopaLog({
      level: "info",
      message: `[Onboarding] Company profile analyzed: ${companyName} - Industry: ${profile.industry}`,
    });

    return profile;
  } catch (err: any) {
    console.error(`[Onboarding] Analysis failed for ${companyName}:`, err.message);
    await updateRopaTaskStatus(taskId, "failed", { error: err.message });
    return null;
  }
}

// ============ PROTOCOL 1b: AUTO-GENERATE CAMPAIGNS ============

/**
 * Generate marketing campaigns based on company profile
 */
export async function generateCampaignsFromProfile(profile: CompanyProfile): Promise<CampaignPlan[]> {
  try {
    await createRopaLog({
      level: "info",
      message: `[Onboarding] Generating campaigns for ${profile.companyName} based on profile analysis`,
    });

    const campaignPrompt = `Eres un director de marketing digital. Basándote en el siguiente perfil de empresa, genera un plan de campañas de marketing.

PERFIL DE EMPRESA:
- Nombre: ${profile.companyName}
- Industria: ${profile.industry}
- Productos: ${profile.products.join(", ") || "No especificados"}
- Servicios: ${profile.services.join(", ") || "No especificados"}
- Mercado Objetivo: ${profile.targetMarket}
- Tono de Marca: ${profile.brandVoice}
- USPs: ${profile.uniqueSellingPoints.join(", ") || "No especificados"}
- Competidores: ${profile.competitors.join(", ") || "No identificados"}

Genera exactamente 3 campañas de marketing con esta estructura JSON:
[
  {
    "name": "Nombre descriptivo de la campaña",
    "type": "email|phone|social_media|multi_channel",
    "channel": "Canal principal (Email, Teléfono, LinkedIn, Multi-canal)",
    "objective": "Objetivo específico de la campaña",
    "targetAudience": "Audiencia objetivo específica",
    "timeline": "Duración (ej: 4 semanas)",
    "daysFromNow": 0,
    "durationDays": 28,
    "tasks": [
      {
        "title": "Título de la tarea",
        "description": "Descripción detallada",
        "priority": "high|medium|low",
        "dayOffset": 0,
        "phase": "Fase 1: Preparación"
      }
    ],
    "drafts": [
      {
        "type": "email|sms|call_script",
        "subject": "Asunto del email o título del guión",
        "body": "Contenido completo del borrador en español",
        "recipientType": "Tipo de destinatario (ej: CEO, Director de Compras)"
      }
    ]
  }
]

Cada campaña debe tener al menos 4 tareas y 2 borradores (email/SMS/guión de llamada).
Las campañas deben ser progresivas: la primera empieza inmediatamente, la segunda en 2 semanas, la tercera en 4 semanas.
Responde SOLO con el JSON array, sin markdown.`;

    let campaignResult: string | null = null;
    
    if (isGeminiConfigured()) {
      campaignResult = await invokeGemini([
        { role: "system", content: "Eres un director de marketing digital. Responde solo con JSON válido." },
        { role: "user", content: campaignPrompt },
      ]);
    }
    
    if (!campaignResult) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un director de marketing digital. Responde solo con JSON válido." },
          { role: "user", content: campaignPrompt },
        ],
      });
      campaignResult = llmResult?.choices?.[0]?.message?.content || null;
    }

    if (!campaignResult) {
      console.warn("[Onboarding] LLM returned no campaign plans");
      return getDefaultCampaignPlans(profile);
    }

    try {
      const parsed = safeJsonParse(campaignResult, 'campaignGeneration');
      
      if (!parsed || !Array.isArray(parsed)) {
        return getDefaultCampaignPlans(profile);
      }

      const now = new Date();
      return parsed.map((c: any) => ({
        name: c.name || `Campaña ${profile.companyName}`,
        type: c.type || "email",
        channel: c.channel || "Email",
        objective: c.objective || "Generar leads",
        targetAudience: c.targetAudience || profile.targetMarket,
        timeline: c.timeline || "4 semanas",
        startDate: new Date(now.getTime() + (c.daysFromNow || 0) * 86400000),
        endDate: new Date(now.getTime() + ((c.daysFromNow || 0) + (c.durationDays || 28)) * 86400000),
        tasks: (c.tasks || []).map((t: any) => ({
          title: t.title || "Tarea",
          description: t.description || "",
          priority: t.priority || "medium",
          dueDate: new Date(now.getTime() + (t.dayOffset || 0) * 86400000),
          phase: t.phase || "Fase 1",
        })),
        drafts: (c.drafts || []).map((d: any) => ({
          type: d.type || "email",
          subject: d.subject || "Sin asunto",
          body: d.body || "",
          recipientType: d.recipientType || "General",
        })),
      }));
    } catch (parseErr) {
      console.warn("[Onboarding] Failed to parse campaign plans:", parseErr);
      return getDefaultCampaignPlans(profile);
    }
  } catch (err: any) {
    console.error("[Onboarding] Campaign generation failed:", err.message);
    return getDefaultCampaignPlans(profile);
  }
}

/**
 * Default campaign plans when LLM fails
 */
function getDefaultCampaignPlans(profile: CompanyProfile): CampaignPlan[] {
  const now = new Date();
  return [
    {
      name: `Introducción ${profile.companyName} - Email`,
      type: "email",
      channel: "Email",
      objective: `Presentar ${profile.companyName} y sus servicios al mercado objetivo`,
      targetAudience: profile.targetMarket,
      timeline: "4 semanas",
      startDate: now,
      endDate: new Date(now.getTime() + 28 * 86400000),
      tasks: [
        { title: "Definir lista de contactos", description: "Recopilar emails del mercado objetivo", priority: "high", dueDate: new Date(now.getTime() + 2 * 86400000), phase: "Fase 1: Preparación" },
        { title: "Redactar copy de email", description: "Crear contenido persuasivo para el email de presentación", priority: "high", dueDate: new Date(now.getTime() + 5 * 86400000), phase: "Fase 1: Preparación" },
        { title: "Diseñar template HTML", description: "Crear template visual con branding de la empresa", priority: "medium", dueDate: new Date(now.getTime() + 7 * 86400000), phase: "Fase 2: Diseño" },
        { title: "Enviar primer lote", description: "Enviar emails al primer segmento", priority: "high", dueDate: new Date(now.getTime() + 10 * 86400000), phase: "Fase 3: Ejecución" },
        { title: "Analizar métricas", description: "Revisar tasas de apertura y click", priority: "medium", dueDate: new Date(now.getTime() + 14 * 86400000), phase: "Fase 4: Análisis" },
      ],
      drafts: [
        { type: "email", subject: `Descubre cómo ${profile.companyName} puede transformar tu negocio`, body: `Estimado/a [Nombre],\n\nEn ${profile.companyName} nos especializamos en ${profile.industry}. Nos gustaría presentarle nuestras soluciones que pueden ayudar a su empresa.\n\n${profile.uniqueSellingPoints.join("\n")}\n\n¿Le gustaría agendar una llamada de 15 minutos?\n\nSaludos cordiales,\nEquipo ${profile.companyName}`, recipientType: "Director/CEO" },
        { type: "sms", subject: `SMS Intro ${profile.companyName}`, body: `Hola [Nombre], somos ${profile.companyName}. Nos especializamos en ${profile.industry}. ¿Podemos enviarle más información? Responda SI para más detalles.`, recipientType: "Contacto principal" },
      ],
    },
    {
      name: `Seguimiento Telefónico ${profile.companyName}`,
      type: "phone",
      channel: "Teléfono",
      objective: "Seguimiento a prospectos que mostraron interés en la campaña de email",
      targetAudience: "Prospectos que abrieron el email",
      timeline: "2 semanas",
      startDate: new Date(now.getTime() + 14 * 86400000),
      endDate: new Date(now.getTime() + 28 * 86400000),
      tasks: [
        { title: "Identificar prospectos calientes", description: "Filtrar contactos que abrieron el email o hicieron click", priority: "high", dueDate: new Date(now.getTime() + 14 * 86400000), phase: "Fase 1: Preparación" },
        { title: "Preparar guión de llamada", description: "Crear script de llamada personalizado", priority: "high", dueDate: new Date(now.getTime() + 15 * 86400000), phase: "Fase 1: Preparación" },
        { title: "Realizar llamadas", description: "Ejecutar llamadas de seguimiento", priority: "critical", dueDate: new Date(now.getTime() + 18 * 86400000), phase: "Fase 2: Ejecución" },
        { title: "Registrar resultados", description: "Documentar respuestas y próximos pasos", priority: "medium", dueDate: new Date(now.getTime() + 21 * 86400000), phase: "Fase 3: Seguimiento" },
      ],
      drafts: [
        { type: "call_script", subject: `Guión de llamada - ${profile.companyName}`, body: `Buenos días/tardes, mi nombre es [Agente] de ${profile.companyName}.\n\nLe llamo porque recientemente le enviamos información sobre nuestros servicios de ${profile.industry} y queríamos saber si tuvo oportunidad de revisarla.\n\n[Si SÍ]: Excelente, ¿qué le pareció? ¿Hay algún servicio que le interese particularmente?\n[Si NO]: No se preocupe, le resumo brevemente: ${profile.uniqueSellingPoints[0] || "ofrecemos soluciones innovadoras"}.\n\n¿Le gustaría agendar una reunión para discutir cómo podemos ayudarle?`, recipientType: "Prospecto interesado" },
      ],
    },
    {
      name: `Campaña Multi-canal ${profile.companyName}`,
      type: "multi_channel",
      channel: "Multi-canal",
      objective: "Campaña integral combinando email, teléfono y redes sociales",
      targetAudience: profile.targetMarket,
      timeline: "6 semanas",
      startDate: new Date(now.getTime() + 28 * 86400000),
      endDate: new Date(now.getTime() + 70 * 86400000),
      tasks: [
        { title: "Planificar estrategia multi-canal", description: "Definir mensajes y timing por canal", priority: "high", dueDate: new Date(now.getTime() + 28 * 86400000), phase: "Fase 1: Estrategia" },
        { title: "Crear contenido para redes sociales", description: "Diseñar posts para LinkedIn y otras plataformas", priority: "medium", dueDate: new Date(now.getTime() + 32 * 86400000), phase: "Fase 2: Contenido" },
        { title: "Lanzar campaña coordinada", description: "Ejecutar envíos simultáneos en todos los canales", priority: "critical", dueDate: new Date(now.getTime() + 35 * 86400000), phase: "Fase 3: Lanzamiento" },
        { title: "Medir ROI por canal", description: "Analizar rendimiento de cada canal y optimizar", priority: "high", dueDate: new Date(now.getTime() + 49 * 86400000), phase: "Fase 4: Optimización" },
      ],
      drafts: [
        { type: "email", subject: `Caso de éxito: Cómo ${profile.companyName} ayudó a [Cliente]`, body: `Estimado/a [Nombre],\n\nQueremos compartir con usted un caso de éxito reciente.\n\n[Descripción del caso]\n\nResultados obtenidos:\n- [Resultado 1]\n- [Resultado 2]\n- [Resultado 3]\n\n¿Le gustaría obtener resultados similares?\n\nSaludos,\nEquipo ${profile.companyName}`, recipientType: "Decisor de compra" },
        { type: "sms", subject: `SMS Follow-up ${profile.companyName}`, body: `[Nombre], ${profile.companyName} tiene una oferta especial para su empresa. Visite [URL] o responda para más info.`, recipientType: "Prospecto calificado" },
      ],
    },
  ];
}

// ============ PROTOCOL 2: PERSIST CAMPAIGNS, TASKS, DRAFTS TO DB ============

/**
 * Save generated campaigns, tasks, and drafts to the database
 */
export async function persistCampaignPlan(
  profile: CompanyProfile,
  campaigns: CampaignPlan[]
): Promise<{ campaignsCreated: number; tasksCreated: number; draftsCreated: number }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Onboarding] Database not available for persisting campaigns");
    return { campaignsCreated: 0, tasksCreated: 0, draftsCreated: 0 };
  }

  let campaignsCreated = 0;
  let tasksCreated = 0;
  let draftsCreated = 0;

  for (const campaign of campaigns) {
    try {
      // Create campaign in sales_campaigns
      await safeDbMutation("insertCampaign",
        async () => db.insert(salesCampaigns).values({
          name: campaign.name,
          type: campaign.type,
          status: "draft",
          targetAudience: profile.companyName,
          content: `${campaign.objective}\n\nCanal: ${campaign.channel}\nTimeline: ${campaign.timeline}\nAudiencia: ${campaign.targetAudience}`,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          createdBy: "ROPA-Onboarding",
        }),
        async () => db.execute(sql`INSERT INTO sales_campaigns (name, type, status, target_audience, content, start_date, end_date, created_by) VALUES (${campaign.name}, ${campaign.type}, 'draft', ${profile.companyName}, ${campaign.objective}, ${campaign.startDate}, ${campaign.endDate}, 'ROPA-Onboarding')`)
      );
      campaignsCreated++;

      // Create tasks in ropa_tasks
      for (const task of campaign.tasks) {
        const taskId = `onboard_task_${profile.clientId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        try {
          await createRopaTask({
            taskId,
            type: "campaign_task",
            status: "pending",
            priority: task.priority,
            input: {
              company: profile.companyName,
              clientId: profile.clientId,
              campaign: campaign.name,
              title: task.title,
              description: task.description,
              phase: task.phase,
              dueDate: task.dueDate.toISOString(),
            },
          });
          tasksCreated++;
        } catch (e) {
          console.warn(`[Onboarding] Failed to create task: ${task.title}`);
        }
      }

      // BRAND FIREWALL: Create drafts with company-specific HTML templates
      for (const draft of campaign.drafts) {
        const draftId = `onboard_draft_${profile.clientId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        try {
          // Generate brand-specific HTML for the draft
          let htmlContent = '';
          try {
            if (draft.type === 'email' || !draft.type) {
              const brandResult = await generateBrandedEmailHtml({
                companyName: profile.companyName,
                subject: draft.subject,
                body: draft.body,
              });
              htmlContent = brandResult.html;
              if (!brandResult.coherenceCheck) {
                console.warn(`[Onboarding] ⚠️ Brand coherence failed for ${profile.companyName} draft: ${draft.subject}`);
              }
            } else if (draft.type === 'sms') {
              htmlContent = await generateBrandedSmsTemplate({
                companyName: profile.companyName,
                body: draft.body,
              });
            } else if (draft.type === 'call_script') {
              htmlContent = await generateBrandedCallScript({
                companyName: profile.companyName,
                body: draft.body,
                campaignName: campaign.name,
              });
            }
          } catch (brandErr) {
            console.warn(`[Onboarding] Brand Firewall error for ${profile.companyName}:`, brandErr);
          }

          await safeDbMutation("insertDraft",
            async () => db.insert(emailDrafts).values({
              draftId,
              company: profile.companyName,
              campaign: campaign.name,
              subject: draft.subject,
              body: draft.body,
              htmlContent: htmlContent || undefined,
              status: "pending",
              createdBy: "ROPA-Onboarding",
            }),
            async () => db.execute(sql`INSERT INTO email_drafts (draft_id, company, campaign, subject, body, html_content, status, created_by) VALUES (${draftId}, ${profile.companyName}, ${campaign.name}, ${draft.subject}, ${draft.body}, ${htmlContent || ''}, 'pending', 'ROPA-Onboarding')`)
          );
          draftsCreated++;
        } catch (e) {
          console.warn(`[Onboarding] Failed to create draft: ${draft.subject}`);
        }
      }

      // BRAND FIREWALL: Also create campaign_content entries with branded HTML
      for (const draft of campaign.drafts) {
        try {
          // Generate brand-specific HTML for campaign_content too
          let contentHtml = '';
          try {
            if (draft.type === 'email' || !draft.type) {
              const brandResult = await generateBrandedEmailHtml({
                companyName: profile.companyName,
                subject: draft.subject,
                body: draft.body,
              });
              contentHtml = brandResult.html;
            }
          } catch (e) { /* fallback: no html */ }

          await safeDbMutation("insertCampaignContent",
            async () => db.insert(campaignContent).values({
              companyName: profile.companyName,
              contentType: draft.type === "call_script" ? "call_script" : draft.type === "sms" ? "sms" : "email",
              subject: draft.subject,
              body: draft.body,
              htmlContent: contentHtml || undefined,
              status: "pending",
              targetRecipients: draft.recipientType,
            }),
            async () => db.execute(sql`INSERT INTO campaign_content (company_name, content_type, subject, body, html_content, status, target_recipients) VALUES (${profile.companyName}, ${draft.type === "call_script" ? "call_script" : draft.type === "sms" ? "sms" : "email"}, ${draft.subject}, ${draft.body}, ${contentHtml || ''}, 'pending', ${draft.recipientType})`)
          );
        } catch (e) {
          console.warn(`[Onboarding] Failed to create campaign content for: ${draft.subject}`);
        }
      }
    } catch (err: any) {
      console.warn(`[Onboarding] Failed to persist campaign ${campaign.name}:`, err.message);
    }
  }

  await createRopaLog({
    level: "info",
    message: `[Onboarding] Persisted for ${profile.companyName}: ${campaignsCreated} campaigns, ${tasksCreated} tasks, ${draftsCreated} drafts`,
  });

  return { campaignsCreated, tasksCreated, draftsCreated };
}

// ============ PROTOCOL 2B: MARKET ALERTS ============

/**
 * Generate market intelligence alerts for a company
 */
export async function generateMarketAlerts(profile: CompanyProfile): Promise<number> {
  let alertsCreated = 0;

  try {
    const alertPrompt = `Eres un analista de inteligencia de mercado. Para la empresa ${profile.companyName} en la industria ${profile.industry}, genera 2-3 alertas de mercado relevantes.

Perfil: ${profile.documentsSummary}
Competidores: ${profile.competitors.join(", ") || "No identificados"}

Genera un JSON array con alertas:
[
  {
    "severity": "info|warning",
    "title": "Título corto de la alerta",
    "message": "Descripción detallada de la tendencia o cambio de mercado y cómo afecta a la empresa",
    "recommendation": "Acción recomendada para ajustar la estrategia"
  }
]

Responde SOLO con el JSON array.`;

    let alertResult: string | null = null;
    
    if (isGeminiConfigured()) {
      alertResult = await invokeGemini([
        { role: "system", content: "Eres un analista de mercado. Responde solo con JSON válido." },
        { role: "user", content: alertPrompt },
      ]);
    }
    
    if (!alertResult) {
      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: "Eres un analista de mercado. Responde solo con JSON válido." },
          { role: "user", content: alertPrompt },
        ],
      });
      alertResult = llmResult?.choices?.[0]?.message?.content || null;
    }

    if (alertResult) {
      try {
        const alerts = safeJsonParse(alertResult, 'marketAlerts');
        
        if (alerts && Array.isArray(alerts)) {
          for (const alert of alerts) {
            await createRopaAlert({
              severity: alert.severity === "warning" ? "warning" : "info",
              title: `[${profile.companyName}] ${alert.title}`,
              message: `${alert.message}\n\nRecomendación: ${alert.recommendation || "Revisar estrategia"}`,
              resolved: false,
              metadata: {
                company: profile.companyName,
                clientId: profile.clientId,
                type: "market_intelligence",
                recommendation: alert.recommendation,
              },
            });
            alertsCreated++;
          }
        }
      } catch (parseErr) {
        console.warn("[Onboarding] Failed to parse market alerts:", parseErr);
      }
    }

    // Always create at least one onboarding alert
    if (alertsCreated === 0) {
      await createRopaAlert({
        severity: "info",
        title: `[${profile.companyName}] Onboarding completado`,
        message: `Se ha completado el onboarding de ${profile.companyName}. Se han generado campañas, tareas y borradores de comunicación. Revise la sección de Monitor para aprobar los borradores.`,
        resolved: false,
        metadata: {
          company: profile.companyName,
          clientId: profile.clientId,
          type: "onboarding_complete",
        },
      });
      alertsCreated++;
    }
  } catch (err: any) {
    console.warn("[Onboarding] Market alert generation failed:", err.message);
  }

  return alertsCreated;
}

// ============ PROTOCOL 3: CALENDAR SYNC & DRAG-DROP PROPAGATION ============

/**
 * When a campaign is moved in the calendar (drag-and-drop), propagate changes
 */
export async function propagateCalendarChange(
  campaignId: number,
  newStartDate: Date,
  newStatus?: string
): Promise<{ success: boolean; message: string; affectedTasks: number; affectedDrafts: number }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available", affectedTasks: 0, affectedDrafts: 0 };

  try {
    // Get the campaign
    const campaign = await safeDbQuery("getCampaign", async () => {
      const [result] = await db.select().from(salesCampaigns).where(eq(salesCampaigns.id, campaignId)).limit(1);
      return result;
    });

    if (!campaign) {
      return { success: false, message: "Campaign not found", affectedTasks: 0, affectedDrafts: 0 };
    }

    const oldStartDate = (campaign as any).startDate || (campaign as any).start_date;
    const oldEndDate = (campaign as any).endDate || (campaign as any).end_date;
    const campaignName = (campaign as any).name;
    const companyName = (campaign as any).targetAudience || (campaign as any).target_audience;

    // Calculate date shift
    const dateShiftMs = oldStartDate ? newStartDate.getTime() - new Date(oldStartDate).getTime() : 0;
    const dateShiftDays = Math.round(dateShiftMs / 86400000);

    // Update campaign dates
    const newEndDate = oldEndDate ? new Date(new Date(oldEndDate).getTime() + dateShiftMs) : new Date(newStartDate.getTime() + 28 * 86400000);
    
    const updateData: any = { startDate: newStartDate, endDate: newEndDate };
    if (newStatus) {
      updateData.status = newStatus;
    }

    await safeDbMutation("updateCampaignDates",
      async () => db.update(salesCampaigns).set(updateData).where(eq(salesCampaigns.id, campaignId)),
      async () => db.execute(sql`UPDATE sales_campaigns SET start_date = ${newStartDate}, end_date = ${newEndDate}${newStatus ? sql`, status = ${newStatus}` : sql``} WHERE id = ${campaignId}`)
    );

    // Update related tasks (shift due dates)
    let affectedTasks = 0;
    if (dateShiftDays !== 0) {
      const tasks = await safeDbQuery("getRelatedTasks", async () => {
        return db.select().from(ropaTasks).where(
          like(ropaTasks.type, "campaign_task")
        );
      });

      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          const taskInput = typeof (task as any).input === "string" ? JSON.parse((task as any).input) : (task as any).input;
          if (taskInput?.campaign === campaignName && taskInput?.company === companyName) {
            if (taskInput.dueDate) {
              const newDueDate = new Date(new Date(taskInput.dueDate).getTime() + dateShiftMs);
              taskInput.dueDate = newDueDate.toISOString();
              await safeDbMutation("updateTaskDueDate",
                async () => db.update(ropaTasks).set({ input: taskInput }).where(eq(ropaTasks.id, (task as any).id))
              );
              affectedTasks++;
            }
          }
        }
      }
    }

    // Log the change
    await createRopaLog({
      level: "info",
      message: `[Calendar] Campaign "${campaignName}" moved by ${dateShiftDays} days. Updated ${affectedTasks} tasks.`,
      metadata: { campaignId, dateShiftDays, newStartDate, newEndDate },
    });

    // Create viability alert if shift is significant
    if (Math.abs(dateShiftDays) > 7) {
      await createRopaAlert({
        severity: "warning",
        title: `[${companyName}] Cambio significativo en calendario`,
        message: `La campaña "${campaignName}" fue movida ${Math.abs(dateShiftDays)} días ${dateShiftDays > 0 ? "hacia adelante" : "hacia atrás"}. Esto puede afectar el rendimiento esperado. Se recomienda revisar los KPIs y ajustar la estrategia.`,
        resolved: false,
        metadata: {
          company: companyName,
          campaign: campaignName,
          dateShiftDays,
          type: "calendar_change",
        },
      });
    }

    // Notify owner
    try {
      await notifyOwner({
        title: `Calendario actualizado: ${campaignName}`,
        content: `La campaña "${campaignName}" de ${companyName} fue reprogramada ${dateShiftDays > 0 ? "+" : ""}${dateShiftDays} días. ${affectedTasks} tareas actualizadas.`,
      });
    } catch (e) {
      // Notification is optional
    }

    return {
      success: true,
      message: `Campaña movida ${dateShiftDays} días. ${affectedTasks} tareas actualizadas.`,
      affectedTasks,
      affectedDrafts: 0,
    };
  } catch (err: any) {
    console.error("[Calendar] Propagation failed:", err.message);
    return { success: false, message: err.message, affectedTasks: 0, affectedDrafts: 0 };
  }
}

// ============ PROTOCOL 4: PROGRESS MONITORING ============

/**
 * Check campaign progress and generate KPI alerts
 */
export async function monitorCampaignProgress(companyName?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get all active campaigns (optionally filtered by company)
    let campaigns: any[] = [];
    if (companyName) {
      const result = await safeDbQuery("getActiveCampaigns", async () => {
        return db.select().from(salesCampaigns).where(
          and(
            eq(salesCampaigns.status, "active"),
            eq(salesCampaigns.targetAudience, companyName)
          )
        );
      });
      campaigns = Array.isArray(result) ? result : [];
    } else {
      const result = await safeDbQuery("getAllActiveCampaigns", async () => {
        return db.select().from(salesCampaigns).where(eq(salesCampaigns.status, "active"));
      });
      campaigns = Array.isArray(result) ? result : [];
    }

    for (const campaign of campaigns) {
      const cName = (campaign as any).name;
      const cCompany = (campaign as any).targetAudience || (campaign as any).target_audience;
      const startDate = (campaign as any).startDate || (campaign as any).start_date;
      const endDate = (campaign as any).endDate || (campaign as any).end_date;

      if (!startDate || !endDate) continue;

      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDuration = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

      // Check for overdue campaigns
      if (now > end) {
        await createRopaAlert({
          severity: "warning",
          title: `[${cCompany}] Campaña vencida: ${cName}`,
          message: `La campaña "${cName}" venció el ${end.toLocaleDateString("es-ES")}. Considere completarla o extender el plazo.`,
          resolved: false,
          metadata: { company: cCompany, campaign: cName, type: "campaign_overdue", progressPercent: 100 },
        });
      }

      // Record progress metric
      await recordRopaMetric({
        metricType: "campaign_progress",
        value: String(progressPercent),
        unit: "percent",
        metadata: { company: cCompany, campaign: cName, startDate, endDate },
      });
    }

    await createRopaLog({
      level: "info",
      message: `[Monitor] Progress check completed for ${campaigns.length} active campaigns${companyName ? ` (${companyName})` : ""}`,
    });
  } catch (err: any) {
    console.warn("[Monitor] Progress monitoring failed:", err.message);
  }
}

// ============ MAIN ORCHESTRATOR ============

/**
 * Full autonomous onboarding for a company
 * Called after company creation or on-demand for existing companies
 */
export async function runFullOnboarding(clientId: string, companyName: string): Promise<OnboardingResult> {
  const masterTaskId = `onboard_${clientId}_${Date.now()}`;
  const errors: string[] = [];

  await createRopaTask({
    taskId: masterTaskId,
    type: "company_onboarding",
    status: "running",
    priority: "critical",
    input: { clientId, companyName },
  });

  await createRopaLog({
    level: "info",
    message: `[Onboarding] Starting full onboarding for ${companyName} (${clientId})`,
  });

  // Step 1: Analyze company from Google Drive + DB
  const profile = await analyzeCompanyFromDrive(clientId, companyName);
  if (!profile) {
    errors.push("Profile analysis failed - using defaults");
  }

  const effectiveProfile: CompanyProfile = profile || {
    companyName,
    clientId,
    industry: "General",
    products: [],
    services: [],
    targetMarket: "Mercado general",
    brandVoice: "profesional",
    competitors: [],
    uniqueSellingPoints: [],
    documentsSummary: "Perfil por defecto",
  };

  // Step 2: Generate campaign plans
  const campaignPlans = await generateCampaignsFromProfile(effectiveProfile);

  // Step 3: Persist to database
  const { campaignsCreated, tasksCreated, draftsCreated } = await persistCampaignPlan(effectiveProfile, campaignPlans);

  // Step 4: Generate market alerts
  const alertsCreated = await generateMarketAlerts(effectiveProfile);

  // Step 5: Save onboarding config
  await setRopaConfig(`onboarding_${clientId}`, {
    completedAt: new Date(),
    profile: effectiveProfile,
    campaignsCreated,
    tasksCreated,
    draftsCreated,
    alertsCreated,
  });

  // Step 6: Notify owner
  try {
    await notifyOwner({
      title: `Onboarding completado: ${companyName}`,
      content: `ROPA ha completado el onboarding de ${companyName}:\n- ${campaignsCreated} campañas generadas\n- ${tasksCreated} tareas creadas\n- ${draftsCreated} borradores para aprobación\n- ${alertsCreated} alertas de mercado\n\nRevise la sección de Monitor para aprobar los borradores.`,
    });
  } catch (e) {
    // Optional
  }

  await updateRopaTaskStatus(masterTaskId, "completed", {
    campaignsCreated,
    tasksCreated,
    draftsCreated,
    alertsCreated,
    errors,
  });

  await createRopaLog({
    level: "info",
    message: `[Onboarding] Completed for ${companyName}: ${campaignsCreated} campaigns, ${tasksCreated} tasks, ${draftsCreated} drafts, ${alertsCreated} alerts`,
  });

  return {
    success: true,
    companyName,
    clientId,
    profile: effectiveProfile,
    campaignsCreated,
    tasksCreated,
    draftsCreated,
    alertsCreated,
    errors,
  };
}

/**
 * Onboard ALL existing companies that haven't been onboarded yet
 */
export async function onboardAllExistingCompanies(): Promise<{ onboarded: string[]; skipped: string[]; errors: string[] }> {
  const db = await getDb();
  if (!db) return { onboarded: [], skipped: [], errors: ["Database not available"] };

  const onboarded: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  try {
    const companies = await safeDbQuery("getAllCompanies", async () => {
      return db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt));
    });

    if (!companies || !Array.isArray(companies)) {
      return { onboarded, skipped, errors: ["Could not fetch companies"] };
    }

    for (const company of companies) {
      const cId = (company as any).clientId || (company as any).client_id;
      const cName = (company as any).companyName || (company as any).company_name;

      if (!cId || !cName) continue;

      // Check if already onboarded
      const config = await getRopaConfig(`onboarding_${cId}`);
      if (config) {
        skipped.push(cName);
        continue;
      }

      try {
        await runFullOnboarding(cId, cName);
        onboarded.push(cName);
      } catch (err: any) {
        errors.push(`${cName}: ${err.message}`);
      }
    }

    await createRopaLog({
      level: "info",
      message: `[Onboarding] Batch onboarding: ${onboarded.length} onboarded, ${skipped.length} skipped, ${errors.length} errors`,
    });
  } catch (err: any) {
    errors.push(`Batch onboarding failed: ${err.message}`);
  }

  return { onboarded, skipped, errors };
}

// ============ PERIODIC MONITORING CYCLE ============

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start the 24/7 campaign monitoring cycle
 */
export function startCampaignMonitoringCycle() {
  if (monitoringInterval) clearInterval(monitoringInterval);

  // Run every 2 hours
  monitoringInterval = setInterval(async () => {
    try {
      await monitorCampaignProgress();
    } catch (err: any) {
      console.warn("[Monitor] Periodic monitoring failed:", err.message);
    }
  }, 2 * 60 * 60 * 1000);

  console.log("[Onboarding Engine] Campaign monitoring cycle started (every 2 hours)");
}

export function stopCampaignMonitoringCycle() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}
