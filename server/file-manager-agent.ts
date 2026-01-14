/**
 * FileManager Agent - Agente autónomo para gestión de archivos en Google Drive
 * 
 * Este agente es orquestado por ROPA y se encarga de:
 * - Sincronizar toda la información de clientes a Google Drive
 * - Mantener estructura de carpetas por ID de cliente
 * - Respaldar campañas, templates, reportes, KPIs, estadísticas
 * - Actualizar archivos en tiempo real
 */

import { getDb } from "./db";
import { googleDriveTokens, ivyClients } from "../drizzle/schema";
import { 
  getOAuth2Client, 
  initializeFolderStructure, 
  uploadFileToDrive,
  listFilesInFolder 
} from "./google-drive";
import { google } from "googleapis";

// Estructura de carpetas por cliente
const CLIENT_FOLDER_STRUCTURE = [
  "Campañas",
  "Campañas/Email",
  "Campañas/Phone",
  "Campañas/Social Media",
  "Campañas/Multi-Channel",
  "Templates",
  "Templates/Email",
  "Templates/SMS",
  "Templates/Call Scripts",
  "Reportes",
  "Reportes/Diarios",
  "Reportes/Semanales",
  "Reportes/Mensuales",
  "KPIs",
  "Estadísticas",
  "Leads",
  "Leads/Activos",
  "Leads/Convertidos",
  "Leads/Perdidos",
  "Branding",
  "Documentos",
  "Backups",
];

interface FileManagerTask {
  type: "sync_client" | "backup_campaign" | "save_template" | "update_kpi" | "save_report";
  clientId: string;
  data: any;
  priority: "high" | "medium" | "low";
}

class FileManagerAgent {
  private taskQueue: FileManagerTask[] = [];
  private isProcessing = false;
  private oauth2Client: any = null;
  private clientFolderCache: Map<string, { folderId: string; subfolders: Record<string, string> }> = new Map();

  constructor() {
    console.log("[FileManager Agent] Inicializado");
  }

  /**
   * Inicializar conexión con Google Drive
   */
  async initialize(): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) {
        console.error("[FileManager Agent] Database no disponible");
        return false;
      }

      const [tokenRecord] = await db.select().from(googleDriveTokens).limit(1);
      if (!tokenRecord) {
        console.log("[FileManager Agent] Google Drive no conectado");
        return false;
      }

      this.oauth2Client = getOAuth2Client();
      this.oauth2Client.setCredentials({
        access_token: tokenRecord.accessToken,
        refresh_token: tokenRecord.refreshToken || undefined,
        expiry_date: tokenRecord.expiryDate?.getTime(),
        token_type: tokenRecord.tokenType || undefined,
        scope: tokenRecord.scope || undefined,
      });

      console.log("[FileManager Agent] Conectado a Google Drive");
      return true;
    } catch (error) {
      console.error("[FileManager Agent] Error inicializando:", error);
      return false;
    }
  }

  /**
   * Crear estructura de carpetas para un cliente
   */
  async createClientFolderStructure(clientId: string, companyName: string): Promise<string | null> {
    if (!this.oauth2Client) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      
      // Buscar o crear carpeta raíz de Ivy.AI
      const rootFolderId = await this.getOrCreateFolder(drive, "Ivy.AI - Clientes", undefined);
      
      // Crear carpeta del cliente con formato: [ID] - Nombre
      const clientFolderName = `[${clientId}] - ${companyName}`;
      const clientFolderId = await this.getOrCreateFolder(drive, clientFolderName, rootFolderId);
      
      // Crear subcarpetas
      const subfolders: Record<string, string> = {};
      for (const folder of CLIENT_FOLDER_STRUCTURE) {
        const parts = folder.split("/");
        let parentId = clientFolderId;
        
        for (let i = 0; i < parts.length; i++) {
          const folderName = parts[i];
          const folderId = await this.getOrCreateFolder(drive, folderName, parentId);
          parentId = folderId;
          
          // Guardar referencia de la carpeta final
          if (i === parts.length - 1) {
            subfolders[folder] = folderId;
          }
        }
      }
      
      // Cachear estructura
      this.clientFolderCache.set(clientId, { folderId: clientFolderId, subfolders });
      
      console.log(`[FileManager Agent] Estructura creada para cliente ${clientId}`);
      return clientFolderId;
    } catch (error) {
      console.error(`[FileManager Agent] Error creando estructura para ${clientId}:`, error);
      return null;
    }
  }

  /**
   * Obtener o crear carpeta
   */
  private async getOrCreateFolder(drive: any, name: string, parentId?: string): Promise<string> {
    // Buscar carpeta existente
    const query = parentId
      ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Crear carpeta
    const fileMetadata: any = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    return folder.data.id;
  }

  /**
   * Guardar campaña en Google Drive
   */
  async saveCampaign(clientId: string, campaign: any): Promise<boolean> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) {
        console.error(`[FileManager Agent] No hay carpeta para cliente ${clientId}`);
        return false;
      }

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      
      // Determinar subcarpeta según tipo de campaña
      const campaignType = campaign.type || "email";
      const folderKey = `Campañas/${campaignType.charAt(0).toUpperCase() + campaignType.slice(1).replace("_", " ")}`;
      const folderId = clientFolder.subfolders[folderKey] || clientFolder.subfolders["Campañas"];
      
      // Crear archivo JSON con datos de la campaña
      const fileName = `campaign_${campaign.id}_${new Date().toISOString().split("T")[0]}.json`;
      const content = JSON.stringify(campaign, null, 2);
      
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: content,
        },
      });

      console.log(`[FileManager Agent] Campaña ${campaign.id} guardada para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error guardando campaña:`, error);
      return false;
    }
  }

  /**
   * Guardar template en Google Drive
   */
  async saveTemplate(clientId: string, template: any, type: "email" | "sms" | "call_script"): Promise<boolean> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) return false;

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      
      const folderMap: Record<string, string> = {
        email: "Templates/Email",
        sms: "Templates/SMS",
        call_script: "Templates/Call Scripts",
      };
      
      const folderId = clientFolder.subfolders[folderMap[type]] || clientFolder.subfolders["Templates"];
      
      const fileName = `template_${type}_${Date.now()}.json`;
      const content = JSON.stringify(template, null, 2);
      
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: content,
        },
      });

      console.log(`[FileManager Agent] Template ${type} guardado para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error guardando template:`, error);
      return false;
    }
  }

  /**
   * Guardar reporte/KPIs en Google Drive
   */
  async saveReport(clientId: string, report: any, reportType: "daily" | "weekly" | "monthly"): Promise<boolean> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) return false;

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      
      const folderMap: Record<string, string> = {
        daily: "Reportes/Diarios",
        weekly: "Reportes/Semanales",
        monthly: "Reportes/Mensuales",
      };
      
      const folderId = clientFolder.subfolders[folderMap[reportType]] || clientFolder.subfolders["Reportes"];
      
      const date = new Date().toISOString().split("T")[0];
      const fileName = `report_${reportType}_${date}.json`;
      const content = JSON.stringify(report, null, 2);
      
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: content,
        },
      });

      console.log(`[FileManager Agent] Reporte ${reportType} guardado para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error guardando reporte:`, error);
      return false;
    }
  }

  /**
   * Guardar KPIs actualizados
   */
  async saveKPIs(clientId: string, kpis: any): Promise<boolean> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) return false;

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const folderId = clientFolder.subfolders["KPIs"];
      
      const date = new Date().toISOString().split("T")[0];
      const fileName = `kpis_${date}.json`;
      const content = JSON.stringify({
        ...kpis,
        updatedAt: new Date().toISOString(),
      }, null, 2);
      
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: content,
        },
      });

      console.log(`[FileManager Agent] KPIs guardados para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error guardando KPIs:`, error);
      return false;
    }
  }

  /**
   * Guardar estadísticas
   */
  async saveStatistics(clientId: string, stats: any): Promise<boolean> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) return false;

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const folderId = clientFolder.subfolders["Estadísticas"];
      
      const date = new Date().toISOString().split("T")[0];
      const fileName = `statistics_${date}.json`;
      const content = JSON.stringify({
        ...stats,
        generatedAt: new Date().toISOString(),
      }, null, 2);
      
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/json",
        },
        media: {
          mimeType: "application/json",
          body: content,
        },
      });

      console.log(`[FileManager Agent] Estadísticas guardadas para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error guardando estadísticas:`, error);
      return false;
    }
  }

  /**
   * Subir archivo genérico a carpeta de cliente
   */
  async uploadFile(
    clientId: string, 
    fileName: string, 
    content: Buffer | string, 
    mimeType: string,
    folder: string
  ): Promise<{ success: boolean; fileId?: string; webViewLink?: string }> {
    try {
      const clientFolder = this.clientFolderCache.get(clientId);
      if (!clientFolder) {
        return { success: false };
      }

      const drive = google.drive({ version: "v3", auth: this.oauth2Client });
      const folderId = clientFolder.subfolders[folder] || clientFolder.folderId;
      
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType,
        },
        media: {
          mimeType,
          body: typeof content === "string" ? content : Buffer.from(content).toString(),
        },
        fields: "id, webViewLink",
      });

      console.log(`[FileManager Agent] Archivo ${fileName} subido para cliente ${clientId}`);
      return {
        success: true,
        fileId: response.data.id || undefined,
        webViewLink: response.data.webViewLink || undefined,
      };
    } catch (error) {
      console.error(`[FileManager Agent] Error subiendo archivo:`, error);
      return { success: false };
    }
  }

  /**
   * Sincronizar todos los datos de un cliente
   */
  async syncClient(clientId: string): Promise<boolean> {
    console.log(`[FileManager Agent] Iniciando sincronización para cliente ${clientId}`);
    
    try {
      const db = await getDb();
      if (!db) return false;

      // Obtener datos del cliente
      const [client] = await db
        .select()
        .from(ivyClients)
        .where((clients: any) => clients.clientId.equals(clientId))
        .limit(1);

      if (!client) {
        console.error(`[FileManager Agent] Cliente ${clientId} no encontrado`);
        return false;
      }

      // Asegurar que existe la estructura de carpetas
      if (!this.clientFolderCache.has(clientId)) {
        await this.createClientFolderStructure(clientId, client.companyName);
      }

      // Guardar datos del cliente
      await this.uploadFile(
        clientId,
        "client_info.json",
        JSON.stringify(client, null, 2),
        "application/json",
        "Documentos"
      );

      console.log(`[FileManager Agent] Sincronización completada para cliente ${clientId}`);
      return true;
    } catch (error) {
      console.error(`[FileManager Agent] Error sincronizando cliente ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Agregar tarea a la cola
   */
  addTask(task: FileManagerTask): void {
    // Ordenar por prioridad
    if (task.priority === "high") {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }
    
    // Procesar cola si no está procesando
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Procesar cola de tareas
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      
      try {
        switch (task.type) {
          case "sync_client":
            await this.syncClient(task.clientId);
            break;
          case "backup_campaign":
            await this.saveCampaign(task.clientId, task.data);
            break;
          case "save_template":
            await this.saveTemplate(task.clientId, task.data.template, task.data.type);
            break;
          case "update_kpi":
            await this.saveKPIs(task.clientId, task.data);
            break;
          case "save_report":
            await this.saveReport(task.clientId, task.data.report, task.data.reportType);
            break;
        }
      } catch (error) {
        console.error(`[FileManager Agent] Error procesando tarea:`, error);
      }
      
      // Pequeña pausa entre tareas para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.isProcessing = false;
  }

  /**
   * Obtener estado del agente
   */
  getStatus(): { connected: boolean; queueLength: number; isProcessing: boolean } {
    return {
      connected: this.oauth2Client !== null,
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Singleton instance
export const fileManagerAgent = new FileManagerAgent();

// Función para inicializar el agente (llamada por ROPA)
export async function initializeFileManagerAgent(): Promise<boolean> {
  return await fileManagerAgent.initialize();
}

// Exportar funciones para uso por ROPA y otros componentes
export const FileManager = {
  createClientFolder: (clientId: string, companyName: string) => 
    fileManagerAgent.createClientFolderStructure(clientId, companyName),
  saveCampaign: (clientId: string, campaign: any) => 
    fileManagerAgent.saveCampaign(clientId, campaign),
  saveTemplate: (clientId: string, template: any, type: "email" | "sms" | "call_script") => 
    fileManagerAgent.saveTemplate(clientId, template, type),
  saveReport: (clientId: string, report: any, reportType: "daily" | "weekly" | "monthly") => 
    fileManagerAgent.saveReport(clientId, report, reportType),
  saveKPIs: (clientId: string, kpis: any) => 
    fileManagerAgent.saveKPIs(clientId, kpis),
  saveStatistics: (clientId: string, stats: any) => 
    fileManagerAgent.saveStatistics(clientId, stats),
  uploadFile: (clientId: string, fileName: string, content: Buffer | string, mimeType: string, folder: string) =>
    fileManagerAgent.uploadFile(clientId, fileName, content, mimeType, folder),
  syncClient: (clientId: string) => 
    fileManagerAgent.syncClient(clientId),
  addTask: (task: FileManagerTask) => 
    fileManagerAgent.addTask(task),
  getStatus: () => 
    fileManagerAgent.getStatus(),
};
