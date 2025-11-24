-- Insert the "7-Day Challenge" Multi-Channel Campaign
INSERT INTO multiChannelCampaigns (
  name,
  description,
  targetAudience,
  status,
  createdAt,
  updatedAt
) VALUES (
  'El Desafío de los 7 Días',
  'Automatiza tu primer proceso de ventas en 7 días o te devolvemos tu tiempo. Campaña de urgencia con gamificación y resultados garantizados.',
  'awareness',
  'draft',
  NOW(),
  NOW()
);

-- Get the campaign ID (assuming it's the last inserted)
SET @campaign_id = LAST_INSERT_ID();

-- Insert Step 1: Day 0 - Welcome Email
INSERT INTO campaignSteps (
  campaignId,
  stepOrder,
  channel,
  delayDays,
  subject,
  content,
  createdAt
) VALUES (
  @campaign_id,
  1,
  'email',
  0,
  '🎯 Tu desafío comienza HOY: Automatiza ventas en 7 días',
  '¡Bienvenido al Desafío de los 7 Días!

Tu misión: Automatizar tu primer proceso de ventas en solo 7 días.

🎁 Lo que recibes HOY:
- Video personalizado del CEO explicando el desafío
- Checklist descargable de los 7 días
- Badge digital "Challenger Badge" para compartir en LinkedIn

📋 Tu Checklist de 7 Días:
✅ Día 1-2: Configura tu primer agente IA
✅ Día 3-4: Conecta tus fuentes de leads
✅ Día 5-6: Automatiza tu primer workflow
✅ Día 7: ¡Celebra tus resultados!

🏆 Garantía: Si no automatizas al menos 1 proceso en 7 días, te devolvemos tu tiempo con una consultoría gratuita.

¿Estás listo para el desafío?

👉 [Acepto el Desafío]

¡Nos vemos en el día 2!

El equipo de Ivy.AI',
  NOW()
);

-- Insert Step 2: Day 2 - LinkedIn Post
INSERT INTO campaignSteps (
  campaignId,
  stepOrder,
  channel,
  delayDays,
  subject,
  content,
  createdAt
) VALUES (
  @campaign_id,
  2,
  'linkedin',
  2,
  'Caso de éxito real: Automatización que transforma',
  '🔥 CASO REAL: Cómo TechStart automatizó 300 leads/mes y aumentó conversión 45% en solo 5 días

📊 Los números no mienten:

ANTES:
❌ 80 leads/mes procesados manualmente
❌ Tiempo de respuesta: 24-48 horas
❌ Tasa de conversión: 12%
❌ 60 horas/semana del equipo

DESPUÉS (con Ivy.AI):
✅ 300 leads/mes procesados automáticamente
✅ Tiempo de respuesta: < 5 minutos
✅ Tasa de conversión: 17.4% (+45%)
✅ 20 horas/semana del equipo (-67%)

💡 "Pasamos de perseguir leads a que los leads nos persigan a nosotros" - María González, CEO TechStart

¿Quieres resultados similares?

👉 Únete al Desafío de los 7 Días y descubre cómo automatizar tu proceso de ventas.

Link en comentarios 👇

#AutomatizaciónDeVentas #IA #Productividad #IvyAI',
  NOW()
);

-- Insert Step 3: Day 3 - Follow-up Email
INSERT INTO campaignSteps (
  campaignId,
  stepOrder,
  channel,
  delayDays,
  subject,
  content,
  createdAt
) VALUES (
  @campaign_id,
  3,
  'email',
  3,
  '⏰ Día 3/7: Ya estás a mitad del camino',
  '¡Hola Challenger!

Ya estás en el Día 3 de 7. ¡Vas por la mitad del camino! 🎯

📊 Tu progreso:
[████████░░░░░░] 50% completado

🎓 Mini-Tutorial del Día:
"Configura tu primer agente IA en 10 minutos"

En este video corto te mostramos:
✅ Cómo crear tu primer agente desde cero
✅ Las 3 configuraciones esenciales
✅ Cómo conectarlo a tus leads existentes

👉 [Ver Tutorial Ahora]

🔴 WEBINAR EN VIVO - Mañana a las 3 PM
"De 0 a Automatizado: Demo en vivo"

En este webinar exclusivo verás:
- Setup completo de un sistema de automatización (en vivo)
- Casos de uso reales de empresas como la tuya
- Sesión de Q&A con nuestros expertos

Solo quedan 23 lugares disponibles.

👉 [Reservar Mi Lugar]

💪 Sigue adelante, ¡estás haciendo un trabajo increíble!

El equipo de Ivy.AI

P.D. ¿Tienes dudas? Responde este email y te ayudamos en menos de 1 hora.',
  NOW()
);

-- Insert Step 4: Day 5 - LinkedIn Success Story
INSERT INTO campaignSteps (
  campaignId,
  stepOrder,
  channel,
  delayDays,
  subject,
  content,
  createdAt
) VALUES (
  @campaign_id,
  4,
  'linkedin',
  5,
  'Historia de transformación: De 60 a 20 horas semanales',
  '💡 "Pasé de 60 horas semanales a 20 horas gracias a Ivy.AI"

Esta es la historia de María González, CEO de TechStart.

🔴 ANTES (Sin automatización):
- 60 horas/semana gestionando leads manualmente
- Respondía emails hasta las 11 PM
- Perdía el 40% de los leads por respuesta tardía
- Su equipo estaba agotado y desmotivado

🟢 DESPUÉS (Con Ivy.AI):
- 20 horas/semana enfocadas en estrategia
- Los agentes IA responden 24/7 en segundos
- Captura el 95% de los leads
- Su equipo se enfoca en cerrar ventas, no en tareas repetitivas

📈 RESULTADOS EN 30 DÍAS:
• +180% en leads calificados
• +45% en tasa de conversión
• -67% en tiempo operativo
• ROI de 340%

💬 "Lo mejor no son solo los números. Es recuperar mi vida. Ahora puedo cenar con mi familia y dormir tranquila sabiendo que ningún lead se pierde."

¿Estás listo para tu transformación?

👉 Únete al Desafío de los 7 Días

Link en comentarios 👇

#Transformación #Automatización #IA #Emprendimiento',
  NOW()
);

-- Insert Step 5: Day 7 - Final Email with Offer
INSERT INTO campaignSteps (
  campaignId,
  stepOrder,
  channel,
  delayDays,
  subject,
  content,
  createdAt
) VALUES (
  @campaign_id,
  5,
  'email',
  7,
  '🎁 ¡Lo lograste! Aquí está tu recompensa exclusiva',
  '¡FELICIDADES, CHALLENGER! 🎉

Completaste el Desafío de los 7 Días. Eres parte del 5% que realmente toma acción.

🏆 Tu Certificado de Completación está listo:
[Descargar Certificado]

Y ahora viene lo mejor...

🎁 TU RECOMPENSA EXCLUSIVA:

Por completar el desafío, tienes acceso a una oferta que NUNCA volveremos a ofrecer:

✨ 50% OFF en tu primer mes de Ivy.AI
✨ Setup y configuración GRATUITA (valor $2,000)
✨ 3 agentes IA pre-configurados listos para usar
✨ Consultoría 1-on-1 con nuestro experto en automatización (valor $500)
✨ Acceso a comunidad privada de Challengers

💰 VALOR TOTAL: $3,500
🎯 TU PRECIO HOY: $499/mes (primer mes)

⏰ PERO HAY UN DETALLE...

Esta oferta expira en exactamente:
[⏱️ 47:59:23]

¿Por qué tan poco tiempo?

Porque queremos trabajar solo con personas que toman acción rápida, como tú. Los que completan desafíos. Los que no se quedan en la zona de confort.

📊 LO QUE VAS A LOGRAR EN TU PRIMER MES:

✅ Automatizar al menos 3 procesos de ventas
✅ Aumentar tu capacidad de procesamiento de leads en 200%
✅ Reducir tiempo operativo en 50%
✅ Generar ROI positivo en las primeras 2 semanas

💪 GARANTÍA DE RESULTADOS:

Si en 30 días no automatizas al menos 1 proceso y no ahorras al menos 10 horas semanales, te devolvemos el 100% de tu dinero + $200 por tu tiempo.

👉 [ACTIVAR MI DESCUENTO AHORA]

No dejes pasar esta oportunidad. En 48 horas, esta oferta desaparece para siempre.

Nos vemos del otro lado,

El equipo de Ivy.AI

P.D. ¿Tienes dudas? Agenda una llamada de 15 minutos con nuestro equipo:
[Agendar Llamada]

P.P.D. Mira lo que dicen otros Challengers que ya activaron su cuenta:
[Ver Testimoniales]',
  NOW()
);
