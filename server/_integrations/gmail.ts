/**
 * Gmail API Integration for Ivy.AI Platform
 * Enables automated email sending for lead follow-up and customer communication
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Create new project or select existing one
 * 3. Enable Gmail API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized redirect URI: https://your-domain.com/api/oauth/gmail/callback
 * 6. Download credentials JSON
 * 7. Set environment variables:
 *    - GMAIL_CLIENT_ID
 *    - GMAIL_CLIENT_SECRET
 *    - GMAIL_REFRESH_TOKEN (obtained after first OAuth flow)
 */

import { google } from 'googleapis';

// Gmail OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/oauth/gmail/callback'
);

// Set refresh token if available
if (process.env.GMAIL_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
}

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email using Gmail API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const from = options.from || process.env.GMAIL_FROM_EMAIL || 'epmconstrucciones@gmail.com';
    
    // Build email message in RFC 2822 format
    const messageParts = [
      `From: ${from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html || options.body,
    ];

    if (options.cc && options.cc.length > 0) {
      messageParts.splice(2, 0, `Cc: ${options.cc.join(', ')}`);
    }

    if (options.bcc && options.bcc.length > 0) {
      messageParts.splice(2, 0, `Bcc: ${options.bcc.join(', ')}`);
    }

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[Gmail] Email sent successfully:', response.data.id);
    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error: any) {
    console.error('[Gmail] Failed to send email:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send bulk emails (with rate limiting to avoid Gmail quota)
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<{
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const emailOptions of emails) {
    const result = await sendEmail(emailOptions);
    results.push({
      email: emailOptions.to,
      ...result,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Rate limiting: wait 1 second between emails to avoid Gmail quota (500 emails/day)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[Gmail] Bulk send complete: ${sent} sent, ${failed} failed`);
  return { sent, failed, results };
}

/**
 * Get OAuth2 authorization URL for initial setup
 */
export function getGmailAuthUrl(): string {
  const scopes = ['https://www.googleapis.com/auth/gmail.send'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for refresh token
 */
export async function getGmailTokens(code: string): Promise<{ refresh_token?: string; access_token: string }> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  console.log('[Gmail] Tokens obtained:', {
    hasRefreshToken: !!tokens.refresh_token,
    hasAccessToken: !!tokens.access_token,
  });
  
  return {
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token!,
  };
}

/**
 * Email template for EPM Construcciones - Educational Sector
 */
export function getEducationalTemplate(data: {
  leadName: string;
  company: string;
  title?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .cta { background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EPM Construcciones</h1>
      <p>Especialistas en Mantenimiento Profesional</p>
    </div>
    
    <div class="content">
      <p>Estimado/a ${data.leadName},</p>
      
      <p>Mi nombre es Leoncio Eloy Robledo, Arquitecto y Director de EPM Construcciones SA de CV. Me dirijo a usted como ${data.title || 'responsable'} de <strong>${data.company}</strong> para presentarle nuestros servicios especializados en mantenimiento para instituciones educativas.</p>
      
      <h3>¿Por qué las escuelas confían en EPM Construcciones?</h3>
      <ul>
        <li><strong>Horarios flexibles:</strong> Trabajamos fuera del horario escolar para no interrumpir las clases</li>
        <li><strong>Seguridad certificada:</strong> Todo nuestro personal cuenta con certificaciones y antecedentes penales</li>
        <li><strong>Mantenimiento preventivo:</strong> Evitamos emergencias costosas con inspecciones regulares</li>
        <li><strong>Respuesta rápida:</strong> Atención de emergencias en menos de 2 horas</li>
      </ul>
      
      <h3>Nuestros servicios incluyen:</h3>
      <ul>
        <li>Mantenimiento eléctrico (iluminación, tableros, cableado)</li>
        <li>Plomería y sanitarios (fugas, drenajes, tinacos)</li>
        <li>Pintura y acabados (aulas, pasillos, fachadas)</li>
        <li>Herrería y carpintería (puertas, ventanas, mobiliario)</li>
        <li>Climatización (aires acondicionados, ventiladores)</li>
        <li>Jardinería y limpieza de áreas verdes</li>
      </ul>
      
      <p><strong>Oferta especial para instituciones educativas:</strong> Primera inspección y diagnóstico SIN COSTO.</p>
      
      <a href="https://wa.me/5219513079830?text=Hola,%20me%20interesa%20una%20cotización%20para%20mi%20escuela" class="cta">Solicitar Cotización Gratuita</a>
      
      <p>Estamos ubicados en Oaxaca y atendemos toda la región. Contamos con más de 15 años de experiencia dando servicio a escuelas, universidades y centros educativos.</p>
      
      <p>Quedo a sus órdenes para cualquier consulta.</p>
      
      <p>Saludos cordiales,</p>
      <p><strong>Arq. Leoncio Eloy Robledo L.</strong><br>
      Director General<br>
      EPM Construcciones SA de CV<br>
      📞 +52 1 951 307 9830<br>
      📧 epmconstrucciones@gmail.com<br>
      🌐 www.epmconstrucciones.com</p>
    </div>
    
    <div class="footer">
      <p>EPM Construcciones SA de CV | Oaxaca, México</p>
      <p>Este correo fue enviado porque usted expresó interés en nuestros servicios de mantenimiento.</p>
      <p>Si desea dejar de recibir estos correos, responda con "UNSUB" en el asunto.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email template for EPM Construcciones - Hotel Sector
 */
export function getHotelTemplate(data: {
  leadName: string;
  company: string;
  title?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .cta { background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .highlight { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EPM Construcciones</h1>
      <p>Mantenimiento Hotelero 24/7</p>
    </div>
    
    <div class="content">
      <p>Estimado/a ${data.leadName},</p>
      
      <p>Mi nombre es Leoncio Eloy Robledo, Arquitecto y Director de EPM Construcciones SA de CV. Me dirijo a usted como ${data.title || 'responsable'} de <strong>${data.company}</strong> para presentarle nuestros servicios especializados en mantenimiento hotelero.</p>
      
      <div class="highlight">
        <strong>🏨 Servicio 24/7:</strong> Sabemos que en la industria hotelera, una emergencia no puede esperar. Por eso ofrecemos atención inmediata las 24 horas, los 365 días del año.
      </div>
      
      <h3>¿Por qué los hoteles eligen EPM Construcciones?</h3>
      <ul>
        <li><strong>Respuesta inmediata:</strong> Técnico en sitio en menos de 1 hora para emergencias</li>
        <li><strong>Discreción total:</strong> Trabajamos sin interrumpir la experiencia de sus huéspedes</li>
        <li><strong>Contratos flexibles:</strong> Mantenimiento preventivo mensual o servicio por llamada</li>
        <li><strong>Personal certificado:</strong> Técnicos especializados con uniformes y credenciales</li>
      </ul>
      
      <h3>Servicios especializados para hoteles:</h3>
      <ul>
        <li>Mantenimiento de habitaciones (plomería, eléctrico, acabados)</li>
        <li>Sistemas HVAC (aires acondicionados, calefacción)</li>
        <li>Alberca y áreas recreativas</li>
        <li>Cocinas y áreas de alimentos (campanas, extractores, gas)</li>
        <li>Elevadores y sistemas eléctricos</li>
        <li>Jardinería y áreas exteriores</li>
        <li>Pintura y remodelaciones express</li>
      </ul>
      
      <p><strong>Paquete especial para hoteles:</strong> Mantenimiento preventivo mensual con descuento del 20% en emergencias.</p>
      
      <a href="https://wa.me/5219513079830?text=Hola,%20necesito%20mantenimiento%20para%20mi%20hotel" class="cta">Contactar Ahora (WhatsApp 24/7)</a>
      
      <p>Atendemos hoteles, resorts, moteles y casas de huéspedes en Oaxaca y alrededores. Referencias disponibles a solicitud.</p>
      
      <p>Quedo a sus órdenes para una cotización personalizada.</p>
      
      <p>Saludos cordiales,</p>
      <p><strong>Arq. Leoncio Eloy Robledo L.</strong><br>
      Director General<br>
      EPM Construcciones SA de CV<br>
      📞 +52 1 951 307 9830 (WhatsApp 24/7)<br>
      📧 epmconstrucciones@gmail.com<br>
      🌐 www.epmconstrucciones.com</p>
    </div>
    
    <div class="footer">
      <p>EPM Construcciones SA de CV | Oaxaca, México</p>
      <p>Servicio de emergencias 24/7 disponible</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email template for EPM Construcciones - Residential Sector
 */
export function getResidentialTemplate(data: {
  leadName: string;
  company: string;
  title?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .cta { background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EPM Construcciones</h1>
      <p>Mantenimiento Residencial Profesional</p>
    </div>
    
    <div class="content">
      <p>Estimado/a ${data.leadName},</p>
      
      <p>Mi nombre es Leoncio Eloy Robledo, Arquitecto y Director de EPM Construcciones SA de CV. Me dirijo a usted como ${data.title || 'administrador'} de <strong>${data.company}</strong> para presentarle nuestros servicios especializados en mantenimiento para condominios y fraccionamientos.</p>
      
      <h3>¿Por qué los condominios confían en EPM Construcciones?</h3>
      <ul>
        <li><strong>Contratos anuales:</strong> Mantenimiento preventivo programado con precio fijo</li>
        <li><strong>Atención personalizada:</strong> Un coordinador dedicado para su condominio</li>
        <li><strong>Transparencia total:</strong> Reportes fotográficos de cada servicio realizado</li>
        <li><strong>Garantía escrita:</strong> 6 meses de garantía en todos nuestros trabajos</li>
      </ul>
      
      <h3>Servicios para condominios y fraccionamientos:</h3>
      <ul>
        <li>Mantenimiento de áreas comunes (jardines, albercas, salones)</li>
        <li>Sistemas eléctricos (iluminación, portones, intercomunicadores)</li>
        <li>Plomería general (tinacos, cisternas, drenajes)</li>
        <li>Pintura de fachadas y áreas comunes</li>
        <li>Impermeabilización de azoteas</li>
        <li>Limpieza de cisternas y tinacos</li>
        <li>Fumigación y control de plagas</li>
      </ul>
      
      <p><strong>Paquete especial para condominios:</strong> Mantenimiento preventivo trimestral con 15% de descuento en el primer año.</p>
      
      <a href="https://wa.me/5219513079830?text=Hola,%20necesito%20cotización%20para%20mantenimiento%20de%20condominio" class="cta">Solicitar Cotización</a>
      
      <p>Actualmente damos servicio a más de 20 condominios en Oaxaca. Con gusto le compartimos referencias de nuestros clientes satisfechos.</p>
      
      <p>Quedo a sus órdenes para agendar una visita sin compromiso.</p>
      
      <p>Saludos cordiales,</p>
      <p><strong>Arq. Leoncio Eloy Robledo L.</strong><br>
      Director General<br>
      EPM Construcciones SA de CV<br>
      📞 +52 1 951 307 9830<br>
      📧 epmconstrucciones@gmail.com<br>
      🌐 www.epmconstrucciones.com</p>
    </div>
    
    <div class="footer">
      <p>EPM Construcciones SA de CV | Oaxaca, México</p>
      <p>Más de 15 años de experiencia en mantenimiento residencial</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
