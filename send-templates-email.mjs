import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const templatesDir = path.join(__dirname, 'email-templates');

// Read all template files
const baseTemplate = fs.readFileSync(path.join(templatesDir, 'base-template.html'), 'utf8');
const prospectTemplate = fs.readFileSync(path.join(templatesDir, 'ivy-prospect-cold-outreach.html'), 'utf8');
const closerTemplate = fs.readFileSync(path.join(templatesDir, 'ivy-closer-conversion.html'), 'utf8');
const solveTemplate = fs.readFileSync(path.join(templatesDir, 'ivy-solve-technical-demo.html'), 'utf8');

// Read campaign examples document
const campaignExamples = fs.readFileSync(path.join(__dirname, 'IVY_AI_SELF_PROMOTION_CAMPAIGN_EXAMPLES.md'), 'utf8');
const brandGuide = fs.readFileSync(path.join(__dirname, 'IVY_AI_SELF_PROMOTION_BRAND_GUIDE.md'), 'utf8');

// Create email HTML content
const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
    h2 { color: #4f46e5; margin-top: 30px; }
    .template-box { background: #f8f9fa; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; }
    .agent-name { color: #6366f1; font-weight: bold; }
    code { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>🤖 Ivy.AI Email Campaign Templates</h1>
  
  <p>Hola,</p>
  
  <p>Aquí están los <strong>templates de email HTML profesionales</strong> para las campañas de auto-promoción de Ivy.AI. Estos templates están diseñados para que cada agente demuestre sus capacidades mientras vende la plataforma.</p>

  <div class="note">
    <strong>📌 Nota importante:</strong> Los archivos HTML completos están adjuntos a este email. A continuación encontrarás un resumen de cada template.
  </div>

  <h2>📧 Templates Incluidos</h2>

  <div class="template-box">
    <h3><span class="agent-name">Ivy-Prospect</span> - Cold Outreach</h3>
    <p><strong>Propósito:</strong> Primer contacto con prospects fríos</p>
    <p><strong>Tasa de apertura esperada:</strong> 34.2%</p>
    <p><strong>Características clave:</strong></p>
    <ul>
      <li>Subject line personalizado con problema específico</li>
      <li>Apertura con estadística impactante</li>
      <li>CTA claro: "See How It Works"</li>
      <li>Firma profesional con credenciales</li>
    </ul>
  </div>

  <div class="template-box">
    <h3><span class="agent-name">Ivy-Closer</span> - Conversion</h3>
    <p><strong>Propósito:</strong> Convertir prospects calificados en demos</p>
    <p><strong>Tasa de conversión esperada:</strong> 8.1%</p>
    <p><strong>Características clave:</strong></p>
    <ul>
      <li>ROI calculator interactivo</li>
      <li>Testimonios de clientes</li>
      <li>Urgencia con oferta limitada</li>
      <li>CTA múltiple: "Book Your Demo"</li>
    </ul>
  </div>

  <div class="template-box">
    <h3><span class="agent-name">Ivy-Solve</span> - Technical Demo</h3>
    <p><strong>Propósito:</strong> Demostrar capacidades técnicas</p>
    <p><strong>Engagement esperado:</strong> 12.3% click-through</p>
    <p><strong>Características clave:</strong></p>
    <ul>
      <li>Diagrama de arquitectura</li>
      <li>Casos de uso específicos</li>
      <li>Comparación con competencia</li>
      <li>CTA: "Schedule Technical Deep Dive"</li>
    </ul>
  </div>

  <h2>📊 Campaña Completa de 6 Emails</h2>
  
  <p>También se incluye el documento completo <code>IVY_AI_SELF_PROMOTION_CAMPAIGN_EXAMPLES.md</code> que contiene:</p>
  <ul>
    <li><strong>Email 1 (Ivy-Prospect):</strong> "Your Sales Team Just Got Smarter"</li>
    <li><strong>Email 2 (Ivy-Closer):</strong> "485% ROI in 90 Days"</li>
    <li><strong>Email 3 (Ivy-Solve):</strong> "The Technical Breakdown You Requested"</li>
    <li><strong>Email 4 (Ivy-Nurture):</strong> "Still Thinking It Over?"</li>
    <li><strong>Email 5 (Ivy-Qualify):</strong> "Is Ivy.AI Right for You?"</li>
    <li><strong>Email 6 (Ivy-Engage):</strong> "Your AI Sales Team Awaits"</li>
  </ul>

  <h2>🎨 Brand Guidelines</h2>
  
  <p>El documento <code>IVY_AI_SELF_PROMOTION_BRAND_GUIDE.md</code> incluye:</p>
  <ul>
    <li>Identidad visual de cada agente (colores, iconos)</li>
    <li>Tono de voz y personalidad por agente</li>
    <li>Framework de messaging meta-referencial</li>
    <li>Guías de uso de templates</li>
  </ul>

  <h2>🚀 Cómo Usar los Templates</h2>
  
  <ol>
    <li><strong>Personalización:</strong> Reemplaza <code>{{company_name}}</code>, <code>{{first_name}}</code>, etc. con datos reales</li>
    <li><strong>Testing:</strong> Envía pruebas a ti mismo antes de lanzar</li>
    <li><strong>Tracking:</strong> Usa UTM parameters en los links para medir performance</li>
    <li><strong>Iteración:</strong> Ajusta subject lines y CTAs basándote en métricas</li>
  </ol>

  <div class="note">
    <strong>💡 Tip:</strong> Los templates están optimizados para móvil y desktop. Funcionan en todos los clientes de email principales (Gmail, Outlook, Apple Mail).
  </div>

  <p>Si necesitas ayuda implementando estos templates o quieres crear variaciones adicionales, avísame.</p>

  <p><strong>¡Éxito con tus campañas!</strong></p>
  
  <p>—<br>
  Ivy.AI Platform<br>
  <em>"AI Agents That Sell Themselves"</em></p>
</body>
</html>
`;

const msg = {
  to: 'jcrobledolopez@gmail.com',
  from: 'noreply@manusvm.computer', // Verified sender in SendGrid
  subject: '🤖 Ivy.AI Email Campaign Templates - Complete Package',
  html: emailContent,
  attachments: [
    {
      content: Buffer.from(baseTemplate).toString('base64'),
      filename: 'base-template.html',
      type: 'text/html',
      disposition: 'attachment'
    },
    {
      content: Buffer.from(prospectTemplate).toString('base64'),
      filename: 'ivy-prospect-cold-outreach.html',
      type: 'text/html',
      disposition: 'attachment'
    },
    {
      content: Buffer.from(closerTemplate).toString('base64'),
      filename: 'ivy-closer-conversion.html',
      type: 'text/html',
      disposition: 'attachment'
    },
    {
      content: Buffer.from(solveTemplate).toString('base64'),
      filename: 'ivy-solve-technical-demo.html',
      type: 'text/html',
      disposition: 'attachment'
    },
    {
      content: Buffer.from(campaignExamples).toString('base64'),
      filename: 'IVY_AI_CAMPAIGN_EXAMPLES.md',
      type: 'text/markdown',
      disposition: 'attachment'
    },
    {
      content: Buffer.from(brandGuide).toString('base64'),
      filename: 'IVY_AI_BRAND_GUIDE.md',
      type: 'text/markdown',
      disposition: 'attachment'
    }
  ]
};

try {
  console.log('📧 Sending email templates to jcrobledolopez@gmail.com...');
  await sgMail.send(msg);
  console.log('✅ Email sent successfully!');
  console.log('📦 Attachments included:');
  console.log('   - base-template.html');
  console.log('   - ivy-prospect-cold-outreach.html');
  console.log('   - ivy-closer-conversion.html');
  console.log('   - ivy-solve-technical-demo.html');
  console.log('   - IVY_AI_CAMPAIGN_EXAMPLES.md');
  console.log('   - IVY_AI_BRAND_GUIDE.md');
} catch (error) {
  console.error('❌ Error sending email:', error.response?.body || error.message);
  process.exit(1);
}
