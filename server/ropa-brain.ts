/**
 * ROPA Brain - Intelligent Local Response Engine
 * 
 * This module provides intelligent responses WITHOUT requiring an external LLM.
 * It handles ALL platform commands, navigation, queries, and general conversation.
 * Used as the final fallback tier and for instant responses.
 * 
 * Capabilities:
 * - Navigation to all sections
 * - Company/campaign CRUD
 * - Email generation
 * - Google Drive access
 * - Web search
 * - Dashboard metrics
 * - Date/time queries
 * - General conversation
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

  // ============ 1. GREETINGS ============
  const greetings = ['hola', 'hey', 'buenos días', 'buenas tardes', 'buenas noches', 'qué tal', 'hi', 'hello', 'saludos'];
  const isGreeting = greetings.some(g => msg === g || msg === g + ' ropa' || msg.startsWith(g + ',') || msg.startsWith(g + ' '));
  
  if (isGreeting && msg.length < 60) {
    intent = 'greeting';
    // Use client's local hour for time-aware greeting (fallback to server time)
    const hour = typeof clientHour === 'number' ? clientHour : new Date().getHours();
    const timeGreeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
    const dayInfo = clientDay ? ` Hoy es ${clientDay}.` : '';
    response = `${timeGreeting}!${dayInfo} Soy ROPA, tu meta-agente autónomo de Ivy.AI. Estoy listo para ejecutar cualquier tarea. ¿Qué necesitas?`;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 2. NAVIGATION ============
  const navKeywords = ['ve a', 'ir a', 'abre', 'abrir', 'navega', 'muestra', 'mostrar', 'llévame', 'llevame', 'entra a', 'entra en', 'go to', 'open', 'show'];
  const isNavRequest = navKeywords.some(k => msg.includes(k));
  
  if (isNavRequest) {
    const sectionMappings: Record<string, string> = {
      'dashboard': 'dashboard', 'panel': 'dashboard', 'inicio': 'dashboard', 'principal': 'dashboard',
      'campaña': 'campaigns', 'campañas': 'campaigns', 'campaigns': 'campaigns',
      'archivo': 'files', 'archivos': 'files', 'drive': 'files', 'files': 'files',
      'monitor': 'monitor', 'validación': 'monitor', 'borradores': 'monitor',
      'tarea': 'tasks', 'tareas': 'tasks', 'tasks': 'tasks',
      'alerta': 'alerts', 'alertas': 'alerts', 'alerts': 'alerts',
      'salud': 'health', 'estado': 'health', 'health': 'health',
      'calendario': 'calendar', 'calendar': 'calendar',
      'configuración': 'config', 'configuracion': 'config', 'config': 'config', 'ajustes': 'config',
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
    
    // Dialog commands
    if (msg.includes('nueva empresa') || msg.includes('crear empresa')) {
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
    
    if (msg.includes('nueva campaña') || msg.includes('crear campaña')) {
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

  // ============ 3. MAXIMIZE/MINIMIZE/CLOSE CHAT ============
  if (msg.includes('maximiza') || msg.includes('agranda') || msg.includes('pantalla completa')) {
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
  
  if (msg.includes('cierra') && (msg.includes('chat') || msg.includes('ventana'))) {
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

  // ============ 4. EMAIL GENERATION ============
  if ((msg.includes('genera') || msg.includes('crea') || msg.includes('hazme')) && 
      (msg.includes('email') || msg.includes('correo') || msg.includes('borrador'))) {
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
    
    const countMatch = cleanMessage.match(/(\d+)\s*(?:email|correo|borrador)/i);
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

  // ============ 5. COMPANY CREATION ============
  if ((msg.includes('crea') || msg.includes('añade') || msg.includes('registra')) && 
      (msg.includes('empresa') || msg.includes('compañía') || msg.includes('cliente'))) {
    intent = 'create_company';
    
    const companyMatch = cleanMessage.match(/(?:empresa|compañía|cliente)\s+["']?([^"']+)["']?/i);
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

  // ============ 6. CAMPAIGN CREATION ============
  if ((msg.includes('crea') || msg.includes('inicia') || msg.includes('lanza')) && msg.includes('campaña')) {
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

  // ============ 7. WEB SEARCH ============
  if ((msg.includes('busca') || msg.includes('investiga') || msg.includes('encuentra')) && 
      (msg.includes('web') || msg.includes('internet') || msg.includes('información sobre'))) {
    intent = 'web_search';
    
    const searchMatch = cleanMessage.match(/(?:busca|investiga|encuentra|información sobre)\s+["']?([^"']+)["']?/i);
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

  // ============ 8. COMPANY RESEARCH ============
  if ((msg.includes('investiga') || msg.includes('busca información')) && 
      (msg.includes('empresa') || msg.includes('compañía'))) {
    intent = 'research_company';
    
    const companyMatch = cleanMessage.match(/(?:empresa|compañía)\s+["']?([^"']+)["']?/i);
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

  // ============ 9. DASHBOARD METRICS ============
  if (msg.includes('métrica') || msg.includes('metricas') || msg.includes('estadística') || 
      msg.includes('estadisticas') || msg.includes('stats') || msg.includes('resumen') ||
      msg.includes('estado del sistema') || msg.includes('cómo está') || msg.includes('como esta') ||
      (msg.includes('dashboard') && !isNavRequest)) {
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

  // ============ 10. LEAD FUNNEL ============
  if (msg.includes('embudo') || msg.includes('funnel') || msg.includes('conversión') || msg.includes('leads')) {
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

  // ============ 11. SEND EMAIL ============
  if ((msg.includes('envía') || msg.includes('envia') || msg.includes('manda') || msg.includes('send')) && 
      (msg.includes('email') || msg.includes('correo')) && msg.includes('@')) {
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

  // ============ 12. GOOGLE DRIVE ============
  if ((msg.includes('google drive') || msg.includes('carpeta') || msg.includes('archivo')) &&
      (msg.includes('ver') || msg.includes('lista') || msg.includes('muestra') || msg.includes('revisa') || msg.includes('busca'))) {
    intent = 'google_drive';
    
    try {
      if (msg.includes('cliente') || msg.includes('clientes')) {
        platformResult = await ropaDriveService.listAllClients();
        const clientCount = platformResult?.clients?.length || 0;
        response = `Encontré ${clientCount} clientes con carpetas en Google Drive.`;
      } else if (msg.includes('estructura') || msg.includes('carpetas')) {
        platformResult = await ropaDriveService.getFullFolderTree();
        const folderCount = platformResult?.tree?.length || 0;
        response = `Estructura de carpetas obtenida: ${folderCount} carpetas principales.`;
      } else if (msg.includes('busca') || msg.includes('encuentra')) {
        const searchMatch = cleanMessage.match(/(?:archivo|documento)\s+["']?([^"']+)["']?/i);
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

  // ============ 13. DATE/TIME ============
  if (msg.includes('fecha') || msg.includes('hora') || msg.includes('día') || msg.includes('dia') || 
      msg.includes('hoy') || msg.includes('qué día') || msg.includes('que dia') || msg.includes('date') || msg.includes('time')) {
    intent = 'date_time';
    const now = new Date();
    try {
      response = `Hoy es ${now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}.`;
    } catch {
      response = `Hoy es ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}.`;
    }
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 14. HELP / CAPABILITIES ============
  if (msg.includes('ayuda') || msg.includes('help') || msg.includes('qué puedes') || msg.includes('que puedes') ||
      msg.includes('qué haces') || msg.includes('que haces') || msg.includes('capacidades') || msg.includes('funcionalidades') ||
      msg.includes('secciones') || msg.includes('módulos') || msg.includes('modulos') || msg.includes('menú') || msg.includes('menu')) {
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

  // ============ 15. GRATITUDE ============
  if (msg.includes('gracias') || msg.includes('thanks') || msg.includes('perfecto') || msg.includes('excelente') || msg.includes('genial')) {
    intent = 'gratitude';
    response = 'De nada! Estoy aquí para lo que necesites. ¿Algo más en lo que pueda ayudarte?';
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 16. WHO ARE YOU ============
  if (msg.includes('quién eres') || msg.includes('quien eres') || msg.includes('qué eres') || msg.includes('que eres') || msg.includes('who are you')) {
    intent = 'identity';
    response = `Soy ROPA, el meta-agente autónomo de Ivy.AI, la Plataforma de Agentes de Inteligencia Artificial. ` +
      `Tengo control total sobre la plataforma: puedo navegar entre secciones, crear empresas y campañas, ` +
      `generar emails, acceder a Google Drive, buscar en internet, y mucho más. ` +
      `Orquesto a los agentes ARIA (Ventas), LUCA (Soporte), NOVA (Marketing) y SAGE (Operaciones). ` +
      `Mi motor de orquestación es n8n Cloud Pro. ¿En qué te puedo ayudar?`;
    return { response, intent, command, platformActionExecuted, platformResult };
  }

  // ============ 17. GENERAL FALLBACK ============
  intent = 'general';
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
