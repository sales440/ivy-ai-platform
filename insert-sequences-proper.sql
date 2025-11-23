-- Insert Decision Stage Sequence
INSERT INTO emailSequences (name, description, targetStage, isActive) 
VALUES ('Decision Stage - Post Demo', 'Email sequence for leads after demo to help them make purchase decision', 'decision', true);

SET @decision_seq_id = LAST_INSERT_ID();

INSERT INTO emailSequenceSteps (sequenceId, stepNumber, delayDays, subject, body) VALUES
(@decision_seq_id, 1, 0, '{{leadName}}, aquí está tu plan de implementación personalizado', 'Hola {{leadName}},

Gracias por la demo de ayer. Fue un placer conocer los desafíos de {{company}}.

He preparado un plan de implementación personalizado para resolver {{painPoint}}:

📋 **Tu Plan de Implementación (4 Semanas)**

**Semana 1: Configuración**
- Integración con tu CRM y herramientas actuales
- Configuración de 3 agentes prioritarios
- Migración de datos históricos

**Semana 2: Personalización**
- Workflows personalizados para tu proceso
- Entrenamiento de agentes con tus datos
- Configuración de reglas de negocio

**Semana 3: Pruebas**
- Testing con leads reales
- Ajustes y optimización
- Capacitación de tu equipo

**Semana 4: Go-Live**
- Activación completa
- Monitoreo 24/7
- Soporte dedicado

💰 **ROI Proyectado para {{company}}:**
- Reducción de 40% en costos operativos
- Aumento de 60% en conversión
- Recuperación de inversión en 3 meses

¿Listo para empezar?

Responde a este email para agendar tu kick-off.

Saludos,
Ivy.AI Team
sales@ivybai.com'),

(@decision_seq_id, 2, 3, 'Preguntas frecuentes sobre Ivy.AI para {{company}}', 'Hola {{leadName}},

Entiendo que tomar una decisión de este tipo requiere claridad total.

Aquí respondo las preguntas más comunes:

**❓ ¿Cuánto tiempo toma la implementación?**
4 semanas desde firma hasta go-live completo.

**❓ ¿Necesito personal técnico?**
No. Nuestro equipo maneja toda la implementación.

**❓ ¿Qué pasa con mis herramientas actuales?**
Ivy.AI se integra con tu CRM, email, calendario existentes.

**❓ ¿Cuál es el costo total?**
Inversión inicial + suscripción mensual. ROI positivo en 3 meses.

**❓ ¿Qué soporte recibo?**
- Onboarding dedicado (4 semanas)
- Soporte técnico 24/7
- Actualizaciones continuas sin costo

**❓ ¿Puedo cancelar si no funciona?**
Sí. Garantía de satisfacción de 30 días.

🎯 **Próximo Paso:**
Agenda una llamada de 15 minutos para resolver tus dudas específicas.

Responde a este email con tu disponibilidad.

Saludos,
Ivy.AI Team
sales@ivybai.com'),

(@decision_seq_id, 3, 5, '{{company}} + Ivy.AI: Propuesta final', 'Hola {{leadName}},

Quiero asegurarme de que tienes toda la información para tomar tu decisión.

📊 **Resumen de tu Propuesta:**

**Problema a resolver:**
{{painPoint}}

**Solución:**
6 agentes de IA especializados trabajando 24/7

**Implementación:**
4 semanas con soporte dedicado

**ROI Proyectado:**
- 40% reducción de costos operativos
- 60% aumento en conversión
- Recuperación en 3 meses

**Incluye:**
✅ Implementación completa
✅ Integración con tus herramientas
✅ Capacitación de equipo
✅ Soporte 24/7 por 12 meses
✅ Actualizaciones sin costo

🎁 **Oferta válida hasta fin de mes:**
- 1 mes adicional de soporte premium
- Análisis de optimización gratuito
- Prioridad en roadmap de features

¿Listo para transformar {{company}}?

Responde "SÍ" y agendamos tu kick-off esta semana.

Saludos,
Ivy.AI Team
sales@ivybai.com');

-- Insert Consideration Sequence Steps
SET @consideration_seq_id = (SELECT id FROM emailSequences WHERE name = 'Consideration Stage - Demo Request' LIMIT 1);

INSERT INTO emailSequenceSteps (sequenceId, stepNumber, delayDays, subject, body) VALUES
(@consideration_seq_id, 1, 0, '¿Cómo Ivy.AI puede resolver {{painPoint}} en {{company}}?', 'Hola {{leadName}},

Vi que descargaste nuestra calculadora de ROI. Eso significa que estás evaluando opciones para resolver {{painPoint}}.

Quiero compartir contigo cómo empresas similares a {{company}} han usado Ivy.AI:

📊 **Caso Real: Empresa de {{industry}}**
- Reducción del 40% en tiempo de calificación de leads
- Aumento del 60% en conversión de ventas
- ROI positivo en los primeros 3 meses

🎯 **¿Cómo funciona para ti?**
Nuestros 6 agentes especializados trabajan 24/7:
- Ivy-Prospect: Genera y califica leads automáticamente
- Ivy-Closer: Cierra ventas con seguimiento inteligente
- Ivy-Solve: Soporte al cliente sin contratar personal

¿Te gustaría ver una demo personalizada de 15 minutos?

Responde a este email con tu disponibilidad.

Saludos,
Ivy.AI Team
sales@ivybai.com'),

(@consideration_seq_id, 2, 3, 'Demo de Ivy.AI: Automatiza {{painPoint}} en 3 pasos', 'Hola {{leadName}},

¿Sigues buscando soluciones para {{painPoint}}?

Permíteme mostrarte exactamente cómo Ivy.AI puede ayudar a {{company}}:

**Paso 1: Conecta tus herramientas** (5 minutos)
Integración con CRM, email, calendario

**Paso 2: Configura tus agentes** (10 minutos)
Personaliza workflows según tu proceso de ventas

**Paso 3: Activa la automatización** (Instantáneo)
Tus agentes empiezan a trabajar 24/7

💡 **Beneficios inmediatos:**
✅ Calificación automática de leads
✅ Seguimiento inteligente sin intervención manual
✅ Soporte 24/7 sin contratar personal
✅ Analytics predictivos en tiempo real

📅 **Agenda tu demo ahora**
Responde con tu disponibilidad esta semana.

Saludos,
Ivy.AI Team
sales@ivybai.com'),

(@consideration_seq_id, 3, 5, 'Última oportunidad: Demo exclusiva de Ivy.AI para {{company}}', 'Hola {{leadName}},

He intentado contactarte sobre la demo de Ivy.AI para resolver {{painPoint}}.

**¿Por qué es importante actuar ahora?**

Cada día sin automatización significa:
- ❌ Leads perdidos por seguimiento manual lento
- ❌ Costos de personal que podrían reducirse 60%
- ❌ Oportunidades de venta que se escapan

**Lo que obtienes con Ivy.AI:**
- ✅ 6 agentes especializados trabajando 24/7
- ✅ Implementación en menos de 1 semana
- ✅ ROI positivo en los primeros 3 meses
- ✅ Soporte dedicado durante onboarding

🎁 **Oferta especial:**
Agenda tu demo esta semana y recibe:
- Análisis gratuito de tu proceso actual
- Plan de implementación personalizado
- 1 mes de soporte premium sin costo

¿Hablamos 15 minutos esta semana?

Responde a este email o contáctanos en sales@ivybai.com

Saludos,
Ivy.AI Team');
