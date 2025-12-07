-- Campaign 1: Training Programs
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'FAGOR Training Programs 2025',
  'Capacitación técnica especializada en CNC y automatización industrial. Mejora las habilidades de tu equipo con expertos de FAGOR.',
  'consideration',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign1_id = LAST_INSERT_ID();

-- Steps for Training Campaign
INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign1_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🎓 Capacitación Técnica FAGOR: Impulsa la productividad de tu equipo',
  'content', 'Estimado profesional,\n\n¿Tu equipo técnico está aprovechando al máximo sus equipos CNC FAGOR?\n\n🎯 PROGRAMAS DE TRAINING DISPONIBLES:\n\n✅ CNC Programming Advanced\n✅ Preventive Maintenance Certification\n✅ Troubleshooting & Diagnostics\n✅ FAGOR Digital Suite Training\n\n💡 BENEFICIOS:\n• Reducción de downtime hasta 40%\n• Aumento de productividad 25%\n• Certificación oficial FAGOR\n• Soporte técnico prioritario post-training\n\n📅 Próximas sesiones: Febrero-Marzo 2025\n📍 Modalidad: Presencial en Elk Grove Village, IL + Virtual\n\n👉 [Ver Calendario de Cursos]\n\nSaludos,\nFAGOR Automation USA - Service Team'
),
NOW(), NOW()),

(@campaign1_id, 2, 3, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '🎓 ¿Tu equipo técnico domina realmente sus equipos CNC?\n\nEn FAGOR Automation USA sabemos que la tecnología es solo tan buena como las personas que la operan.\n\n📊 DATOS REALES:\n• Empresas con técnicos certificados reducen downtime 40%\n• El 78% de fallas CNC son por error humano, no del equipo\n• ROI promedio de training: 320% en el primer año\n\n🎯 NUESTROS PROGRAMAS 2025:\n✅ CNC Programming Advanced\n✅ Preventive Maintenance\n✅ Troubleshooting Expert\n✅ Digital Suite Mastery\n\n💼 Incluye:\n• Certificación oficial FAGOR\n• Material de referencia lifetime\n• Soporte técnico prioritario\n• Acceso a comunidad de expertos\n\n📅 Inscripciones abiertas para Q1 2025\n\n¿Listo para llevar a tu equipo al siguiente nivel?\n\n#Manufacturing #CNC #IndustrialAutomation #Training #FAGOR'
),
NOW(), NOW()),

(@campaign1_id, 3, 5, 'email', 'send_email',
JSON_OBJECT(
  'subject', '⏰ Últimos lugares: Training FAGOR - Descuento Early Bird',
  'content', 'Hola,\n\nQuedan solo 8 lugares para nuestro programa de Training más solicitado.\n\n🔥 OFERTA EARLY BIRD (válida 72 horas):\n• 25% OFF en inscripción\n• Material de estudio GRATIS (valor $500)\n• 1 año de soporte técnico prioritario\n\n📋 PROGRAMA INCLUYE:\n\nDÍA 1-2: CNC Programming Fundamentals\n• G-code optimization\n• Macro programming\n• Error prevention\n\nDÍA 3-4: Advanced Troubleshooting\n• Diagnostic tools mastery\n• Common failure patterns\n• Emergency procedures\n\nDÍA 5: Certification Exam\n• Práctica supervisada\n• Examen oficial FAGOR\n• Entrega de certificado\n\n💰 INVERSIÓN:\n$2,400 por persona (precio regular: $3,200)\nGrupos de 3+: 15% adicional\n\n👉 [Inscribirse Ahora]\n\nSaludos,\nFAGOR Service Team'
),
NOW(), NOW());

