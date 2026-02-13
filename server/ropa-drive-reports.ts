/**
 * ROPA Drive Reports - Auto-save reports to Google Drive
 * Saves KPI/ROI reports, email drafts, and campaign data to client folders
 */

import { uploadFileToDrive, createFolder } from './google-drive';
import { getOAuth2Client, setCredentials } from './google-drive';
import mysql from 'mysql2/promise';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { ivyClients } from '../drizzle/schema';
import { notifyOwner } from './_core/notification';

// Get authenticated Google Drive client
async function getAuthenticatedClient(): Promise<any | null> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL || '');
    
    const [rows] = await connection.execute(
      "SELECT access_token, refresh_token, expiry_date, scope, token_type, folder_ids FROM google_drive_tokens LIMIT 1"
    ) as [any[], any];
    
    if (rows.length === 0) {
      console.log('[ROPA Drive Reports] No Google Drive tokens found');
      return null;
    }

    const tokenRecord = rows[0];
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenRecord.access_token,
      refresh_token: tokenRecord.refresh_token,
      expiry_date: tokenRecord.expiry_date,
      scope: tokenRecord.scope,
      token_type: tokenRecord.token_type,
    });

    const folderIds = typeof tokenRecord.folder_ids === 'string' 
      ? JSON.parse(tokenRecord.folder_ids) 
      : (tokenRecord.folder_ids || {});

    return { oauth2Client, folderIds };
  } catch (error) {
    console.error('[ROPA Drive Reports] Error getting authenticated client:', error);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Get or create the Reports subfolder for a client in Google Drive
 */
async function getOrCreateReportsFolder(
  oauth2Client: any,
  clientFolderId: string,
  clientName: string
): Promise<string | null> {
  try {
    const { google } = await import('googleapis');
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Search for existing "Reportes" folder
    const res = await drive.files.list({
      q: `name='Reportes' and '${clientFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    
    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }
    
    // Create "Reportes" folder
    const folder = await createFolder(oauth2Client, 'Reportes', clientFolderId);
    return folder.id;
  } catch (error) {
    console.error(`[ROPA Drive Reports] Error getting/creating Reports folder for ${clientName}:`, error);
    return null;
  }
}

/**
 * Generate HTML report content for KPI
 */
function generateKPIReportHTML(reportData: any, companyName?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const r = reportData.report || reportData;
  const s = r.summary || {};
  const k = r.kpis || {};

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte KPI - ${companyName || 'Ivy.AI'} - ${dateStr}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; background: #f8f9fa; }
    .header { background: linear-gradient(135deg, #0d9488, #0f766e); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .logo { font-size: 14px; opacity: 0.7; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .card .value { font-size: 28px; font-weight: 700; color: #0d9488; margin-top: 4px; }
    .card .sub { font-size: 13px; color: #9ca3af; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    th { background: #0d9488; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
    td { padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .section-title { font-size: 18px; font-weight: 600; margin: 30px 0 15px; color: #1a1a2e; }
    .footer { text-align: center; margin-top: 40px; padding: 20px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte KPI${companyName ? ` - ${companyName}` : ''}</h1>
    <p>Generado: ${dateStr}</p>
    <div class="logo">POWERED BY IVY.AI</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Empresas</div>
      <div class="value">${s.totalCompanies || 0}</div>
      <div class="sub">${s.activeCompanies || 0} activas</div>
    </div>
    <div class="card">
      <div class="label">Campañas</div>
      <div class="value">${s.totalCampaigns || 0}</div>
      <div class="sub">${s.activeCampaigns || 0} activas, ${s.completedCampaigns || 0} completadas</div>
    </div>
    <div class="card">
      <div class="label">Emails</div>
      <div class="value">${s.totalEmailDrafts || 0}</div>
      <div class="sub">${s.approvedEmails || 0} aprobados, ${s.sentEmails || 0} enviados</div>
    </div>
    <div class="card">
      <div class="label">Leads</div>
      <div class="value">${s.totalLeads || 0}</div>
      <div class="sub">${s.qualifiedLeads || 0} calificados, ${s.closedWon || 0} cerrados</div>
    </div>
  </div>

  <div class="section-title">Indicadores Clave</div>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Tasa de aprobación de emails</td><td>${k.emailApprovalRate || '0%'}</td></tr>
    <tr><td>Tasa de conversión de leads</td><td>${k.leadConversionRate || '0%'}</td></tr>
    <tr><td>Tasa de completación de campañas</td><td>${k.campaignCompletionRate || '0%'}</td></tr>
    <tr><td>Promedio campañas por empresa</td><td>${k.avgCampaignsPerCompany || '0'}</td></tr>
    <tr><td>Promedio leads por campaña</td><td>${k.avgLeadsPerCampaign || '0'}</td></tr>
  </table>

  <div class="footer">
    <p>© ${now.getFullYear()} Ivy.AI - Plataforma de Agentes IA | Reporte generado automáticamente por ROPA</p>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML report content for ROI
 */
function generateROIReportHTML(reportData: any, companyName?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const r = reportData.report || reportData;
  const costs = r.costs || {};
  const revenue = r.revenue || {};
  const metrics = r.metrics || {};

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte ROI - ${companyName || 'Ivy.AI'} - ${dateStr}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a2e; background: #f8f9fa; }
    .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .logo { font-size: 14px; opacity: 0.7; margin-top: 10px; }
    .roi-badge { background: white; color: #7c3aed; font-size: 48px; font-weight: 800; padding: 20px 40px; border-radius: 16px; text-align: center; margin: 20px 0 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .roi-badge .label { font-size: 14px; color: #6b7280; font-weight: 400; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .card h3 { margin: 0 0 15px; font-size: 16px; color: #374151; }
    .card .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .card .row:last-child { border-bottom: none; }
    .card .row .label { color: #6b7280; }
    .card .row .value { font-weight: 600; }
    .cost { color: #ef4444; }
    .revenue { color: #10b981; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    th { background: #7c3aed; color: white; padding: 12px 16px; text-align: left; }
    td { padding: 10px 16px; border-bottom: 1px solid #e5e7eb; }
    .section-title { font-size: 18px; font-weight: 600; margin: 30px 0 15px; }
    .footer { text-align: center; margin-top: 40px; padding: 20px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte ROI${companyName ? ` - ${companyName}` : ''}</h1>
    <p>Generado: ${dateStr}</p>
    <div class="logo">POWERED BY IVY.AI</div>
  </div>

  <div class="roi-badge">
    ${r.roi || '0%'}
    <div class="label">Retorno de Inversión</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>💰 Costos</h3>
      <div class="row"><span class="label">Emails</span><span class="value cost">${costs.emailCosts || '$0'}</span></div>
      <div class="row"><span class="label">Agencia</span><span class="value cost">${costs.agencyCost || '$0'}</span></div>
      <div class="row"><span class="label"><strong>Total</strong></span><span class="value cost"><strong>${costs.totalCost || '$0'}</strong></span></div>
    </div>
    <div class="card">
      <h3>📈 Ingresos</h3>
      <div class="row"><span class="label">Leads calificados</span><span class="value revenue">${revenue.qualifiedLeadValue || '$0'}</span></div>
      <div class="row"><span class="label">Deals cerrados</span><span class="value revenue">${revenue.closedDealValue || '$0'}</span></div>
      <div class="row"><span class="label"><strong>Total</strong></span><span class="value revenue"><strong>${revenue.totalRevenue || '$0'}</strong></span></div>
    </div>
  </div>

  <div class="section-title">Métricas de Rendimiento</div>
  <table>
    <tr><th>Métrica</th><th>Valor</th></tr>
    <tr><td>Emails enviados</td><td>${metrics.emailsSent || 0}</td></tr>
    <tr><td>Leads generados</td><td>${metrics.leadsGenerated || 0}</td></tr>
    <tr><td>Leads calificados</td><td>${metrics.leadsQualified || 0}</td></tr>
    <tr><td>Deals cerrados</td><td>${metrics.dealsClosed || 0}</td></tr>
    <tr><td>Tasa de conversión</td><td>${metrics.conversionRate || '0%'}</td></tr>
  </table>

  <div class="footer">
    <p>© ${now.getFullYear()} Ivy.AI - Plataforma de Agentes IA | Reporte generado automáticamente por ROPA</p>
  </div>
</body>
</html>`;
}

/**
 * Save a KPI report to Google Drive for a specific company
 */
export async function saveKPIReportToDrive(reportData: any, companyName?: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return { success: false, error: 'Google Drive no conectado. Conecta Google Drive primero.' };

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds?.rootFolderId || folderIds?.root;
    
    if (!rootFolderId) return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI en Google Drive.' };

    let targetFolderId = rootFolderId;

    // If company specified, find or create company folder
    if (companyName) {
      const db = await getDb();
      if (db) {
        const clients = await db.select().from(ivyClients);
        const client = clients.find(c => c.companyName.toLowerCase().includes(companyName.toLowerCase()));
        if (client?.googleDriveFolderId) {
          const reportsFolderId = await getOrCreateReportsFolder(oauth2Client, client.googleDriveFolderId, companyName);
          if (reportsFolderId) targetFolderId = reportsFolderId;
        }
      }
    }

    const html = generateKPIReportHTML(reportData, companyName);
    const buffer = Buffer.from(html, 'utf-8');
    const now = new Date();
    const fileName = `KPI_Report_${companyName || 'Global'}_${now.toISOString().split('T')[0]}.html`;

    const result = await uploadFileToDrive(oauth2Client, fileName, buffer, 'text/html', targetFolderId);

    // Notify owner
    await notifyOwner({
      title: `[Ivy.AI] Reporte KPI guardado - ${companyName || 'Global'}`,
      content: `El reporte KPI ha sido guardado automáticamente en Google Drive: ${result.webViewLink}`,
    });

    return { success: true, fileUrl: result.webViewLink };
  } catch (error: any) {
    console.error('[ROPA Drive Reports] Error saving KPI report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save an ROI report to Google Drive for a specific company
 */
export async function saveROIReportToDrive(reportData: any, companyName?: string): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return { success: false, error: 'Google Drive no conectado. Conecta Google Drive primero.' };

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds?.rootFolderId || folderIds?.root;
    
    if (!rootFolderId) return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI en Google Drive.' };

    let targetFolderId = rootFolderId;

    if (companyName) {
      const db = await getDb();
      if (db) {
        const clients = await db.select().from(ivyClients);
        const client = clients.find(c => c.companyName.toLowerCase().includes(companyName.toLowerCase()));
        if (client?.googleDriveFolderId) {
          const reportsFolderId = await getOrCreateReportsFolder(oauth2Client, client.googleDriveFolderId, companyName);
          if (reportsFolderId) targetFolderId = reportsFolderId;
        }
      }
    }

    const html = generateROIReportHTML(reportData, companyName);
    const buffer = Buffer.from(html, 'utf-8');
    const now = new Date();
    const fileName = `ROI_Report_${companyName || 'Global'}_${now.toISOString().split('T')[0]}.html`;

    const result = await uploadFileToDrive(oauth2Client, fileName, buffer, 'text/html', targetFolderId);

    await notifyOwner({
      title: `[Ivy.AI] Reporte ROI guardado - ${companyName || 'Global'}`,
      content: `El reporte ROI ha sido guardado automáticamente en Google Drive: ${result.webViewLink}`,
    });

    return { success: true, fileUrl: result.webViewLink };
  } catch (error: any) {
    console.error('[ROPA Drive Reports] Error saving ROI report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save any custom report/document to a client's Google Drive folder
 */
export async function saveDocumentToDrive(params: {
  companyName: string;
  fileName: string;
  content: string;
  mimeType?: string;
  subfolder?: string;
}): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return { success: false, error: 'Google Drive no conectado.' };

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds?.rootFolderId || folderIds?.root;
    
    if (!rootFolderId) return { success: false, error: 'No se encontró la carpeta raíz.' };

    let targetFolderId = rootFolderId;

    const db = await getDb();
    if (db) {
      const clients = await db.select().from(ivyClients);
      const client = clients.find(c => c.companyName.toLowerCase().includes(params.companyName.toLowerCase()));
      if (client?.googleDriveFolderId) {
        if (params.subfolder) {
          // Try to find or create subfolder
          try {
            const subfolder = await createFolder(oauth2Client, params.subfolder, client.googleDriveFolderId);
            targetFolderId = subfolder.id;
          } catch {
            targetFolderId = client.googleDriveFolderId;
          }
        } else {
          targetFolderId = client.googleDriveFolderId;
        }
      }
    }

    const buffer = Buffer.from(params.content, 'utf-8');
    const result = await uploadFileToDrive(
      oauth2Client,
      params.fileName,
      buffer,
      params.mimeType || 'text/html',
      targetFolderId
    );

    return { success: true, fileUrl: result.webViewLink };
  } catch (error: any) {
    console.error('[ROPA Drive Reports] Error saving document:', error);
    return { success: false, error: error.message };
  }
}
