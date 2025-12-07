import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// EPM Construcciones Company ID (created earlier)
const EPM_COMPANY_ID = 4;
// EPM Admin User ID (Arq. Leoncio Eloy Robledo L.)
const EPM_ADMIN_USER_ID = 8;

// 12 Email Templates for EPM Construcciones (4 per sector)
const EPM_TEMPLATES = [
  // SECTOR EDUCATIVO (4 templates)
  {
    name: "Primer Contacto Educativo",
    subject: "Mantenimiento preventivo para {{company}} - Seguridad y tranquilidad",
    body: `Estimado/a {{leadName}},

Mi nombre es {{agentName}}, Director de EPM Construcciones, empresa especializada en mantenimiento integral para instituciones educativas en Oaxaca.

Entiendo que en {{company}} la seguridad de estudiantes y personal es prioridad absoluta. Por eso quiero compartirle cómo hemos ayudado a más de 45 escuelas y universidades a:

✅ Eliminar riesgos eléctricos y estructurales antes de que se conviertan en emergencias
✅ Mantener instalaciones en óptimas condiciones durante todo el ciclo escolar
✅ Cumplir con normativas de Protección Civil sin complicaciones
✅ Reducir costos de reparaciones de emergencia hasta en 60%

**Nuestro enfoque para instituciones educativas:**
- Inspecciones programadas en horarios que no interrumpan clases (tardes/fines de semana)
- Mantenimiento preventivo de instalaciones eléctricas, hidráulicas y estructurales
- Respuesta inmediata ante emergencias (disponibilidad 24/7)
- Reportes fotográficos detallados para directivos y padres de familia

¿Le gustaría agendar una inspección sin costo para evaluar el estado actual de las instalaciones de {{company}}?

Saludos cordiales,
{{agentName}}
Director General, EPM Construcciones SA de CV
📞 {{companyPhone}} | 📧 {{companyEmail}}`,
    sector: "educativo",
    sequence: 1,
    delayDays: 0
  },
  {
    name: "Seguimiento 1 Educativo",
    subject: "Re: Mantenimiento preventivo para {{company}} - ¿Recibió mi mensaje?",
    body: `Hola {{leadName}},

Le escribí hace unos días sobre nuestros servicios de mantenimiento preventivo para {{company}}.

**Pregunta rápida:** ¿Cuándo fue la última inspección completa de instalaciones eléctricas e hidráulicas en {{company}}?

Si hace más de 6 meses, es probable que existan riesgos no detectados que podrían convertirse en emergencias costosas.

**Oferta especial para esta semana:**
Inspección técnica gratuita (valor $3,500 MXN) + diagnóstico fotográfico detallado + presupuesto sin compromiso.

¿Tiene 15 minutos esta semana para una llamada rápida?

Saludos,
{{agentName}}
📞 {{companyPhone}}`,
    sector: "educativo",
    sequence: 2,
    delayDays: 3
  },
  {
    name: "Seguimiento 2 Educativo",
    subject: "Caso de éxito: Colegio Montessori redujo 70% en fallas eléctricas",
    body: `{{leadName}},

Quiero compartirle un caso de éxito reciente que podría interesarle para {{company}}:

**Colegio Montessori de Oaxaca** (350 estudiantes)
- Problema: Fallas eléctricas frecuentes interrumpían clases
- Solución EPM: Mantenimiento preventivo trimestral
- Resultado: 70% reducción en fallas + $45,000 MXN ahorrados en 12 meses

**¿Qué hicimos?**
✓ Inspección completa de instalaciones eléctricas
✓ Reemplazo preventivo de componentes críticos
✓ Mantenimiento programado cada 3 meses
✓ Respuesta de emergencia 24/7

**Inversión:** $8,500 MXN/trimestre (incluye todo)

¿Le gustaría conocer cómo podemos replicar estos resultados en {{company}}?

{{agentName}}
EPM Construcciones | {{companyPhone}}`,
    sector: "educativo",
    sequence: 3,
    delayDays: 7
  },
  {
    name: "Última Oportunidad Educativo",
    subject: "Última oportunidad: Inspección gratuita para {{company}} (vence viernes)",
    body: `{{leadName}},

Esta es mi última comunicación sobre la inspección gratuita para {{company}}.

**Oferta válida solo hasta este viernes:**
- Inspección técnica completa SIN COSTO
- Diagnóstico fotográfico profesional
- Presupuesto detallado sin compromiso
- Recomendaciones de seguridad prioritarias

**¿Por qué es urgente?**
El 73% de emergencias en escuelas pudieron prevenirse con inspecciones regulares. No espere a que un problema menor se convierta en crisis.

Si no es el momento adecuado, lo entiendo perfectamente. Solo responda "NO INTERESA" y no volveré a contactarle.

Última oportunidad para agendar: {{companyPhone}}

{{agentName}}
EPM Construcciones`,
    sector: "educativo",
    sequence: 4,
    delayDays: 14
  },

  // SECTOR HOTELERO (4 templates)
  {
    name: "Primer Contacto Hotelero",
    subject: "Mantenimiento 24/7 para {{company}} - Cero interrupciones para huéspedes",
    body: `Estimado/a {{leadName}},

Soy {{agentName}}, Director de EPM Construcciones, especialistas en mantenimiento integral para hoteles y establecimientos de hospedaje en Oaxaca.

En la industria hotelera, cada minuto de inactividad impacta directamente en la experiencia del huésped y en sus ingresos. Por eso desarrollamos un sistema de mantenimiento que garantiza:

✅ Respuesta inmediata 24/7 ante cualquier emergencia
✅ Mantenimiento preventivo en horarios de baja ocupación
✅ Discreción absoluta para no afectar la experiencia del huésped
✅ Equipos especializados en instalaciones hoteleras

**Nuestro enfoque hotelero:**
- Técnicos disponibles 24/7/365 (incluye fines de semana y festivos)
- Mantenimiento silencioso y discreto
- Uniformes corporativos y credenciales profesionales
- Reportes en tiempo real vía WhatsApp

**Clientes hoteleros actuales:**
- Hotel Boutique Casa Oaxaca (5 estrellas)
- Hotel Misión de los Ángeles
- Posada Real Oaxaca

¿Le gustaría una cotización personalizada para {{company}}?

Saludos cordiales,
{{agentName}}
EPM Construcciones | {{companyPhone}} (WhatsApp 24/7)`,
    sector: "hotelero",
    sequence: 1,
    delayDays: 0
  },
  {
    name: "Seguimiento 1 Hotelero",
    subject: "Re: Mantenimiento 24/7 para {{company}}",
    body: `Hola {{leadName}},

Le contacté sobre nuestros servicios de mantenimiento 24/7 para {{company}}.

**Pregunta directa:** ¿Qué sucede cuando tienen una emergencia de plomería o electricidad a las 2 AM con el hotel lleno?

Nuestros clientes hoteleros nos llaman porque:
🔹 Respondemos en menos de 45 minutos (promedio: 28 minutos)
🔹 Resolvemos el 90% de emergencias en la primera visita
🔹 Trabajamos sin interrumpir la operación del hotel

**Tarifa especial hotelera:**
$12,000 MXN/mes (todo incluido, sin límite de llamadas de emergencia)

¿15 minutos para explicarle cómo funciona?

{{agentName}} | {{companyPhone}}`,
    sector: "hotelero",
    sequence: 2,
    delayDays: 3
  },
  {
    name: "Seguimiento 2 Hotelero",
    subject: "Hotel Boutique Casa Oaxaca confía en EPM desde 2019",
    body: `{{leadName}},

Quiero compartirle por qué Hotel Boutique Casa Oaxaca (5 estrellas, 25 habitaciones) eligió EPM Construcciones como su proveedor exclusivo de mantenimiento:

**El desafío:**
- Emergencias frecuentes afectaban reviews en TripAdvisor
- Costos de mantenimiento correctivo muy altos
- Necesitaban proveedor confiable 24/7

**Nuestra solución:**
✓ Contrato anual con respuesta garantizada <1 hora
✓ Mantenimiento preventivo mensual
✓ Técnicos certificados con uniformes corporativos
✓ Reportes digitales en tiempo real

**Resultados en 12 meses:**
- 95% reducción en quejas de mantenimiento
- $78,000 MXN ahorrados en emergencias
- Calificación TripAdvisor: 4.2 → 4.8 estrellas

**Inversión:** $12,000 MXN/mes (todo incluido)

¿Le gustaría una propuesta personalizada para {{company}}?

{{agentName}} | EPM Construcciones
{{companyPhone}} (WhatsApp 24/7)`,
    sector: "hotelero",
    sequence: 3,
    delayDays: 7
  },
  {
    name: "Última Oportunidad Hotelero",
    subject: "Última oportunidad: Prueba gratuita 30 días para {{company}}",
    body: `{{leadName}},

Esta es mi última comunicación.

**Oferta exclusiva (vence este viernes):**
Prueba GRATUITA de 30 días de nuestro servicio de mantenimiento 24/7 para {{company}}.

**¿Qué incluye?**
✅ Respuesta de emergencia 24/7 SIN COSTO durante 30 días
✅ 1 mantenimiento preventivo completo GRATIS
✅ Diagnóstico técnico de todas las instalaciones
✅ Sin compromiso, sin letra pequeña

**¿Por qué esta oferta?**
Estamos tan seguros de nuestro servicio que queremos que lo pruebe sin riesgo. Si no queda 100% satisfecho, simplemente no renueva.

**Para activar la prueba:** Responda "ACEPTO PRUEBA" antes del viernes.

Si no es para usted, responda "NO INTERESA" y no volveré a contactarle.

{{agentName}}
EPM Construcciones | {{companyPhone}}`,
    sector: "hotelero",
    sequence: 4,
    delayDays: 14
  },

  // SECTOR RESIDENCIAL (4 templates)
  {
    name: "Primer Contacto Residencial",
    subject: "Mantenimiento integral para {{company}} - Tranquilidad garantizada",
    body: `Estimado/a {{leadName}},

Soy {{agentName}}, Director de EPM Construcciones, empresa especializada en mantenimiento integral para desarrollos residenciales y condominios en Oaxaca.

Entiendo que como {{title}} de {{company}}, su prioridad es mantener el valor de las propiedades y la satisfacción de los residentes. Por eso quiero compartirle cómo ayudamos a más de 32 desarrollos residenciales a:

✅ Mantener áreas comunes en perfecto estado
✅ Prevenir problemas costosos con mantenimiento preventivo
✅ Responder rápidamente ante emergencias de residentes
✅ Aumentar el valor de reventa de las propiedades

**Nuestro enfoque residencial:**
- Contratos anuales con tarifas fijas (sin sorpresas)
- Mantenimiento preventivo programado
- Atención personalizada a solicitudes de residentes
- Transparencia total con reportes fotográficos

**Servicios incluidos:**
- Mantenimiento de áreas comunes (jardines, albercas, gimnasios)
- Reparaciones eléctricas e hidráulicas
- Pintura y acabados
- Emergencias 24/7

¿Le gustaría una cotización personalizada para {{company}}?

Saludos cordiales,
{{agentName}}
EPM Construcciones | {{companyPhone}}`,
    sector: "residencial",
    sequence: 1,
    delayDays: 0
  },
  {
    name: "Seguimiento 1 Residencial",
    subject: "Re: Mantenimiento para {{company}} - Propuesta personalizada",
    body: `Hola {{leadName}},

Le contacté sobre mantenimiento integral para {{company}}.

**Pregunta importante:** ¿Cuánto gastan actualmente en mantenimiento correctivo (reparaciones de emergencia)?

Nuestros clientes residenciales reducen estos costos hasta en 65% con nuestro programa de mantenimiento preventivo.

**Propuesta típica para desarrollo residencial:**
- Mantenimiento preventivo mensual: $15,000 MXN
- Incluye: Revisión completa de instalaciones + reparaciones menores + reporte fotográfico
- Emergencias 24/7: Tarifa preferencial para residentes

**Beneficio adicional:**
Residentes más satisfechos = menos quejas = más tiempo para usted

¿Tiene 20 minutos esta semana para una videollamada?

{{agentName}} | {{companyPhone}}`,
    sector: "residencial",
    sequence: 2,
    delayDays: 3
  },
  {
    name: "Seguimiento 2 Residencial",
    subject: "Caso de éxito: Residencial Los Arcos ahorró $180K en 12 meses",
    body: `{{leadName}},

Quiero compartirle un caso de éxito que podría replicarse en {{company}}:

**Residencial Los Arcos** (48 casas, Oaxaca)
- Problema: Gastos de mantenimiento impredecibles, quejas constantes
- Solución EPM: Contrato anual de mantenimiento preventivo
- Resultado: $180,000 MXN ahorrados + 85% reducción en quejas

**¿Qué hicimos?**
✓ Mantenimiento preventivo mensual de áreas comunes
✓ Inspecciones trimestrales de instalaciones
✓ Atención prioritaria a emergencias de residentes
✓ Reportes mensuales con fotografías y recomendaciones

**Inversión:** $15,000 MXN/mes (todo incluido)
**ROI:** Recuperaron la inversión en 4 meses

**Testimonial del Administrador:**
_"EPM transformó nuestra operación. Ahora los residentes están felices y nosotros tenemos presupuesto predecible."_

¿Le gustaría una propuesta similar para {{company}}?

{{agentName}}
EPM Construcciones | {{companyPhone}}`,
    sector: "residencial",
    sequence: 3,
    delayDays: 7
  },
  {
    name: "Última Oportunidad Residencial",
    subject: "Última oportunidad: Diagnóstico gratuito para {{company}} (vence viernes)",
    body: `{{leadName}},

Esta es mi última comunicación sobre el diagnóstico gratuito para {{company}}.

**Oferta válida solo hasta este viernes:**
- Diagnóstico completo de instalaciones SIN COSTO
- Reporte fotográfico profesional
- Presupuesto anual con tarifa fija
- Plan de mantenimiento preventivo personalizado

**¿Por qué actuar ahora?**
El 68% de emergencias en desarrollos residenciales pudieron prevenirse con mantenimiento regular. Cada mes que espera, aumenta el riesgo de reparaciones costosas.

**Garantía de satisfacción:**
Si contrata nuestro servicio anual y no está 100% satisfecho en los primeros 30 días, le devolvemos su dinero completo.

Si no es el momento, lo entiendo. Solo responda "NO INTERESA" y no volveré a contactarle.

Última oportunidad: {{companyPhone}}

{{agentName}}
EPM Construcciones`,
    sector: "residencial",
    sequence: 4,
    delayDays: 14
  }
];

async function seedEPMTemplates() {
  console.log("🌱 Seeding EPM Construcciones Email Templates...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Check if templates already exist for EPM
    const [existingTemplates] = await connection.execute(
      "SELECT COUNT(*) as count FROM emailCampaigns WHERE companyId = ?",
      [EPM_COMPANY_ID]
    );

    if (existingTemplates[0].count > 0) {
      console.log(`⚠️  EPM already has ${existingTemplates[0].count} templates. Skipping seed.`);
      console.log("   To re-seed, delete existing templates first.\n");
      await connection.end();
      return;
    }

    // Insert all 12 templates
    let inserted = 0;
    for (const template of EPM_TEMPLATES) {
      await connection.execute(
        `INSERT INTO emailCampaigns (companyId, name, subject, body, type, sector, sequence, delayDays, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'callback', ?, ?, ?, ?, NOW(), NOW())`,
        [
          EPM_COMPANY_ID,
          template.name,
          template.subject,
          template.body,
          template.sector,
          template.sequence,
          template.delayDays,
          EPM_ADMIN_USER_ID
        ]
      );
      inserted++;
      console.log(`✅ ${template.sector.toUpperCase()} - ${template.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${inserted} email templates for EPM Construcciones!\n`);
    console.log("📧 Templates by sector:");
    console.log("   - Educativo: 4 templates (0, 3, 7, 14 días)");
    console.log("   - Hotelero: 4 templates (0, 3, 7, 14 días)");
    console.log("   - Residencial: 4 templates (0, 3, 7, 14 días)\n");

  } catch (error) {
    console.error("❌ Error seeding EPM templates:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run seed
seedEPMTemplates()
  .then(() => {
    console.log("✨ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
