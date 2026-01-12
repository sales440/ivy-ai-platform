import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { campaignContent } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

export const campaignContentRouter = router({
  // List all pending content for validation
  listPending: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const content = await db
      .select()
      .from(campaignContent)
      .where(eq(campaignContent.status, "pending"))
      .orderBy(desc(campaignContent.createdAt));
    
    return content;
  }),

  // List all content with optional filters
  list: publicProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "sent"]).optional(),
      contentType: z.enum(["email", "call_script", "sms"]).optional(),
      companyId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(campaignContent);
      
      const conditions = [];
      if (input?.status) {
        conditions.push(eq(campaignContent.status, input.status));
      }
      if (input?.contentType) {
        conditions.push(eq(campaignContent.contentType, input.contentType));
      }
      if (input?.companyId) {
        conditions.push(eq(campaignContent.companyId, input.companyId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const content = await query.orderBy(desc(campaignContent.createdAt));
      return content;
    }),

  // Get single content by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const [content] = await db
        .select()
        .from(campaignContent)
        .where(eq(campaignContent.id, input.id))
        .limit(1);
      
      return content || null;
    }),

  // Create new content for validation
  create: publicProcedure
    .input(z.object({
      campaignId: z.number().optional(),
      companyId: z.number().optional(),
      companyName: z.string(),
      companyLogo: z.string().optional(),
      companyAddress: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().optional(),
      companyWebsite: z.string().optional(),
      contentType: z.enum(["email", "call_script", "sms"]),
      subject: z.string().optional(),
      body: z.string(),
      htmlContent: z.string().optional(),
      targetRecipients: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Generate HTML content with company letterhead for emails
      let htmlContent = input.htmlContent;
      if (input.contentType === "email" && !htmlContent) {
        htmlContent = generateEmailWithLetterhead(input);
      }
      
      const result = await db.insert(campaignContent).values({
        ...input,
        htmlContent,
        status: "pending",
      });
      
      return { success: true, id: result[0].insertId };
    }),

  // Approve content
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(campaignContent)
        .set({
          status: "approved",
          approvedBy: ctx.user?.openId || "admin",
          approvedAt: new Date(),
        })
        .where(eq(campaignContent.id, input.id));
      
      return { success: true };
    }),

  // Reject content with reason
  reject: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(campaignContent)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
          approvedBy: ctx.user?.openId || "admin",
          approvedAt: new Date(),
        })
        .where(eq(campaignContent.id, input.id));
      
      return { success: true };
    }),

  // Update content (edit before approval)
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      body: z.string().optional(),
      htmlContent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {};
      if (input.subject) updateData.subject = input.subject;
      if (input.body) updateData.body = input.body;
      if (input.htmlContent) updateData.htmlContent = input.htmlContent;
      
      await db
        .update(campaignContent)
        .set(updateData)
        .where(eq(campaignContent.id, input.id));
      
      return { success: true };
    }),

  // Mark as sent
  markSent: publicProcedure
    .input(z.object({
      id: z.number(),
      sentCount: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(campaignContent)
        .set({
          status: "sent",
          sentAt: new Date(),
          sentCount: input.sentCount,
        })
        .where(eq(campaignContent.id, input.id));
      
      return { success: true };
    }),

  // Generate creative email content using LLM
  generateCreativeEmail: publicProcedure
    .input(z.object({
      companyName: z.string(),
      companyLogo: z.string().optional(),
      companyAddress: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().optional(),
      companyWebsite: z.string().optional(),
      campaignGoal: z.string(),
      targetAudience: z.string(),
      productService: z.string(),
      tone: z.enum(["professional", "friendly", "urgent", "persuasive"]).default("professional"),
    }))
    .mutation(async ({ input }) => {
      const prompt = `Genera un email de marketing MUY CREATIVO y de ALTO ENGANCHE para una campaña de ventas.

EMPRESA CLIENTE: ${input.companyName}
OBJETIVO DE LA CAMPAÑA: ${input.campaignGoal}
AUDIENCIA OBJETIVO: ${input.targetAudience}
PRODUCTO/SERVICIO: ${input.productService}
TONO: ${input.tone}

REQUISITOS:
1. El email debe ser MUY CREATIVO y llamar la atención desde el asunto
2. Debe generar curiosidad y urgencia
3. Incluir un CTA (Call to Action) claro y persuasivo
4. El contenido debe ser personalizable con variables como {{nombre}}, {{empresa}}
5. Máximo 300 palabras en el cuerpo
6. El asunto debe ser corto pero impactante (máximo 60 caracteres)

FORMATO DE RESPUESTA (JSON):
{
  "subject": "Asunto del email",
  "body": "Cuerpo del email en texto plano",
  "cta": "Texto del botón de acción"
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un experto en copywriting y email marketing. Generas contenido creativo, persuasivo y de alto engagement." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "email_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  subject: { type: "string" },
                  body: { type: "string" },
                  cta: { type: "string" }
                },
                required: ["subject", "body", "cta"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0].message.content;
        const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
        const content = JSON.parse(contentStr || "{}");
        
        // Generate HTML with letterhead
        const htmlContent = generateEmailWithLetterhead({
          companyName: input.companyName,
          companyLogo: input.companyLogo,
          companyAddress: input.companyAddress,
          companyPhone: input.companyPhone,
          companyEmail: input.companyEmail,
          companyWebsite: input.companyWebsite,
          subject: content.subject,
          body: content.body,
          contentType: "email",
        });

        return {
          success: true,
          subject: content.subject,
          body: content.body,
          cta: content.cta,
          htmlContent,
        };
      } catch (error) {
        console.error("Error generating email:", error);
        throw new Error("Failed to generate email content");
      }
    }),

  // Generate call script using LLM
  generateCallScript: publicProcedure
    .input(z.object({
      companyName: z.string(),
      campaignGoal: z.string(),
      targetAudience: z.string(),
      productService: z.string(),
      objections: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const prompt = `Genera un SCRIPT DE LLAMADA TELEFÓNICA profesional y efectivo para ventas.

EMPRESA CLIENTE: ${input.companyName}
OBJETIVO: ${input.campaignGoal}
AUDIENCIA: ${input.targetAudience}
PRODUCTO/SERVICIO: ${input.productService}
OBJECIONES COMUNES: ${input.objections?.join(", ") || "No especificadas"}

REQUISITOS:
1. Incluir saludo profesional
2. Presentación breve de la empresa
3. Gancho de atención (hook)
4. Preguntas de descubrimiento
5. Presentación del valor
6. Manejo de objeciones
7. Cierre y siguiente paso
8. Despedida profesional

FORMATO DE RESPUESTA (JSON):
{
  "greeting": "Saludo inicial",
  "introduction": "Presentación",
  "hook": "Gancho de atención",
  "discoveryQuestions": ["Pregunta 1", "Pregunta 2"],
  "valueProposition": "Propuesta de valor",
  "objectionHandling": {"objecion": "respuesta"},
  "closing": "Cierre",
  "farewell": "Despedida"
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un experto en ventas telefónicas y scripts de llamadas. Generas guiones profesionales y efectivos." },
            { role: "user", content: prompt }
          ],
        });

        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content) || "";
        
        return {
          success: true,
          script: content,
        };
      } catch (error) {
        console.error("Error generating call script:", error);
        throw new Error("Failed to generate call script");
      }
    }),

  // Generate SMS content using LLM
  generateSMS: publicProcedure
    .input(z.object({
      companyName: z.string(),
      campaignGoal: z.string(),
      productService: z.string(),
    }))
    .mutation(async ({ input }) => {
      const prompt = `Genera 3 variaciones de SMS de marketing para una campaña.

EMPRESA: ${input.companyName}
OBJETIVO: ${input.campaignGoal}
PRODUCTO/SERVICIO: ${input.productService}

REQUISITOS:
1. Máximo 160 caracteres por SMS
2. Incluir CTA claro
3. Generar urgencia o curiosidad
4. Personalizable con {{nombre}}

FORMATO DE RESPUESTA (JSON):
{
  "variations": [
    {"text": "SMS 1", "characters": 150},
    {"text": "SMS 2", "characters": 145},
    {"text": "SMS 3", "characters": 155}
  ]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Eres un experto en SMS marketing. Generas mensajes cortos, impactantes y efectivos." },
            { role: "user", content: prompt }
          ],
        });

        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content) || "";
        
        return {
          success: true,
          smsOptions: content,
        };
      } catch (error) {
        console.error("Error generating SMS:", error);
        throw new Error("Failed to generate SMS content");
      }
    }),

  // Get stats for dashboard
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { pending: 0, approved: 0, rejected: 0, sent: 0 };
    
    const all = await db.select().from(campaignContent);
    
    return {
      pending: all.filter(c => c.status === "pending").length,
      approved: all.filter(c => c.status === "approved").length,
      rejected: all.filter(c => c.status === "rejected").length,
      sent: all.filter(c => c.status === "sent").length,
      total: all.length,
    };
  }),
});

// Helper function to generate HTML email with company letterhead
function generateEmailWithLetterhead(input: {
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  subject?: string;
  body: string;
  contentType: string;
}): string {
  const logoHtml = input.companyLogo 
    ? `<img src="${input.companyLogo}" alt="${input.companyName}" style="max-height: 80px; max-width: 200px;" />`
    : `<h1 style="margin: 0; color: #1a1a2e; font-size: 28px; font-weight: bold;">${input.companyName}</h1>`;

  const contactInfo = [];
  if (input.companyAddress) contactInfo.push(input.companyAddress);
  if (input.companyPhone) contactInfo.push(`Tel: ${input.companyPhone}`);
  if (input.companyEmail) contactInfo.push(input.companyEmail);
  if (input.companyWebsite) contactInfo.push(input.companyWebsite);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.subject || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- LETTERHEAD / HEADER -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px 8px 0 0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    ${logoHtml}
                  </td>
                  <td align="right" style="color: #ffffff; font-size: 12px; line-height: 1.6;">
                    ${contactInfo.join('<br>')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- DIVIDER LINE -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #06b6d4 0%, #14b8a6 50%, #fb923c 100%);"></td>
          </tr>
          
          <!-- EMAIL BODY -->
          <tr>
            <td style="padding: 40px;">
              <div style="color: #333333; font-size: 16px; line-height: 1.8;">
                ${input.body.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          
          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding: 0 40px 40px;">
              <a href="#" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Más Información
              </a>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="color: #6c757d; font-size: 12px; line-height: 1.6;">
                    <strong>${input.companyName}</strong><br>
                    ${contactInfo.join(' | ')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px; color: #adb5bd; font-size: 11px;">
                    Este email fue enviado por ${input.companyName}. Si no desea recibir más comunicaciones, 
                    <a href="#" style="color: #06b6d4;">haga clic aquí para darse de baja</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type CampaignContentRouter = typeof campaignContentRouter;
