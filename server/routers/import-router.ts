/**
 * Import Router - tRPC endpoints for importing leads from CSV
 * Supports automatic sector detection and field mapping for EPM Construcciones
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const LeadImportSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  budget: z.number().optional(),
  installationSize: z.number().optional(),
});

const ImportLeadsSchema = z.object({
  companyId: z.number(),
  leads: z.array(LeadImportSchema),
  autoDetectSector: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
});

const PreviewCSVSchema = z.object({
  csvData: z.string(),
  delimiter: z.enum([',', ';', '\t']).default(','),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect sector from company name or industry
 */
function detectSector(company: string = '', industry: string = ''): 'educativo' | 'hotelero' | 'residencial' | 'otro' {
  const text = `${company} ${industry}`.toLowerCase();
  
  // Educativo keywords
  if (text.match(/escuela|colegio|universidad|instituto|educativo|educación|primaria|secundaria|preparatoria/)) {
    return 'educativo';
  }
  
  // Hotelero keywords
  if (text.match(/hotel|posada|hospedaje|hostal|resort|hotelero|turismo|hospitalidad/)) {
    return 'hotelero';
  }
  
  // Residencial keywords
  if (text.match(/residencial|condominio|fraccionamiento|casa|vivienda|departamento|inmobiliaria|constructora/)) {
    return 'residencial';
  }
  
  return 'otro';
}

/**
 * Parse CSV string into array of objects
 */
function parseCSV(csvData: string, delimiter: string = ','): Record<string, string>[] {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV debe tener al menos 2 líneas (header + datos)');
  }
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Map CSV row to lead object with automatic field mapping
 */
function mapCSVRowToLead(row: Record<string, string>): z.infer<typeof LeadImportSchema> {
  // Try to find common field names (case-insensitive)
  const findField = (possibleNames: string[]): string | undefined => {
    for (const name of possibleNames) {
      const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
      if (key && row[key]) return row[key];
    }
    return undefined;
  };
  
  const name = findField(['name', 'nombre', 'contact', 'contacto', 'full_name', 'nombre_completo']) || 'Sin nombre';
  const email = findField(['email', 'correo', 'e-mail', 'mail']);
  const phone = findField(['phone', 'telefono', 'teléfono', 'tel', 'celular', 'mobile']);
  const company = findField(['company', 'empresa', 'organization', 'organizacion', 'organización']);
  const title = findField(['title', 'cargo', 'position', 'puesto', 'job_title']);
  const industry = findField(['industry', 'industria', 'sector', 'giro']);
  const location = findField(['location', 'ubicacion', 'ubicación', 'city', 'ciudad', 'address', 'direccion', 'dirección']);
  const source = findField(['source', 'fuente', 'origen', 'lead_source']);
  const notes = findField(['notes', 'notas', 'comments', 'comentarios', 'description', 'descripcion', 'descripción']);
  
  // Parse numeric fields
  const budgetStr = findField(['budget', 'presupuesto', 'budget_mxn', 'monto']);
  const budget = budgetStr ? parseFloat(budgetStr.replace(/[^0-9.]/g, '')) : undefined;
  
  const sizeStr = findField(['installation_size', 'tamaño', 'size', 'm2', 'area', 'superficie']);
  const installationSize = sizeStr ? parseFloat(sizeStr.replace(/[^0-9.]/g, '')) : undefined;
  
  // Determine status
  const statusStr = findField(['status', 'estado', 'stage', 'etapa']);
  const statusMap: Record<string, typeof LeadImportSchema._type.status> = {
    'nuevo': 'new',
    'new': 'new',
    'contactado': 'contacted',
    'contacted': 'contacted',
    'calificado': 'qualified',
    'qualified': 'qualified',
    'propuesta': 'proposal',
    'proposal': 'proposal',
    'negociacion': 'negotiation',
    'negotiation': 'negotiation',
    'ganado': 'won',
    'won': 'won',
    'perdido': 'lost',
    'lost': 'lost',
  };
  const status = statusStr ? (statusMap[statusStr.toLowerCase()] || 'new') : 'new';
  
  // Determine priority
  const priorityStr = findField(['priority', 'prioridad', 'urgency', 'urgencia']);
  const priorityMap: Record<string, typeof LeadImportSchema._type.priority> = {
    'baja': 'low',
    'low': 'low',
    'media': 'medium',
    'medium': 'medium',
    'alta': 'high',
    'high': 'high',
    'urgente': 'urgent',
    'urgent': 'urgent',
  };
  const priority = priorityStr ? priorityMap[priorityStr.toLowerCase()] : undefined;
  
  return {
    name,
    email,
    phone,
    company,
    title,
    industry,
    location,
    source,
    status,
    priority,
    notes,
    budget,
    installationSize,
  };
}

/**
 * Check if lead already exists by email or phone
 */
async function checkDuplicate(companyId: number, email?: string, phone?: string): Promise<boolean> {
  if (!email && !phone) return false;
  
  const db = await getDb();
  if (!db) return false;
  
  let query = 'SELECT id FROM leads WHERE companyId = ?';
  const params: any[] = [companyId];
  
  if (email && phone) {
    query += ' AND (email = ? OR phone = ?)';
    params.push(email, phone);
  } else if (email) {
    query += ' AND email = ?';
    params.push(email);
  } else if (phone) {
    query += ' AND phone = ?';
    params.push(phone);
  }
  
  const [rows] = await db.execute(query, params);
  return Array.isArray(rows) && rows.length > 0;
}

// ============================================================================
// ROUTER DEFINITION
// ============================================================================

export const importRouter = router({
  /**
   * Preview CSV data before importing
   * Parses CSV and shows mapped fields
   */
  previewCSV: protectedProcedure
    .input(PreviewCSVSchema)
    .mutation(({ input }) => {
      try {
        const rows = parseCSV(input.csvData, input.delimiter);
        const preview = rows.slice(0, 10).map(row => mapCSVRowToLead(row));
        
        return {
          success: true,
          totalRows: rows.length,
          previewRows: preview,
          headers: Object.keys(rows[0] || {}),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          totalRows: 0,
          previewRows: [],
          headers: [],
        };
      }
    }),

  /**
   * Import leads from CSV data
   */
  importLeads: protectedProcedure
    .input(ImportLeadsSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = {
        total: input.leads.length,
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };
      
      for (const lead of input.leads) {
        try {
          // Check for duplicates
          if (input.skipDuplicates) {
            const isDuplicate = await checkDuplicate(input.companyId, lead.email, lead.phone);
            if (isDuplicate) {
              results.skipped++;
              continue;
            }
          }
          
          // Auto-detect sector if enabled
          let industry = lead.industry || '';
          if (input.autoDetectSector) {
            const sector = detectSector(lead.company, lead.industry);
            if (sector !== 'otro') {
              industry = sector;
            }
          }
          
          // Prepare metadata
          const metadata = {
            budget: lead.budget,
            installationSize: lead.installationSize,
            importedAt: new Date().toISOString(),
            importedBy: ctx.user?.id,
          };
          
          // Insert lead
          await db.execute(
            `INSERT INTO leads (
              companyId, name, email, phone, company, title, industry, 
              location, source, status, priority, notes, metadata, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              input.companyId,
              lead.name,
              lead.email || null,
              lead.phone || null,
              lead.company || null,
              lead.title || null,
              industry || null,
              lead.location || null,
              lead.source || 'import',
              lead.status,
              lead.priority || null,
              lead.notes || null,
              JSON.stringify(metadata),
            ]
          );
          
          results.imported++;
        } catch (error: any) {
          results.errors.push(`Error importando ${lead.name}: ${error.message}`);
        }
      }
      
      return results;
    }),

  /**
   * Get import history for a company
   */
  getImportHistory: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [imports] = await db.execute(
        `SELECT 
          DATE(createdAt) as importDate,
          COUNT(*) as count,
          source
         FROM leads 
         WHERE companyId = ? AND source = 'import'
         GROUP BY DATE(createdAt), source
         ORDER BY importDate DESC
         LIMIT ?`,
        [input.companyId, input.limit]
      );
      
      return imports;
    }),
});
