-- Campaign 3: Warranty Extension
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'Warranty Extension - Protege tu Inversión',
  'Extiende la garantía de tus equipos FAGOR y opera con tranquilidad. Cobertura total contra fallas y mantenimiento incluido.',
  'consideration',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign3_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign3_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🛡️ Tu garantía FAGOR está por vencer: Extiéndela ahora',
  'content', 'Estimado cliente FAGOR,\n\nNuestros registros indican que la garantía de tu equipo CNC vence pronto.\n\n⚠️ ¿QUÉ PASA DESPUÉS DEL VENCIMIENTO?\n\nUna sola reparación mayor puede costar:\n• Servo motor: $4,500 - $8,000\n• Control board: $3,200 - $6,500\n• Spindle repair: $5,000 - $12,000\n• Emergency service: $250/hora\n\n💡 SOLUCIÓN: WARRANTY EXTENSION FAGOR\n\n✅ COBERTURA TOTAL:\n• Todas las partes y mano de obra\n• Servicio técnico prioritario\n• Respuesta en 4 horas\n• Repuestos originales garantizados\n• Mantenimiento preventivo incluido\n• Sin deducibles\n\n📦 PLANES DISPONIBLES:\n\n🥉 SILVER (2 años)\n$1,890/año\n• Cobertura básica\n• 2 mantenimientos/año\n• Soporte telefónico\n\n🥈 GOLD (3 años)\n$2,490/año\n• Cobertura completa\n• 4 mantenimientos/año\n• Soporte 24/7\n• Repuestos express\n\n🥇 PLATINUM (5 años)\n$3,290/año\n• Cobertura premium\n• Mantenimiento ilimitado\n• Ingeniero dedicado\n• Loaner equipment\n• Upgrades incluidos\n\n💰 OFERTA ESPECIAL:\nRenueva antes del vencimiento: 20% OFF\n\n📊 CÁLCULO DE ROI:\nUna sola falla mayor = $8,000\nWarranty Gold 3 años = $7,470\nAhorro potencial: $24,000+ en 3 años\n\n👉 [Extender Garantía Ahora]\n\nNo esperes a que sea tarde.\n\nSaludos,\nFAGOR Service Team'
),
NOW(), NOW()),

(@campaign3_id, 2, 4, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '🛡️ ¿Cuánto cuesta NO tener warranty en tu CNC?\n\nHistoria real de dos clientes:\n\n❌ CLIENTE A (sin warranty):\n• Falla de servo motor: $6,500\n• Downtime 8 días: $32,000 en producción perdida\n• Service emergency: $2,800\n• TOTAL: $41,300 en UNA falla\n\n✅ CLIENTE B (con warranty FAGOR):\n• Misma falla: $0\n• Downtime: 6 horas (repuesto express)\n• Service: $0\n• TOTAL: $0 + tranquilidad\n\nInversión anual warranty: $2,490\n\n📊 LA MATEMÁTICA ES SIMPLE:\n\nSin warranty:\n• Riesgo: $40,000+ por falla\n• Downtime promedio: 5-10 días\n• Estrés: Infinito\n\nCon warranty:\n• Costo fijo: $2,490/año\n• Downtime: < 24 horas\n• Tranquilidad: Total\n\n💡 ADEMÁS INCLUYE:\n✅ Mantenimiento preventivo\n✅ Soporte técnico 24/7\n✅ Repuestos originales\n✅ Sin sorpresas en el presupuesto\n\n🎯 "La warranty de FAGOR nos ha ahorrado más de $50,000 en los últimos 2 años. Es la mejor inversión que hemos hecho." - Sarah K., Operations Director\n\n¿Tu equipo está protegido?\n\n#Manufacturing #Maintenance #CNC #RiskManagement #FAGOR'
),
NOW(), NOW()),

(@campaign3_id, 3, 6, 'email', 'send_email',
JSON_OBJECT(
  'subject', '⏰ URGENTE: Tu garantía vence en 30 días - Renueva con descuento',
  'content', 'ATENCIÓN,\n\nEste es un recordatorio importante:\n\n⚠️ Tu garantía FAGOR vence en 30 días\n\nDespués del vencimiento:\n❌ Pagas precio completo por reparaciones\n❌ Sin prioridad en servicio\n❌ Tiempos de espera más largos\n❌ Sin repuestos garantizados\n\n🎁 RENUEVA HOY Y RECIBE:\n\n✨ 25% OFF en renovación anticipada\n✨ Upgrade GRATIS a plan superior\n✨ 6 meses adicionales sin costo\n✨ Mantenimiento preventivo inmediato\n\n💰 EJEMPLO DE AHORRO:\n\nPlan Gold (3 años):\nPrecio regular: $2,490/año x 3 = $7,470\nCon descuento 25%: $5,602\n+ 6 meses gratis: $1,245 adicionales\n\nAHORRO TOTAL: $3,113\n\n📋 PROCESO DE RENOVACIÓN:\n1. Click en el botón abajo\n2. Selecciona tu plan\n3. Confirmación instantánea\n4. Cobertura activa en 24 horas\n\n👉 [Renovar Ahora con Descuento]\n\n⏰ Esta oferta expira en 7 días\n\n🔒 GARANTÍA DE SATISFACCIÓN:\nSi no estás 100% satisfecho en 90 días, te devolvemos tu dinero.\n\nNo arriesgues tu producción.\n\nSaludos,\nFAGOR Service Team\n\nP.D. ¿Preguntas? Llámanos: +1-847-593-5400'
),
NOW(), NOW());

