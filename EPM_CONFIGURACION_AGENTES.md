# Configuración Técnica de Agentes IA para EPM Construcciones

**Cliente:** EPM Construcciones SA de CV  
**Company ID:** 4 (epm-construcciones)  
**Plan:** Enterprise  
**Fecha de Activación:** 19 de Noviembre, 2025

---

## AGENTES ACTIVADOS

### 1. IVY-PROSPECT (Generación de Leads)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "prospect_search",
  "companyId": 4,
  "config": {
    "industries": ["Education", "Hospitality", "Real Estate", "Construction"],
    "location": {
      "city": "Santa Lucía del Camino",
      "state": "Oaxaca",
      "country": "México",
      "radius_km": 50
    },
    "targetTitles": [
      "Director de Mantenimiento",
      "Gerente de Operaciones",
      "Administrador",
      "Director de Infraestructura",
      "Gerente de Facilities",
      "Coordinador de Mantenimiento"
    ],
    "companySize": ["11-50", "51-200", "201-1000", "1000+"],
    "leadGoal": 200,
    "frequency": "daily",
    "enrichment": true
  }
}
```

**Métricas Objetivo:**
- 180-200 leads/mes
- 60% tasa de calificación
- Enriquecimiento automático 100%

---

### 2. IVY-QUALIFY (Calificación Inteligente)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "lead_qualification",
  "companyId": 4,
  "config": {
    "scoringCriteria": {
      "companySize": {
        "1-10": 20,
        "11-50": 40,
        "51-200": 60,
        "201-1000": 80,
        "1000+": 100
      },
      "industry": {
        "Education": 100,
        "Hospitality": 90,
        "Real Estate": 80,
        "Construction": 70
      },
      "urgency": {
        "emergency": 100,
        "urgent": 75,
        "normal": 50,
        "preventive": 25
      },
      "budget": {
        ">500000": 100,
        "100000-500000": 75,
        "50000-100000": 50,
        "<50000": 25
      }
    },
    "autoAssignment": {
      "VIP": "gerente_ventas_senior",
      "Premium": "gerente_ventas",
      "Standard": "ejecutivo_ventas"
    },
    "qualificationThreshold": 60
  }
}
```

**Segmentos:**
- **VIP:** Score 85-100 (presupuesto >$500K MXN)
- **Premium:** Score 70-84 (presupuesto $100K-$500K)
- **Standard:** Score 60-69 (presupuesto <$100K)

---

### 3. IVY-ENGAGE (Seguimiento Automatizado)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "email_engagement",
  "companyId": 4,
  "config": {
    "sequences": {
      "education": {
        "name": "Secuencia Educativa",
        "emails": [
          {
            "day": 0,
            "subject": "Mantenimiento Profesional para {{institution_name}}",
            "template": "education_intro"
          },
          {
            "day": 3,
            "subject": "Cómo Reducir Costos de Mantenimiento en 40%",
            "template": "education_value"
          },
          {
            "day": 7,
            "subject": "Casos de Éxito: Universidades en Oaxaca",
            "template": "education_case_study"
          },
          {
            "day": 14,
            "subject": "Oferta Especial: Auditoría Gratuita",
            "template": "education_offer"
          }
        ]
      },
      "hospitality": {
        "name": "Secuencia Hotelera",
        "emails": [
          {
            "day": 0,
            "subject": "Mantenimiento Premium para {{hotel_name}}",
            "template": "hospitality_intro"
          },
          {
            "day": 3,
            "subject": "Mejore la Experiencia de sus Huéspedes",
            "template": "hospitality_value"
          },
          {
            "day": 7,
            "subject": "Hoteles 5 Estrellas que Confían en EPM",
            "template": "hospitality_case_study"
          },
          {
            "day": 14,
            "subject": "Mantenimiento Preventivo: Evite Emergencias",
            "template": "hospitality_offer"
          }
        ]
      },
      "real_estate": {
        "name": "Secuencia Residencial",
        "emails": [
          {
            "day": 0,
            "subject": "Mantenimiento Profesional para {{development_name}}",
            "template": "real_estate_intro"
          },
          {
            "day": 3,
            "subject": "Aumente el Valor de su Propiedad",
            "template": "real_estate_value"
          },
          {
            "day": 7,
            "subject": "Desarrollos Residenciales en Oaxaca",
            "template": "real_estate_case_study"
          },
          {
            "day": 14,
            "subject": "Planes de Mantenimiento Anual",
            "template": "real_estate_offer"
          }
        ]
      }
    },
    "sendTime": "09:00",
    "timezone": "America/Mexico_City",
    "unsubscribeLink": true,
    "trackOpens": true,
    "trackClicks": true
  }
}
```

**Templates de Email:**
- 12 templates personalizados por industria
- Variables dinámicas: {{name}}, {{company}}, {{industry}}, {{location}}
- Diseño responsive para móvil

---

### 4. IVY-SCHEDULE (Gestión de Servicios)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "service_scheduling",
  "companyId": 4,
  "config": {
    "technicians": [
      {
        "id": "tech_001",
        "name": "Equipo Eléctrico",
        "specialties": ["electrical", "lighting"],
        "availability": "Mon-Sat 8:00-18:00"
      },
      {
        "id": "tech_002",
        "name": "Equipo Hidráulico",
        "specialties": ["plumbing", "sanitary"],
        "availability": "Mon-Sat 8:00-18:00"
      },
      {
        "id": "tech_003",
        "name": "Equipo Pintura",
        "specialties": ["painting", "renovation"],
        "availability": "Mon-Sat 8:00-18:00"
      },
      {
        "id": "tech_004",
        "name": "Equipo Deportivo",
        "specialties": ["sports_areas", "outdoor"],
        "availability": "Mon-Sat 8:00-18:00"
      },
      {
        "id": "tech_005",
        "name": "Equipo Emergencias",
        "specialties": ["emergency", "all"],
        "availability": "24/7"
      }
    ],
    "serviceTypes": {
      "preventive": {
        "duration_hours": 4,
        "buffer_hours": 1,
        "priority": "normal"
      },
      "corrective": {
        "duration_hours": 3,
        "buffer_hours": 0.5,
        "priority": "high"
      },
      "emergency": {
        "duration_hours": 2,
        "buffer_hours": 0,
        "priority": "critical"
      },
      "renovation": {
        "duration_hours": 8,
        "buffer_hours": 2,
        "priority": "normal"
      }
    },
    "autoReminders": {
      "48h_before": true,
      "24h_before": true,
      "2h_before": true
    },
    "routeOptimization": true,
    "maxDistance_km": 50
  }
}
```

**Horarios:**
- Lunes a Viernes: 8:00 AM - 6:00 PM
- Sábados: 8:00 AM - 2:00 PM
- Emergencias: 24/7

---

### 5. IVY-TICKET (Soporte y Emergencias)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "ticket_management",
  "companyId": 4,
  "config": {
    "channels": ["email", "phone", "whatsapp", "web_form"],
    "priorityRules": {
      "emergency": {
        "keywords": ["emergencia", "urgente", "fuga", "cortocircuito", "incendio"],
        "responseTime_minutes": 30,
        "escalation_minutes": 15
      },
      "urgent": {
        "keywords": ["rápido", "hoy", "importante"],
        "responseTime_hours": 2,
        "escalation_hours": 4
      },
      "normal": {
        "keywords": [],
        "responseTime_hours": 24,
        "escalation_hours": 48
      },
      "preventive": {
        "keywords": ["mantenimiento", "preventivo", "programar"],
        "responseTime_hours": 48,
        "escalation_hours": 96
      }
    },
    "autoAssignment": {
      "electrical": "tech_001",
      "plumbing": "tech_002",
      "painting": "tech_003",
      "sports": "tech_004",
      "emergency": "tech_005"
    },
    "statusTracking": true,
    "clientNotifications": {
      "ticket_created": true,
      "technician_assigned": true,
      "technician_on_way": true,
      "service_completed": true,
      "feedback_request": true
    },
    "sla": {
      "emergency": "30min",
      "urgent": "2h",
      "normal": "24h",
      "preventive": "48h"
    }
  }
}
```

**SLA (Service Level Agreement):**
- **Emergencia:** Respuesta <30 min, Resolución <4 horas
- **Urgente:** Respuesta <2 horas, Resolución <24 horas
- **Normal:** Respuesta <24 horas, Resolución <72 horas
- **Preventivo:** Respuesta <48 horas, Programación flexible

---

### 6. IVY-ANALYTICS (Inteligencia de Negocio)

**Status:** ✅ Activo  
**Configuración:**

```json
{
  "agentType": "business_analytics",
  "companyId": 4,
  "config": {
    "dashboards": {
      "executive": {
        "metrics": [
          "total_leads",
          "qualified_leads",
          "conversion_rate",
          "revenue",
          "pipeline_value",
          "customer_satisfaction"
        ],
        "refreshInterval_minutes": 15
      },
      "sales": {
        "metrics": [
          "leads_by_source",
          "leads_by_industry",
          "conversion_funnel",
          "avg_deal_size",
          "sales_cycle_days",
          "win_rate"
        ],
        "refreshInterval_minutes": 30
      },
      "operations": {
        "metrics": [
          "tickets_by_priority",
          "avg_response_time",
          "sla_compliance",
          "technician_utilization",
          "service_completion_rate",
          "customer_feedback"
        ],
        "refreshInterval_minutes": 5
      }
    },
    "reports": {
      "weekly": {
        "recipients": ["gerente@epmconstrucciones.com"],
        "day": "Monday",
        "time": "09:00",
        "format": "PDF"
      },
      "monthly": {
        "recipients": ["director@epmconstrucciones.com"],
        "day": 1,
        "time": "10:00",
        "format": "PDF+Excel"
      }
    },
    "alerts": {
      "low_conversion": {
        "threshold": 20,
        "notification": "email"
      },
      "high_response_time": {
        "threshold_hours": 6,
        "notification": "sms+email"
      },
      "sla_breach": {
        "threshold": 1,
        "notification": "sms+email+whatsapp"
      }
    },
    "predictions": {
      "demand_forecast": true,
      "revenue_forecast": true,
      "churn_prediction": true
    }
  }
}
```

**Reportes Automáticos:**
- **Semanal:** Lunes 9:00 AM (PDF)
- **Mensual:** Día 1 del mes, 10:00 AM (PDF + Excel)
- **Alertas:** Tiempo real vía email/SMS/WhatsApp

---

## INTEGR ACIONES

### Email
- **Proveedor:** Gmail (epmconstrucciones@gmail.com)
- **SMTP:** Configurado
- **Tracking:** Opens + Clicks habilitado

### WhatsApp Business (Opcional)
- **Número:** +52 1 951 307 9830
- **API:** Pendiente de configuración
- **Uso:** Notificaciones de tickets y recordatorios

### Calendario
- **Proveedor:** Google Calendar
- **Sincronización:** Bidireccional
- **Técnicos:** 5 calendarios sincronizados

### CRM Existente (Si aplica)
- **Status:** No integrado actualmente
- **Opción:** Exportación CSV semanal

---

## CAPACITACIÓN DEL EQUIPO

### Sesión 1: Introducción a Ivy.AI (2 horas)
**Fecha:** Semana 1  
**Participantes:** Todo el equipo  
**Contenido:**
- Qué es Ivy.AI y cómo funciona
- Login y navegación en plataforma
- Dashboard principal
- Configuración de perfil

### Sesión 2: IVY-PROSPECT y Generación de Leads (2 horas)
**Fecha:** Semana 1  
**Participantes:** Equipo de ventas  
**Contenido:**
- Cómo funciona la búsqueda automatizada
- Revisión de leads generados
- Enriquecimiento de contactos
- Exportación de listas

### Sesión 3: IVY-QUALIFY y Seguimiento (2 horas)
**Fecha:** Semana 2  
**Participantes:** Equipo de ventas  
**Contenido:**
- Sistema de scoring de leads
- Secuencias de email automatizadas
- Seguimiento de oportunidades
- Gestión de pipeline

### Sesión 4: IVY-SCHEDULE y Gestión de Servicios (2 horas)
**Fecha:** Semana 2  
**Participantes:** Coordinador de operaciones + técnicos  
**Contenido:**
- Calendario de servicios
- Asignación de técnicos
- Gestión de emergencias
- Optimización de rutas

---

## MÉTRICAS DE ÉXITO

### Semana 1-4 (Mes 1)
- ✅ 150+ leads generados
- ✅ 90+ leads calificados
- ✅ 10+ oportunidades creadas
- ✅ 80% adopción del equipo

### Semana 5-12 (Mes 2-3)
- ✅ 180+ leads generados/mes
- ✅ 108+ leads calificados/mes
- ✅ 30+ oportunidades/mes
- ✅ 25% conversión a ventas

### Semana 13-24 (Mes 4-6)
- ✅ 200 leads generados/mes
- ✅ 120 leads calificados/mes
- ✅ 36 oportunidades/mes
- ✅ 30% conversión a ventas
- ✅ ROI 10,000%+

---

## SOPORTE Y CONTACTO

**Gerente de Cuenta:** [Por asignar]  
**Email Soporte:** support@ivy-ai.com  
**Teléfono:** +52 1 951 XXX XXXX  
**Horario:** Lunes a Viernes 8:00 AM - 8:00 PM  
**Emergencias:** 24/7 vía email

**Documentación:** https://docs.ivy-ai.com  
**Portal de Clientes:** https://ivy-ai.com/portal  
**Status de Servicio:** https://status.ivy-ai.com

---

## PRÓXIMOS PASOS

1. **Hoy:** Firma de contrato y pago
2. **Semana 1:** Kickoff meeting + Capacitación Sesiones 1-2
3. **Semana 2:** Capacitación Sesiones 3-4 + Activación de agentes
4. **Semana 3:** Go-Live y monitoreo diario
5. **Semana 4:** Primera revisión de métricas

---

**Documento preparado por:** Ivy.AI Technical Team  
**Fecha:** 19 de Noviembre, 2025  
**Versión:** 1.0
