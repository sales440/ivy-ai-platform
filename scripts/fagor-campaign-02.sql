-- Campaign 2: CNC Upgrades
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'CNC Upgrades - Moderniza tu Producción',
  'Actualiza tus equipos CNC con la última tecnología FAGOR. Aumenta productividad, reduce costos y mantente competitivo.',
  'decision',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign2_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign2_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🚀 Moderniza tu CNC: Upgrades FAGOR con ROI garantizado',
  'content', 'Estimado profesional,\n\n¿Tus equipos CNC están limitando tu productividad?\n\n⚙️ SEÑALES DE QUE NECESITAS UN UPGRADE:\n❌ Downtime frecuente por fallas\n❌ Dificultad para encontrar repuestos\n❌ Incompatibilidad con software moderno\n❌ Consumo energético elevado\n❌ Velocidades de producción lentas\n\n✅ SOLUCIÓN: CNC UPGRADE FAGOR\n\n🎯 BENEFICIOS COMPROBADOS:\n• +35% velocidad de producción\n• -50% consumo energético\n• -60% downtime\n• +10 años de vida útil\n• ROI en 18-24 meses\n\n📦 PAQUETES DISPONIBLES:\n\n1. ESSENTIAL UPGRADE\n   • Control system update\n   • Software modernization\n   • Basic diagnostics\n   Desde $8,500\n\n2. PROFESSIONAL UPGRADE\n   • Todo lo anterior +\n   • Servo motor replacement\n   • Precision calibration\n   • 2 años warranty\n   Desde $15,900\n\n3. PREMIUM UPGRADE\n   • Todo lo anterior +\n   • Digital Suite integration\n   • IoT connectivity\n   • 5 años warranty\n   Desde $24,500\n\n💰 FINANCIAMIENTO DISPONIBLE\n📅 Instalación en 3-5 días\n\n👉 [Solicitar Evaluación Gratuita]\n\nSaludos,\nFAGOR Upgrades Team'
),
NOW(), NOW()),

(@campaign2_id, 2, 2, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '⚙️ ¿Cuánto dinero estás perdiendo por equipos CNC obsoletos?\n\nUn estudio reciente reveló que máquinas CNC con más de 10 años cuestan a las empresas:\n\n💸 $47,000/año en downtime\n💸 $23,000/año en consumo energético excesivo\n💸 $31,000/año en pérdida de productividad\n\nTOTAL: $101,000/año en costos ocultos\n\n🚀 LA SOLUCIÓN: CNC UPGRADE FAGOR\n\nCASO REAL - Midwest Manufacturing:\n• Upgrade investment: $18,500\n• Ahorro anual: $89,000\n• ROI: 2.4 meses\n• Productividad: +42%\n\n✅ QUÉ INCLUYE:\n• Control system de última generación\n• Software compatible con Industry 4.0\n• Conectividad IoT\n• Warranty extendida\n• Training incluido\n\n💡 "El upgrade de FAGOR pagó su inversión en menos de 3 meses. Ahora producimos 40% más con el mismo equipo." - John M., Production Manager\n\n📊 Evaluación gratuita de tu equipo disponible\n\n¿Listo para modernizar?\n\n#Manufacturing #CNC #Industry40 #Productivity #FAGOR'
),
NOW(), NOW()),

(@campaign2_id, 3, 7, 'email', 'send_email',
JSON_OBJECT(
  'subject', '💰 Oferta Especial: Upgrade tu CNC con 0% financiamiento',
  'content', 'Hola,\n\nTenemos una propuesta que no puedes rechazar.\n\n🎁 PROMOCIÓN LIMITADA (válida hasta fin de mes):\n\n✨ 0% FINANCIAMIENTO a 24 meses\n✨ Evaluación técnica GRATIS (valor $1,200)\n✨ Training post-upgrade incluido\n✨ 3 años de warranty (en lugar de 1)\n\n📊 CALCULA TU AHORRO:\n\nSi produces 1,000 piezas/mes:\n• Ahorro en downtime: $3,900/mes\n• Ahorro energético: $1,800/mes\n• Aumento productividad: $7,200/mes\n\nTOTAL AHORRO: $12,900/mes\nCosto upgrade: $15,900 (pagado en 24 meses = $662/mes)\n\nGANANCIA NETA: $12,238/mes desde el día 1\n\n🏆 GARANTÍA DE SATISFACCIÓN:\nSi no ves mejora en 90 días, reversamos el upgrade sin costo.\n\n📅 PROCESO SIMPLE:\n1. Evaluación técnica (1 día)\n2. Propuesta personalizada (2 días)\n3. Aprobación y scheduling (1 día)\n4. Instalación (3-5 días)\n5. Training y go-live (1 día)\n\nTotal: 8-10 días desde inicio hasta producción\n\n👉 [Agendar Evaluación Ahora]\n\nNo dejes pasar esta oportunidad.\n\nSaludos,\nFAGOR Upgrades Team\n\nP.D. Solo tenemos 5 slots disponibles este mes.'
),
NOW(), NOW());

