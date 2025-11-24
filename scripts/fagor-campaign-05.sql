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

