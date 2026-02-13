/**
 * ROPA Brain v3.0 - Intelligent Local Response Engine
 * 
 * Massively expanded vocabulary with fuzzy intent matching.
 * Handles ALL platform commands, navigation, queries, and general conversation.
 * Complex/ambiguous queries are flagged with shouldDeferToLLM for upstream tiers.
 * 
 * Capabilities:
 * - Navigation to all sections (30+ keyword variants)
 * - Company/campaign CRUD
 * - Email generation
 * - Google Drive access
 * - Web search
 * - Dashboard metrics
 * - Date/time queries
 * - General conversation
 * - Graceful fallback with shouldDeferToLLM
 */

import { ropaPlatformTools } from "./ropa-platform-tools";
import { ropaSuperTools } from "./ropa-super-tools";
import { ropaNavigationTools, IVY_SECTIONS } from "./ropa-navigation-service";
import ropaDriveService from "./ropa-drive-service";
import { n8nOutreachService } from "./n8n-integration";
import { runFullOnboarding, onboardAllExistingCompanies, propagateCalendarChange, monitorCampaignProgress } from "./ropa-onboarding-engine";

export interface RopaBrainResult {
  response: string;
  intent: string;
  command?: { type: string; section?: string } | null;
  platformActionExecuted: boolean;
  platformResult?: any;
  shouldDeferToLLM?: boolean;
}

// ============ HELPER: Fuzzy keyword matching ============
function matchesAny(msg: string, keywords: string[]): boolean {
  return keywords.some(k => msg.includes(k));
}

function matchesStart(msg: string, keywords: string[]): boolean {
  return keywords.some(k => msg.startsWith(k));
}

function matchesExact(msg: string, keywords: string[]): boolean {
  return keywords.some(k => msg === k);
}

/**
 * Process a message through ROPA's local intelligence engine.
 * Returns an intelligent response with optional platform actions.
 */
export async function processWithRopaBrain(cleanMessage: string, clientHour?: number, clientDay?: string): Promise<RopaBrainResult> {
  const msg = cleanMessage.toLowerCase().trim();
  
  let response = '';
  let intent = 'unknown';
  let command: { type: string; section?: string } | null = null;
  let platformActionExecuted = false;
  let platformResult: any = null;

  // ============ 1. GREETINGS (expanded) ============
  const greetingWords = [
    'hola', 'hey', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches',
    'qué tal', 'que tal', 'hi', 'hello', 'saludos', 'buen día', 'buen dia',
    'qué onda', 'que onda', 'buenas', 'ey', 'oye', 'oiga', 'holi',
    'qué hay', 'que hay', 'sup', 'yo', 'alo', 'aló', 'wenas',
    'cómo estás', 'como estas', 'cómo andas', 'como andas',
    'qué pasa', 'que pasa', 'qué hubo', 'que hubo',
  ];
  const isGreeting = greetingWords.some(g => msg === g || msg === g + ' ropa' || msg.startsWith(g + ',') || msg.startsWith(g + ' '));
  
  if (isGreeting && msg.length < 80) {
    intent = 'greeting';
    const hour = typeof clientHour === 'number' ? clientHour : new Date().getHours();
    const timeGreeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    const dayInfo = clientDay ? ` Hoy es ${clientDay}.` : '';
    response = `${timeGreeting}!${dayInfo} Soy ROPA, tu meta-agente autónomo de Ivy.AI. Estoy listo para ejecutar cualquier tarea. ¿Qué necesitas?`;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ EARLY: Company filter pattern detection ============
  // Detect patterns like "tareas de EMPRESA", "campañas de EMPRESA" early to prevent false matches
  const isCompanyFilterPattern = /\b(tareas|campañas|emails|correos|borradores|alertas|leads|archivos|overview|resumen|datos|información|informacion|todo)\s+(de|para|del?\s+cliente|de\s+la\s+empresa)\s+/i.test(cleanMessage) || /\b(qué|que)\s+(tareas|campañas|emails|alertas|leads)\s+(tiene|tienes|hay)/i.test(cleanMessage) || /\b(muestra|lista|dame|enseña|ver|show|list)\s+(las?\s+)?(tareas|campañas|emails|correos|alertas|leads|archivos)\s+(de|para)/i.test(cleanMessage);

  // ============ 2. NAVIGATION (expanded) ============
  const navKeywords = [
    've a', 'ir a', 'abre', 'abrir', 'navega', 'muestra', 'mostrar',
    'llévame', 'llevame', 'entra a', 'entra en', 'go to', 'open', 'show',
    'quiero ver', 'déjame ver', 'dejame ver', 'enseñame', 'enséñame',
    'pasa a', 'cambia a', 'switch to', 'vamos a', 'vayamos a',
    'dirígeme', 'dirigeme', 'llévame a', 'dame acceso a',
    'necesito ver', 'quiero ir a', 'pon', 'ponme',
  ];
  const isNavRequest = navKeywords.some(k => msg.includes(k));
  
  if (isNavRequest && !isCompanyFilterPattern) {
    const sectionMappings: Record<string, string> = {
      'dashboard': 'dashboard', 'panel': 'dashboard', 'inicio': 'dashboard', 'principal': 'dashboard',
      'home': 'dashboard', 'resumen': 'dashboard', 'overview': 'dashboard', 'tablero': 'dashboard',
      'campaña': 'campaigns', 'campañas': 'campaigns', 'campaigns': 'campaigns', 'campaign': 'campaigns',
      'marketing': 'campaigns', 'ventas': 'campaigns',
      'archivo': 'files', 'archivos': 'files', 'drive': 'files', 'files': 'files',
      'documentos': 'files', 'docs': 'files', 'ficheros': 'files',
      'monitor': 'monitor', 'validación': 'monitor', 'validacion': 'monitor', 'borradores': 'monitor',
      'drafts': 'monitor', 'emails': 'monitor', 'correos': 'monitor', 'bandeja': 'monitor',
      'tarea': 'tasks', 'tareas': 'tasks', 'tasks': 'tasks', 'pendientes': 'tasks',
      'to-do': 'tasks', 'todo': 'tasks', 'actividades': 'tasks',
      'alerta': 'alerts', 'alertas': 'alerts', 'alerts': 'alerts', 'notificaciones': 'alerts',
      'avisos': 'alerts', 'warnings': 'alerts',
      'salud': 'health', 'estado': 'health', 'health': 'health', 'diagnóstico': 'health',
      'diagnostico': 'health', 'sistema': 'health', 'status': 'health',
      'calendario': 'calendar', 'calendar': 'calendar', 'agenda': 'calendar', 'schedule': 'calendar',
      'eventos': 'calendar', 'citas': 'calendar', 'programación': 'calendar',
      'configuración': 'config', 'configuracion': 'config', 'config': 'config', 'ajustes': 'config',
      'settings': 'config', 'preferencias': 'config', 'opciones': 'config',
    };
    
    let targetSection = '';
    for (const [keyword, section] of Object.entries(sectionMappings)) {
      if (msg.includes(keyword)) {
        targetSection = section;
        break;
      }
    }
    
    if (targetSection) {
      intent = 'navigation';
      try {
        platformResult = await ropaNavigationTools.navigateTo({ section: targetSection as any });
        platformActionExecuted = true;
        command = { type: 'navigate', section: targetSection };
        response = `Navegando a ${targetSection}. ${platformResult?.message || ''}`;
      } catch (err: any) {
        response = `Navegando a ${targetSection}.`;
        command = { type: 'navigate', section: targetSection };
      }
      return { response, intent, command, platformActionExecuted, platformResult };
    }
    
    // Dialog commands (expanded)
    if (matchesAny(msg, ['nueva empresa', 'crear empresa', 'agregar empresa', 'añadir empresa', 'registrar empresa', 'add company', 'new company'])) {
      intent = 'open_dialog';
      try {
        platformResult = await ropaNavigationTools.openNewCompanyDialog();
        platformActionExecuted = true;
        response = 'Abriendo el formulario para crear nueva empresa.';
      } catch (err: any) {
        response = 'Abriendo el formulario de nueva empresa.';
      }
      return { response, intent, command, platformActionExecuted, platformResult };
    }
    
    if (matchesAny(msg, ['nueva campaña', 'crear campaña', 'agregar campaña', 'añadir campaña', 'new campaign', 'add campaign'])) {
      intent = 'open_dialog';
      try {
        platformResult = await ropaNavigationTools.openNewCampaignDialog();
        platformActionExecuted = true;
        response = 'Abriendo el formulario para crear nueva campaña.';
      } catch (err: any) {
        response = 'Abriendo el formulario de nueva campaña.';
      }
      return { response, intent, command, platformActionExecuted, platformResult };
    }
  }

  // ============ 3. MAXIMIZE/MINIMIZE/CLOSE CHAT (expanded) ============
  if (matchesAny(msg, ['maximiza', 'agranda', 'pantalla completa', 'más grande', 'mas grande', 'expand', 'maximize', 'fullscreen', 'full screen', 'amplía', 'amplia'])) {
    intent = 'maximize_chat';
    try {
      platformResult = await ropaNavigationTools.maximizeChat();
      platformActionExecuted = true;
      response = 'Chat maximizado.';
    } catch (err: any) {
      response = 'Maximizando el chat.';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }
  
  if (matchesAny(msg, ['minimiza', 'reduce', 'más pequeño', 'mas pequeño', 'minimize', 'smaller'])) {
    intent = 'minimize_chat';
    try {
      platformResult = await ropaNavigationTools.closeChat();
      platformActionExecuted = true;
      response = 'Chat minimizado.';
    } catch (err: any) {
      response = 'Minimizando el chat.';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }
  
  if (matchesAny(msg, ['cierra']) && matchesAny(msg, ['chat', 'ventana', 'conversación', 'conversacion'])) {
    intent = 'close_chat';
    try {
      platformResult = await ropaNavigationTools.closeChat();
      platformActionExecuted = true;
      response = 'Cerrando el chat.';
    } catch (err: any) {
      response = 'Cerrando el chat.';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 4. EMAIL GENERATION (expanded) ============
  const emailGenVerbs = ['genera', 'crea', 'hazme', 'prepara', 'redacta', 'escribe', 'draft', 'compose', 'elabora', 'haz', 'produce', 'diseña', 'arma'];
  const emailNouns = ['email', 'correo', 'borrador', 'borradores', 'emails', 'correos', 'mail', 'mails', 'mensaje', 'mensajes', 'carta', 'comunicación'];
  
  if (matchesAny(msg, emailGenVerbs) && matchesAny(msg, emailNouns)) {
    intent = 'generate_emails';
    
    const companyPatterns = [
      /(?:para|de|empresa|compañía|cliente)\s+([A-Z][A-Za-z0-9\s]+)/i,
      /([A-Z][A-Z0-9]+)(?:\s|$)/,
    ];
    let companyName = 'General';
    for (const pattern of companyPatterns) {
      const match = cleanMessage.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        break;
      }
    }
    
    const countMatch = cleanMessage.match(/(\d+)\s*(?:email|correo|borrador|mail|mensaje)/i);
    const count = countMatch ? parseInt(countMatch[1]) : 3;
    const campaignMatch = cleanMessage.match(/campaña\s+["']?([^"']+)["']?/i);
    const campaignName = campaignMatch ? campaignMatch[1].trim() : `Campaña ${companyName}`;
    
    try {
      platformResult = await ropaPlatformTools.generateCampaignEmailDrafts({
        company: companyName,
        campaign: campaignName,
        count: count,
        emailType: 'cold_outreach',
      });
      platformActionExecuted = true;
      const draftCount = platformResult?.drafts?.length || platformResult?.count || count;
      response = `He generado ${draftCount} borradores de email para ${companyName}. Puedes revisarlos en la sección Monitor para aprobarlos antes de enviarlos.`;
      // Auto-notify owner (non-blocking)
      ropaPlatformTools.notifyEmailsGenerated({ companyName, count: draftCount, campaign: campaignName }).catch(() => {});
    } catch (err: any) {
      response = `Error al generar emails: ${err.message}. Intenta de nuevo o especifica la empresa.`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 5. COMPANY CREATION (expanded) ============
  const createVerbs = ['crea', 'añade', 'registra', 'agrega', 'agregar', 'dar de alta', 'alta', 'incorpora', 'incluye', 'mete', 'pon'];
  const companyNouns = ['empresa', 'compañía', 'compania', 'cliente', 'company', 'negocio', 'organización', 'organizacion', 'firma'];
  
  if (matchesAny(msg, createVerbs) && matchesAny(msg, companyNouns) && !msg.includes('campaña')) {
    intent = 'create_company';
    
    const companyMatch = cleanMessage.match(/(?:empresa|compañía|compania|cliente|company|negocio|firma)\s+["']?([^"']+)["']?/i);
    if (companyMatch && companyMatch[1]) {
      // Strip common filler words that appear between "empresa" and the actual name
      // e.g., "crea empresa llamada PETLIFE 360" -> "PETLIFE 360"
      // e.g., "registra empresa con nombre PETLIFE" -> "PETLIFE"
      let companyName = companyMatch[1].trim()
        .replace(/^(?:llamada|denominada|con\s+(?:el\s+)?nombre(?:\s+de)?|que\s+se\s+llam[ae]|nueva|con\s+raz[oó]n\s+social|de\s+nombre)\s+/i, '')
        .trim();
      try {
        platformResult = await ropaPlatformTools.createCompany({ companyName });
        platformActionExecuted = true;
        response = `Empresa "${companyName}" creada exitosamente. Iniciando onboarding autónomo...\n\n`;
        
        // Trigger autonomous onboarding in background
        const clientId = platformResult?.clientId || platformResult?.client_id || `CLI-${Date.now()}`;
        runFullOnboarding(clientId, companyName).then(result => {
          console.log(`[ROPA] Onboarding completed for ${companyName}: ${result.campaignsCreated} campaigns, ${result.tasksCreated} tasks, ${result.draftsCreated} drafts`);
        }).catch(err => {
          console.error(`[ROPA] Onboarding failed for ${companyName}:`, err.message);
        });
        
        response += `ROPA está analizando el perfil de ${companyName} desde Google Drive y generará automáticamente:\n` +
          `- Campañas de marketing personalizadas\n` +
          `- Tareas desglosadas por campaña\n` +
          `- Borradores de email/SMS/llamadas para aprobación\n` +
          `- Alertas de mercado\n\n` +
          `Revisa la sección de Monitor para aprobar los borradores cuando estén listos.`;
      } catch (err: any) {
        response = `Error al crear la empresa: ${err.message}`;
      }
    } else {
      response = 'Para crear una empresa dime: "crea empresa [NOMBRE]"';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 6. CAMPAIGN CREATION (expanded) ============
  const campaignNouns = ['campaña', 'campana', 'campaign'];
  if (matchesAny(msg, createVerbs.concat(['inicia', 'lanza', 'arranca', 'comienza', 'empieza', 'start', 'launch'])) && matchesAny(msg, campaignNouns)) {
    intent = 'create_campaign';
    
    const campaignMatch = cleanMessage.match(/campaña\s+["']?([^"']+)["']?/i);
    const companyMatch = cleanMessage.match(/(?:para|de)\s+([A-Z][A-Za-z0-9\s]+)/i);
    
    if (campaignMatch && campaignMatch[1]) {
      const campaignName = campaignMatch[1].trim();
      const companyName = companyMatch ? companyMatch[1].trim() : 'General';
      
      try {
        platformResult = await ropaPlatformTools.createCampaign({
          name: campaignName,
          companyName: companyName,
          type: 'email',
          status: 'draft',
        });
        platformActionExecuted = true;
        response = `Campaña "${campaignName}" creada para ${companyName}. Estado: borrador. Puedes activarla cuando estés listo.`;
      } catch (err: any) {
        response = `Error al crear la campaña: ${err.message}`;
      }
    } else {
      response = 'Para crear una campaña dime: "crea campaña [NOMBRE] para [EMPRESA]"';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 7. WEB SEARCH (expanded) ============
  const searchVerbs = ['busca', 'investiga', 'encuentra', 'search', 'look up', 'googlea', 'consulta', 'indaga', 'averigua', 'explora'];
  const webNouns = ['web', 'internet', 'información sobre', 'info sobre', 'datos sobre', 'online', 'en línea', 'en linea', 'google'];
  
  if (matchesAny(msg, searchVerbs) && matchesAny(msg, webNouns)) {
    intent = 'web_search';
    
    const searchMatch = cleanMessage.match(/(?:busca|investiga|encuentra|información sobre|info sobre|datos sobre|googlea|consulta|averigua)\s+["']?([^"']+)["']?/i);
    if (searchMatch && searchMatch[1]) {
      const query = searchMatch[1].trim();
      try {
        platformResult = await ropaSuperTools.webSearch({ query, maxResults: 5 });
        platformActionExecuted = true;
        const resultCount = platformResult?.results?.length || 0;
        response = `Búsqueda completada. Encontré ${resultCount} resultados para "${query}".`;
        if (platformResult?.results?.length > 0) {
          response += '\n\n' + platformResult.results.slice(0, 3).map((r: any, i: number) => 
            `${i + 1}. ${r.title || r.name || 'Resultado'}: ${r.snippet || r.description || r.url || ''}`
          ).join('\n');
        }
      } catch (err: any) {
        response = `Error en la búsqueda web: ${err.message}`;
      }
    } else {
      response = 'Para buscar en la web dime: "busca en internet [tu consulta]"';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 8. COMPANY RESEARCH (expanded) ============
  if (matchesAny(msg, ['investiga', 'busca información', 'busca info', 'analiza', 'research']) && 
      matchesAny(msg, companyNouns)) {
    intent = 'research_company';
    
    const companyMatch = cleanMessage.match(/(?:empresa|compañía|compania|cliente|company)\s+["']?([^"']+)["']?/i);
    if (companyMatch && companyMatch[1]) {
      const companyName = companyMatch[1].trim();
      try {
        platformResult = await ropaSuperTools.researchCompany({ companyName });
        platformActionExecuted = true;
        response = `Investigación de ${companyName} completada. ${platformResult?.summary || ''}`;
      } catch (err: any) {
        response = `Error investigando la empresa: ${err.message}`;
      }
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 9. DASHBOARD METRICS (expanded) ============
  const statsKeywords = [
    'métrica', 'metricas', 'métricas', 'estadística', 'estadísticas', 'estadisticas',
    'stats', 'resumen', 'estado del sistema', 'cómo está', 'como esta',
    'cómo va', 'como va', 'rendimiento', 'performance',
    'números', 'numeros', 'cifras', 'datos generales',
    'analytics', 'analítica', 'analitica',
  ];
  
  if (!isCompanyFilterPattern && (matchesAny(msg, statsKeywords) || (msg.includes('dashboard') && !isNavRequest))) {
    intent = 'dashboard_stats';
    
    try {
      platformResult = await ropaSuperTools.getDashboardMetrics();
      platformActionExecuted = true;
      response = `Estado del Sistema Ivy.AI:\n\n`;
      if (platformResult) {
        response += `Plataforma: ${platformResult.health || 'Operativa'}\n`;
        response += `Agentes activos: ARIA (Ventas), LUCA (Soporte), NOVA (Marketing), SAGE (Operaciones)\n`;
        response += `Tareas completadas: ${platformResult.tasksCompleted || 0}\n`;
        response += `Tasa de éxito: ${platformResult.successRate || 100}%\n`;
        response += `Última sincronización: ${new Date().toLocaleString('es-ES')}\n`;
      } else {
        response += `Plataforma: Operativa\nAgentes activos: 4\nMotor de orquestación: n8n Cloud (Pro)\nÚltima sincronización: ${new Date().toLocaleString('es-ES')}`;
      }
    } catch (err: any) {
      response = `Estado del Sistema: Operativo. Error obteniendo métricas detalladas: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 10. LEAD FUNNEL (expanded) ============
  if (!isCompanyFilterPattern && matchesAny(msg, ['embudo', 'funnel', 'conversión', 'conversion', 'leads', 'pipeline', 'prospecto', 'prospectos', 'oportunidades'])) {
    intent = 'lead_funnel';
    try {
      platformResult = await ropaSuperTools.getLeadFunnelAnalytics();
      platformActionExecuted = true;
      response = `Análisis de embudo de leads completado. ${platformResult?.summary || 'Revisa los datos en el dashboard.'}`;
    } catch (err: any) {
      response = `Error obteniendo análisis de embudo: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11. SEND EMAIL (expanded) ============
  const sendVerbs = ['envía', 'envia', 'manda', 'send', 'despacha', 'remite', 'transmite'];
  if (matchesAny(msg, sendVerbs) && matchesAny(msg, ['email', 'correo', 'mail', 'mensaje']) && msg.includes('@')) {
    intent = 'send_email';
    
    const emailMatch = cleanMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const subjectMatch = cleanMessage.match(/(?:asunto|subject)[:\s]+["']?([^"']+)["']?/i);
    
    if (emailMatch) {
      const to = emailMatch[1];
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Mensaje de Ivy.AI';
      
      try {
        platformResult = await ropaSuperTools.sendEmail({
          to,
          subject,
          body: `<p>Este es un mensaje enviado por ROPA, el meta-agente de Ivy.AI.</p>`,
        });
        platformActionExecuted = true;
        response = `Email enviado exitosamente a ${to} con asunto "${subject}".`;
      } catch (err: any) {
        response = `Error enviando email: ${err.message}`;
      }
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11b. MASS EMAIL / n8n OUTREACH ============
  const massEmailKeywords = ['envío masivo', 'envio masivo', 'email masivo', 'emails masivos', 'correo masivo', 'correos masivos', 'mass email', 'mass emails', 'enviar masivo', 'campaña de email', 'campaña email', 'campaña de correo', 'blast email', 'email blast', 'enviar emails a', 'enviar correos a', 'enviar emails masivos', 'enviar correos masivos', 'lanzar campaña', 'ejecutar campaña', 'disparar campaña', 'enviar campaña'];
  const isN8NOutreach = matchesAny(msg, massEmailKeywords);
  
  if (isN8NOutreach) {
    intent = 'n8n_mass_outreach';
    
    // Extract company name
    const companyMatch = cleanMessage.match(/(?:para|de|a)\s+(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+?)["']?(?:\s*$|\s+con|\s+sobre|\s+asunto)/i);
    const companyName = companyMatch ? companyMatch[1].trim() : null;
    
    if (!companyName) {
      response = `Para enviar emails masivos necesito saber:\n` +
        `1. Nombre de la empresa\n` +
        `2. Lista de destinatarios (emails)\n` +
        `3. Asunto del email\n` +
        `4. Contenido del email\n\n` +
        `Ejemplo: "Envío masivo para PETLIFE 360 con asunto 'Propuesta de servicios IA'"\n\n` +
        `También puedo generar borradores primero: "genera emails para [EMPRESA]"\n` +
        `Y luego enviarlos: "enviar borradores aprobados de [EMPRESA]"\n\n` +
        `El envío se realiza a través de n8n con Outlook (rpcommercegroup@gmail.com).`;
    } else {
      // Check n8n health first
      try {
        const health = await n8nOutreachService.email.checkHealth();
        if (health.available) {
          response = `Servicio de envío masivo disponible via n8n/Outlook.\n\n` +
            `Para ${companyName}, necesito:\n` +
            `- Lista de emails destinatarios\n` +
            `- Asunto del email\n` +
            `- Contenido HTML del email\n\n` +
            `Opciones:\n` +
            `1. "genera 5 emails para ${companyName}" → Crear borradores primero\n` +
            `2. Proporciona los datos directamente para envío inmediato\n\n` +
            `Webhook: ${health.webhookUrl}\n` +
            `Sender: rpcommercegroup@gmail.com (Outlook)`;
        } else {
          response = `El servicio de envío masivo n8n no está disponible en este momento: ${health.message}\n` +
            `Puedo generar borradores de email mientras tanto: "genera emails para ${companyName}"`;
        }
      } catch (err: any) {
        response = `Error verificando servicio n8n: ${err.message}. Puedo generar borradores: "genera emails para ${companyName}"`;
      }
      platformActionExecuted = true;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11c. SEND APPROVED DRAFTS via n8n ============
  const sendDraftsKeywords = ['enviar borradores', 'enviar drafts', 'enviar aprobados', 'send drafts', 'send approved', 'despachar borradores', 'enviar los borradores', 'enviar los emails aprobados', 'enviar correos aprobados'];
  if (matchesAny(msg, sendDraftsKeywords)) {
    intent = 'send_approved_drafts';
    
    const companyMatch = cleanMessage.match(/(?:de|para|a)\s+(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+?)(?:["']|$)/i);
    const companyName = companyMatch ? companyMatch[1].trim() : null;
    
    try {
      // Get approved drafts
      const draftsResult = await ropaPlatformTools.listEmailDrafts({ status: 'approved', company: companyName || undefined });
      const approvedDrafts = draftsResult.drafts || [];
      
      if (approvedDrafts.length === 0) {
        response = companyName 
          ? `No hay borradores aprobados para ${companyName}. Primero genera y aprueba borradores: "genera emails para ${companyName}"`
          : `No hay borradores aprobados. Primero genera y aprueba borradores.`;
      } else {
        // Convert approved drafts to email recipients for n8n
        const emails = approvedDrafts.map((d: any) => ({
          to: d.recipientEmail || d.recipient_email || '',
          subject: d.subject,
          body: d.body || d.bodyPreview || '',
          recipientName: d.recipientName || d.recipient_name || '',
        })).filter((e: any) => e.to && e.to.includes('@'));
        
        if (emails.length === 0) {
          response = `Hay ${approvedDrafts.length} borradores aprobados pero ninguno tiene email de destinatario. Actualiza los borradores con emails de contacto.`;
        } else {
          const result = await n8nOutreachService.email.sendMassEmails({
            company: companyName || 'General',
            campaign: approvedDrafts[0]?.campaign || 'Direct',
            emails,
          });
          platformResult = result;
          platformActionExecuted = true;
          response = result.success 
            ? `Enviados ${emails.length} emails via n8n/Outlook para ${companyName || 'varias empresas'}. Batch ID: ${result.batchId}. Los resultados llegarán por callback.`
            : `Error enviando emails: ${result.message}`;
        }
      }
    } catch (err: any) {
      response = `Error al enviar borradores: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11d. ONBOARD EXISTING COMPANIES ============
  const onboardKeywords = ['onboarding', 'onboard', 'inicializar empresas', 'inicializar todas', 'analizar todas', 'analizar empresas', 'onboardear', 'activar empresas', 'activar todas las empresas', 'procesar empresas'];
  if (matchesAny(msg, onboardKeywords)) {
    intent = 'onboard_all_companies';
    response = 'Iniciando onboarding autónomo de todas las empresas existentes. Esto puede tomar varios minutos...\n\n';
    
    onboardAllExistingCompanies().then(result => {
      console.log(`[ROPA] Batch onboarding: ${result.onboarded.length} onboarded, ${result.skipped.length} skipped, ${result.errors.length} errors`);
    }).catch(err => {
      console.error('[ROPA] Batch onboarding failed:', err.message);
    });
    
    response += 'ROPA está procesando cada empresa:\n' +
      '1. Leyendo documentos de Google Drive\n' +
      '2. Analizando perfil con IA\n' +
      '3. Generando campañas personalizadas\n' +
      '4. Creando tareas y borradores\n' +
      '5. Generando alertas de mercado\n\n' +
      'Recibirás notificaciones cuando cada empresa esté lista.';
    platformActionExecuted = true;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11e. ONBOARD SPECIFIC COMPANY ============
  const onboardSpecificKeywords = ['onboard', 'onboarding de', 'inicializar', 'analizar perfil de', 'procesar empresa'];
  if (matchesAny(msg, onboardSpecificKeywords) && matchesAny(msg, companyNouns)) {
    intent = 'onboard_company';
    const companyMatch = cleanMessage.match(/(?:empresa|compañía|compania|cliente|company)\s+["']?([^"']+)["']?/i);
    if (companyMatch && companyMatch[1]) {
      const companyName = companyMatch[1].trim();
      response = `Iniciando onboarding autónomo de ${companyName}...\n\n`;
      
      // Find client ID
      try {
        const companies = await ropaPlatformTools.listCompanies();
        const found = companies?.companies?.find((c: any) => 
          (c.companyName || c.company_name || '').toLowerCase().includes(companyName.toLowerCase())
        );
        const clientId = found?.clientId || found?.client_id || `CLI-${Date.now()}`;
        
        runFullOnboarding(clientId, companyName).then(result => {
          console.log(`[ROPA] Onboarding completed for ${companyName}: ${result.campaignsCreated} campaigns`);
        }).catch(err => {
          console.error(`[ROPA] Onboarding failed for ${companyName}:`, err.message);
        });
        
        response += `Procesando ${companyName}:\n` +
          `- Leyendo Google Drive\n` +
          `- Analizando perfil\n` +
          `- Generando campañas\n` +
          `- Creando tareas y borradores\n\n` +
          `Te notificaré cuando esté listo.`;
        platformActionExecuted = true;
      } catch (err: any) {
        response = `Error al iniciar onboarding: ${err.message}`;
      }
    } else {
      response = 'Dime qué empresa quieres procesar: "onboarding de [NOMBRE]"';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 11f. MONITOR CAMPAIGN PROGRESS ============
  const monitorKeywords = ['monitorear', 'monitoreo', 'progreso', 'progress', 'kpi', 'rendimiento', 'performance', 'revisar progreso', 'ver progreso'];
  if (matchesAny(msg, monitorKeywords) && matchesAny(msg, campaignNouns.concat(['campañas', 'campaigns']))) {
    intent = 'monitor_progress';
    try {
      const companyMatch = cleanMessage.match(/(?:de|para)\s+([A-Z][A-Za-z0-9\s]+)/i);
      const companyName = companyMatch ? companyMatch[1].trim() : undefined;
      await monitorCampaignProgress(companyName);
      platformActionExecuted = true;
      response = `Monitoreo de progreso completado${companyName ? ` para ${companyName}` : ' para todas las empresas'}. Revisa la sección de Alertas para ver los resultados.`;
    } catch (err: any) {
      response = `Error al monitorear progreso: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 12. GOOGLE DRIVE (expanded) ============
  const driveKeywords = ['google drive', 'carpeta', 'archivo', 'archivos', 'documentos', 'docs', 'fichero', 'ficheros', 'drive'];
  const driveVerbs = ['ver', 'lista', 'muestra', 'revisa', 'busca', 'dame', 'enseña', 'enséñame', 'abre', 'accede', 'consulta'];
  
  if (!isCompanyFilterPattern && matchesAny(msg, driveKeywords) && matchesAny(msg, driveVerbs)) {
    intent = 'google_drive';
    
    try {
      if (matchesAny(msg, ['cliente', 'clientes'])) {
        platformResult = await ropaDriveService.listAllClients();
        const clientCount = platformResult?.clients?.length || 0;
        response = `Encontré ${clientCount} clientes con carpetas en Google Drive.`;
      } else if (matchesAny(msg, ['estructura', 'carpetas', 'árbol', 'arbol', 'tree'])) {
        platformResult = await ropaDriveService.getFullFolderTree();
        const folderCount = platformResult?.tree?.length || 0;
        response = `Estructura de carpetas obtenida: ${folderCount} carpetas principales.`;
      } else if (matchesAny(msg, ['busca', 'encuentra', 'search'])) {
        const searchMatch = cleanMessage.match(/(?:archivo|documento|fichero)\s+["']?([^"']+)["']?/i);
        if (searchMatch && searchMatch[1]) {
          platformResult = await ropaDriveService.searchFiles(searchMatch[1].trim());
          const fileCount = platformResult?.files?.length || 0;
          response = `Encontré ${fileCount} archivos que coinciden con "${searchMatch[1].trim()}".`;
        } else {
          platformResult = await ropaDriveService.listAllFiles();
          const fileCount = platformResult?.files?.length || 0;
          response = `Encontré ${fileCount} archivos en Google Drive.`;
        }
      } else {
        platformResult = await ropaDriveService.listAllFiles();
        const fileCount = platformResult?.files?.length || 0;
        response = `Encontré ${fileCount} archivos en Google Drive.`;
      }
      platformActionExecuted = true;
    } catch (err: any) {
      response = `Error accediendo a Google Drive: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 13. DATE/TIME (expanded) ============
  const dateKeywords = [
    'fecha', 'hora', 'día', 'dia', 'hoy', 'qué día', 'que dia', 'date', 'time',
    'qué hora', 'que hora', 'cuándo', 'cuando', 'momento', 'ahora', 'now',
    'qué fecha', 'que fecha', 'calendario hoy', 'today',
  ];
  if (matchesAny(msg, dateKeywords) && msg.length < 60) {
    intent = 'date_time';
    const now = new Date();
    try {
      response = `Hoy es ${now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}.`;
    } catch {
      response = `Hoy es ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}.`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 14. HELP / CAPABILITIES (expanded) ============
  const helpKeywords = [
    'ayuda', 'help', 'qué puedes', 'que puedes', 'qué haces', 'que haces',
    'capacidades', 'funcionalidades', 'secciones', 'módulos', 'modulos',
    'menú', 'menu', 'instrucciones', 'tutorial', 'guía', 'guia',
    'cómo funciona', 'como funciona', 'cómo te uso', 'como te uso',
    'qué sabes hacer', 'que sabes hacer', 'para qué sirves', 'para que sirves',
    'comandos', 'opciones disponibles', 'features', 'funciones',
  ];
  if (matchesAny(msg, helpKeywords)) {
    intent = 'help';
    response = `Soy ROPA, el meta-agente autónomo de Ivy.AI. Mis capacidades incluyen:\n\n` +
      `NAVEGACIÓN: "ve a dashboard", "abre campañas", "muestra calendario"\n` +
      `EMPRESAS: "crea empresa NOMBRE", "registra cliente NOMBRE"\n` +
      `CAMPAÑAS: "crea campaña NOMBRE para EMPRESA", "lista campañas"\n` +
      `EMAILS: "genera 5 emails para EMPRESA", "envía email a user@mail.com"\n` +
      `FILTROS POR EMPRESA: "tareas de EMPRESA", "campañas de EMPRESA", "emails de EMPRESA", "alertas de EMPRESA"\n` +
      `OVERVIEW: "resumen de EMPRESA", "overview de EMPRESA"\n` +
      `REPORTES: "reporte KPI", "reporte ROI", "detalles de empresa NOMBRE"\n` +
      `GOOGLE DRIVE: "muestra archivos de Drive", "busca archivo NOMBRE"\n` +
      `WEB: "busca en internet TEMA", "investiga empresa NOMBRE"\n` +
      `ANALYTICS: "muestra estadísticas", "estado del sistema", "embudo de leads"\n` +
      `FECHA: "qué día es hoy", "qué hora es"\n` +
      `CHAT: "maximiza el chat", "cierra el chat"\n\n` +
      `Secciones disponibles: Dashboard, Campañas, Archivos, Monitor, Tareas, Alertas, Salud, Calendario, Configuración.\n\n` +
      `¿Qué necesitas?`;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 15. GRATITUDE (expanded) ============
  const gratitudeWords = [
    'gracias', 'thanks', 'perfecto', 'excelente', 'genial', 'bien hecho',
    'buen trabajo', 'good job', 'great', 'awesome', 'nice', 'cool',
    'ok gracias', 'vale gracias', 'muchas gracias', 'mil gracias',
    'te lo agradezco', 'agradecido', 'thank you', 'thx', 'ty',
    'súper', 'super', 'increíble', 'increible', 'fantástico', 'fantastico',
    'maravilloso', 'espectacular', 'brillante', 'chido', 'chévere', 'chevere',
  ];
  if (gratitudeWords.some(g => msg === g || msg.startsWith(g + ' ') || msg.startsWith(g + ','))) {
    intent = 'gratitude';
    const responses = [
      'De nada! Estoy aquí para lo que necesites. ¿Algo más?',
      '¡Con gusto! ¿Necesitas algo más?',
      '¡Para eso estoy! ¿Qué más puedo hacer por ti?',
      'Siempre a tu servicio. ¿Algo más en lo que pueda ayudarte?',
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 16. WHO ARE YOU (expanded) ============
  const identityKeywords = [
    'quién eres', 'quien eres', 'qué eres', 'que eres', 'who are you',
    'preséntate', 'presentate', 'tu nombre', 'cómo te llamas', 'como te llamas',
    'what are you', 'cuéntame de ti', 'cuentame de ti', 'háblame de ti',
    'hablame de ti', 'eres un bot', 'eres una ia', 'eres humano',
    'eres real', 'qué tipo de ia', 'que tipo de ia',
  ];
  if (matchesAny(msg, identityKeywords)) {
    intent = 'identity';
    response = `Soy ROPA, el meta-agente autónomo de Ivy.AI, la Plataforma de Agentes de Inteligencia Artificial. ` +
      `Tengo control total sobre la plataforma: puedo navegar entre secciones, crear empresas y campañas, ` +
      `generar emails, acceder a Google Drive, buscar en internet, y mucho más. ` +
      `Orquesto a los agentes ARIA (Ventas), LUCA (Soporte), NOVA (Marketing) y SAGE (Operaciones). ` +
      `Mi motor de orquestación es n8n Cloud Pro. ¿En qué te puedo ayudar?`;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 17. FAREWELL (new) ============
  const farewellWords = ['adiós', 'adios', 'bye', 'chao', 'chau', 'hasta luego', 'nos vemos', 'hasta pronto', 'me voy', 'goodbye', 'see you'];
  if (farewellWords.some(f => msg === f || msg.startsWith(f + ' ') || msg.startsWith(f + ','))) {
    intent = 'farewell';
    response = '¡Hasta luego! Estaré aquí cuando me necesites. Que tengas un excelente día.';
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 18. AFFIRMATIVE / CONFIRMATION (new) ============
  const affirmativeWords = ['sí', 'si', 'ok', 'okay', 'vale', 'dale', 'claro', 'por supuesto', 'afirmativo', 'correcto', 'exacto', 'de acuerdo', 'entendido', 'listo', 'hecho'];
  if (affirmativeWords.some(a => msg === a || msg === a + '!')) {
    intent = 'affirmative';
    response = 'Entendido. ¿Hay algo más que necesites que haga?';
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 19. NEGATIVE / NOTHING MORE (new) ============
  const negativeWords = ['no', 'nada', 'nada más', 'nada mas', 'no gracias', 'eso es todo', 'nothing', 'no más', 'no mas', 'no por ahora', 'estoy bien'];
  if (negativeWords.some(n => msg === n || msg === n + '.' || msg === n + '!')) {
    intent = 'negative';
    response = 'Perfecto. Estaré aquí si necesitas algo. ¡Que tengas un buen día!';
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 20. STATUS QUERIES (new) ============
  if (matchesAny(msg, ['cuántas empresas', 'cuantas empresas', 'cuántas campañas', 'cuantas campañas', 'cuántos emails', 'cuantos emails', 'cuántas tareas', 'cuantas tareas', 'lista empresas', 'lista campañas', 'listar'])) {
    intent = 'list_query';
    // Defer to LLM for complex queries
    return { response: '', intent, command, platformActionExecuted, platformResult, shouldDeferToLLM: true };
  }

  // ============ 20a. COMPANY-SPECIFIC FILTERING ============
  // Pattern: "tareas de EMPRESA", "campañas de EMPRESA", "emails de EMPRESA", "alertas de EMPRESA", "overview de EMPRESA"
  const filterKeywords = ['tareas de', 'tasks de', 'campañas de', 'campaigns de', 'emails de', 'correos de', 'borradores de', 'alertas de', 'alerts de', 'leads de', 'archivos de', 'files de', 'overview de', 'resumen de', 'todo de', 'información de', 'informacion de', 'datos de'];
  const filterForKeywords = ['tareas para', 'tasks para', 'campañas para', 'campaigns para', 'emails para', 'correos para', 'borradores para', 'alertas para', 'alerts para', 'leads para', 'archivos para', 'files para', 'overview para', 'resumen para', 'todo para'];
  const filterPendingKeywords = ['pendientes de', 'pendientes para', 'pendientes por', 'que tiene pendiente', 'que tienes pendiente'];
  
  // Check for "tareas pendientes para la empresa X" or "qué tareas tiene EMPRESA"
  const companyFilterMatch = cleanMessage.match(/(?:tareas|tasks|campañas|campaigns|emails|correos|borradores|alertas|alerts|leads|archivos|files|overview|resumen|todo|información|informacion|datos|pendientes)\s+(?:de|para|de la empresa|para la empresa|por realizar para|pendientes de|pendientes para)\s+(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
  const companyFilterMatch2 = cleanMessage.match(/(?:qué|que)\s+(?:tareas|campañas|emails|alertas|leads)\s+(?:tiene|tienes|hay|existen)\s+(?:pendientes?\s+)?(?:para|de|en)?\s*(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
  const companyFilterMatch3 = cleanMessage.match(/(?:muestra|lista|dame|enseña|ver|show|list)\s+(?:las?\s+)?(?:tareas|campañas|emails|correos|alertas|leads|archivos)\s+(?:de|para|del cliente|de la empresa)\s+["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
  
  const companyNameFromFilter = (companyFilterMatch?.[1] || companyFilterMatch2?.[1] || companyFilterMatch3?.[1] || '').trim();
  
  if (companyNameFromFilter && (matchesAny(msg, filterKeywords) || matchesAny(msg, filterForKeywords) || matchesAny(msg, filterPendingKeywords) || companyFilterMatch2 || companyFilterMatch3)) {
    // Determine what type of data to filter
    const isTaskFilter = matchesAny(msg, ['tarea', 'tareas', 'tasks', 'pendiente', 'pendientes']);
    const isCampaignFilter = matchesAny(msg, ['campaña', 'campañas', 'campaigns', 'campaign']);
    const isEmailFilter = matchesAny(msg, ['email', 'emails', 'correo', 'correos', 'borrador', 'borradores', 'mail', 'mails']);
    const isAlertFilter = matchesAny(msg, ['alerta', 'alertas', 'alerts', 'alert']);
    const isLeadFilter = matchesAny(msg, ['lead', 'leads', 'prospecto', 'prospectos']);
    const isFileFilter = matchesAny(msg, ['archivo', 'archivos', 'files', 'file', 'documento', 'documentos']);
    const isOverview = matchesAny(msg, ['overview', 'resumen', 'todo', 'información', 'informacion', 'datos', 'general']);
    
    try {
      if (isTaskFilter) {
        intent = 'filter_tasks_by_company';
        const statusFilter = matchesAny(msg, ['pendiente', 'pendientes']) ? 'pending' : undefined;
        platformResult = await ropaPlatformTools.listTasksForCompany({ companyName: companyNameFromFilter, status: statusFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Tareas de ${companyNameFromFilter}:\n\n` +
            `Total: ${platformResult.count}\n` +
            `Pendientes: ${platformResult.pending} | En progreso: ${platformResult.running} | Completadas: ${platformResult.completed} | Fallidas: ${platformResult.failed}\n\n`;
          if (platformResult.tasks?.length > 0) {
            response += platformResult.tasks.map((t: any, i: number) => 
              `${i + 1}. [${t.status}] ${t.taskType} (Prioridad: ${t.priority || 'normal'})`
            ).join('\n');
          } else {
            response += 'No se encontraron tareas para esta empresa.';
          }
        } else {
          response = `No se encontraron tareas para ${companyNameFromFilter}.`;
        }
      } else if (isCampaignFilter) {
        intent = 'filter_campaigns_by_company';
        platformResult = await ropaPlatformTools.listCampaignsForCompany({ companyName: companyNameFromFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Campañas de ${companyNameFromFilter}:\n\n` +
            `Total: ${platformResult.count}\n` +
            `Activas: ${platformResult.active} | Borrador: ${platformResult.draft} | Completadas: ${platformResult.completed} | Pausadas: ${platformResult.paused}\n\n`;
          if (platformResult.campaigns?.length > 0) {
            response += platformResult.campaigns.map((c: any, i: number) => 
              `${i + 1}. ${c.name} [${c.status}] - Tipo: ${c.type}`
            ).join('\n');
          } else {
            response += 'No se encontraron campañas para esta empresa.';
          }
        } else {
          response = `No se encontraron campañas para ${companyNameFromFilter}.`;
        }
      } else if (isEmailFilter) {
        intent = 'filter_emails_by_company';
        const statusFilter = matchesAny(msg, ['aprobado', 'aprobados', 'approved']) ? 'approved' as const
          : matchesAny(msg, ['rechazado', 'rechazados', 'rejected']) ? 'rejected' as const
          : matchesAny(msg, ['pendiente', 'pendientes', 'pending']) ? 'pending' as const
          : matchesAny(msg, ['enviado', 'enviados', 'sent']) ? 'sent' as const
          : 'all' as const;
        platformResult = await ropaPlatformTools.listEmailDraftsForCompany({ companyName: companyNameFromFilter, status: statusFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Emails de ${companyNameFromFilter}${statusFilter !== 'all' ? ` (${statusFilter})` : ''}:\n\n` +
            `Total: ${platformResult.count}\n` +
            `Pendientes: ${platformResult.pending} | Aprobados: ${platformResult.approved} | Rechazados: ${platformResult.rejected} | Enviados: ${platformResult.sent}\n\n`;
          if (platformResult.drafts?.length > 0) {
            response += platformResult.drafts.map((d: any, i: number) => 
              `${i + 1}. [${d.status}] ${d.subject}`
            ).join('\n');
          } else {
            response += 'No se encontraron emails para esta empresa.';
          }
        } else {
          response = `No se encontraron emails para ${companyNameFromFilter}.`;
        }
      } else if (isAlertFilter) {
        intent = 'filter_alerts_by_company';
        platformResult = await ropaPlatformTools.listAlertsForCompany({ companyName: companyNameFromFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Alertas de ${companyNameFromFilter}:\n\n` +
            `Total: ${platformResult.count} (${platformResult.unresolved} sin resolver)\n\n`;
          if (platformResult.alerts?.length > 0) {
            response += platformResult.alerts.map((a: any, i: number) => 
              `${i + 1}. [${a.severity}] ${a.message} ${a.resolved ? '✓' : '⚠'}`
            ).join('\n');
          } else {
            response += 'No se encontraron alertas para esta empresa.';
          }
        } else {
          response = `No se encontraron alertas para ${companyNameFromFilter}.`;
        }
      } else if (isLeadFilter) {
        intent = 'filter_leads_by_company';
        platformResult = await ropaPlatformTools.listLeadsForCompany({ companyName: companyNameFromFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Leads de ${companyNameFromFilter}:\n\n` +
            `Total: ${platformResult.count}\n\n`;
          if (platformResult.leads?.length > 0) {
            response += platformResult.leads.map((l: any, i: number) => 
              `${i + 1}. ${l.contactName || l.companyName} [${l.status}] - ${l.email || 'Sin email'}`
            ).join('\n');
          } else {
            response += 'No se encontraron leads para esta empresa.';
          }
        } else {
          response = `No se encontraron leads para ${companyNameFromFilter}.`;
        }
      } else if (isFileFilter) {
        intent = 'filter_files_by_company';
        platformResult = await ropaPlatformTools.listFilesForCompany({ companyName: companyNameFromFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          response = `Archivos de ${companyNameFromFilter}: ${platformResult.count} archivos encontrados.\n\n`;
          if (platformResult.files?.length > 0) {
            response += platformResult.files.map((f: any, i: number) => 
              `${i + 1}. ${f.fileName} (${f.fileType || f.mimeType})`
            ).join('\n');
          }
        } else {
          response = `No se encontraron archivos para ${companyNameFromFilter}.`;
        }
      } else {
        // Full overview
        intent = 'company_overview';
        platformResult = await ropaPlatformTools.getCompanyFullOverview({ companyName: companyNameFromFilter });
        platformActionExecuted = true;
        if (platformResult?.success) {
          const s = platformResult.summary;
          const c = platformResult.company;
          response = `OVERVIEW DE ${c?.companyName || companyNameFromFilter}\n\n`;
          if (c) {
            response += `ID: ${c.clientId} | Industria: ${c.industry || 'N/A'} | Estado: ${c.status} | Plan: ${c.plan || 'N/A'}\n`;
            response += `Contacto: ${c.contactName || 'N/A'} (${c.contactEmail || 'N/A'})\n`;
            response += `Google Drive: ${c.googleDriveFolderId ? 'Conectado' : 'No configurado'}\n\n`;
          }
          response += `Tareas: ${s.tasks}\n`;
          response += `Campañas: ${s.campaigns}\n`;
          response += `Emails: ${s.emailDrafts}\n`;
          response += `Alertas: ${s.alerts}\n`;
          response += `Leads: ${s.leads}\n`;
          response += `Archivos: ${s.files}`;
        } else {
          response = `No se encontró información para ${companyNameFromFilter}.`;
        }
      }
    } catch (err: any) {
      response = `Error filtrando datos de ${companyNameFromFilter}: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 20b. KPI REPORT ============
  const kpiKeywords = ['kpi', 'kpis', 'reporte kpi', 'report kpi', 'reporte de kpi', 'indicadores clave', 'indicadores de rendimiento', 'key performance'];
  if (matchesAny(msg, kpiKeywords)) {
    intent = 'kpi_report';
    try {
      const { reportingTools } = await import('./ropa-platform-tools');
      platformResult = await reportingTools.generateKPIReport();
      platformActionExecuted = true;
      if (platformResult?.success && platformResult?.report) {
        const r = platformResult.report;
        response = `REPORTE KPI - Ivy.AI\n\n` +
          `Empresas: ${r.summary.totalCompanies} (${r.summary.activeCompanies} activas)\n` +
          `Campañas: ${r.summary.totalCampaigns} (${r.summary.activeCampaigns} activas, ${r.summary.completedCampaigns} completadas)\n` +
          `Emails: ${r.summary.totalEmailDrafts} borradores (${r.summary.approvedEmails} aprobados, ${r.summary.sentEmails} enviados)\n` +
          `Leads: ${r.summary.totalLeads} (${r.summary.qualifiedLeads} calificados, ${r.summary.closedWon} cerrados)\n\n` +
          `Tasa aprobación emails: ${r.kpis.emailApprovalRate}\n` +
          `Tasa conversión leads: ${r.kpis.leadConversionRate}\n` +
          `Tasa completación campañas: ${r.kpis.campaignCompletionRate}\n` +
          `Promedio campañas/empresa: ${r.kpis.avgCampaignsPerCompany}`;
        // Auto-notify (non-blocking)
        ropaPlatformTools.notifyReportReady({ reportType: 'KPI', summary: response }).catch(() => {});
      } else {
        response = 'No se pudo generar el reporte KPI.';
      }
    } catch (err: any) {
      response = `Error generando reporte KPI: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 20c. ROI REPORT ============
  const roiKeywords = ['roi', 'retorno', 'retorno de inversión', 'return on investment', 'rentabilidad', 'costo beneficio', 'costo-beneficio'];
  if (matchesAny(msg, roiKeywords)) {
    intent = 'roi_report';
    try {
      const { reportingTools } = await import('./ropa-platform-tools');
      platformResult = await reportingTools.generateROIReport();
      platformActionExecuted = true;
      if (platformResult?.success && platformResult?.report) {
        const r = platformResult.report;
        response = `REPORTE ROI - Ivy.AI\n\n` +
          `COSTOS:\n` +
          `  Emails: ${r.costs.emailCosts}\n` +
          `  Agencia: ${r.costs.agencyCost}\n` +
          `  Total: ${r.costs.totalCost}\n\n` +
          `INGRESOS:\n` +
          `  Leads calificados: ${r.revenue.qualifiedLeadValue}\n` +
          `  Deals cerrados: ${r.revenue.closedDealValue}\n` +
          `  Total: ${r.revenue.totalRevenue}\n\n` +
          `ROI: ${r.roi}\n` +
          `Emails enviados: ${r.metrics.emailsSent}\n` +
          `Leads generados: ${r.metrics.leadsGenerated}\n` +
          `Deals cerrados: ${r.metrics.dealsClosed}\n` +
          `Tasa conversión: ${r.metrics.conversionRate}`;
      } else {
        response = 'No se pudo generar el reporte ROI.';
      }
    } catch (err: any) {
      response = `Error generando reporte ROI: ${err.message}`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 20d. COMPANY DETAILS ============
  const detailKeywords = ['detalle', 'detalles', 'info de', 'información de', 'informacion de', 'datos de', 'perfil de', 'ficha de'];
  if (matchesAny(msg, detailKeywords) && matchesAny(msg, companyNouns)) {
    intent = 'company_details';
    const companyMatch = cleanMessage.match(/(?:empresa|compañía|compania|cliente|company|negocio|firma)\s+["']?([^"']+)["']?/i);
    if (companyMatch && companyMatch[1]) {
      try {
        const { reportingTools } = await import('./ropa-platform-tools');
        platformResult = await reportingTools.getCompanyDetails({ companyName: companyMatch[1].trim() });
        platformActionExecuted = true;
        if (platformResult?.success && platformResult?.company) {
          const c = platformResult.company;
          response = `Detalles de ${c.companyName}:\n\n` +
            `ID: ${c.clientId}\n` +
            `Industria: ${c.industry || 'No especificada'}\n` +
            `Estado: ${c.status}\n` +
            `Plan: ${c.plan || 'No especificado'}\n` +
            `Contacto: ${c.contactName || 'N/A'} (${c.contactEmail || 'N/A'})\n` +
            `Campañas: ${c.campaigns}\n` +
            `Email drafts: ${c.emailDrafts} (${c.pendingDrafts} pendientes, ${c.approvedDrafts} aprobados, ${c.sentDrafts} enviados)\n` +
            `Google Drive: ${c.googleDriveFolderId ? 'Conectado' : 'No configurado'}\n` +
            `Creada: ${c.createdAt}`;
        } else {
          response = platformResult?.error || 'Empresa no encontrada.';
        }
      } catch (err: any) {
        response = `Error obteniendo detalles: ${err.message}`;
      }
    } else {
      response = 'Especifica la empresa: "detalles de empresa NOMBRE"';
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 21. COMPLEX QUESTIONS → DEFER TO LLM ============
  // If the message is a question or complex request that doesn't match any pattern, defer to LLM
  const questionIndicators = ['?', 'cómo', 'como', 'por qué', 'por que', 'cuál', 'cual', 'cuándo', 'cuando', 'dónde', 'donde', 'explica', 'explain', 'describe', 'define', 'qué es', 'que es', 'qué significa', 'que significa'];
  const isQuestion = matchesAny(msg, questionIndicators);
  
  // Complex requests that should go to LLM
  const complexIndicators = ['analiza', 'analyze', 'compara', 'compare', 'sugiere', 'suggest', 'recomienda', 'recommend', 'planifica', 'plan', 'estrategia', 'strategy', 'optimiza', 'optimize', 'mejora', 'improve', 'evalúa', 'evalua', 'evaluate', 'piensa', 'think', 'opina', 'opinion'];
  const isComplex = matchesAny(msg, complexIndicators);
  
  if (isQuestion || isComplex || msg.length > 100) {
    intent = 'complex_query';
    return { response: '', intent, command, platformActionExecuted, platformResult, shouldDeferToLLM: true };
  }

  // ============ 22. GENERAL FALLBACK ============
  // For short unrecognized messages, still try to be helpful
  intent = 'general';
  
  // If message is very short (1-3 words), try to be conversational
  if (msg.split(/\s+/).length <= 3) {
    return { response: '', intent, command, platformActionExecuted, platformResult, shouldDeferToLLM: true };
  }
  
  response = `Entendido: "${cleanMessage}"\n\n` +
    `Puedo ejecutar estas acciones:\n` +
    `- Navegación: "ve a [sección]"\n` +
    `- Empresas: "crea empresa [nombre]"\n` +
    `- Campañas: "crea campaña [nombre] para [empresa]"\n` +
    `- Emails: "genera emails para [empresa]"\n` +
    `- Envío masivo: "envío masivo para [empresa]"\n` +
    `- Enviar borradores: "enviar borradores aprobados de [empresa]"\n` +
    `- Drive: "muestra archivos de Drive"\n` +
    `- Web: "busca en internet [tema]"\n` +
    `- Stats: "muestra estadísticas"\n` +
    `- Ayuda: "ayuda" o "qué puedes hacer"\n\n` +
    `¿Qué necesitas?`;
  
  return { response, intent, command, platformActionExecuted, platformResult };
}
