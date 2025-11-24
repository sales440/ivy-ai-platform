-- Campaign 4: FAGOR DIGITAL SUITE
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'FAGOR DIGITAL SUITE - Industry 4.0',
  'Transforma tu planta en una fábrica inteligente. Monitoreo en tiempo real, predictive maintenance y analytics avanzados.',
  'awareness',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign4_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign4_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🚀 Bienvenido a Industry 4.0: FAGOR DIGITAL SUITE',
  'content', 'Estimado profesional,\n\n¿Imaginas controlar toda tu producción desde tu smartphone?\n\n📱 FAGOR DIGITAL SUITE hace esto realidad.\n\n🎯 QUÉ ES:\nPlataforma cloud que conecta todos tus equipos FAGOR para monitoreo, análisis y optimización en tiempo real.\n\n✅ FUNCIONALIDADES:\n\n📊 REAL-TIME MONITORING\n• Estado de todas las máquinas\n• Producción en tiempo real\n• Alertas instantáneas\n• Dashboard personalizable\n\n🔮 PREDICTIVE MAINTENANCE\n• IA predice fallas antes de que ocurran\n• Reduce downtime hasta 70%\n• Programa mantenimiento óptimo\n• Extiende vida útil de equipos\n\n📈 ADVANCED ANALYTICS\n• OEE (Overall Equipment Effectiveness)\n• Análisis de productividad\n• Identificación de cuellos de botella\n• Reportes automáticos\n\n🔗 INTEGRATION\n• ERP/MES connectivity\n• API abierta\n• Mobile app iOS/Android\n• Web dashboard\n\n💡 CASOS DE ÉXITO:\n\n"Aumentamos OEE de 67% a 89% en 6 meses"\n- Manufacturing Corp\n\n"Redujimos downtime 73% con predictive maintenance"\n- Precision Parts Inc\n\n"ROI de 340% en el primer año"\n- Industrial Solutions LLC\n\n💰 INVERSIÓN:\n$495/mes por máquina\n(Descuento por volumen disponible)\n\n🎁 PRUEBA GRATIS:\n30 días sin compromiso\nInstalación y setup incluidos\n\n👉 [Iniciar Prueba Gratuita]\n\nBienvenido al futuro de la manufactura.\n\nSaludos,\nFAGOR Digital Team'
),
NOW(), NOW()),

(@campaign4_id, 2, 3, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '🚀 Industry 4.0 no es el futuro. Es el PRESENTE.\n\nY las empresas que no se adaptan están perdiendo millones.\n\n📊 DATOS IMPACTANTES:\n\n• 82% de manufacturers planean invertir en IoT en 2025\n• Empresas con Industry 4.0 tienen 25% más productividad\n• Predictive maintenance reduce costos 30-40%\n• ROI promedio de digitalización: 280% en 2 años\n\n❓ ¿QUÉ ESTÁN HACIENDO TUS COMPETIDORES?\n\nMientras tú revisas reportes en papel, ellos:\n✅ Monitorean producción en tiempo real desde cualquier lugar\n✅ Reciben alertas antes de que ocurran fallas\n✅ Optimizan producción con IA\n✅ Toman decisiones basadas en datos, no intuición\n\n🎯 FAGOR DIGITAL SUITE:\nLa plataforma Industry 4.0 diseñada específicamente para manufactura.\n\n💡 LO QUE HACE:\n• Conecta todos tus equipos CNC\n• Monitoreo 24/7 en tiempo real\n• Predictive maintenance con IA\n• Analytics avanzados\n• Integración con ERP/MES\n• Mobile + Web dashboard\n\n📈 RESULTADOS REALES:\n\nCliente A: +34% productividad en 4 meses\nCliente B: -68% downtime no planificado\nCliente C: ROI de 290% en año 1\n\n🎁 OFERTA ESPECIAL:\n30 días de prueba GRATIS\nSetup e instalación incluidos\nSin compromiso\n\n¿Listo para digitalizar tu planta?\n\nLink en comentarios 👇\n\n#Industry40 #Manufacturing #IoT #DigitalTransformation #FAGOR'
),
NOW(), NOW()),

(@campaign4_id, 3, 5, 'email', 'send_email',
JSON_OBJECT(
  'subject', '📊 Demo exclusiva: Ve FAGOR DIGITAL SUITE en acción',
  'content', 'Hola,\n\nGracias por tu interés en FAGOR DIGITAL SUITE.\n\nTe invitamos a una DEMO PERSONALIZADA donde verás:\n\n🎬 AGENDA DE LA DEMO (45 minutos):\n\n1. DASHBOARD EN VIVO (10 min)\n   • Monitoreo de máquinas en tiempo real\n   • Alertas y notificaciones\n   • KPIs principales\n\n2. PREDICTIVE MAINTENANCE (15 min)\n   • Cómo la IA predice fallas\n   • Casos reales de prevención\n   • Ahorro en costos\n\n3. ANALYTICS & REPORTS (10 min)\n   • OEE tracking\n   • Análisis de productividad\n   • Reportes automáticos\n\n4. INTEGRATION (5 min)\n   • Conexión con ERP/MES\n   • API capabilities\n   • Mobile app demo\n\n5. Q&A (5 min)\n   • Tus preguntas específicas\n   • Pricing personalizado\n   • Próximos pasos\n\n📅 HORARIOS DISPONIBLES:\n• Martes 10:00 AM CST\n• Miércoles 2:00 PM CST\n• Jueves 11:00 AM CST\n• Viernes 3:00 PM CST\n\n👉 [Reservar Mi Demo]\n\n🎁 BONUS:\nTodos los asistentes reciben:\n• Whitepaper: "ROI de Industry 4.0"\n• Calculadora de ahorro personalizada\n• 30 días de prueba gratis\n\n💡 "La demo me convenció en 15 minutos. Implementamos Digital Suite y nunca miramos atrás." - Mike R., Plant Manager\n\nNo te quedes atrás.\n\nSaludos,\nFAGOR Digital Team'
),
NOW(), NOW());

