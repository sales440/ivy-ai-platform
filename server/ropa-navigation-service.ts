/**
 * ROPA Navigation Service
 * Allows ROPA to control the Ivy.AI interface
 */

// Navigation command queue
interface NavigationCommand {
  id: string;
  type: 'navigate' | 'click' | 'scroll' | 'dialog' | 'sidebar' | 'refresh' | 'focus' | 'highlight';
  target: string;
  params?: Record<string, any>;
  createdAt: string;
  executed: boolean;
  result?: any;
}

let navigationQueue: NavigationCommand[] = [];

// Available sections
export const IVY_SECTIONS = {
  dashboard: { path: '/', name: 'Dashboard', description: 'Panel principal con estadísticas y métricas' },
  campaigns: { path: '/campaigns', name: 'Campañas', description: 'Gestión de campañas de marketing' },
  files: { path: '/files', name: 'Archivos', description: 'Gestión de archivos y Google Drive' },
  monitor: { path: '/monitor', name: 'Monitor', description: 'Validación de emails, llamadas y SMS' },
  tasks: { path: '/tasks', name: 'Tareas', description: 'Lista de tareas del sistema' },
  alerts: { path: '/alerts', name: 'Alertas', description: 'Alertas y notificaciones' },
  health: { path: '/health', name: 'Salud', description: 'Estado de salud del sistema' },
  calendar: { path: '/calendar', name: 'Calendario', description: 'Calendario de campañas' },
  config: { path: '/config', name: 'Configuración', description: 'Configuración de ROPA' },
} as const;

export const IVY_DIALOGS = {
  newCompany: 'new-company-dialog',
  newCampaign: 'new-campaign-dialog',
  editCompany: 'edit-company-dialog',
  ropaChat: 'ropa-chat-window',
} as const;

export const ropaNavigationTools = {
  async navigateTo(params: { section: keyof typeof IVY_SECTIONS | string }) {
    const sectionKey = params.section.toLowerCase().replace(/\s+/g, '') as keyof typeof IVY_SECTIONS;
    const section = IVY_SECTIONS[sectionKey];
    
    const command: NavigationCommand = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'navigate',
      target: section?.path || `/${params.section}`,
      params: { sectionName: section?.name || params.section },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: `Navegando a ${section?.name || params.section}...` };
  },

  async listAvailableSections() {
    return {
      success: true,
      sections: Object.entries(IVY_SECTIONS).map(([key, value]) => ({ key, ...value })),
      count: Object.keys(IVY_SECTIONS).length,
      message: 'Secciones disponibles en Ivy.AI',
    };
  },

  async openDialog(params: { dialog: keyof typeof IVY_DIALOGS | string; data?: any }) {
    const dialogId = IVY_DIALOGS[params.dialog as keyof typeof IVY_DIALOGS] || params.dialog;
    const command: NavigationCommand = {
      id: `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'dialog',
      target: dialogId,
      params: { action: 'open', data: params.data },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: `Abriendo diálogo: ${dialogId}` };
  },

  async closeDialog(params: { dialog?: string }) {
    const command: NavigationCommand = {
      id: `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'dialog',
      target: params.dialog || 'active',
      params: { action: 'close' },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: 'Cerrando diálogo' };
  },

  async clickElement(params: { selector?: string; id?: string; buttonText?: string }) {
    const target = params.id ? `#${params.id}` : params.selector || `button:contains("${params.buttonText}")`;
    const command: NavigationCommand = {
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'click',
      target,
      params: { ...params },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: `Haciendo clic en: ${params.buttonText || params.id || params.selector}` };
  },

  async scrollTo(params: { selector?: string; id?: string; position?: 'top' | 'bottom' | 'center' }) {
    const target = params.id ? `#${params.id}` : params.selector || params.position || 'top';
    const command: NavigationCommand = {
      id: `scroll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'scroll',
      target,
      params: { smooth: true, ...params },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: `Desplazando a: ${target}` };
  },

  async toggleSidebar(params?: { expanded?: boolean }) {
    const command: NavigationCommand = {
      id: `sidebar_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'sidebar',
      target: 'main-sidebar',
      params: { action: 'toggle', ...params },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: 'Alternando sidebar' };
  },

  async refreshPage(params?: { section?: string }) {
    const command: NavigationCommand = {
      id: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'refresh',
      target: params?.section || 'current',
      params: {},
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: 'Refrescando página...' };
  },

  async highlightElement(params: { selector?: string; id?: string; duration?: number }) {
    const target = params.id ? `#${params.id}` : params.selector || '';
    const command: NavigationCommand = {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'highlight',
      target,
      params: { duration: params.duration || 3000, ...params },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: `Resaltando elemento` };
  },

  async openChat() {
    return ropaNavigationTools.openDialog({ dialog: 'ropaChat' });
  },

  async closeChat() {
    return ropaNavigationTools.closeDialog({ dialog: 'ropaChat' });
  },

  async maximizeChat() {
    const command: NavigationCommand = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'dialog',
      target: 'ropaChat',
      params: { action: 'maximize' },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    navigationQueue.push(command);
    return { success: true, commandId: command.id, message: 'Maximizando ventana de chat' };
  },

  async openNewCompanyDialog() {
    await ropaNavigationTools.navigateTo({ section: 'campaigns' });
    return ropaNavigationTools.openDialog({ dialog: 'newCompany' });
  },

  async openNewCampaignDialog(params?: { companyId?: string }) {
    await ropaNavigationTools.navigateTo({ section: 'campaigns' });
    return ropaNavigationTools.openDialog({ dialog: 'newCampaign', data: params });
  },

  // Queue management
  async getPendingCommands() {
    const pending = navigationQueue.filter(c => !c.executed);
    return { success: true, commands: pending, count: pending.length };
  },

  async markCommandExecuted(params: { commandId: string; result?: any }) {
    const command = navigationQueue.find(c => c.id === params.commandId);
    if (command) {
      command.executed = true;
      command.result = params.result;
      return { success: true, message: 'Comando marcado como ejecutado' };
    }
    return { success: false, message: 'Comando no encontrado' };
  },

  async clearPendingCommands() {
    const count = navigationQueue.filter(c => !c.executed).length;
    navigationQueue = navigationQueue.filter(c => c.executed);
    return { success: true, message: `${count} comandos pendientes eliminados` };
  },

  async getCommandHistory(params?: { limit?: number }) {
    const limit = params?.limit || 20;
    return { success: true, commands: navigationQueue.slice(-limit), count: navigationQueue.length };
  },
};

export default ropaNavigationTools;
