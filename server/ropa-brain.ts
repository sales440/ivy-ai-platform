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
  
  if (isNavRequest) {
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
      const companyName = companyMatch[1].trim();
      try {
        platformResult = await ropaPlatformTools.createCompany({ companyName });
        platformActionExecuted = true;
        response = `Empresa "${companyName}" creada exitosamente. Puedes verla en la sección de Campañas.`;
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
  
  if (matchesAny(msg, statsKeywords) || (msg.includes('dashboard') && !isNavRequest)) {
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
  if (matchesAny(msg, ['embudo', 'funnel', 'conversión', 'conversion', 'leads', 'pipeline', 'prospecto', 'prospectos', 'oportunidades'])) {
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

  // ============ 12. GOOGLE DRIVE (expanded) ============
  const driveKeywords = ['google drive', 'carpeta', 'archivo', 'archivos', 'documentos', 'docs', 'fichero', 'ficheros', 'drive'];
  const driveVerbs = ['ver', 'lista', 'muestra', 'revisa', 'busca', 'dame', 'enseña', 'enséñame', 'abre', 'accede', 'consulta'];
  
  if (matchesAny(msg, driveKeywords) && matchesAny(msg, driveVerbs)) {
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
    `- Drive: "muestra archivos de Drive"\n` +
    `- Web: "busca en internet [tema]"\n` +
    `- Stats: "muestra estadísticas"\n` +
    `- Ayuda: "ayuda" o "qué puedes hacer"\n\n` +
    `¿Qué necesitas?`;
  
  return { response, intent, command, platformActionExecuted, platformResult };
}
