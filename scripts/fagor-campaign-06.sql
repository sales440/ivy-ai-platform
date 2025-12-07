-- Campaign 6: Repair Process
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'Repair Process - Servicio Experto',
  'Reparación certificada FAGOR con garantía. Diagnóstico gratuito, turnaround rápido y loaner equipment disponible.',
  'decision',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign6_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign6_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🔧 Reparación FAGOR: Rápida, Certificada, Garantizada',
  'content', 'Estimado cliente,\n\n¿Tu equipo FAGOR necesita reparación?\n\n⚠️ RIESGOS DE REPARACIONES NO CERTIFICADAS:\n❌ Partes no originales\n❌ Sin garantía real\n❌ Problemas recurrentes\n❌ Pérdida de warranty del equipo\n❌ Riesgo de daños mayores\n\n✅ REPAIR PROCESS FAGOR:\nServicio certificado con garantía de fábrica\n\n🎯 NUESTRO PROCESO:\n\n1️⃣ DIAGNÓSTICO (24-48 horas)\n• Evaluación completa GRATIS\n• Identificación de causa raíz\n• Cotización detallada\n• Sin compromiso\n\n2️⃣ APROBACIÓN\n• Cotización transparente\n• Timeline claro\n• Opciones de loaner equipment\n• Aprobación simple\n\n3️⃣ REPARACIÓN (3-7 días)\n• Técnicos certificados FAGOR\n• Partes originales 100%\n• Testing exhaustivo\n• Quality assurance\n\n4️⃣ ENTREGA\n• Delivery o pickup\n• Documentación completa\n• Garantía escrita\n• Follow-up incluido\n\n💰 PRICING TRANSPARENTE:\n\n🔍 Diagnóstico: GRATIS\n\n🔧 Reparaciones comunes:\n• Servo motor rebuild: $1,200-2,400\n• Control board repair: $800-1,800\n• Power supply: $600-1,200\n• Spindle repair: $2,500-5,000\n• Encoder replacement: $400-800\n\n✅ INCLUYE:\n• Partes originales\n• Mano de obra\n• Testing completo\n• 90 días de garantía\n• Soporte post-repair\n\n🚀 SERVICIOS ADICIONALES:\n\n⚡ EXPRESS REPAIR\n• Turnaround 24-48 horas\n• +30% sobre precio standard\n• Disponible para reparaciones críticas\n\n🔄 LOANER EQUIPMENT\n• Equipo de reemplazo mientras reparamos\n• $150/día\n• Minimiza downtime\n\n🏠 ON-SITE REPAIR\n• Técnico va a tu planta\n• Reparación en sitio\n• Desde $250/hora + partes\n\n💡 "FAGOR reparó nuestro control en 4 días. Funciona mejor que nuevo y con garantía de 90 días." - Mike T., Maintenance Supervisor\n\n👉 [Solicitar Diagnóstico Gratuito]\n\nSaludos,\nFAGOR Repair Team'
),
NOW(), NOW()),

(@campaign6_id, 2, 3, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '🔧 ¿Reparación barata o reparación CORRECTA?\n\nLa diferencia puede costarte $50,000.\n\nHistoria real de dos clientes:\n\n❌ CLIENTE A - "Reparación económica"\n• Costo inicial: $800\n• Partes genéricas usadas\n• Problema "resuelto"\n• 3 semanas después: Falla nuevamente\n• Segunda reparación: $1,200\n• 2 meses después: Falla catastrófica\n• Reemplazo completo: $12,000\n• Downtime total: 3 semanas\n• Producción perdida: $45,000\n• TOTAL: $59,000\n\n✅ CLIENTE B - Reparación FAGOR certificada\n• Costo: $1,800\n• Partes originales\n• Garantía 90 días\n• Funciona perfectamente 2 años después\n• Downtime: 4 días\n• TOTAL: $1,800\n\n📊 DIFERENCIA: $57,200\n\n💡 ¿POR QUÉ ELEGIR FAGOR REPAIR?\n\n✅ Técnicos certificados de fábrica\n✅ Partes 100% originales\n✅ Diagnóstico gratuito\n✅ Garantía escrita 90 días\n✅ Testing exhaustivo\n✅ Documentación completa\n✅ Turnaround 3-7 días\n✅ Express service disponible\n✅ Loaner equipment opcional\n\n🎯 PROCESO SIMPLE:\n1. Envías equipo o agendas on-site\n2. Diagnóstico gratis en 24-48h\n3. Apruebas cotización\n4. Reparamos en 3-7 días\n5. Recibes equipo como nuevo\n\n💬 "Intentamos ahorrar $500 con un repair shop local. Terminamos gastando $8,000 más. Nunca más. Solo FAGOR." - John M., Production Manager\n\n¿Tu equipo merece lo mejor?\n\n#Manufacturing #Maintenance #CNC #Quality #FAGOR'
),
NOW(), NOW()),

(@campaign6_id, 3, 6, 'email', 'send_email',
JSON_OBJECT(
  'subject', '⚡ Express Repair: Tu equipo listo en 48 horas',
  'content', 'SERVICIO URGENTE,\n\n¿Necesitas tu equipo funcionando YA?\n\n⚡ EXPRESS REPAIR SERVICE\n\nTurnaround garantizado: 24-48 horas\n\n🚀 CÓMO FUNCIONA:\n\nLUNES 8:00 AM\n• Recibes tu equipo en nuestro facility\n• Diagnóstico inmediato\n• Cotización en 2 horas\n\nLUNES 12:00 PM\n• Apruebas cotización\n• Iniciamos reparación\n• Partes express ordered\n\nMARTES 10:00 AM\n• Reparación completada\n• Testing exhaustivo\n• Quality check\n\nMARTES 4:00 PM\n• Equipo listo para pickup/delivery\n• Documentación completa\n• Back in production\n\nDOWNTIME TOTAL: 32 horas\n\n💰 INVERSIÓN:\nPrecio standard + 30%\n\nEjemplo:\n• Servo motor repair standard: $1,800\n• Express service: $2,340\n• Ahorro vs nuevo: $4,000+\n• Ahorro en downtime: $20,000+\n\n✅ INCLUYE:\n• Priority queue\n• Partes express\n• Técnicos dedicados\n• Testing acelerado\n• Delivery express\n• Misma garantía 90 días\n\n🔄 LOANER EQUIPMENT:\nSi necesitas 0 downtime:\n• Te prestamos equipo equivalente\n• Instalación incluida\n• Solo $150/día\n• Producción continua\n\n📊 CÁLCULO:\n\nOpción 1: Repair standard (7 días)\n• Costo repair: $1,800\n• Downtime: 7 días = $35,000\n• TOTAL: $36,800\n\nOpción 2: Express repair (2 días)\n• Costo repair: $2,340\n• Downtime: 2 días = $10,000\n• TOTAL: $12,340\n\nAHORRO: $24,460\n\n👉 [Solicitar Express Repair]\n\n⏰ DISPONIBILIDAD:\nSolo 2 slots por semana\nReserva con 24 horas de anticipación\n\n🎯 REPARACIONES EXPRESS DISPONIBLES:\n✅ Servo motors\n✅ Control boards\n✅ Power supplies\n✅ Encoders\n✅ Drives\n✅ HMI screens\n\n💡 "Express repair de FAGOR nos salvó. Equipo listo en 36 horas. Producción recuperada. Cliente feliz." - Sarah K., Operations Manager\n\nNo pierdas más tiempo.\n\nSaludos,\nFAGOR Express Repair Team\n\n📞 Emergency hotline: +1-847-593-5400\n📧 express@fagorautomation.us'
),
NOW(), NOW());
