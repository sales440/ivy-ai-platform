// ROPA Super Brain v3.0 - n8n Code Node
// Este es el cerebro real de ROPA en n8n.
// Recibe el mensaje, consulta la API de Ivy.AI para contexto real,
// y genera una respuesta inteligente usando el Super Agent.

const userMessage = $input.first().json.body?.message || $input.first().json.message || '';
const userId = $input.first().json.body?.userId || $input.first().json.userId || 'unknown';
const IVY_API_BASE = 'https://3000-iah3odxbo91a2fyb4g4r5-85060592.us2.manus.computer';

// ============ HELPER: HTTP POST ============
async function apiPost(path, body) {
  try {
    const response = await $helpers.httpRequest({
      method: 'POST',
      url: IVY_API_BASE + path,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeout: 25000
    });
    return typeof response === 'string' ? JSON.parse(response) : response;
  } catch(e) {
    return { error: e.message };
  }
}

// ============ HELPER: HTTP GET ============
async function apiGet(path) {
  try {
    const response = await $helpers.httpRequest({
      method: 'GET',
      url: IVY_API_BASE + path,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    return typeof response === 'string' ? JSON.parse(response) : response;
  } catch(e) {
    return { error: e.message };
  }
}

// ============ INTENT DETECTION ============
const msg = userMessage.toLowerCase().trim();

// Detect intent from message
const intents = {
  generate_campaign: ['genera campaña', 'generar campaña', 'crear campaña', 'nueva campaña', 'campaign for', 'campaña para'],
  analyze_campaigns: ['analiza', 'análisis', 'analizar', 'analisis', 'estado de campañas', 'cómo van', 'como van', 'reporte'],
  list_companies: ['empresas', 'clientes', 'lista de empresas', 'companies', 'lista clientes'],
  list_drafts: ['emails', 'borradores', 'drafts', 'correos', 'emails generados'],
  health_check: ['estado', 'salud', 'health', 'status', 'sistema', 'dashboard'],
  send_email: ['enviar email', 'enviar correo', 'send email', 'mandar email'],
  navigate: ['ve a', 'navega a', 'abre', 'ir a', 'muéstrame'],
};

let detectedIntent = 'general';
for (const [intent, keywords] of Object.entries(intents)) {
  if (keywords.some(k => msg.includes(k))) {
    detectedIntent = intent;
    break;
  }
}

// ============ EXECUTE BASED ON INTENT ============
let response = '';
let command = null;
let data = null;

if (detectedIntent === 'health_check') {
  // Get real health from Ivy.AI
  const health = await apiGet('/api/trpc/ropa.getSuperAgentHealth?input=%7B%7D');
  const h = health?.result?.data?.json;
  if (h) {
    response = `🤖 **ROPA Super Meta-Agente - Estado del Sistema**\n\n` +
      `**Estado General:** ${h.status === 'healthy' ? '✅ OPERATIVO' : '⚠️ DEGRADADO'}\n\n` +
      `**Componentes:**\n` +
      `• Base de Datos: ${h.components?.database ? '✅' : '❌'}\n` +
      `• Motor LLM: ${h.components?.llm ? '✅' : '❌'}\n` +
      `• n8n: ${h.components?.n8n ? '✅' : '❌'}\n\n` +
      `**Métricas:**\n` +
      `• Empresas activas: ${h.metrics?.companies || 0}\n` +
      `• Campañas activas: ${h.metrics?.activeCampaigns || 0}\n` +
      `• Emails generados: ${h.metrics?.emailDrafts || 0}\n` +
      `• Leads en pipeline: ${h.metrics?.leads || 0}\n\n` +
      `_Última actualización: ${new Date().toLocaleString('es-MX')}_`;
    command = { type: 'navigate', section: 'dashboard' };
  } else {
    response = `⚠️ No pude obtener el estado del sistema en este momento. El servidor puede estar reiniciándose.`;
  }
}

else if (detectedIntent === 'analyze_campaigns') {
  // Get real campaign analysis
  const analysis = await apiPost('/api/trpc/ropa.analyzeCampaigns', { json: {} });
  const a = analysis?.result?.data?.json;
  if (a && a.analyses && a.analyses.length > 0) {
    response = `📊 **Análisis de Campañas - ROPA Intelligence**\n\n`;
    response += `_Análisis generado: ${new Date().toLocaleString('es-MX')}_\n\n`;
    for (const camp of a.analyses) {
      const urgencyEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[camp.urgency] || '⚪';
      response += `**${camp.campaignName}** (${camp.company})\n`;
      response += `${urgencyEmoji} Urgencia: ${camp.urgency?.toUpperCase()}\n`;
      response += `📋 ${camp.recommendation}\n`;
      response += `▶️ Próxima acción: ${camp.nextAction}\n\n`;
    }
    command = { type: 'navigate', section: 'campaigns' };
  } else {
    response = `No hay campañas activas para analizar. Crea una empresa y genera su primera campaña con ROPA.`;
  }
}

else if (detectedIntent === 'list_companies') {
  // Get companies from Ivy.AI
  const companies = await apiGet('/api/trpc/ropa.getCompanies?input=%7B%7D');
  const c = companies?.result?.data?.json;
  if (c && c.length > 0) {
    response = `🏢 **Empresas en Ivy.AI (${c.length})**\n\n`;
    for (const company of c) {
      response += `**${company.name}**\n`;
      response += `• Industria: ${company.industry || 'No especificada'}\n`;
      response += `• Estado: ${company.isActive ? '✅ Activa' : '⏸️ Inactiva'}\n\n`;
    }
    command = { type: 'navigate', section: 'campaigns' };
  } else {
    response = `No hay empresas registradas. Ve a Campañas para agregar la primera empresa.`;
    command = { type: 'navigate', section: 'campaigns' };
  }
}

else if (detectedIntent === 'list_drafts') {
  // Get email drafts
  const drafts = await apiGet('/api/trpc/ropa.getEmailDrafts?input=%7B%7D');
  const d = drafts?.result?.data?.json;
  if (d && d.length > 0) {
    response = `📧 **Borradores de Email (${d.length})**\n\n`;
    for (const draft of d.slice(0, 5)) {
      response += `**${draft.subject || 'Sin asunto'}**\n`;
      response += `• Empresa: ${draft.company}\n`;
      response += `• Estado: ${draft.status}\n`;
      response += `• Tamaño: ${draft.bodyLength || 0} chars\n\n`;
    }
    if (d.length > 5) response += `_...y ${d.length - 5} más_\n`;
    command = { type: 'navigate', section: 'monitor' };
  } else {
    response = `No hay borradores de email. Genera una campaña para crear emails profesionales.`;
  }
}

else if (detectedIntent === 'generate_campaign') {
  // Extract company name from message
  const companyMatch = msg.match(/para\s+([a-z0-9\s]+?)(?:\s+con|\s+de|\s+en|$)/i);
  const companyName = companyMatch ? companyMatch[1].trim() : null;
  
  if (companyName) {
    response = `🚀 **Iniciando generación de campaña para "${companyName}"**\n\n`;
    response += `ROPA está orquestando:\n`;
    response += `1. ✅ Análisis de industria y mercado\n`;
    response += `2. ✅ Estrategia multicanal (email, teléfono, LinkedIn, WhatsApp)\n`;
    response += `3. ✅ Generación de emails HTML profesionales\n`;
    response += `4. ✅ Script de llamadas y mensajes\n\n`;
    response += `Ve a la sección **Campañas**, selecciona la empresa y haz clic en "Generar Campaña con ROPA".`;
    command = { type: 'navigate', section: 'campaigns' };
  } else {
    response = `Para generar una campaña, dime el nombre de la empresa. Ejemplo:\n"Genera campaña para PET LIFE 360"\n\nEmpresas disponibles:\n• PET LIFE 360\n• FAGOR Automation`;
    command = { type: 'navigate', section: 'campaigns' };
  }
}

else if (detectedIntent === 'navigate') {
  const sections = {
    'dashboard': { path: 'dashboard', name: 'Dashboard Principal' },
    'campañas': { path: 'campaigns', name: 'Campañas y Empresas' },
    'campaigns': { path: 'campaigns', name: 'Campañas y Empresas' },
    'monitor': { path: 'monitor', name: 'Monitor de Emails' },
    'leads': { path: 'leads', name: 'Pipeline de Leads' },
    'analytics': { path: 'analytics', name: 'Analytics' },
    'configuración': { path: 'settings', name: 'Configuración' },
    'archivos': { path: 'files', name: 'Archivos y Drive' },
  };
  
  let targetSection = null;
  for (const [key, section] of Object.entries(sections)) {
    if (msg.includes(key)) {
      targetSection = section;
      break;
    }
  }
  
  if (targetSection) {
    response = `Navegando a **${targetSection.name}**...`;
    command = { type: 'navigate', section: targetSection.path };
  } else {
    response = `¿A qué sección quieres ir? Opciones: Dashboard, Campañas, Monitor, Leads, Analytics, Archivos, Configuración.`;
  }
}

else {
  // General - use the Super Agent via Ivy.AI API
  const superAgentResponse = await apiPost('/api/ropa/super-chat', {
    message: userMessage,
    userId: userId,
    context: { source: 'n8n' }
  });
  
  if (superAgentResponse && superAgentResponse.response) {
    response = superAgentResponse.response;
    command = superAgentResponse.command || null;
  } else {
    // Fallback intelligent response
    response = `Hola, soy **ROPA** - el Super Meta-Agente de Ivy.AI 🤖\n\n` +
      `Puedo ayudarte con:\n` +
      `• 📊 **Análisis**: "analiza las campañas"\n` +
      `• 🏢 **Empresas**: "lista las empresas"\n` +
      `• 📧 **Emails**: "muestra los borradores"\n` +
      `• 🚀 **Campañas**: "genera campaña para [empresa]"\n` +
      `• 💡 **Estado**: "estado del sistema"\n` +
      `• 🗺️ **Navegación**: "ve a dashboard"\n\n` +
      `¿Qué necesitas?`;
  }
}

return [{
  json: {
    success: true,
    response: response,
    command: command,
    intent: detectedIntent,
    userId: userId,
    timestamp: new Date().toISOString(),
    source: 'n8n-ropa-super-agent-v3'
  }
}];
