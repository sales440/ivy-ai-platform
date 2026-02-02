/**
 * ROPA UI Inspection & Self-Correction Tools
 * Gives ROPA visibility into the Ivy.AI interface and ability to diagnose/fix issues
 */

import { createRopaLog, createRopaAlert } from "./ropa-db";

// In-memory state that gets updated by the frontend via API
let uiState: {
  activeSection: string;
  emailDrafts: any[];
  googleDriveConnected: boolean;
  localStorageKeys: string[];
  lastUpdate: string;
  errors: string[];
  chatHistory: any[];
  companies: any[];
  campaigns: any[];
} = {
  activeSection: "dashboard",
  emailDrafts: [],
  googleDriveConnected: false,
  localStorageKeys: [],
  lastUpdate: "",
  errors: [],
  chatHistory: [],
  companies: [],
  campaigns: [],
};

// ============ UI STATE MANAGEMENT ============

export function updateUIState(newState: Partial<typeof uiState>) {
  uiState = { ...uiState, ...newState, lastUpdate: new Date().toISOString() };
}

export function getUIState() {
  return uiState;
}

// ============ UI INSPECTION TOOLS ============

export const uiInspectionTools = {
  /**
   * Get current UI state - what section is active, what data is loaded
   */
  async getUIStatus() {
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[UI Inspector] Getting UI status",
      metadata: { activeSection: uiState.activeSection },
    });

    return {
      success: true,
      activeSection: uiState.activeSection,
      lastUpdate: uiState.lastUpdate,
      googleDriveConnected: uiState.googleDriveConnected,
      emailDraftsCount: uiState.emailDrafts.length,
      companiesCount: uiState.companies.length,
      campaignsCount: uiState.campaigns.length,
      chatMessagesCount: uiState.chatHistory.length,
      errorsCount: uiState.errors.length,
    };
  },

  /**
   * Get all email drafts currently in Monitor
   */
  async getMonitorEmailDrafts() {
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[UI Inspector] Getting email drafts from Monitor",
      metadata: { count: uiState.emailDrafts.length },
    });

    return {
      success: true,
      count: uiState.emailDrafts.length,
      drafts: uiState.emailDrafts.map(d => ({
        id: d.id,
        company: d.company,
        subject: d.subject,
        campaign: d.campaign,
        status: d.status,
        createdAt: d.createdAt,
        bodyPreview: d.body?.substring(0, 100) + "...",
      })),
      pending: uiState.emailDrafts.filter(d => d.status === 'pending').length,
      approved: uiState.emailDrafts.filter(d => d.status === 'approved').length,
      rejected: uiState.emailDrafts.filter(d => d.status === 'rejected').length,
    };
  },

  /**
   * Get localStorage keys and their sizes
   */
  async getLocalStorageInfo() {
    return {
      success: true,
      keys: uiState.localStorageKeys,
      description: "Keys stored in browser localStorage for persistence",
    };
  },

  /**
   * Get any JavaScript errors that occurred in the UI
   */
  async getUIErrors() {
    return {
      success: true,
      errors: uiState.errors,
      count: uiState.errors.length,
      hasErrors: uiState.errors.length > 0,
    };
  },

  /**
   * Get chat history summary
   */
  async getChatHistorySummary() {
    return {
      success: true,
      totalMessages: uiState.chatHistory.length,
      userMessages: uiState.chatHistory.filter((m: any) => m.role === 'user').length,
      assistantMessages: uiState.chatHistory.filter((m: any) => m.role === 'assistant').length,
      lastMessage: uiState.chatHistory.length > 0 
        ? uiState.chatHistory[uiState.chatHistory.length - 1] 
        : null,
    };
  },

  /**
   * Get companies and campaigns data
   */
  async getCompaniesAndCampaigns() {
    return {
      success: true,
      companies: uiState.companies,
      campaigns: uiState.campaigns,
      companiesCount: uiState.companies.length,
      campaignsCount: uiState.campaigns.length,
    };
  },
};

// ============ DIAGNOSTIC TOOLS ============

export const diagnosticTools = {
  /**
   * Diagnose why email drafts might not be appearing
   */
  async diagnoseEmailDraftsIssue() {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if there are any drafts
    if (uiState.emailDrafts.length === 0) {
      issues.push("No hay borradores de email en el estado de la UI");
      suggestions.push("Verifica que el formato [EMAIL_DRAFT]...[/EMAIL_DRAFT] esté correcto en la respuesta");
      suggestions.push("Asegúrate de que el frontend está parseando correctamente los tags");
    }

    // Check if localStorage might be the issue
    if (!uiState.localStorageKeys.includes('ropaEmailDrafts')) {
      issues.push("No hay clave 'ropaEmailDrafts' en localStorage");
      suggestions.push("Los borradores no se están guardando en localStorage");
    }

    // Check for errors
    if (uiState.errors.length > 0) {
      issues.push(`Hay ${uiState.errors.length} errores de JavaScript en la UI`);
      suggestions.push("Revisa los errores de consola para más detalles");
    }

    await createRopaLog({
      taskId: undefined,
      level: issues.length > 0 ? "warn" : "info",
      message: "[Diagnostic] Email drafts diagnosis complete",
      metadata: { issues, suggestions },
    });

    return {
      success: true,
      issuesFound: issues.length,
      issues,
      suggestions,
      currentDraftsCount: uiState.emailDrafts.length,
    };
  },

  /**
   * Diagnose Google Drive connection issues
   */
  async diagnoseGoogleDriveIssue() {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!uiState.googleDriveConnected) {
      issues.push("Google Drive no está conectado según el estado de la UI");
      suggestions.push("Verifica que el token de acceso esté guardado en la base de datos");
      suggestions.push("Intenta reconectar desde la sección de Archivos");
    }

    return {
      success: true,
      connected: uiState.googleDriveConnected,
      issues,
      suggestions,
    };
  },

  /**
   * Run comprehensive platform diagnosis
   */
  async runFullDiagnosis() {
    const emailDiagnosis = await diagnosticTools.diagnoseEmailDraftsIssue();
    const driveDiagnosis = await diagnosticTools.diagnoseGoogleDriveIssue();
    const uiStatus = await uiInspectionTools.getUIStatus();

    const allIssues = [
      ...emailDiagnosis.issues,
      ...driveDiagnosis.issues,
    ];

    const allSuggestions = [
      ...emailDiagnosis.suggestions,
      ...driveDiagnosis.suggestions,
    ];

    if (allIssues.length > 0) {
      await createRopaAlert({
        severity: "warning",
        title: "Diagnóstico de Plataforma",
        message: `Se encontraron ${allIssues.length} problemas`,
        resolved: false,
        metadata: { issues: allIssues, suggestions: allSuggestions },
      });
    }

    return {
      success: true,
      overallHealth: allIssues.length === 0 ? "healthy" : "issues_found",
      totalIssues: allIssues.length,
      issues: allIssues,
      suggestions: allSuggestions,
      uiStatus,
      emailDrafts: emailDiagnosis,
      googleDrive: driveDiagnosis,
    };
  },
};

// ============ SELF-CORRECTION TOOLS ============

// Commands that will be sent to the frontend to execute
let pendingCommands: Array<{
  id: string;
  command: string;
  params: any;
  createdAt: string;
  executed: boolean;
}> = [];

export const selfCorrectionTools = {
  /**
   * Queue a command to clear corrupted localStorage data
   */
  async clearLocalStorageKey(params: { key: string }) {
    const command = {
      id: `cmd_${Date.now()}`,
      command: "clearLocalStorage",
      params: { key: params.key },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    pendingCommands.push(command);

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Self-Correction] Queued command to clear localStorage key: ${params.key}`,
      metadata: command,
    });

    return {
      success: true,
      commandId: command.id,
      message: `Comando encolado para limpiar localStorage['${params.key}']`,
    };
  },

  /**
   * Queue a command to reset email drafts
   */
  async resetEmailDrafts() {
    const command = {
      id: `cmd_${Date.now()}`,
      command: "resetEmailDrafts",
      params: {},
      createdAt: new Date().toISOString(),
      executed: false,
    };
    pendingCommands.push(command);

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[Self-Correction] Queued command to reset email drafts",
      metadata: command,
    });

    return {
      success: true,
      commandId: command.id,
      message: "Comando encolado para reiniciar los borradores de email",
    };
  },

  /**
   * Queue a command to force refresh Google Drive connection
   */
  async forceRefreshGoogleDrive() {
    const command = {
      id: `cmd_${Date.now()}`,
      command: "refreshGoogleDrive",
      params: {},
      createdAt: new Date().toISOString(),
      executed: false,
    };
    pendingCommands.push(command);

    return {
      success: true,
      commandId: command.id,
      message: "Comando encolado para refrescar la conexión de Google Drive",
    };
  },

  /**
   * Queue a command to navigate to a specific section
   */
  async navigateToSection(params: { section: string }) {
    const command = {
      id: `cmd_${Date.now()}`,
      command: "navigateToSection",
      params: { section: params.section },
      createdAt: new Date().toISOString(),
      executed: false,
    };
    pendingCommands.push(command);

    return {
      success: true,
      commandId: command.id,
      message: `Comando encolado para navegar a la sección: ${params.section}`,
    };
  },

  /**
   * Queue a command to add a test email draft (for debugging)
   */
  async addTestEmailDraft(params: { company: string; subject: string; body: string; campaign: string }) {
    const command = {
      id: `cmd_${Date.now()}`,
      command: "addEmailDraft",
      params,
      createdAt: new Date().toISOString(),
      executed: false,
    };
    pendingCommands.push(command);

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[Self-Correction] Queued command to add test email draft",
      metadata: command,
    });

    return {
      success: true,
      commandId: command.id,
      message: `Comando encolado para añadir borrador de email de prueba para ${params.company}`,
    };
  },

  /**
   * Get pending commands that need to be executed by the frontend
   */
  async getPendingCommands() {
    const pending = pendingCommands.filter(c => !c.executed);
    return {
      success: true,
      commands: pending,
      count: pending.length,
    };
  },

  /**
   * Mark a command as executed
   */
  async markCommandExecuted(params: { commandId: string }) {
    const command = pendingCommands.find(c => c.id === params.commandId);
    if (command) {
      command.executed = true;
      return { success: true, message: "Comando marcado como ejecutado" };
    }
    return { success: false, message: "Comando no encontrado" };
  },

  /**
   * Clear all pending commands
   */
  async clearPendingCommands() {
    const count = pendingCommands.length;
    pendingCommands = [];
    return {
      success: true,
      message: `${count} comandos eliminados`,
    };
  },
};

// ============ EXPORT ALL UI TOOLS ============

export const ropaUITools = {
  ...uiInspectionTools,
  ...diagnosticTools,
  ...selfCorrectionTools,
};

export default ropaUITools;
