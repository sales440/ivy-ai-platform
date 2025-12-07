-- FAGOR Automation USA - Multi-Channel Campaigns
-- Department: Service

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

-- Campaign 5: Spare Parts
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'Spare Parts - Stock Inteligente',
  'Repuestos originales FAGOR siempre disponibles. Delivery express y programa de stock management para minimizar downtime.',
  'consideration',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign5_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign5_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '⚙️ Repuestos FAGOR: Stock inteligente para 0 downtime',
  'content', 'Estimado cliente,\n\n¿Cuánto te cuesta cada hora de downtime por falta de repuestos?\n\n💸 COSTO REAL DEL DOWNTIME:\n• Producción perdida: $500-2,000/hora\n• Personal idle: $200-500/hora\n• Órdenes retrasadas: $1,000-5,000\n• Clientes insatisfechos: Incalculable\n\n⚠️ PROBLEMA COMÚN:\n"Necesito un servo motor URGENTE"\n"El repuesto llega en 2 semanas"\n"Perdí $40,000 en producción"\n\n✅ SOLUCIÓN: SPARE PARTS PROGRAM FAGOR\n\n🎯 BENEFICIOS:\n\n📦 STOCK INTELIGENTE\n• Análisis de tu equipo\n• Identificamos partes críticas\n• Recomendamos stock óptimo\n• Evitas sobre-inventario\n\n🚀 DELIVERY EXPRESS\n• Repuestos críticos: 24-48 horas\n• Repuestos standard: 3-5 días\n• Emergency service: Same day (área Chicago)\n\n💯 GARANTÍA ORIGINAL\n• 100% partes originales FAGOR\n• Garantía de compatibilidad\n• Certificados de calidad\n• Trazabilidad completa\n\n💰 PROGRAMA DE DESCUENTOS:\n\n🥉 BASIC (compras < $5,000/año)\n• 5% descuento\n• Delivery standard\n• Soporte telefónico\n\n🥈 PREFERRED (compras $5,000-15,000/año)\n• 12% descuento\n• Priority delivery\n• Soporte 24/7\n• Stock management básico\n\n🥇 PREMIUM (compras > $15,000/año)\n• 18% descuento\n• Express delivery incluido\n• Ingeniero dedicado\n• Stock management avanzado\n• Consignment inventory disponible\n\n📊 PARTES MÁS CRÍTICAS:\n1. Servo motors\n2. Control boards\n3. Power supplies\n4. Encoders\n5. Cables y conectores\n\n👉 [Solicitar Análisis de Stock Gratuito]\n\nNo esperes a que sea tarde.\n\nSaludos,\nFAGOR Parts Team'
),
NOW(), NOW()),

(@campaign5_id, 2, 4, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '⚙️ Historia real: Cómo $800 en repuestos salvaron $50,000 en producción\n\nCliente: Precision Manufacturing Inc.\nProblema: Servo motor crítico falló un viernes a las 4 PM\n\n❌ SIN PROGRAMA DE SPARE PARTS:\n• Repuesto disponible: Lunes (3 días)\n• Downtime: 72 horas\n• Producción perdida: $48,000\n• Cliente perdido: $250,000 contrato anual\n• TOTAL: $298,000 en pérdidas\n\n✅ CON PROGRAMA FAGOR:\n• Repuesto en stock: Disponible\n• Técnico en sitio: 2 horas\n• Downtime total: 4 horas\n• Costo: $800 (repuesto)\n• AHORRO: $297,200\n\n📊 LA MATEMÁTICA:\n\nInversión en stock crítico: $3,500\nCosto anual programa: $2,400\nTOTAL: $5,900\n\nUNA SOLA emergencia evitada = ROI de 5,000%\n\n💡 PROGRAMA SPARE PARTS FAGOR:\n\n✅ Análisis de partes críticas\n✅ Stock management inteligente\n✅ Delivery express 24-48h\n✅ Descuentos hasta 18%\n✅ Consignment inventory disponible\n\n🎯 PARTES QUE DEBERÍAS TENER:\n• Servo motors (crítico)\n• Control boards (crítico)\n• Power supplies (alto riesgo)\n• Encoders (medio riesgo)\n• Cables y conectores (preventivo)\n\n💬 "El programa de spare parts de FAGOR nos ha salvado al menos 5 veces este año. Cada vez que lo necesitamos, está ahí." - John M., Maintenance Manager\n\n¿Tu planta está preparada para una emergencia?\n\n#Manufacturing #Maintenance #SupplyChain #Downtime #FAGOR'
),
NOW(), NOW()),

(@campaign5_id, 3, 7, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🎁 Kit de Repuestos Críticos: 20% OFF por tiempo limitado',
  'content', 'OFERTA ESPECIAL,\n\nHemos creado KITS DE REPUESTOS específicos para cada modelo FAGOR.\n\n📦 CRITICAL PARTS KIT\n\nIncluye las 10 partes con mayor probabilidad de falla:\n\n1. Servo motor backup\n2. Control board\n3. Power supply\n4. Encoder\n5. Emergency stop button\n6. Limit switches (set)\n7. Cooling fan\n8. Cable set\n9. Fuses and relays\n10. Lubrication kit\n\n💰 PRECIO:\nValor individual: $4,850\nKit completo: $3,880 (20% OFF)\n\n🎁 BONUS INCLUIDOS:\n• Storage case organizado\n• Installation manual\n• Video tutorials\n• 1 año de soporte técnico\n• Priority delivery en futuras órdenes\n\n📊 ANÁLISIS DE ROI:\n\nCosto kit: $3,880\nUna emergencia evitada: $40,000+\nROI: 1,000%+\n\nPeace of mind: Invaluable\n\n✅ GARANTÍA:\nSi no usas ninguna parte en 2 años, te devolvemos 50% del valor.\n\n⏰ OFERTA VÁLIDA: 10 días\n\n👉 [Ordenar Mi Kit Ahora]\n\n📋 TAMBIÉN DISPONIBLE:\n\n🔧 MAINTENANCE KIT\n• Filtros, lubricantes, consumibles\n• $890 (15% OFF)\n\n⚡ EMERGENCY KIT\n• Partes de reemplazo rápido\n• $1,450 (15% OFF)\n\n🎯 CUSTOM KIT\n• Diseñado para tu equipo específico\n• Precio personalizado\n\n💡 "Compré el Critical Parts Kit hace 6 meses. Ya lo usé 2 veces y me ahorró semanas de downtime." - Sarah K., Plant Manager\n\nNo esperes a necesitarlo.\n\nSaludos,\nFAGOR Parts Team\n\nP.D. Financiamiento 0% disponible en compras > $3,000'
),
NOW(), NOW());

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
