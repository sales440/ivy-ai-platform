import { sendEmail } from './server/services/sendgrid';

/**
 * Send test emails to validate SendGrid integration
 */

const testLead = {
  name: 'Juan Carlos Robledo',
  email: 'jcrobledolopez@gmail.com',
  company: 'RP Commerce Group LLC',
  industry: 'Technology',
  painPoint: 'Manual lead qualification process',
};

const emails = [
  {
    subject: 'Bienvenido a Ivy.AI - Tu Plataforma de Agentes Inteligentes',
    body: `Hola ${testLead.name},

¡Bienvenido a Ivy.AI! Estamos emocionados de tenerte con nosotros.

Ivy.AI es una plataforma de orquestación de agentes de IA diseñada para automatizar procesos empresariales complejos. Nuestros agentes especializados pueden ayudarte a:

✅ Automatizar la generación y calificación de leads
✅ Proporcionar soporte al cliente 24/7
✅ Optimizar campañas de marketing
✅ Analizar datos y generar insights predictivos

En los próximos días, te enviaremos información sobre cómo Ivy.AI puede transformar ${testLead.company} y resolver tu desafío actual: ${testLead.painPoint}.

¿Tienes preguntas? Responde a este email o contáctanos en sales@rpcommercegroupllc.com

Saludos,
Ivy.AI Team`,
  },
  {
    subject: `Descubre cómo Ivy.AI automatiza ${testLead.company}`,
    body: `Hola ${testLead.name},

Queremos mostrarte cómo Ivy.AI puede ayudar a ${testLead.company} a automatizar procesos y aumentar la eficiencia.

🎯 **Demo Personalizada**

Nuestros 6 agentes especializados trabajan juntos:
- **Ivy-Prospect**: Genera y califica leads automáticamente
- **Ivy-Closer**: Cierra ventas con seguimiento inteligente
- **Ivy-Solve**: Soporte al cliente 24/7
- **Ivy-Content**: Crea contenido de marketing
- **Ivy-Logic**: Optimiza operaciones
- **Ivy-Talent**: Gestiona recursos humanos

📅 **Agenda una demo de 15 minutos**
Responde a este email con tu disponibilidad y te mostraremos cómo resolver: ${testLead.painPoint}

¿Preguntas? Escríbenos a sales@rpcommercegroupllc.com

Saludos,
Ivy.AI Team`,
  },
  {
    subject: `Caso de éxito: Cómo empresas como ${testLead.company} usan Ivy.AI`,
    body: `Hola ${testLead.name},

Queremos compartir contigo un caso de éxito de una empresa similar a ${testLead.company}.

📊 **Resultados Reales**

Una empresa del sector ${testLead.industry} implementó Ivy.AI y logró:
- ✅ 40% reducción en tiempo de calificación de leads
- ✅ 60% aumento en conversión de ventas
- ✅ 24/7 soporte automatizado sin contratar personal adicional
- ✅ ROI positivo en los primeros 3 meses

🚀 **Tu Próximo Paso**

Estamos listos para ayudarte a resolver: ${testLead.painPoint}

Agenda una llamada de 15 minutos para discutir cómo Ivy.AI puede transformar ${testLead.company}.

Responde a este email o contáctanos en sales@rpcommercegroupllc.com

Saludos,
Ivy.AI Team`,
  },
];

async function main() {
  console.log('🚀 Enviando emails de prueba...\n');
  console.log(`📧 Destinatario: ${testLead.email}`);
  console.log(`👤 Nombre: ${testLead.name}`);
  console.log(`🏢 Empresa: ${testLead.company}\n`);
  console.log('---\n');

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`📨 Enviando email ${i + 1}/3: ${email.subject}`);

    try {
      const result = await sendEmail({
        to: testLead.email,
        toName: testLead.name,
        subject: email.subject,
        htmlContent: email.body.replace(/\n/g, '<br>'),
        textContent: email.body,
        trackOpens: true,
        trackClicks: true,
        customArgs: {
          testEmail: 'true',
          emailNumber: String(i + 1),
        },
      });

      if (result.success) {
        console.log(`✅ Email ${i + 1} enviado exitosamente`);
      } else {
        console.error(`❌ Error enviando email ${i + 1}:`, result.error);
      }
    } catch (error: any) {
      console.error(`❌ Error enviando email ${i + 1}:`, error.message);
    }

    // Wait 2 seconds between emails
    if (i < emails.length - 1) {
      console.log('⏳ Esperando 2 segundos antes del siguiente email...\n');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('\n---\n');
  console.log('✅ Proceso completado!');
  console.log(`📬 Revisa tu bandeja de entrada en ${testLead.email}`);
}

main().catch(console.error);
