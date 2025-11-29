-- Missing FAGOR Campaigns
-- Creates the 3 campaigns that were not in the original seed file

-- Campaign: EOL Parts Availability (for Ivy-Logic)
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'EOL Parts Availability - Stock Crítico',
  'Asegura la disponibilidad de partes descontinuadas antes de que sea tarde. Stock limitado de componentes críticos para equipos legacy.',
  'decision',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign_eol_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign_eol_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '⚠️ ALERTA: Partes de tu equipo CNC serán descontinuadas',
  'content', 'Estimado cliente FAGOR,\n\nTenemos una notificación importante sobre tu equipo.\n\n🚨 PARTES EN PROCESO DE DESCONTINUACIÓN:\n\nLos siguientes componentes para tu modelo CNC entrarán en EOL (End of Life) en los próximos 6 meses:\n\n• Servo motors serie 8025\n• Control boards legacy\n• Encoders específicos\n• Spindle components\n\n⏰ ¿QUÉ SIGNIFICA ESTO?\n\nUna vez descontinuadas:\n❌ No habrá stock disponible\n❌ Reparaciones imposibles\n❌ Downtime prolongado\n❌ Necesidad de upgrade completo ($$$)\n\n💡 SOLUCIÓN: STOCK PREVENTIVO\n\nRecomendamos asegurar:\n• 2-3 servo motors de respaldo\n• 1 control board spare\n• Set de encoders críticos\n• Componentes de spindle\n\nINVERSIÓN: $8,500 - $15,000\nVS. Upgrade forzado: $25,000+\n\n📦 BENEFICIOS:\n✅ Garantía de disponibilidad 5+ años\n✅ Precio actual (antes de EOL premium)\n✅ Storage sin costo en FAGOR\n✅ Envío express cuando lo necesites\n\n⏰ OFERTA LIMITADA:\nCompra antes de EOL oficial: 15% OFF\n\n👉 [Ver Partes Recomendadas]\n\nNo esperes a que sea tarde.\n\nSaludos,\nFAGOR Supply Chain Team'
),
NOW(), NOW()),

(@campaign_eol_id, 2, 5, 'email', 'send_email',
JSON_OBJECT(
  'subject', '📊 Análisis personalizado: Partes críticas para tu operación',
  'content', 'Hola,\n\nBasándonos en tu historial de uso, preparamos un análisis personalizado.\n\n📋 TU PERFIL DE RIESGO:\n\nEquipo: FAGOR 8025 CNC (instalado 2012)\nHoras de operación: ~45,000 hrs\nPartes en riesgo EOL: 8 componentes\n\n🎯 RECOMENDACIÓN PERSONALIZADA:\n\nPRIORIDAD ALTA (comprar ahora):\n• Servo motor X-axis: $2,400 (2 unidades)\n• Control board main: $3,800 (1 unidad)\n• Encoder set: $1,200 (1 set)\n\nPRIORIDAD MEDIA (considerar):\n• Spindle bearings: $890\n• Power supply backup: $1,450\n\nTOTAL RECOMENDADO: $12,140\nCon descuento EOL (15%): $10,319\n\n💰 ANÁLISIS ROI:\n\nSin stock preventivo:\n• Falla crítica: downtime 2-4 semanas\n• Pérdida producción: $45,000\n• Upgrade forzado: $28,000\n• TOTAL RIESGO: $73,000\n\nCon stock preventivo:\n• Inversión: $10,319\n• Downtime: 4-8 horas\n• Pérdida: $800\n• AHORRO NETO: $62,000+\n\n📦 FINANCIAMIENTO:\n12 meses sin intereses disponible\n\n👉 [Aprobar Orden Recomendada]\n\nSaludos,\nFAGOR Supply Chain Team'
),
NOW(), NOW());

-- Campaign: Preventive Maintenance Contracts (for Ivy-Logic)
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'Preventive Maintenance - Evita Fallas',
  'Programa de mantenimiento preventivo que reduce downtime hasta 70%. Servicio programado que mantiene tus equipos en óptimas condiciones.',
  'consideration',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign_pm_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign_pm_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '🔧 Mantenimiento Preventivo: La clave para 99% uptime',
  'content', 'Estimado profesional,\n\n¿Cuánto te cuesta cada hora de downtime no planificado?\n\n📊 ESTADÍSTICAS REALES:\n\nEmpresas SIN mantenimiento preventivo:\n• Downtime promedio: 180 hrs/año\n• Costo promedio: $47,000/año\n• Fallas críticas: 4-6 eventos/año\n\nEmpresas CON mantenimiento preventivo:\n• Downtime promedio: 25 hrs/año\n• Costo promedio: $6,500/año\n• Fallas críticas: 0-1 eventos/año\n\nAHORRO: $40,500/año\n\n🎯 PROGRAMA FAGOR PREVENTIVE MAINTENANCE:\n\n✅ QUÉ INCLUYE:\n• Inspecciones programadas (trimestrales)\n• Calibración de precisión\n• Lubricación especializada\n• Diagnóstico predictivo\n• Reemplazo de componentes de desgaste\n• Actualización de software\n• Reportes detallados de condición\n• Prioridad en emergencias\n\n📦 PLANES DISPONIBLES:\n\n🥉 BASIC (1 equipo)\n$3,900/año\n• 2 visitas/año\n• Inspección básica\n• Reporte de condición\n\n🥈 PROFESSIONAL (1-3 equipos)\n$6,500/año por equipo\n• 4 visitas/año\n• Calibración incluida\n• Partes de desgaste incluidas\n• Soporte prioritario\n\n🥇 ENTERPRISE (4+ equipos)\n$5,200/año por equipo\n• Visitas ilimitadas\n• Ingeniero dedicado\n• Todas las partes incluidas\n• Garantía de uptime 99%\n\n💡 ROI GARANTIZADO:\nSi no reduces downtime 50% en el primer año, segundo año GRATIS.\n\n👉 [Solicitar Evaluación Gratuita]\n\nSaludos,\nFAGOR Service Team'
),
NOW(), NOW()),

(@campaign_pm_id, 2, 7, 'email', 'send_email',
JSON_OBJECT(
  'subject', '📈 Caso de éxito: 85% reducción en downtime',
  'content', 'Hola,\n\nQuiero compartir un caso real que puede interesarte.\n\n🏭 CLIENTE: Precision Manufacturing Inc.\n📍 Ubicación: Wisconsin\n⚙️ Equipos: 5 CNCs FAGOR\n\n❌ ANTES DEL PROGRAMA:\n• Downtime: 220 hrs/año\n• Costo mantenimiento reactivo: $52,000/año\n• Fallas críticas: 7 eventos\n• Producción perdida: $180,000\n\n✅ DESPUÉS DEL PROGRAMA (12 meses):\n• Downtime: 32 hrs/año (-85%)\n• Costo programa PM: $26,000/año\n• Fallas críticas: 0 eventos\n• Producción perdida: $12,000\n\nAHORRO TOTAL: $194,000/año\nROI: 650%\n\n💬 TESTIMONIO:\n\n"El programa de mantenimiento preventivo de FAGOR transformó nuestra operación. Ya no vivimos con el estrés de fallas inesperadas. Ahora podemos planificar con confianza."\n\n- Michael R., Production Manager\n\n📊 TU POTENCIAL:\n\nSi tienes downtime similar:\n• Ahorro estimado: $150,000 - $200,000/año\n• Inversión programa: $26,000 - $32,000/año\n• ROI: 500%+\n\n🎁 OFERTA ESPECIAL:\nPrimer año: 20% OFF\nEvaluación inicial: GRATIS\n\n👉 [Agendar Evaluación]\n\nSaludos,\nFAGOR Service Team'
),
NOW(), NOW());

-- Campaign: Equipment Modernization Strategy (for Ivy-Insight)
INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdBy, createdAt, updatedAt)
VALUES (
  'Equipment Modernization - Estrategia de Futuro',
  'Análisis estratégico de modernización vs. reemplazo. Maximiza ROI de equipos existentes y planifica inversiones inteligentes.',
  'awareness',
  'draft',
  1,
  NOW(),
  NOW()
);

SET @campaign_mod_id = LAST_INSERT_ID();

INSERT INTO campaignSteps (campaignId, stepNumber, delayDays, channelType, actionType, actionConfig, createdAt, updatedAt)
VALUES
(@campaign_mod_id, 1, 0, 'email', 'send_email',
JSON_OBJECT(
  'subject', '💡 Modernizar vs. Reemplazar: La decisión de $100K',
  'content', 'Estimado ejecutivo,\n\n¿Cuándo tiene sentido modernizar equipos existentes vs. comprar nuevos?\n\n📊 ANÁLISIS COMPARATIVO:\n\nOPCIÓN A: COMPRAR NUEVO CNC\n💰 Inversión: $120,000 - $180,000\n⏰ Implementación: 6-12 meses\n📉 Depreciación: -20% año 1\n🔧 Curva de aprendizaje: 3-6 meses\n\nOPCIÓN B: MODERNIZAR EXISTENTE\n💰 Inversión: $25,000 - $45,000\n⏰ Implementación: 2-4 semanas\n📈 Valor agregado: +150%\n🔧 Curva de aprendizaje: Mínima\n\nAHORRO: $75,000 - $135,000\n\n✅ CUÁNDO MODERNIZAR:\n\n• Estructura mecánica en buen estado\n• Precisión base aún adecuada\n• Inversión < 40% de equipo nuevo\n• Necesitas resultados rápidos\n• Quieres preservar conocimiento del equipo\n\n❌ CUÁNDO REEMPLAZAR:\n\n• Desgaste mecánico severo\n• Tecnología obsoleta (>15 años)\n• Costos de mantenimiento >$15K/año\n• Cambio radical de capacidades necesarias\n\n🎯 PROGRAMA DE MODERNIZACIÓN FAGOR:\n\n1. CONTROL SYSTEM UPGRADE\n   • Nuevo control CNC\n   • Software actualizado\n   • Conectividad IoT\n   Desde: $18,500\n\n2. PRECISION ENHANCEMENT\n   • Nuevos servos\n   • Encoders de alta resolución\n   • Recalibración completa\n   Desde: $28,000\n\n3. DIGITAL TRANSFORMATION\n   • Todo lo anterior +\n   • Digital Suite integration\n   • Predictive maintenance\n   • Data analytics\n   Desde: $42,000\n\n💰 FINANCIAMIENTO:\n0% interés a 36 meses disponible\n\n📊 ROI TÍPICO:\n• Payback period: 12-18 meses\n• Vida útil extendida: +10 años\n• Aumento productividad: +35%\n\n👉 [Solicitar Análisis Personalizado]\n\nSaludos,\nFAGOR Strategy Team'
),
NOW(), NOW()),

(@campaign_mod_id, 2, 5, 'linkedin', 'generate_linkedin_post',
JSON_OBJECT(
  'content', '💡 MODERNIZACIÓN vs. REEMPLAZO: El dilema de todo director de manufactura\n\n¿Invertir $150K en equipos nuevos o $35K en modernizar los existentes?\n\n📊 CASO REAL:\n\nCliente: Mid-size manufacturer (Ohio)\nSituación: 4 CNCs FAGOR (10-12 años)\nDilema: ¿Modernizar o reemplazar?\n\n💰 ANÁLISIS FINANCIERO:\n\nOpción A - Reemplazar todo:\n• Inversión: $520,000\n• Tiempo implementación: 8 meses\n• Disruption: Alta\n• ROI: 4.5 años\n\nOpción B - Modernización estratégica:\n• Inversión: $140,000\n• Tiempo implementación: 6 semanas\n• Disruption: Mínima\n• ROI: 14 meses\n\n✅ RESULTADO:\nEligieron modernización.\n\n12 meses después:\n• Productividad: +38%\n• Downtime: -65%\n• Ahorro vs. reemplazo: $380,000\n• Vida útil extendida: +10 años\n\n🎯 LECCIONES CLAVE:\n\n1. Modernización no es "parche"\n   Es transformación estratégica\n\n2. ROI más rápido\n   Menos inversión = payback más corto\n\n3. Menor riesgo\n   Conoces el equipo, minimizas sorpresas\n\n4. Flexibilidad\n   Puedes modernizar por fases\n\n💡 ¿CUÁNDO MODERNIZAR?\n\n✅ Estructura mecánica sólida\n✅ Inversión < 40% de nuevo\n✅ Necesitas resultados rápidos\n✅ Quieres preservar know-how\n\n❌ CUÁNDO REEMPLAZAR?\n\n• Desgaste mecánico severo\n• Tecnología >15 años\n• Cambio radical de necesidades\n\n¿Tu planta tiene equipos candidatos para modernización?\n\n#Manufacturing #CNC #Industry40 #CAPEX #ROI #FAGOR'
),
NOW(), NOW());
