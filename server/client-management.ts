import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { ivyClients, clientFiles, googleDriveTokens } from "../drizzle/schema";
import { getOAuth2Client, uploadFileToDrive } from "./google-drive";

// Generar ID único para cliente: IVY-YYYY-XXXX
function generateClientId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `IVY-${year}-${random}`;
}

// Crear estructura de carpetas en Google Drive para un cliente
async function createClientFolderStructure(oauth2Client: any, clientId: string, companyName: string) {
  const { google } = await import('googleapis');
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  // Crear carpeta raíz del cliente
  
  const rootFolderRes = await drive.files.create({
    requestBody: {
      name: `[${clientId}] ${companyName}`,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id, name'
  });
  const rootFolder = { id: rootFolderRes.data.id };
  
  // Crear subcarpetas
  const subfolders = [
    'Logos y Branding',
    'Templates de Email',
    'Listas de Clientes',
    'Reportes',
    'Backups',
    'Campanas',
    'Documentos'
  ];
  
  const folderStructure: Record<string, string> = {
    root: rootFolder.id!
  };
  
  for (const subfolder of subfolders) {
    const folder = await drive.files.create({
      requestBody: {
        name: subfolder,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolder.id!]
      },
      fields: 'id, name'
    });
    folderStructure[subfolder.toLowerCase().replace(/ /g, '_')] = folder.data.id!;
  }
  
  return folderStructure;
}

export const clientManagementRouter = router({
  // Crear nuevo cliente con ID único
  create: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
      plan: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Generar ID único
      let clientId = generateClientId();
      
      // Verificar que no exista
      let exists = true;
      while (exists) {
        const existing = await db.select().from(ivyClients).where(eq(ivyClients.clientId, clientId)).limit(1);
        if (existing.length === 0) {
          exists = false;
        } else {
          clientId = generateClientId();
        }
      }
      
      // Intentar crear estructura en Google Drive
      let googleDriveFolderId = null;
      let googleDriveStructure = null;
      
      try {
        const [tokenRecord] = await db.select().from(googleDriveTokens).limit(1);
        if (tokenRecord) {
          const oauth2Client = getOAuth2Client();
          oauth2Client.setCredentials({
            access_token: tokenRecord.accessToken,
            refresh_token: tokenRecord.refreshToken || undefined,
            expiry_date: tokenRecord.expiryDate?.getTime(),
          });
          
          const folderStructure = await createClientFolderStructure(oauth2Client, clientId, input.companyName);
          googleDriveFolderId = folderStructure.root;
          googleDriveStructure = JSON.stringify(folderStructure);
          
          console.log(`[Client Management] Created Google Drive structure for ${clientId}`);
        }
      } catch (error) {
        console.warn(`[Client Management] Could not create Google Drive structure: ${error}`);
      }
      
      // Insertar cliente
      await db.insert(ivyClients).values({
        clientId,
        companyName: input.companyName,
        industry: input.industry,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        address: input.address,
        website: input.website,
        plan: input.plan || "free",
        status: "prospect",
        googleDriveFolderId,
        googleDriveStructure,
        createdBy: ctx.user.openId,
      });
      
      console.log(`[Client Management] Created client ${clientId}: ${input.companyName}`);
      
      return {
        success: true,
        clientId,
        googleDriveFolderId,
        message: `Cliente creado con ID: ${clientId}`
      };
    }),

  // Listar todos los clientes
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const clients = await db.select().from(ivyClients).orderBy(ivyClients.createdAt);
    return clients;
  }),

  // Obtener cliente por ID
  getById: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const [client] = await db.select().from(ivyClients).where(eq(ivyClients.clientId, input.clientId)).limit(1);
      return client || null;
    }),

  // Actualizar cliente
  update: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
      status: z.enum(["active", "inactive", "prospect", "churned"]).optional(),
      plan: z.enum(["free", "starter", "professional", "enterprise"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { clientId, ...updateData } = input;
      
      await db.update(ivyClients)
        .set(updateData)
        .where(eq(ivyClients.clientId, clientId));
      
      return { success: true };
    }),

  // Subir archivo para cliente
  uploadFile: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
      fileType: z.enum(["logo", "template", "report", "backup", "document", "campaign_asset", "client_list", "other"]),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Obtener cliente
      const [client] = await db.select().from(ivyClients).where(eq(ivyClients.clientId, input.clientId)).limit(1);
      if (!client) throw new Error("Cliente no encontrado");
      
      const buffer = Buffer.from(input.fileData, "base64");
      let googleDriveFileId = null;
      let googleDriveUrl = null;
      
      // Subir a Google Drive si está conectado
      try {
        const [tokenRecord] = await db.select().from(googleDriveTokens).limit(1);
        if (tokenRecord && client.googleDriveStructure) {
          const oauth2Client = getOAuth2Client();
          oauth2Client.setCredentials({
            access_token: tokenRecord.accessToken,
            refresh_token: tokenRecord.refreshToken || undefined,
            expiry_date: tokenRecord.expiryDate?.getTime(),
          });
          
          const folderStructure = JSON.parse(client.googleDriveStructure);
          
          // Determinar carpeta destino
          const folderMap: Record<string, string> = {
            logo: 'logos_y_branding',
            template: 'templates_de_email',
            client_list: 'listas_de_clientes',
            report: 'reportes',
            backup: 'backups',
            campaign_asset: 'campanas',
            document: 'documentos',
            other: 'root'
          };
          
          const targetFolderId = folderStructure[folderMap[input.fileType]] || folderStructure.root;
          
          const driveFile = await uploadFileToDrive(
            oauth2Client,
            `[${input.clientId}] ${input.fileName}`,
            buffer,
            input.mimeType,
            targetFolderId
          );
          
          googleDriveFileId = driveFile.id;
          googleDriveUrl = driveFile.webViewLink;
        }
      } catch (error) {
        console.warn(`[Client Management] Could not upload to Google Drive: ${error}`);
      }
      
      // Guardar en base de datos
      await db.insert(clientFiles).values({
        clientId: input.clientId,
        fileType: input.fileType,
        fileName: input.fileName,
        googleDriveFileId,
        googleDriveUrl,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        description: input.description,
        uploadedBy: ctx.user.openId,
      });
      
      return {
        success: true,
        googleDriveFileId,
        googleDriveUrl,
      };
    }),

  // Listar archivos de un cliente
  listFiles: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const files = await db.select().from(clientFiles).where(eq(clientFiles.clientId, input.clientId));
      return files;
    }),
});
