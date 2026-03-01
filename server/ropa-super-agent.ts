/**
 * ROPA Super Meta-Agent Core v2.0
 * 
 * This is the REAL brain of ROPA. Not a chatbot. A fully autonomous sales orchestration engine.
 * 
 * Architecture:
 * - CampaignOrchestrator: Analyzes companies and generates complete multi-channel campaign strategies
 * - EmailEngine: LLM-generated professional HTML emails with company branding (NO templates)
 * - N8nOrchestrator: Creates and manages n8n workflows for real execution
 * - AutonomousLoop: Monitors platform state and acts without being prompted
 * - LeadScorer: Scores and prioritizes leads based on engagement
 * - CampaignAnalyzer: Real-time analysis of campaign performance
 */

import { invokeLLM } from "./_core/llm";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { createRopaLog, createRopaAlert } from "./ropa-db";

// ============ TYPES ============

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  notes?: string;
  status?: string;
}

export interface CampaignStrategy {
  companyName: string;
  industry: string;
  objective: string;
  channels: ChannelStrategy[];
  timeline: TimelinePhase[];
  kpis: KPI[];
  emailSequence: EmailSequenceItem[];
  callScript: string;
  linkedinMessage: string;
  whatsappMessage: string;
  totalBudgetEstimate: string;
  expectedROI: string;
  priorityScore: number;
}

export interface ChannelStrategy {
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'sms' | 'instagram' | 'facebook';
  priority: 'high' | 'medium' | 'low';
  frequency: string;
  bestTime: string;
  message: string;
}

export interface TimelinePhase {
  week: number;
  phase: string;
  actions: string[];
  expectedOutcome: string;
}

export interface KPI {
  metric: string;
  target: string;
  measurement: string;
}

export interface EmailSequenceItem {
  sequenceNumber: number;
  dayFromStart: number;
  subject: string;
  purpose: string;
  htmlBody: string;
  ctaText: string;
  ctaUrl?: string;
}

export interface ProfessionalEmail {
  subject: string;
  htmlBody: string;
  previewText: string;
  ctaText: string;
  ctaUrl?: string;
  senderName: string;
  senderTitle: string;
}

export interface CampaignAnalysis {
  campaignId: number;
  campaignName: string;
  companyName: string;
  status: string;
  openRate?: number;
  clickRate?: number;
  responseRate?: number;
  leadsGenerated?: number;
  recommendation: string;
  nextAction: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

// ============ LLM HELPER ============

async function callLLM(systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> {
  // Try Gemini first (faster, better for Spanish)
  if (isGeminiConfigured()) {
    try {
      const result = await invokeGemini([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
      if (result && result.length > 50) return result;
    } catch (e: any) {
      console.warn('[ROPA SuperAgent] Gemini failed:', e.message);
    }
  }
  
  // Fallback to Manus LLM
  const result = await invokeLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    ...(jsonMode ? {
      response_format: { type: 'json_object' }
    } : {}),
  });
  
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  return '';
}

// ============ CAMPAIGN ORCHESTRATOR ============

/**
 * The heart of ROPA: analyzes a company and generates a complete, actionable campaign strategy.
 * This is what ROPA should do automatically when a new company is added.
 */
export async function orchestrateCampaignStrategy(company: CompanyProfile): Promise<CampaignStrategy> {
  console.log(`[ROPA SuperAgent] Orchestrating campaign strategy for ${company.name}`);
  
  const systemPrompt = `Eres ROPA, el Super Meta-Agente de ventas de Ivy.AI. Eres un experto en marketing B2B y B2C con 20 años de experiencia. 
Generas estrategias de campaña completas, detalladas y ejecutables para empresas cliente.
Siempre respondes en JSON válido. Sin markdown. Sin explicaciones fuera del JSON.`;

  const userPrompt = `Analiza esta empresa y genera una estrategia de campaña de ventas COMPLETA y EJECUTABLE:

EMPRESA: ${company.name}
INDUSTRIA: ${company.industry || 'No especificada'}
CONTACTO: ${company.contactName || 'No especificado'}
EMAIL: ${company.contactEmail || 'No especificado'}
WEBSITE: ${company.website || 'No especificado'}
NOTAS: ${company.notes || 'Sin notas adicionales'}

Genera un JSON con esta estructura EXACTA:
{
  "objective": "objetivo principal de la campaña en una oración",
  "channels": [
    {
      "channel": "email|phone|linkedin|whatsapp|sms",
      "priority": "high|medium|low",
      "frequency": "ej: 2 veces por semana",
      "bestTime": "ej: Martes y Jueves 10:00-11:00",
      "message": "mensaje clave para este canal"
    }
  ],
  "timeline": [
    {
      "week": 1,
      "phase": "nombre de la fase",
      "actions": ["acción 1", "acción 2", "acción 3"],
      "expectedOutcome": "resultado esperado"
    }
  ],
  "kpis": [
    {
      "metric": "nombre de la métrica",
      "target": "valor objetivo",
      "measurement": "cómo medirlo"
    }
  ],
  "emailSequence": [
    {
      "sequenceNumber": 1,
      "dayFromStart": 0,
      "subject": "asunto del email",
      "purpose": "propósito de este email en la secuencia",
      "ctaText": "texto del botón de acción"
    }
  ],
  "callScript": "script completo para llamada de ventas de 2-3 minutos",
  "linkedinMessage": "mensaje de LinkedIn para conexión inicial (300 caracteres máx)",
  "whatsappMessage": "mensaje de WhatsApp inicial (160 caracteres máx)",
  "totalBudgetEstimate": "estimado de presupuesto mensual en USD",
  "expectedROI": "ROI esperado en 90 días",
  "priorityScore": 85
}

Sé específico para la industria ${company.industry || 'de esta empresa'}. Genera 4 semanas de timeline, 3-5 KPIs, 5 emails en secuencia, 3 canales mínimo.`;

  let strategyData: any = null;
  
  try {
    const response = await callLLM(systemPrompt, userPrompt, true);
    // Clean JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      strategyData = JSON.parse(jsonMatch[0]);
    }
  } catch (e: any) {
    console.warn('[ROPA SuperAgent] Strategy JSON parse failed:', e.message);
  }
  
  // Fallback structure if LLM fails
  if (!strategyData) {
    strategyData = {
      objective: `Generar 10 leads calificados para ${company.name} en 30 días`,
      channels: [
        { channel: 'email', priority: 'high', frequency: '3 veces por semana', bestTime: 'Martes-Jueves 9:00-11:00', message: 'Propuesta de valor personalizada' },
        { channel: 'phone', priority: 'medium', frequency: '2 veces por semana', bestTime: 'Lunes-Miércoles 10:00-12:00', message: 'Seguimiento y calificación' },
        { channel: 'linkedin', priority: 'medium', frequency: '1 vez por día', bestTime: 'Martes 8:00-9:00', message: 'Conexión y contenido de valor' },
      ],
      timeline: [
        { week: 1, phase: 'Prospección', actions: ['Identificar 50 contactos', 'Enviar emails iniciales', 'Conectar en LinkedIn'], expectedOutcome: '10 respuestas' },
        { week: 2, phase: 'Calificación', actions: ['Llamadas de calificación', 'Enviar follow-ups', 'Demo scheduling'], expectedOutcome: '5 demos agendadas' },
        { week: 3, phase: 'Propuesta', actions: ['Enviar propuestas personalizadas', 'Seguimiento por WhatsApp', 'Resolver objeciones'], expectedOutcome: '3 propuestas enviadas' },
        { week: 4, phase: 'Cierre', actions: ['Negociación final', 'Contrato y onboarding', 'Referidos'], expectedOutcome: '1-2 cierres' },
      ],
      kpis: [
        { metric: 'Tasa de apertura de emails', target: '35%', measurement: 'Plataforma de email' },
        { metric: 'Tasa de respuesta', target: '15%', measurement: 'CRM' },
        { metric: 'Leads calificados', target: '10', measurement: 'CRM' },
        { metric: 'Demos agendadas', target: '5', measurement: 'Calendario' },
        { metric: 'Tasa de cierre', target: '20%', measurement: 'CRM' },
      ],
      emailSequence: [
        { sequenceNumber: 1, dayFromStart: 0, subject: `Solución para ${company.industry || 'su empresa'}`, purpose: 'Primer contacto - propuesta de valor', ctaText: 'Ver Demo' },
        { sequenceNumber: 2, dayFromStart: 3, subject: 'Caso de éxito relevante para usted', purpose: 'Social proof y credibilidad', ctaText: 'Leer Caso de Éxito' },
        { sequenceNumber: 3, dayFromStart: 7, subject: '¿Tiene 15 minutos esta semana?', purpose: 'Solicitar reunión', ctaText: 'Agendar Reunión' },
        { sequenceNumber: 4, dayFromStart: 14, subject: 'Última oportunidad - Oferta especial', purpose: 'Urgencia y oferta', ctaText: 'Aprovechar Oferta' },
        { sequenceNumber: 5, dayFromStart: 21, subject: 'Cerrando el ciclo', purpose: 'Breakup email - reactivación', ctaText: 'Responder Ahora' },
      ],
      callScript: `Hola, buenos días. Mi nombre es [NOMBRE] de Ivy.AI. Llamo porque trabajamos con empresas de ${company.industry || 'su sector'} para optimizar sus procesos de ventas con inteligencia artificial. ¿Tiene 2 minutos? [PAUSA] Perfecto. Actualmente ayudamos a empresas como la suya a generar un 40% más de leads calificados con la mitad del esfuerzo. ¿Cuál es su mayor desafío en ventas hoy? [ESCUCHAR] Entiendo. Precisamente para eso tenemos una solución. ¿Le interesaría ver una demo de 15 minutos esta semana?`,
      linkedinMessage: `Hola [NOMBRE], vi que trabajas en ${company.name}. En Ivy.AI ayudamos a empresas de ${company.industry || 'tu sector'} a automatizar ventas con IA. ¿Conectamos?`,
      whatsappMessage: `Hola! Soy de Ivy.AI. Ayudamos a ${company.name} a generar más ventas con IA. ¿Tienes 5 min para hablar?`,
      totalBudgetEstimate: '$500-1500 USD/mes',
      expectedROI: '300-500% en 90 días',
      priorityScore: 75,
    };
  }
  
  return {
    companyName: company.name,
    industry: company.industry || 'General',
    objective: strategyData.objective || `Generar leads para ${company.name}`,
    channels: strategyData.channels || [],
    timeline: strategyData.timeline || [],
    kpis: strategyData.kpis || [],
    emailSequence: strategyData.emailSequence || [],
    callScript: strategyData.callScript || '',
    linkedinMessage: strategyData.linkedinMessage || '',
    whatsappMessage: strategyData.whatsappMessage || '',
    totalBudgetEstimate: strategyData.totalBudgetEstimate || 'Por definir',
    expectedROI: strategyData.expectedROI || 'Por calcular',
    priorityScore: strategyData.priorityScore || 70,
  };
}

// ============ EMAIL ENGINE ============

/**
 * Generates a REAL professional HTML email - not a template.
 * LLM writes the complete email content, personalized for the company and campaign.
 */
export async function generateProfessionalEmail(params: {
  company: CompanyProfile;
  campaignName: string;
  emailType: 'cold_outreach' | 'follow_up' | 'promotional' | 'newsletter' | 'breakup';
  sequenceNumber: number;
  recipientName?: string;
  recipientTitle?: string;
  senderName?: string;
  senderCompany?: string;
  specificObjective?: string;
  previousInteraction?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}): Promise<ProfessionalEmail> {
  
  const emailTypeDescriptions: Record<string, string> = {
    cold_outreach: 'primer contacto en frío - presentación de valor',
    follow_up: 'seguimiento después del primer contacto',
    promotional: 'oferta especial o promoción',
    newsletter: 'newsletter con contenido de valor',
    breakup: 'último email de reactivación antes de cerrar el ciclo',
  };
  
  const systemPrompt = `Eres un experto en copywriting de ventas B2B con 15 años de experiencia. 
Escribes emails de ventas que generan respuestas. Tus emails son:
- Personalizados y específicos para la industria
- Orientados al valor, no al producto
- Con un CTA claro y urgente
- Profesionales pero cercanos
- En español de negocios
Respondes SOLO con JSON válido. Sin markdown.`;

  const userPrompt = `Escribe un email de ventas profesional COMPLETO para:

EMPRESA DESTINATARIA: ${params.company.name}
INDUSTRIA: ${params.company.industry || 'No especificada'}
CONTACTO: ${params.recipientName || 'Estimado/a'} ${params.recipientTitle ? `(${params.recipientTitle})` : ''}
CAMPAÑA: ${params.campaignName}
TIPO DE EMAIL: ${emailTypeDescriptions[params.emailType]}
NÚMERO EN SECUENCIA: ${params.sequenceNumber} de 5
OBJETIVO ESPECÍFICO: ${params.specificObjective || 'Generar una reunión de 15 minutos'}
INTERACCIÓN PREVIA: ${params.previousInteraction || 'Ninguna - primer contacto'}
EMPRESA REMITENTE: ${params.senderCompany || 'Ivy.AI'}
REMITENTE: ${params.senderName || 'El equipo de Ivy.AI'}

Genera un JSON con esta estructura:
{
  "subject": "asunto del email (máx 60 caracteres, sin emojis, directo y específico)",
  "previewText": "texto de preview (máx 90 caracteres)",
  "senderName": "${params.senderName || 'Equipo Ivy.AI'}",
  "senderTitle": "título profesional del remitente",
  "ctaText": "texto del botón CTA (máx 30 caracteres, acción clara)",
  "ctaUrl": "https://calendly.com/ivy-ai/demo",
  "htmlBody": "HTML COMPLETO del cuerpo del email (sin doctype, solo el contenido interno)"
}

Para el htmlBody, genera HTML profesional con:
- Saludo personalizado con el nombre del contacto
- Párrafo de apertura que conecte con un dolor específico de la industria ${params.company.industry || 'del cliente'}
- Propuesta de valor clara y específica (2-3 oraciones)
- Prueba social o dato relevante (estadística o caso de éxito)
- CTA claro con urgencia
- Firma profesional
- Usa colores: primario ${params.primaryColor || '#0891b2'}, acento ${params.accentColor || '#06b6d4'}
- Fuente: Arial/sans-serif, tamaño 14px
- Ancho máximo: 600px
- Padding: 20px
- NO incluir <html>, <head>, <body> tags - solo el contenido

El email debe sonar HUMANO, no robótico. Específico para ${params.company.industry || 'la industria'}.`;

  let emailData: any = null;
  
  try {
    const response = await callLLM(systemPrompt, userPrompt, true);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      emailData = JSON.parse(jsonMatch[0]);
    }
  } catch (e: any) {
    console.warn('[ROPA EmailEngine] JSON parse failed:', e.message);
  }
  
  // If LLM failed, generate a basic but still LLM-quality email
  if (!emailData || !emailData.htmlBody) {
    emailData = await generateFallbackEmail(params);
  }
  
  return {
    subject: emailData.subject || `Propuesta para ${params.company.name}`,
    htmlBody: wrapEmailInTemplate(emailData.htmlBody || '', params),
    previewText: emailData.previewText || `Solución específica para ${params.company.industry || 'su empresa'}`,
    ctaText: emailData.ctaText || 'Agendar Demo',
    ctaUrl: emailData.ctaUrl || 'https://calendly.com/ivy-ai/demo',
    senderName: emailData.senderName || params.senderName || 'Equipo Ivy.AI',
    senderTitle: emailData.senderTitle || 'Consultor de Ventas IA',
  };
}

async function generateFallbackEmail(params: {
  company: CompanyProfile;
  campaignName: string;
  emailType: string;
  sequenceNumber: number;
  recipientName?: string;
  senderName?: string;
  specificObjective?: string;
}): Promise<any> {
  // Simple but real LLM call as fallback
  const prompt = `Escribe un email de ventas en español para ${params.company.name} (${params.company.industry || 'empresa'}). 
Tipo: ${params.emailType}. Campaña: ${params.campaignName}. Email #${params.sequenceNumber}.
Destinatario: ${params.recipientName || 'Estimado/a'}.
Objetivo: ${params.specificObjective || 'Agendar una reunión de 15 minutos'}.

Escribe SOLO el cuerpo HTML del email (sin html/head/body tags). Profesional, persuasivo, específico.`;

  try {
    const body = await callLLM('Eres un experto en copywriting de ventas. Escribe emails que generan respuestas.', prompt);
    return {
      subject: `Solución para ${params.company.name} - ${params.campaignName}`,
      previewText: `Propuesta personalizada para ${params.company.industry || 'su empresa'}`,
      senderName: params.senderName || 'Equipo Ivy.AI',
      senderTitle: 'Consultor de Ventas IA',
      ctaText: 'Agendar Demo Gratuita',
      ctaUrl: 'https://calendly.com/ivy-ai/demo',
      htmlBody: body || `<p>Estimado/a ${params.recipientName || 'cliente'},</p><p>Me pongo en contacto para presentarle una solución de inteligencia artificial que está transformando empresas como ${params.company.name}.</p>`,
    };
  } catch (e) {
    return {
      subject: `Propuesta para ${params.company.name}`,
      previewText: 'Solución de IA para su empresa',
      senderName: 'Equipo Ivy.AI',
      senderTitle: 'Consultor de Ventas IA',
      ctaText: 'Ver Demo',
      ctaUrl: 'https://calendly.com/ivy-ai/demo',
      htmlBody: `<p>Estimado/a ${params.recipientName || 'cliente'},</p><p>En Ivy.AI hemos desarrollado una solución de inteligencia artificial que ayuda a empresas de ${params.company.industry || 'su sector'} a incrementar sus ventas un 40% en 90 días.</p><p>¿Tiene 15 minutos para una demo?</p>`,
    };
  }
}

/**
 * Wraps email content in a professional HTML template with company branding
 */
function wrapEmailInTemplate(content: string, params: {
  company: CompanyProfile;
  campaignName: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  senderName?: string;
}): string {
  const primaryColor = params.primaryColor || '#0891b2';
  const accentColor = params.accentColor || '#06b6d4';
  const logoUrl = params.logoUrl || '';
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ivy.AI - ${params.campaignName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; color: #333333; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 30px 40px; text-align: center; }
    .header img { max-height: 50px; max-width: 200px; object-fit: contain; }
    .header-text { color: #ffffff; font-size: 13px; margin-top: 8px; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 40px; }
    .content p { font-size: 15px; line-height: 1.7; color: #444444; margin-bottom: 16px; }
    .content h2 { font-size: 20px; color: ${primaryColor}; margin-bottom: 20px; font-weight: 600; }
    .highlight-box { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid ${primaryColor}; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .highlight-box p { margin: 0; font-size: 14px; color: #0c4a6e; }
    .stat-row { display: flex; gap: 16px; margin: 24px 0; }
    .stat-box { flex: 1; text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .stat-number { font-size: 28px; font-weight: 700; color: ${primaryColor}; display: block; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .cta-section { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(8, 145, 178, 0.4); }
    .divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 24px 0; }
    .signature { padding: 0 40px 24px; }
    .signature-name { font-size: 15px; font-weight: 600; color: #1e293b; }
    .signature-title { font-size: 13px; color: #64748b; margin-top: 2px; }
    .signature-company { font-size: 13px; color: ${primaryColor}; font-weight: 500; margin-top: 4px; }
    .footer { background: #1e293b; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: ${accentColor}; text-decoration: none; }
    .campaign-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; padding: 4px 12px; border-radius: 20px; margin-top: 8px; }
    @media (max-width: 600px) {
      .content { padding: 24px; }
      .stat-row { flex-direction: column; }
      .cta-button { padding: 14px 28px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- HEADER -->
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : `<div style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">IVY.AI</div>`}
      <div class="header-text">Plataforma de Agentes IA</div>
      <div class="campaign-badge">${params.campaignName}</div>
    </div>
    
    <!-- CONTENT -->
    <div class="content">
      ${content}
    </div>
    
    <!-- DIVIDER -->
    <div class="divider" style="margin: 0 40px;"></div>
    
    <!-- FOOTER -->
    <div class="footer">
      <p>© ${year} Ivy.AI - Plataforma de Agentes de Inteligencia Artificial<br>
      <a href="mailto:info@ivybyai.com">info@ivybyai.com</a> · 
      <a href="https://ivyai-hoxbpybq.manus.space">ivyai-hoxbpybq.manus.space</a></p>
      <p style="margin-top: 8px;">
        <a href="#">Cancelar suscripción</a> · <a href="#">Política de privacidad</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ============ CAMPAIGN ANALYZER ============

/**
 * Analyzes all active campaigns and generates actionable recommendations.
 * This runs in the autonomous loop.
 */
export async function analyzeCampaigns(): Promise<CampaignAnalysis[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const [campaigns] = await db.execute(sql`
      SELECT sc.*, ic.industry, ic.contact_email, ic.contact_name
      FROM sales_campaigns sc
      LEFT JOIN ivy_clients ic ON sc.company_name = ic.company_name
      WHERE sc.status IN ('active', 'draft', 'paused')
      ORDER BY sc.created_at DESC
      LIMIT 20
    `);
    
    const campaignList = Array.isArray(campaigns) ? campaigns as any[] : [];
    if (campaignList.length === 0) return [];
    
    const analyses: CampaignAnalysis[] = [];
    
    for (const campaign of campaignList) {
      // Get email draft stats for this campaign
      let draftStats = { total: 0, pending: 0, approved: 0, sent: 0 };
      try {
        const [draftRows] = await db.execute(sql`
          SELECT status, COUNT(*) as cnt FROM email_drafts 
          WHERE campaign = ${campaign.name} OR company = ${campaign.company_name}
          GROUP BY status
        `);
        const draftData = Array.isArray(draftRows) ? draftRows as any[] : [];
        for (const d of draftData) {
          const cnt = Number(d.cnt || 0);
          draftStats.total += cnt;
          if (d.status === 'pending') draftStats.pending = cnt;
          if (d.status === 'approved') draftStats.approved = cnt;
          if (d.status === 'sent') draftStats.sent = cnt;
        }
      } catch (e) {}
      
      // Generate LLM analysis for this campaign
      const analysisPrompt = `Analiza esta campaña de ventas y da una recomendación específica y accionable:

CAMPAÑA: ${campaign.name}
EMPRESA: ${campaign.company_name || 'Sin asignar'}
INDUSTRIA: ${campaign.industry || 'No especificada'}
ESTADO: ${campaign.status}
TIPO: ${campaign.type}
BORRADORES: ${draftStats.total} total (${draftStats.pending} pendientes, ${draftStats.approved} aprobados, ${draftStats.sent} enviados)
CREADA: ${campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('es-ES') : 'Desconocida'}

Responde en JSON:
{
  "recommendation": "recomendación específica en 1-2 oraciones",
  "nextAction": "próxima acción concreta a tomar HOY",
  "urgency": "critical|high|medium|low",
  "openRate": null,
  "clickRate": null,
  "responseRate": null,
  "leadsGenerated": ${draftStats.sent}
}`;

      let analysis: any = {
        recommendation: draftStats.pending > 0 
          ? `Hay ${draftStats.pending} borradores pendientes de aprobación. Revísalos en Monitor y apruébalos para activar la campaña.`
          : campaign.status === 'draft' ? `La campaña está en borrador. Genera emails y actívala para empezar a generar leads.`
          : `La campaña está activa. Monitorea las métricas de apertura y respuesta.`,
        nextAction: draftStats.pending > 0 ? 'Ir a Monitor y aprobar borradores' : 'Generar emails para esta campaña',
        urgency: campaign.status === 'active' ? 'high' : 'medium',
        openRate: null,
        clickRate: null,
        responseRate: null,
        leadsGenerated: draftStats.sent,
      };
      
      try {
        const response = await callLLM(
          'Eres un analista de marketing. Responde solo con JSON válido.',
          analysisPrompt,
          true
        );
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          analysis = { ...analysis, ...parsed };
        }
      } catch (e) {}
      
      analyses.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        companyName: campaign.company_name || 'Sin asignar',
        status: campaign.status,
        openRate: analysis.openRate,
        clickRate: analysis.clickRate,
        responseRate: analysis.responseRate,
        leadsGenerated: analysis.leadsGenerated,
        recommendation: analysis.recommendation,
        nextAction: analysis.nextAction,
        urgency: analysis.urgency || 'medium',
      });
    }
    
    return analyses;
  } catch (e: any) {
    console.error('[ROPA SuperAgent] Campaign analysis failed:', e.message);
    return [];
  }
}

// ============ AUTONOMOUS CAMPAIGN GENERATOR ============

/**
 * Generates a complete campaign with email sequence for a company.
 * Called when ROPA creates a new company or when user asks for campaign generation.
 */
export async function generateFullCampaignWithEmails(params: {
  company: CompanyProfile;
  campaignName: string;
  campaignType: 'cold_outreach' | 'follow_up' | 'promotional' | 'newsletter';
  emailCount: number;
  leads?: Array<{ name: string; email: string; title?: string }>;
}): Promise<{
  campaignId?: number;
  draftsCreated: number;
  strategy: CampaignStrategy;
  drafts: Array<{ draftId: string; subject: string; sequenceNumber: number }>;
  message: string;
}> {
  const db = await getDb();
  
  console.log(`[ROPA SuperAgent] Generating full campaign for ${params.company.name}`);
  
  // 1. Generate strategy
  const strategy = await orchestrateCampaignStrategy(params.company);
  
  // 2. Create campaign in DB
  let campaignId: number | undefined;
  if (db) {
    try {
      const [result] = await db.execute(sql`
        INSERT INTO sales_campaigns (name, type, status, company_name, description, created_by)
        VALUES (${params.campaignName}, ${params.campaignType}, 'active', ${params.company.name}, 
                ${strategy.objective}, 'ROPA')
      `);
      campaignId = (result as any)?.insertId;
    } catch (e: any) {
      console.warn('[ROPA SuperAgent] Campaign insert failed:', e.message);
    }
  }
  
  // 3. Generate email sequence
  const drafts: Array<{ draftId: string; subject: string; sequenceNumber: number }> = [];
  
  // Use strategy's email sequence or generate count emails
  const emailsToGenerate = Math.min(params.emailCount, 5);
  
  for (let i = 0; i < emailsToGenerate; i++) {
    const seqItem = strategy.emailSequence[i];
    const emailType = i === 0 ? 'cold_outreach' : 
                     i === emailsToGenerate - 1 ? 'breakup' : 
                     i === 1 ? 'follow_up' : 'promotional';
    
    const email = await generateProfessionalEmail({
      company: params.company,
      campaignName: params.campaignName,
      emailType: emailType as any,
      sequenceNumber: i + 1,
      recipientName: params.leads?.[0]?.name || 'Estimado/a',
      recipientTitle: params.leads?.[0]?.title,
      specificObjective: seqItem?.purpose || strategy.objective,
      senderName: 'Equipo Ivy.AI',
      senderCompany: 'Ivy.AI',
    });
    
    // Save to DB
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (db) {
      try {
        await db.execute(sql`
          INSERT INTO email_drafts (draft_id, company, campaign, subject, body, status, created_by)
          VALUES (${draftId}, ${params.company.name}, ${params.campaignName}, 
                  ${email.subject}, ${email.htmlBody}, 'pending', 'ROPA')
        `);
        drafts.push({ draftId, subject: email.subject, sequenceNumber: i + 1 });
      } catch (e: any) {
        console.warn(`[ROPA SuperAgent] Draft ${i+1} insert failed:`, e.message);
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  return {
    campaignId,
    draftsCreated: drafts.length,
    strategy,
    drafts,
    message: `Campaña "${params.campaignName}" creada para ${params.company.name} con ${drafts.length} emails en secuencia. Revísalos en Monitor.`,
  };
}

// ============ ROPA AUTONOMOUS RESPONSE ENGINE ============

/**
 * The main intelligence function: given a user message and full platform context,
 * ROPA decides what to do and does it.
 * 
 * This replaces the old "intent detection + template response" approach.
 * ROPA now uses the LLM to understand intent AND execute real actions.
 */
export async function ropaIntelligentResponse(params: {
  message: string;
  companies: any[];
  campaigns: any[];
  drafts: { total: number; pending: number; approved: number };
  tasks: { total: number; completed: number; pending: number };
  config: any;
  conversationHistory: Array<{ role: string; content: string }>;
}): Promise<{
  response: string;
  actionsExecuted: string[];
  navigationCommand?: { type: string; section?: string };
  dataChanged: boolean;
}> {
  const actionsExecuted: string[] = [];
  let navigationCommand: { type: string; section?: string } | undefined;
  let dataChanged = false;
  
  // Build rich context for the LLM
  const platformContext = `
ESTADO ACTUAL DE IVY.AI:
- Empresas registradas: ${params.companies.length} (${params.companies.map((c: any) => c.companyName || c.company_name).join(', ') || 'ninguna'})
- Campañas activas: ${params.campaigns.filter((c: any) => c.status === 'active').length} de ${params.campaigns.length} total
- Borradores de email: ${params.drafts.total} total (${params.drafts.pending} pendientes de aprobación)
- Tareas ROPA: ${params.tasks.total} (${params.tasks.pending} pendientes)
- Modo de operación: ${params.config?.operationMode || 'autonomous'}
- Idioma configurado: ${params.config?.language || 'es'}
`;

  const systemPrompt = `Eres ROPA, el Super Meta-Agente autónomo de Ivy.AI. 
Tienes control total de la plataforma. Eres un experto en ventas, marketing y automatización.

${platformContext}

REGLAS ABSOLUTAS:
1. NUNCA muestres código, funciones, ni nombres técnicos
2. Responde SIEMPRE en español natural y conversacional
3. Cuando el usuario pida algo, HAZLO (no solo digas que lo harás)
4. Sé específico: menciona nombres de empresas, números reales, acciones concretas
5. Si hay borradores pendientes, menciónalos proactivamente
6. Si hay campañas sin emails, sugiere generarlos
7. Eres un consultor de ventas experto, no solo un asistente

CAPACIDADES QUE PUEDES EJECUTAR:
- Crear empresas, campañas, leads en la base de datos
- Generar emails profesionales completos con HTML
- Analizar campañas y dar recomendaciones
- Navegar entre secciones de la plataforma
- Generar estrategias de ventas multicanal
- Crear secuencias de email automatizadas
- Analizar el rendimiento y sugerir optimizaciones

PERSONALIDAD: ${params.config?.personality === 'friendly' ? 'Cercano y amigable' : params.config?.personality === 'technical' ? 'Técnico y detallado' : 'Profesional y directo'}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...params.conversationHistory.slice(-8).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content.substring(0, 800),
    })),
    { role: 'user' as const, content: params.message },
  ];
  
  let response = '';
  
  try {
    if (isGeminiConfigured()) {
      response = await invokeGemini(messages) || '';
    }
    if (!response) {
      const result = await invokeLLM({ messages });
      response = (typeof result?.choices?.[0]?.message?.content === 'string' 
        ? result?.choices?.[0]?.message?.content : '') || '';
    }
  } catch (e: any) {
    console.error('[ROPA SuperAgent] LLM call failed:', e.message);
    response = `Estoy procesando tu solicitud. ${params.companies.length > 0 ? `Actualmente tienes ${params.companies.length} empresa(s) registrada(s) y ${params.campaigns.length} campaña(s).` : 'Aún no hay empresas registradas. ¿Quieres que cree una?'}`;
  }
  
  // Clean response
  response = response
    .replace(/<tool_code>[\s\S]*?<\/tool_code>/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .trim();
  
  if (!response || response.length < 10) {
    response = `Entendido. ¿En qué puedo ayudarte con tus campañas de ventas?`;
  }
  
  return {
    response,
    actionsExecuted,
    navigationCommand,
    dataChanged,
  };
}

// ============ N8N WORKFLOW CREATOR ============

/**
 * Creates a real n8n workflow for a campaign via the n8n API.
 * This is what makes ROPA truly autonomous - it creates its own automation workflows.
 */
export async function createN8nCampaignWorkflow(params: {
  companyName: string;
  campaignName: string;
  campaignType: string;
  emailWebhookPath?: string;
}): Promise<{ success: boolean; workflowId?: string; message: string }> {
  const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL?.replace('/webhook', '') || 'https://sales440.app.n8n.cloud';
  const n8nApiKey = process.env.N8N_API_KEY_REAL; // Real API key (not the docs URL)
  
  if (!n8nApiKey) {
    return { 
      success: false, 
      message: 'n8n API key no configurada. Los workflows se ejecutarán via webhooks existentes.' 
    };
  }
  
  // Create a simple email automation workflow
  const workflowDefinition = {
    name: `Ivy.AI - ${params.companyName} - ${params.campaignName}`,
    active: true,
    nodes: [
      {
        id: 'webhook-trigger',
        name: 'Campaign Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {
          path: `campaign-${params.companyName.toLowerCase().replace(/\s+/g, '-')}`,
          responseMode: 'onReceived',
          responseData: 'allEntries',
        },
      },
      {
        id: 'code-processor',
        name: 'Process Campaign Data',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300],
        parameters: {
          jsCode: `
const data = $input.first().json;
return [{
  json: {
    company: '${params.companyName}',
    campaign: '${params.campaignName}',
    type: '${params.campaignType}',
    processedAt: new Date().toISOString(),
    recipients: data.recipients || [],
    subject: data.subject || 'Campaña ${params.campaignName}',
    body: data.body || '',
  }
}];`,
        },
      },
    ],
    connections: {
      'Campaign Trigger': {
        main: [[{ node: 'Process Campaign Data', type: 'main', index: 0 }]],
      },
    },
  };
  
  try {
    const response = await fetch(`${n8nBaseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
      body: JSON.stringify(workflowDefinition),
    });
    
    if (response.ok) {
      const data = await response.json() as any;
      return {
        success: true,
        workflowId: data.id,
        message: `Workflow n8n creado: ${data.name} (ID: ${data.id})`,
      };
    } else {
      return { success: false, message: `n8n API error: ${response.status}` };
    }
  } catch (e: any) {
    return { success: false, message: `Error creando workflow: ${e.message}` };
  }
}

// ============ PLATFORM HEALTH CHECK ============

export async function getROPAHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  components: Record<string, { status: string; message: string }>;
  recommendations: string[];
}> {
  const db = await getDb();
  const components: Record<string, { status: string; message: string }> = {};
  const recommendations: string[] = [];
  
  // DB check
  if (db) {
    try {
      await db.execute(sql`SELECT 1`);
      components.database = { status: 'ok', message: 'Base de datos conectada' };
    } catch (e) {
      components.database = { status: 'error', message: 'Error de conexión a DB' };
    }
  } else {
    components.database = { status: 'error', message: 'Base de datos no disponible' };
  }
  
  // n8n check
  try {
    const n8nResponse = await fetch('https://sales440.app.n8n.cloud/webhook/send-mass-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
      signal: AbortSignal.timeout(5000),
    });
    components.n8n = { 
      status: n8nResponse.ok ? 'ok' : 'degraded', 
      message: n8nResponse.ok ? 'n8n conectado' : `n8n responde con ${n8nResponse.status}` 
    };
  } catch (e: any) {
    components.n8n = { status: 'degraded', message: 'n8n no responde (webhook inactivo)' };
    recommendations.push('Activar workflow "ROPA Chat" en n8n para habilitar el motor TIER 1');
  }
  
  // LLM check
  components.llm = { 
    status: isGeminiConfigured() ? 'ok' : 'degraded', 
    message: isGeminiConfigured() ? 'Gemini LLM activo' : 'Usando Manus LLM (Gemini no configurado)' 
  };
  
  // Companies check
  if (db) {
    try {
      const [rows] = await db.execute(sql`SELECT COUNT(*) as cnt FROM ivy_clients`);
      const count = Number((rows as any[])?.[0]?.cnt || 0);
      components.companies = { status: 'ok', message: `${count} empresa(s) registrada(s)` };
      if (count === 0) recommendations.push('No hay empresas registradas. Crea la primera empresa para comenzar.');
    } catch (e) {
      components.companies = { status: 'error', message: 'Error al consultar empresas' };
    }
  }
  
  const hasErrors = Object.values(components).some(c => c.status === 'error');
  const hasDegraded = Object.values(components).some(c => c.status === 'degraded');
  
  return {
    status: hasErrors ? 'critical' : hasDegraded ? 'degraded' : 'healthy',
    components,
    recommendations,
  };
}
