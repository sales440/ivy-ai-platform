# Ivy.AI Platform - TODO

## Base de Datos y Modelos
- [x] Definir esquema de agentes (6 tipos: Prospect, Solve, Closer, Logic, Talent, Insight)
- [x] Definir esquema de tareas y ejecuciones
- [x] Definir esquema de workflows
- [x] Definir esquema de KPIs y métricas por agente
- [x] Definir esquema de leads (para Ivy-Prospect)
- [x] Definir esquema de tickets de soporte (para Ivy-Solve)
- [x] Definir esquema de base de conocimiento
- [x] Definir esquema de comunicaciones entre agentes
- [x] Definir esquema de configuraciones de agentes
- [x] Ejecutar migración de base de datos

## Backend - Core (The Hive)
- [x] Implementar clase base IvyAgent
- [x] Implementar enums (AgentStatus, Department, TaskType)
- [x] Implementar HiveOrchestrator (sistema central)
- [x] Implementar registro de agentes
- [x] Implementar ejecución de workflows
- [x] Implementar sistema de comunicación entre agentes
- [x] Implementar métricas de rendimiento del sistema
- [ ] Implementar sistema de aprendizaje automático

## Backend - Agentes Especializados
- [x] Implementar Ivy-Prospect (Ventas - Generación de leads)
- [x] Implementar Ivy-Closer (Ventas - Negociación y cierre)
- [x] Implementar Ivy-Solve (Soporte - Nivel 1 y 2)
- [x] Implementar Ivy-Logic (Operaciones - Cadena de suministro)
- [x] Implementar Ivy-Talent (RRHH - Reclutamiento)
- [x] Implementar Ivy-Insight (Estrategia - Análisis de datos)

## Backend - Funcionalidades de Agentes
- [ ] Ivy-Prospect: Búsqueda de leads en LinkedIn
- [ ] Ivy-Prospect: Calificación de leads
- [ ] Ivy-Prospect: Envío de emails de outreach
- [ ] Ivy-Prospect: Integración con CRM
- [ ] Ivy-Closer: Gestión de reuniones de ventas
- [ ] Ivy-Closer: Análisis de tono y objeciones
- [ ] Ivy-Closer: Generación de contratos preliminares
- [ ] Ivy-Solve: Resolución de tickets
- [ ] Ivy-Solve: Búsqueda en base de conocimiento
- [ ] Ivy-Solve: Sistema de escalación inteligente
- [ ] Ivy-Logic: Predicción de demanda
- [ ] Ivy-Logic: Optimización de inventarios
- [ ] Ivy-Logic: Gestión de órdenes de compra
- [ ] Ivy-Talent: Screening de CVs
- [ ] Ivy-Talent: Primeras entrevistas filtro
- [ ] Ivy-Talent: Evaluación de fit cultural
- [ ] Ivy-Insight: Análisis competitivo
- [ ] Ivy-Insight: Identificación de oportunidades
- [ ] Ivy-Insight: Modelado financiero

## Backend - Workflows Predefinidos
- [ ] Workflow de ventas automatizado (Prospect → Closer)
- [ ] Workflow de soporte multi-nivel
- [ ] Workflow de onboarding de empleados
- [ ] Sistema de creación de workflows personalizados

## API tRPC - Endpoints
- [x] Router de agentes (list, status, execute, create)
- [x] Router de workflows (available, execute, create)
- [x] Router de analytics (KPIs, system metrics, reports)
- [x] Router de leads (create, list, qualify, update)
- [x] Router de tickets (create, list, resolve, escalate)
- [x] Router de base de conocimiento (search, add, update)
- [x] Router de estado del sistema (status, health, config)
- [x] Sistema de comandos (parser y ejecutor)

## Sistema de Comandos
- [ ] Implementar parser de comandos (/agents, /workflow, /kpis, /system)
- [ ] Comando: /agents list
- [ ] Comando: /agent [nombre] status
- [ ] Comando: /agent [nombre] execute [tarea]
- [ ] Comando: /agent create [tipo] [config]
- [ ] Comando: /workflows available
- [ ] Comando: /workflow execute [nombre]
- [ ] Comando: /workflow create [definición]
- [ ] Comando: /kpis [departamento]
- [ ] Comando: /analytics system
- [ ] Comando: /report [tipo] [periodo]
- [ ] Comando: /system status
- [ ] Comando: /system health
- [ ] Comando: /system config

## Frontend - Diseño y Layout
- [x] Definir paleta de colores profesional (tema corporativo)
- [ ] Implementar DashboardLayout con navegación lateral
- [x] Crear header con logo Ivy.AI
- [ ] Crear sidebar con navegación por secciones

## Frontend - Páginas Principales
- [x] Página: Dashboard principal (The Hive)
- [x] Página: Gestión de agentes
- [x] Página: Analytics y KPIs
- [x] Página: Workflows
- [x] Página: Leads (Ivy-Prospect)
- [x] Página: Tickets de soporte (Ivy-Solve)
- [x] Página: Estado del sistema

## Frontend - Componentes
- [x] Componente: Chat/Consola de comandos
- [x] Componente: Tarjeta de agente (estado, KPIs)
- [x] Componente: Lista de agentes activos
- [x] Componente: Visualización de KPIs (gráficos)
- [ ] Componente: Timeline de workflow
- [x] Componente: Tabla de leads)
- [x] Componente: Tabla de tickets
- [ ] Componente: Creador de workflows
- [x] Componente: Monitor de sistema en tiempo real

## Integraciones
- [ ] Integrar LLM para procesamiento de lenguaje natural en comandos
- [ ] Integrar LLM para análisis de leads (Ivy-Prospect)
- [ ] Integrar LLM para resolución de tickets (Ivy-Solve)
- [ ] Integrar LLM para análisis estratégico (Ivy-Insight)
- [ ] Implementar sistema de notificaciones al propietario
- [ ] Implementar almacenamiento de archivos en S3

## Testing y Optimización
- [ ] Probar flujo completo de generación de leads
- [ ] Probar flujo completo de resolución de tickets
- [ ] Probar ejecución de workflows automatizados
- [ ] Probar sistema de comandos
- [ ] Probar comunicación entre agentes
- [ ] Optimizar rendimiento de consultas
- [ ] Verificar manejo de errores

## Documentación
- [ ] Documentar API endpoints
- [ ] Documentar estructura de agentes
- [ ] Documentar workflows disponibles
- [ ] Documentar sistema de comandos
- [ ] Crear guía de usuario
- [ ] Crear ejemplos de uso prácticos

## Deployment y DevOps
- [x] Configurar variables de entorno para Railway
- [x] Crear Dockerfile optimizado para producción
- [x] Configurar railway.json
- [x] Crear scripts de deployment
- [x] Configurar GitHub Actions para CI/CD
- [x] Crear README con instrucciones de deployment
- [ ] Configurar PostgreSQL en Railway
- [ ] Configurar secrets en Railway
- [ ] Testing de deployment en Railway
- [ ] Configurar dominio personalizado (opcional)

## Funcionalidades Específicas de Agentes (Nuevas)
- [ ] Ivy-Prospect: Implementar búsqueda de leads en LinkedIn/web
- [x] Ivy-Prospect: Implementar calificación automática de leads con scoring
- [x] Ivy-Prospect: Implementar generación de emails de outreach personalizados
- [ ] Ivy-Closer: Implementar análisis de sentimiento en conversaciones
- [ ] Ivy-Closer: Implementar generación de propuestas comerciales
- [ ] Ivy-Closer: Implementar manejo de objeciones con respuestas sugeridas
- [x] Ivy-Solve: Implementar búsqueda semántica en knowledge base
- [x] Ivy-Solve: Implementar sistema de escalación automática
- [x] Ivy-Solve: Implementar generación de respuestas desde KB
- [ ] Ivy-Logic: Implementar predicción de demanda con ML
- [ ] Ivy-Logic: Implementar optimización de inventario
- [ ] Ivy-Logic: Implementar generación automática de órdenes de compra
- [ ] Ivy-Talent: Implementar parsing y análisis de CVs
- [ ] Ivy-Talent: Implementar matching de candidatos a posiciones
- [ ] Ivy-Talent: Implementar evaluación de fit cultural
- [ ] Ivy-Insight: Implementar análisis competitivo automatizado
- [ ] Ivy-Insight: Implementar identificación de oportunidades de mercado
- [ ] Ivy-Insight: Implementar generación de reportes ejecutivos

## Workflows Automatizados Predefinidos (Nuevos)
- [x] Workflow: Sales Pipeline (Prospect → Closer)
- [x] Workflow: Support Escalation (Solve L1 → L2 → Human)
- [x] Workflow: Employee Onboarding (Talent → Logic → System)
- [x] Workflow: Market Analysis (Insight → Prospect → Closer)
- [ ] Sistema de creación de workflows custom por usuario

## Preparación para Railway Deployment (Nuevos)
- [x] Verificar todas las variables de entorno necesarias
- [x] Crear script de inicialización de base de datos
- [x] Crear script de seed data para demo
- [x] Optimizar Dockerfile para producción
- [ ] Configurar health checks
- [ ] Configurar logging y monitoreo
- [x] Documentar proceso de deployment paso a paso
- [x] Crear guía de troubleshooting para Railway

## Auditoría de Código (Pre-Deployment)
- [x] Auditar y corregir errores en agents/core.ts (ERROR #1: TaskInput/TaskResult exports)
- [x] Auditar y corregir errores en todos los agentes (Prospect, Solve, Closer, Logic, Talent, Insight)
- [x] Auditar y corregir errores en hive/orchestrator.ts (Actualizado para nuevo schema)
- [x] Auditar y corregir errores en server/routers.ts (Sin errores encontrados)
- [x] Auditar y corregir errores en server/db.ts (Sin errores encontrados)
- [x] Auditar y corregir errores en drizzle/schema.ts (ERROR #2, #3, #4: agentCommunications, tickets category, knowledgeBase fields)
- [x] Auditar y corregir errores en frontend (componentes, páginas) (Sin errores - funcionando correctamente)
- [x] Verificar imports y exports en todos los módulos
- [x] Verificar tipos TypeScript en todo el proyecto
- [x] Ejecutar compilación TypeScript sin errores
- [ ] Ejecutar tests y verificar que pasen
- [x] Verificar que el servidor inicie correctamente

## Mejoras UX (Nuevas)
- [x] Implementar skeleton loaders para dashboard mientras carga datos
- [x] Añadir animaciones de transición suaves en cards de agentes
- [x] Crear componente Toast para mensajes de éxito/error
- [x] Implementar mensaje de éxito después de seed data
- [x] Añadir indicadores de progreso en workflows
- [x] Mostrar estado en tiempo real de ejecución de workflows
- [x] Añadir badges de estado (running, completed, failed) en workflows
- [ ] Implementar auto-refresh de métricas cada 30 segundos

## Funcionalidades Avanzadas (Nuevas)

### Sistema de Notificaciones en Tiempo Real
- [x] Diseñar esquema de notificaciones en base de datos
- [x] Implementar backend para crear y gestionar notificaciones
- [x] Crear componente NotificationBell con badge de contador
- [x] Implementar dropdown de notificaciones con lista
- [x] Añadir marcado de leído/no leído
- [x] Implementar auto-refresh cada 30 segundos
- [ ] Crear notificaciones para eventos importantes (workflow completado, lead calificado, ticket resuelto)

### Página de Perfil de Usuario
- [x] Crear ruta /profile en App.tsx
- [x] Diseñar página de perfil con tabs (Info, Preferences, Security)
- [x] Implementar formulario de edición de información personal
- [x] Añadir preferencias de notificaciones
- [x] Implementar cambio de contraseña (si aplica)
- [x] Añadir avatar/foto de perfil
- [ ] Guardar preferencias en base de datos

### Exportación de Datos a CSV
- [x] Implementar endpoint backend para exportar leads a CSV
- [x] Implementar endpoint backend para exportar tickets a CSV
- [x] Crear función de generación de CSV con headers correctos
- [x] Añadir botón "Export to CSV" en página Leads
- [x] Añadir botón "Export to CSV" en página Tickets
- [x] Implementar descarga automática del archivo
- [ ] Añadir filtros opcionales antes de exportar

## Funcionalidades Finales
### Notificaciones Automáticas para Eventos
- [x] Crear notificación cuando un workflow se completa
- [x] Crear notificación cuando un lead es calificado
- [x] Crear notificación cuando un ticket es resuelto
- [ ] Crear notificación cuando un agente cambia de estado
- [x] Integrar notificaciones en los routers correspondientes

### Filtros Avanzados para Exportación CSV
- [x] Añadir selector de rango de fechas en exportación de leads
- [x] Añadir selector de rango de fechas en exportación de tickets
- [x] Añadir filtro por estado en exportación de leads
- [x] Añadir filtro por estado y prioridad en exportación de tickets
- [x] Actualizar backend para soportar filtros en exportación

### Persistencia de Preferencias de Usuario
- [x] Añadir tabla userPreferences en schema de base de datos
- [x] Crear API backend para guardar/cargar preferencias
- [x] Conectar página de perfil con API de preferencias
- [x] Aplicar preferencias guardadas al cargar la aplicación
- [x] Añadir preferencias de tema (dark/light)
- [x] Añadir preferencias de idioma

### Integración de Código RBAC Externo (Feature #1)
- [ ] Auditar código recibido del programador externo
- [ ] Integrar schema de roles y userRoles en drizzle/schema.ts
- [ ] Ejecutar migraciones de base de datos (pnpm db:push)
- [ ] Integrar funciones de base de datos en server/db.ts
- [ ] Crear archivo shared/permissions.ts con constantes de permisos
- [ ] Integrar routers tRPC en server/routers.ts
- [ ] Añadir import de TRPCError faltante
- [ ] Crear interfaz frontend para gestión de roles (página /roles)
- [ ] Crear componente de asignación de roles a usuarios
- [ ] Testing completo del sistema RBAC
- [ ] Corregir errores encontrados durante testing
- [ ] Documentar sistema RBAC en README

### Configuración de Entorno de Pruebas
- [ ] Verificar ejecución de migraciones en Railway
- [x] Confirmar estructura de base de datos en producción
- [ ] Crear plan de pruebas completo con casos de prueba
- [ ] Configurar scripts de testing automatizado con Vitest
- [ ] Cargar datos de demostración en producción (26 leads, 22 tickets, 6 agentes)
- [ ] Ejecutar pruebas de funcionalidad de leads
- [ ] Ejecutar pruebas de funcionalidad de tickets
- [ ] Ejecutar pruebas de sistema de notificaciones
- [ ] Ejecutar pruebas de exportación CSV con filtros
- [ ] Ejecutar pruebas de preferencias de usuario
- [ ] Validar autenticación OAuth en producción
- [ ] Documentar resultados de pruebas y crear reporte de QA

## Bug Fixes
- [x] Implementar comando help en consola de comandos
- [x] Agregar lista de comandos disponibles cuando se ejecuta help
- [x] Permitir comandos sin barra diagonal (help funciona igual que /help)
- [x] Agregar comando /clear para limpiar consola

## Documentación de Ventas
- [x] Crear guía completa de ventas (pitch, casos de uso, ROI)
- [x] Crear script de demostración para clientes
- [x] Crear propuesta comercial template
- [x] Crear one-pager de marketing

## Gestión de Clientes - Enfoque Pragmático
### Fase 1: Selector Simple
- [x] Crear contexto React para empresa seleccionada
- [x] Agregar selector de empresa en header del dashboard
- [x] Implementar filtrado de datos por empresa (en memoria)
- [x] Agregar empresas demo hardcodeadas

### Fase 2: Página de Administración
- [ ] Crear tabla `companies` en schema (sin afectar otras tablas)
- [ ] Crear funciones CRUD en db.ts para companies
- [ ] Crear página /admin/companies con lista de empresas
- [ ] Implementar formulario de creación de empresa
- [ ] Implementar edición y eliminación de empresas
- [ ] Agregar ruta protegida solo para admin

### Fase 3: Integración Completa (Futuro)
- [ ] Agregar companyId a todas las tablas relevantes
- [ ] Implementar aislamiento real de datos por empresa
- [ ] Sistema de permisos y middleware de verificación

## Admin Companies Page - CRUD Implementation
- [x] Add companies table to database schema
- [x] Run db:push to apply schema changes
- [x] Create tRPC router for companies CRUD operations
- [x] Create /admin/companies page with company list table
- [x] Implement create company dialog with form validation
- [x] Implement edit company functionality
- [x] Implement delete company with confirmation
- [x] Add admin-only route protection
- [x] Update CompanyContext to fetch from database instead of hardcoded list
- [ ] Test all CRUD operations

## Paso 1: Conectar Selector de Empresa al Filtrado de Datos
- [ ] Agregar companyId a tabla leads en schema
- [ ] Agregar companyId a tabla tickets en schema
- [ ] Agregar companyId a tabla agents en schema
- [ ] Ejecutar migraciones de base de datos
- [ ] Actualizar seed-router para asignar companyId a datos demo
- [ ] Actualizar queries de leads para filtrar por companyId
- [ ] Actualizar queries de tickets para filtrar por companyId
- [ ] Actualizar queries de agents para filtrar por companyId
- [ ] Conectar CompanyContext con queries de datos

## Paso 2: Agregar Navegación a Admin
- [ ] Agregar link "Gestión de Empresas" en sidebar del DashboardLayout
- [ ] Crear sección "Admin" en navegación
- [ ] Agregar icono Building2 al link
- [ ] Proteger ruta solo para usuarios admin

## Paso 3: Asignación Usuario-Empresa
- [ ] Agregar companyId a tabla users en schema
- [ ] Crear función assignUserToCompany en db.ts
- [ ] Crear endpoint tRPC para asignar usuarios a empresas
- [ ] Agregar selector de empresa en página de perfil de usuario
- [ ] Implementar middleware para verificar acceso por empresa
- [ ] Actualizar CompanyContext para cargar empresa del usuario actual

## Sistema Multi-Tenant Avanzado

### Asignación Usuario-Empresa
- [x] Crear tabla user_companies en schema para relación many-to-many
- [x] Añadir función getUserCompanies() en db.ts
- [x] Añadir función assignUserToCompany() en db.ts
- [x] Crear router tRPC para gestión de asignaciones
- [x] Actualizar CompanySelector para mostrar solo empresas asignadas al usuario
- [ ] Implementar página de administración de asignaciones en /admin/user-companies
- [x] Añadir restricción: usuarios solo ven empresas asignadas (excepto admins)

### Agentes Personalizados por Empresa
- [x] Añadir columna companyId a tabla agents en schema
- [x] Actualizar función getAllAgents() para filtrar por companyId
- [ ] Crear función createCompanyAgent() en db.ts
- [x] Actualizar router de agentes para soportar filtrado por empresa
- [x] Modificar Dashboard para mostrar solo agentes de empresa seleccionada
- [ ] Implementar página de configuración de agentes por empresa
- [ ] Permitir personalización de parámetros de agentes por empresa

### Dashboard y Métricas por Empresa
- [x] Crear función getCompanyMetrics() en db.ts
- [x] Implementar cálculo de KPIs específicos por empresa
- [x] Actualizar página Analytics para filtrar por empresa seleccionada
- [ ] Añadir gráficos de tendencias por empresa
- [x] Implementar comparación de métricas entre empresas (solo admins)
- [x] Crear widget de resumen ejecutivo por empresa en Dashboard
- [ ] Añadir exportación de reportes por empresa

## Funcionalidades Avanzadas Multi-Tenant

### Página de Administración de Asignaciones Usuario-Empresa
- [x] Crear página /admin/user-companies con tabla de asignaciones
- [x] Implementar formulario para asignar usuarios a empresas
- [x] Agregar selector de rol (viewer/member/admin) por asignación
- [x] Implementar edición de rol de usuario en empresa
- [x] Implementar eliminación de asignación usuario-empresa
- [x] Agregar filtros por empresa y por usuario
- [x] Mostrar lista de usuarios asignados a cada empresa
- [x] Proteger ruta solo para admins

### Configuración de Agentes por Empresa
- [x] Crear página /admin/agent-config para configuración de agentes
- [x] Implementar formulario de personalización de parámetros de agentes
- [x] Agregar campos: temperatura, max_tokens, system_prompt personalizado
- [x] Crear tabla agent_configurations en schema
- [x] Implementar funciones CRUD para configuraciones de agentes
- [x] Crear router tRPC para agent configurations
- [x] Permitir que cada empresa tenga configuraciones únicas por agente
- [x] Agregar preview de configuración antes de guardar

### Reportes Comparativos entre Empresas
- [x] Crear página /admin/company-reports con gráficos comparativos
- [x] Implementar gráfico de barras comparando leads por empresa
- [x] Implementar gráfico de barras comparando tickets por empresa
- [x] Implementar gráfico de líneas con tendencias de conversión
- [x] Agregar tabla comparativa de KPIs entre empresas
- [ ] Implementar filtros por rango de fechas
- [x] Agregar exportación de reportes a PDF
- [x] Proteger ruta solo para admins
- [x] Agregar gráfico de distribución de agentes por empresa

## Mejoras Finales Multi-Tenant

### Filtros de Fecha en Reportes
- [x] Agregar selectores de fecha inicio/fin en CompanyReports
- [x] Actualizar función getCompanyMetrics para aceptar rango de fechas
- [x] Filtrar leads por createdAt dentro del rango
- [x] Filtrar tickets por createdAt dentro del rango
- [x] Agregar botón "Aplicar Filtros" y "Limpiar Filtros"
- [x] Mostrar rango de fechas activo en el título de la página

### Notificaciones de Asignaciones
- [x] Crear función notifyUserAssignment en notification-helper
- [x] Enviar notificación cuando usuario es asignado a empresa
- [x] Enviar notificación cuando usuario es removido de empresa
- [x] Enviar notificación cuando rol de usuario cambia
- [x] Incluir detalles de empresa y rol en notificación
- [x] Agregar link directo a la empresa en notificación

### Templates de Configuración de Agentes
- [x] Crear constantes de presets (conservador/balanceado/creativo)
- [x] Agregar selector de template en diálogo de configuración
- [x] Implementar aplicación de preset al seleccionar template
- [x] Mostrar descripción de cada preset
- [x] Permitir personalización después de aplicar preset
- [ ] Agregar botón "Restaurar Defaults" en configuración

## Funcionalidades Avanzadas de Administración

### Auditoría de Cambios
- [x] Crear tabla audit_logs en schema (userId, action, entityType, entityId, changes, timestamp)
- [x] Crear función createAuditLog en db.ts
- [x] Agregar audit logging en assignUserToCompany
- [x] Agregar audit logging en removeUserFromCompany
- [x] Agregar audit logging en updateUserCompanyRole
- [ ] Agregar audit logging en upsertAgentConfig
- [x] Crear página /admin/audit-log con tabla de auditoría
- [x] Implementar filtros por usuario, acción, entidad, fecha
- [x] Agregar exportación de logs a CSV

### Exportación de Configuraciones de Agentes
- [x] Crear endpoint exportConfigurations en agent-config-router
- [x] Implementar generación de JSON con todas las configuraciones
- [x] Crear endpoint importConfigurations en agent-config-router
- [x] Implementar validación de JSON importado
- [x] Agregar botón "Exportar Configuraciones" en AgentConfig
- [x] Agregar botón "Importar Configuraciones" con file upload
- [x] Implementar preview de configuraciones antes de importar
- [x] Agregar opción de sobrescribir o fusionar configuraciones

### Dashboard Ejecutivo Personalizable
- [ ] Crear tabla dashboard_widgets en schema
- [ ] Implementar widgets predefinidos (leads, tickets, agents, revenue)
- [ ] Crear componente WidgetSelector para agregar widgets
- [ ] Implementar drag-and-drop para reordenar widgets
- [ ] Agregar botón "Personalizar Dashboard" en Dashboard
- [ ] Guardar configuración de widgets por empresa
- [ ] Implementar modo edición vs modo vista
- [ ] Agregar opción de resetear a layout default

## Funcionalidades Empresariales Avanzadas

### Dashboard Personalizable por Empresa
- [x] Crear tabla dashboard_widgets en schema (companyId, widgetType, position, config)
- [ ] Definir tipos de widgets predefinidos (leads_summary, tickets_summary, conversion_chart, revenue_chart)
- [ ] Crear componente Widget base con props genéricas
- [ ] Implementar LeadsSummaryWidget
- [ ] Implementar TicketsSummaryWidget
- [ ] Implementar ConversionChartWidget
- [ ] Implementar RevenueChartWidget
- [ ] Instalar y configurar react-grid-layout para drag-and-drop
- [ ] Crear componente DashboardEditor con modo edición
- [ ] Agregar botón "Personalizar Dashboard" en Dashboard
- [ ] Implementar guardado de layout en base de datos
- [ ] Agregar botón "Restaurar Layout Default"

### Roles Granulares por Empresa
- [x] Extender enum de roles en schema: admin, manager, analyst, viewer
- [x] Crear tabla company_permissions (roleId, resource, action)
- [x] Definir matriz de permisos por rol (CRUD en leads, tickets, agents, config)
- [x] Actualizar userCompanies.role para soportar nuevos roles
- [x] Crear middleware checkCompanyPermission en tRPC
- [ ] Proteger endpoints de leads con permisos granulares
- [ ] Proteger endpoints de tickets con permisos granulares
- [ ] Proteger endpoints de agentConfig con permisos granulares
- [ ] Actualizar UI para mostrar/ocultar acciones según permisos
- [ ] Crear página /admin/roles para gestionar permisos

### Integraciones con CRM Externos
- [x] Crear tabla crm_integrations (companyId, crmType, credentials, config)
- [x] Implementar conector base CRMConnector con métodos syncLeads, syncTickets
- [ ] Implementar SalesforceConnector con OAuth2
- [x] Implementar HubSpotConnector con API key
- [ ] Implementar PipedriveConnector con API token
- [x] Crear router tRPC para gestión de integraciones
- [x] Crear página /admin/integrations para configurar CRMs
- [ ] Implementar webhook receiver para sincronización bidireccional
- [ ] Agregar job scheduler para sincronización periódica
- [ ] Implementar mapeo de campos customizable por empresa
- [ ] Agregar logs de sincronización y manejo de errores


## 🎉 Resumen de Funcionalidades Completadas

### Sistema Multi-Tenant ✅
- Gestión completa de empresas con selector en header
- Asignación usuario-empresa con 5 roles (viewer/analyst/member/manager/admin)
- Filtrado automático de datos por empresa seleccionada
- Página de administración de empresas (/admin/companies)
- Página de asignaciones usuario-empresa (/admin/user-companies)

### Configuración y Personalización ✅
- Configuración de agentes por empresa (/admin/agent-config)
- Templates de configuración (Conservative/Balanced/Creative)
- Exportación/importación de configuraciones entre empresas
- Notificaciones automáticas de asignaciones

### Reportes y Analíticas ✅
- Reportes comparativos entre empresas (/admin/company-reports)
- Filtros de fecha para análisis temporal
- Widget de métricas ejecutivas por empresa en Dashboard
- Exportación de reportes a CSV

### Auditoría y Seguridad ✅
- Log de auditoría completo (/admin/audit-log)
- Sistema de permisos granulares con matriz CRUD
- Middleware requirePermission para proteger endpoints
- Guía de implementación de permisos (PERMISSIONS_GUIDE.md)

### Integraciones CRM ✅
- Infraestructura de conectores CRM (base + HubSpot)
- Router tRPC para gestión de integraciones
- Funciones DB para sync/test/upsert
- Página de configuración (/admin/integrations)

### Infraestructura Técnica ✅
- 15+ tablas en base de datos
- 10+ routers tRPC
- 100+ funciones de base de datos
- Sistema de roles y permisos completo
- Notificaciones al propietario
- Exportación de datos

---

## 📋 Tareas Pendientes para Producción

### Alta Prioridad
1. Aplicar middleware requirePermission a todos los endpoints
2. Completar conectores Salesforce y Pipedrive
3. Implementar webhook receiver para CRM
4. Crear widgets drag-and-drop para dashboard personalizable
5. Implementar funcionalidades específicas de agentes (ver líneas 34-56)

### Media Prioridad
6. Sistema de aprendizaje automático para agentes
7. Job scheduler para sincronización periódica CRM
8. Página /admin/roles para gestión visual de permisos
9. Gráficos de tendencias en Analytics
10. Filtros avanzados en todas las páginas

### Baja Prioridad
11. Tests unitarios y de integración
12. Documentación de API
13. Optimización de queries
14. Cache de datos frecuentes
15. Monitoreo y alertas


## 📚 Guías de Implementación

### Archivos de Referencia
1. **PERMISSIONS_GUIDE.md** - Guía del sistema de permisos con ejemplos de uso
2. **IMPLEMENTATION_EXAMPLE.md** - Ejemplos antes/después de aplicar permisos a endpoints

### Pasos para Aplicar Permisos
1. Actualizar input schemas para requerir `companyId`
2. Agregar `.use(requirePermission("resource", "action"))` a cada endpoint
3. Actualizar llamadas del frontend para pasar `companyId` desde `useCompany`
4. Probar con diferentes roles (viewer/analyst/member/manager/admin)

### Estado Actual del Sistema
- ✅ Matriz de permisos completa (5 roles × 6 recursos)
- ✅ Middleware `requirePermission` implementado
- ✅ Función `getUserCompanyRole` en db.ts
- ⏳ Pendiente: Aplicar middleware a endpoints existentes
- ⏳ Pendiente: Actualizar frontend para pasar companyId

---

## 🚀 Próximos Pasos Recomendados

### Implementación Inmediata
1. **Aplicar permisos a endpoints críticos** (leads.create, tickets.update, agentConfig.upsert)
2. **Ejecutar seed de datos** usando el botón "Seed Demo Data" en Dashboard
3. **Probar flujo multi-tenant** cambiando entre empresas y verificando filtrado

### Desarrollo Futuro
4. **Completar conectores CRM** (Salesforce OAuth2, Pipedrive API)
5. **Implementar funcionalidades de agentes** (Prospect: LinkedIn search, Solve: ticket resolution)
6. **Dashboard personalizable** con widgets drag-and-drop usando react-grid-layout


## Tareas Actuales en Progreso

### Paso 1: Poblar Datos Demo
- [x] Verificar que seed funciona correctamente
- [x] Probar botón "Seed Demo Data" en Dashboard
- [x] Verificar que leads/tickets se asignan a empresa correcta

### Paso 2: Refactorizar Endpoints con Permisos
- [x] Aplicar requirePermission a leads.create
- [ ] Aplicar requirePermission a leads.delete
- [x] Aplicar requirePermission a tickets.create
- [x] Aplicar requirePermission a tickets.update (resolve)
- [ ] Aplicar requirePermission a agentConfig.upsert
- [ ] Actualizar frontend para pasar companyId en todas las llamadas

### Paso 3: Implementar Ivy-Solve (Resolución Automática)
- [x] Crear función searchKnowledgeBase en db.ts
- [x] Crear endpoint tickets.autoResolve en router
- [x] Implementar lógica: buscar KB → generar respuesta con LLM → actualizar ticket
- [ ] Agregar botón "Auto-Resolve" en UI de tickets
- [ ] Probar con tickets de ejemplo


## Tareas Finales de Implementación

### Paso 4: UI de Auto-Resolución
- [x] Agregar botón "Auto-Resolve" en página de Tickets
- [x] Crear diálogo de confirmación antes de auto-resolver
- [x] Mostrar resolución generada en diálogo de resultado
- [x] Agregar indicador de loading durante generación
- [x] Mostrar artículos de KB utilizados

### Paso 5: Integrar CompanyContext en Formularios
- [x] Actualizar formulario de creación de leads para incluir companyId
- [x] Actualizar formulario de creación de tickets para incluir companyId
- [x] Obtener companyId automáticamente del CompanyContext
- [x] Validar que companyId esté presente antes de enviar

### Paso 6: Implementar Ivy-Prospect
- [ ] Crear endpoint agents.prospectSearch en router
- [ ] Implementar búsqueda simulada de prospectos (LinkedIn-style)
- [ ] Agregar función enrichLead en db.ts
- [ ] Crear página /prospect-search para interfaz de búsqueda
- [ ] Agregar botón "Enrich Lead" en página de Leads
- [ ] Mostrar datos enriquecidos (company, title, industry, location)


## Fase 2: Implementación de Ivy-Prospect y Permisos (Completada)
- [x] Verificar seed data (5 leads, 5 tickets, 5 KB articles asociados a Demo Company)
- [x] Probar funcionalidad Auto-Resolve en página de Tickets
- [x] Implementar Ivy-Prospect: Endpoint prospect.search con datos mock de LinkedIn
- [x] Implementar Ivy-Prospect: Endpoint prospect.enrich para enriquecimiento de leads
- [x] Crear interfaz de búsqueda de prospectos en página Leads
- [x] Añadir diálogo con filtros (query, industry, location, companySize)
- [x] Mostrar resultados con información enriquecida (nombre, empresa, título, score, ubicación)
- [x] Implementar botones "Add as Lead" y "View LinkedIn"
- [x] Aplicar requirePermission("leads", "delete") a endpoint leads.delete
- [x] Aplicar requirePermission("tickets", "update") a endpoint tickets.update
- [x] Aplicar requirePermission("config", "update") a endpoint agentConfig.upsert
- [x] Crear endpoint leads.delete con validación de companyId
- [x] Crear endpoint tickets.update con validación de companyId y campos opcionales


## Fase 3: Implementar funciones faltantes en db.ts
- [ ] Implementar getAllUsers() para obtener todos los usuarios
- [ ] Implementar updateUserCompanyRole() para actualizar rol de usuario en empresa
- [ ] Implementar getCompanyById() para obtener empresa por ID
- [ ] Implementar createAuditLog() para crear registros de auditoría
- [ ] Verificar que todos los errores de TypeScript se resuelvan

## Fase 4: Conectar Ivy-Prospect con API real
- [x] Investigar APIs de enriquecimiento disponibles (Apollo.io, Hunter.io, Clearbit)
- [x] Elegir API más adecuada según funcionalidades y pricing (LinkedIn API de Manus API Hub)
- [x] Configurar secrets para API key del servicio elegido (ya configurado en Manus API Hub)
- [x] Implementar integración real en prospect.search con LinkedIn/search_people
- [x] Crear prospect-router.ts modular con fallback a datos mock
- [x] Probar búsquedas reales y validar datos retornados (208,408 resultados para "CTO")

## Fase 5: Página de gestión de permisos
- [x] Verificar esquema de permisos existente (ya existe en _core/permissions.ts)
- [x] Endpoints backend ya existen (userCompanies.getUsers, userCompanies.updateRole)
- [x] Crear página /admin/permissions en frontend con componentes shadcn/ui
- [x] Implementar selector de empresa para gestionar permisos
- [x] Implementar tabla de usuarios con roles actuales y selector de cambio de rol
- [x] Implementar matriz de permisos visual (Create/Read/Update/Delete por recurso)
- [x] Agregar descripciones de roles con colores distintivos
- [x] Validación de permisos (solo admins pueden acceder a /admin/permissions)
- [x] Probar visualización de matriz de permisos (viewer, analyst, member, manager, admin)
- [x] Agregar ruta /admin/permissions en App.tsx
- [x] Agregar enlace "Gestión de Permisos" en DashboardLayout sidebar


## Fase 6: Conectar "Add as Lead" de Ivy-Prospect
- [x] Verificar endpoint leads.create existente (ya existe con todos los campos necesarios)
- [x] Modificar prospect.search en Leads.tsx para usar leads.create mutation (ya estaba implementado)
- [x] Mapear campos de prospecto a campos de lead (nombre, email, empresa, título, etc.)
- [x] Agregar validación de duplicados por email (evitar agregar el mismo lead dos veces)
- [x] Mostrar toast de éxito/error al agregar lead con mensajes descriptivos
- [x] Actualizar tabla de leads automáticamente después de agregar (refetch)
- [x] Probar flujo completo: buscar → agregar → verificar en tabla (requiere selección de empresa)

## Fase 7: Filtros avanzados en Ivy-Prospect
- [x] Agregar filtro de tamaño de empresa con Select (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
- [x] Agregar filtro de nivel de senioridad con Select (Entry, Mid, Senior, Executive, C-Level)
- [x] Actualizar UI del diálogo Ivy-Prospect con nuevos filtros en grid layout
- [x] Modificar prospect.search mutation para incluir nuevos parámetros (companySize, seniority)
- [x] Actualizar prospect-router.ts para pasar filtros a LinkedIn API (keywords)
- [x] Probar búsquedas con diferentes combinaciones de filtros (CTO + C-Level + 1000+)
- [x] Validar que los resultados se filtren correctamente (2,904 resultados refinados)

## Fase 8: Auditoría de cambios de permisos
- [x] Verificar tabla auditLogs en schema.ts y campos necesarios (ya existe con todos los campos)
- [x] Modificar userCompanies.updateRole para registrar oldRole y newRole en audit log
- [x] Crear endpoint userCompanies.getPermissionChanges para listar cambios de roles
- [x] Agregar sección "Recent Changes" en página de Permissions
- [x] Mostrar tabla con: usuario, rol anterior, rol nuevo, modificado por, fecha
- [x] Implementar componente RecentChanges con query a getPermissionChanges
- [ ] Probar flujo: cambiar rol → verificar registro en audit trail (requiere datos de prueba)

## Fase 9: Enriquecimiento automático de leads
- [x] Investigar LinkedIn API endpoint get_user_profile_by_username para perfil completo
- [x] Crear endpoint prospect.enrich en prospect-router.ts con LinkedIn API
- [x] Modificar handleAddProspectAsLead para llamar a prospect.enrich antes de leads.create
- [x] Extraer skills (top 10), educación, experiencia, languages, badges del perfil
- [x] Guardar datos enriquecidos en metadata del lead (JSON)
- [x] Mostrar indicador de "Enriching profile from LinkedIn..." durante el proceso
- [x] Implementar fallback si enrichment falla (crear lead con datos básicos)
- [ ] Probar enriquecimiento con diferentes prospectos (requiere datos reales)

## Fase 10: Exportación de audit logs
- [x] Crear endpoint userCompanies.exportPermissionChanges para generar CSV
- [x] Agregar botón "Export to CSV" en sección Recent Changes
- [x] Implementar generación de CSV con columnas: User, Old Role, New Role, Modified By, Date, Company
- [x] Implementar descarga automática del archivo CSV con blob
- [ ] Agregar filtros de fecha (date range picker) en Recent Changes (opcional)
- [ ] Probar exportación con diferentes rangos de fechas (requiere datos de audit log)

## Fase 11: Dashboard de métricas de Ivy-Prospect
- [x] Crear tabla prospectSearches en schema.ts para registrar búsquedas
- [x] Agregar función createProspectSearch en db.ts
- [x] Agregar función getProspectSearchMetrics en db.ts
- [x] Modificar prospect.search para guardar query, filters, resultCount, userId, timestamp
- [x] Crear analytics router con endpoint prospectMetrics
- [x] Crear página /analytics/prospect-metrics con layout responsive
- [x] Agregar cards con métricas clave (total searches, avg results, conversion rate, active days)
- [x] Agregar gráfico de búsquedas por día usando recharts (LineChart)
- [x] Agregar top 10 queries más usadas con bar chart horizontal
- [x] Agregar distribución por industria y senioridad con pie charts
- [x] Agregar ruta en App.tsx y enlace "Prospect Metrics" en sidebar
- [ ] Probar dashboard con datos de búsquedas reales (requiere ejecutar búsquedas)

## Fase 12: Visualización de datos enriquecidos
- [x] Agregar columna "Enriched" en tabla de Leads con badge (Yes/No)
- [x] Crear modal/dialog para mostrar datos enriquecidos completos
- [x] Crear componente EnrichedDataView con tabs para organizar datos
- [x] Mostrar sección de Skills con endorsements en modal
- [x] Mostrar sección de Experience con timeline y descripciones
- [x] Mostrar sección de Education con instituciones y grados
- [x] Mostrar sección Other con Languages y LinkedIn badges
- [x] Badge "View" clickable en columna Enriched abre modal
- [ ] Probar visualización con leads enriquecidos (requiere datos reales)

## Fase 13: Búsqueda por skills técnicos
- [x] Crear lista de 18 skills técnicos comunes (React, Python, AWS, SQL, Docker, Kubernetes, Node.js, TypeScript, Java, C++, Go, Rust, ML, Data Science, DevOps, Agile, Scrum, JavaScript)
- [x] Agregar campo multi-select de skills en filtros de Ivy-Prospect con badges clickables
- [x] Actualizar prospect.search input schema para incluir skills array opcional
- [x] Modificar prospect-router.ts para incluir skills en keywords de LinkedIn API (join con espacios)
- [x] Actualizar estado prospectSkills y handlers en Leads.tsx para manejar skills seleccionados
- [ ] Probar búsquedas con diferentes combinaciones de skills (requiere ejecución)

## Fase 14: Tracking de conversión prospect→lead
- [x] Agregar campo prospectSearchId (nullable) en tabla leads de schema.ts
- [x] Modificar prospect.search para retornar searchId único
- [x] Actualizar handleAddProspectAsLead para guardar prospectSearchId al crear lead
- [x] Guardar currentSearchId en estado cuando search succeeds
- [x] Modificar analytics.prospectMetrics para calcular conversion rate real
- [x] Agregar métrica "Top Converting Queries" en dashboard con bar chart
- [x] Agregar función getLeadsByProspectSearchIds en db.ts
- [x] Mostrar leads from searches y conversion rate en KPI cards
- [ ] Probar flujo completo: buscar → agregar lead → verificar tracking (requiere datos reales)

## Fase 15: Sistema de guardado de búsquedas
- [x] Crear tabla savedSearches en schema.ts (id, userId, companyId, name, filters JSON, usageCount, createdAt, updatedAt)
- [x] Ejecutar SQL para crear tabla savedSearches
- [x] Agregar savedSearches a imports en db.ts
- [x] Crear funciones en db.ts (createSavedSearch, getSavedSearches, updateSavedSearchUsage, deleteSavedSearch)
- [x] Crear saved-searches-router.ts con endpoints create/list/execute/delete
- [x] Registrar savedSearchesRouter en routers.ts
- [x] Agregar estados showSaveSearchDialog y savedSearchName en Leads.tsx
- [x] Crear createSavedSearch mutation y handleSaveSearch handler
- [x] Agregar botón "💾 Save Search" junto a "Search Prospects" en diálogo Ivy-Prospect
- [x] Crear Dialog para nombrar búsqueda guardada con input y botón Save
- [x] Crear sección "Saved Searches" arriba de tabla de Leads con query savedSearches.list
- [x] Mostrar cards con nombre + filtros aplicados + usageCount + fecha
- [x] Implementar botón "Execute" que pre-llena filtros y abre diálogo Ivy-Prospect
- [x] Agregar botón de eliminar (🗑️) en cada card con confirmación
- [x] Incrementar usageCount al ejecutar búsqueda guardada (mutation execute)
- [x] Crear componente SavedSearchesSection con grid de cards
- [x] Implementar handleExecuteSavedSearch para pre-llenar filtros
- [x] Agregar imports de Bookmark y Play icons
- [ ] Probar flujo completo: guardar → ejecutar → eliminar búsquedas

## Fase 16: Date range picker en analytics
- [ ] Instalar date picker library (react-day-picker o shadcn calendar)
- [ ] Agregar estado de dateRange en ProspectMetrics.tsx
- [ ] Crear selector con opciones predefinidas (Last 7/30/90 days, Custom)
- [ ] Pasar startDate/endDate a analytics.prospectMetrics query
- [ ] Actualizar getProspectSearchMetrics en db.ts para filtrar por fechas
- [ ] Agregar comparación vs período anterior en KPIs (% change)
- [ ] Probar filtrado por diferentes rangos de fechas

## Fase 17: Notificaciones de leads de alta calidad
- [ ] Modificar leads.create endpoint para detectar qualificationScore > 80
- [ ] Llamar a notifyOwner cuando se crea lead de alta calidad
- [ ] Incluir en notificación: nombre, empresa, título, score, source
- [ ] Agregar link directo a página de Leads en notificación
- [ ] Probar creando lead con score alto desde Ivy-Prospect
- [ ] Verificar que notificación llega al owner

## Fase 18: Ivy-Call - Agente de llamadas automáticas con Bland.ai
### Backend - Database Schema
- [ ] Crear tabla calls en schema.ts (id, leadId, companyId, userId, phoneNumber, status, duration, startedAt, endedAt, transcript, recording_url, sentiment, outcome, notes, metadata, createdAt, updatedAt)
- [ ] Agregar campo lastCallId a tabla leads para tracking
- [ ] Agregar campo callCount a tabla leads
- [ ] Ejecutar migraciones de base de datos

### Backend - Bland.ai Integration
- [ ] Crear archivo server/_core/blandai.ts para integración con API
- [ ] Implementar función initiateBlandCall(phoneNumber, prompt, options)
- [ ] Implementar función getBlandCallStatus(callId)
- [ ] Implementar función getBlandCallTranscript(callId)
- [ ] Implementar función analyzeBlandCallRecording(callId)
- [ ] Configurar webhook endpoint para recibir eventos de Bland.ai
- [ ] Agregar BLAND_AI_API_KEY a secrets

### Backend - Ivy-Call Agent
- [ ] Crear archivo agents/ivy-call.ts extendiendo IvyAgent
- [ ] Implementar método initiateCall(leadId, scriptTemplate)
- [ ] Implementar método getCallHistory(leadId)
- [ ] Implementar método analyzeCallOutcome(callId) usando LLM
- [ ] Implementar método scheduleFollowUp(callId, outcome)
- [ ] Crear templates de scripts por objetivo (discovery, demo, follow-up, closing)

### Backend - Database Functions
- [ ] Crear función createCall en db.ts
- [ ] Crear función getCallById en db.ts
- [ ] Crear función getCallsByLeadId en db.ts
- [ ] Crear función getCallsByCompanyId en db.ts
- [ ] Crear función updateCallStatus en db.ts
- [ ] Crear función updateCallTranscript en db.ts
- [ ] Crear función getCallAnalytics en db.ts (success rate, avg duration, outcomes)

### Backend - tRPC Router
- [ ] Crear server/routers/calls-router.ts
- [ ] Endpoint: calls.initiate (leadId, scriptTemplate) con requirePermission("calls", "create")
- [ ] Endpoint: calls.list (companyId, filters) con requirePermission("calls", "read")
- [ ] Endpoint: calls.byLead (leadId) para historial de llamadas
- [ ] Endpoint: calls.getTranscript (callId)
- [ ] Endpoint: calls.analyze (callId) para análisis con LLM
- [ ] Endpoint: calls.analytics (companyId, dateRange) para métricas
- [ ] Registrar callsRouter en routers.ts

### Frontend - Call UI in Leads Page
- [ ] Agregar botón "📞 Call Lead" en cada fila de la tabla de Leads
- [ ] Crear diálogo CallLeadDialog con selector de script template
- [ ] Mostrar preview del script con variables ({{name}}, {{company}})
- [ ] Implementar mutation calls.initiate con loading state
- [ ] Agregar columna "Last Call" en tabla de Leads mostrando fecha/outcome
- [ ] Crear diálogo CallHistoryDialog para ver historial de llamadas de un lead
- [ ] Mostrar lista de llamadas con fecha, duración, outcome, botón "View Transcript"
- [ ] Crear diálogo CallTranscriptDialog para ver transcripción completa

### Frontend - Call Analytics Dashboard
- [ ] Crear página client/src/pages/CallAnalytics.tsx
- [ ] Agregar ruta /call-analytics en App.tsx
- [ ] Agregar "Call Analytics" al sidebar navigation
- [ ] Implementar KPI cards (Total Calls, Success Rate, Avg Duration, Conversion Rate)
- [ ] Crear gráfico de línea: Calls over time
- [ ] Crear gráfico de barras: Outcomes distribution (connected, voicemail, no-answer, busy)
- [ ] Crear gráfico de pie: Sentiment analysis (positive, neutral, negative)
- [ ] Mostrar tabla de Recent Calls con filtros
- [ ] Agregar selector de date range para filtrar analytics

### Backend - Call Automation Features
- [ ] Implementar función scheduleCall(leadId, scheduledTime) para llamadas programadas
- [ ] Implementar función bulkInitiateCalls(leadIds[], scriptTemplate) para llamadas masivas
- [ ] Crear función autoFollowUp que crea ticket/tarea según outcome de llamada
- [ ] Implementar actualización automática de lead status según call outcome
- [ ] Crear notificación al owner cuando call tiene outcome positivo (interested, meeting_scheduled)

### Frontend - Advanced Call Features
- [ ] Crear página /admin/call-scripts para gestionar templates de scripts
- [ ] Implementar CRUD de call scripts con editor de texto
- [ ] Agregar variables dinámicas ({{name}}, {{company}}, {{title}}, {{industry}})
- [ ] Crear selector de "Best Time to Call" basado en timezone del lead
- [ ] Implementar bulk call action: seleccionar múltiples leads y llamar en batch
- [ ] Agregar filtro en Leads page: "Never Called", "Called - No Answer", "Called - Interested"

### Testing & Documentation
- [ ] Probar flujo completo: iniciar llamada → recibir webhook → guardar transcript → analizar
- [ ] Verificar que permissions funcionan correctamente
- [ ] Probar call scheduling y bulk calls
- [ ] Documentar integración de Bland.ai en BLAND_AI_INTEGRATION.md
- [ ] Crear guía de uso de Ivy-Call para usuarios finales
- [ ] Agregar ejemplos de call scripts efectivos

### Permissions & Security
- [ ] Agregar permisos "calls" a tabla permissions con CRUD
- [ ] Aplicar requirePermission("calls", "create") a calls.initiate
- [ ] Aplicar requirePermission("calls", "read") a calls.list
- [ ] Aplicar requirePermission("calls", "delete") a calls.delete (si aplica)
- [ ] Verificar que solo usuarios de la misma company pueden ver calls
- [ ] Implementar audit logging para call actions

## Fase 16: Date Range Picker en Analytics Dashboard
- [x] Instalar dependencia date-fns para manejo de fechas
- [x] Crear componente DateRangePicker con Popover + Calendar
- [x] Agregar presets (Last 7 days, Last 30 days, Last 90 days, Custom)
- [x] Actualizar query prospectMetrics para aceptar startDate y endDate
- [x] Backend analytics.prospectMetrics ya soporta filtrado por rango de fechas
- [x] Agregar DateRangePicker en header de ProspectMetrics junto a company selector
- [x] KPI cards automáticamente muestran datos del período seleccionado
- [x] Indicador visual del rango seleccionado en botón del picker
- [ ] Probar con diferentes rangos de fechas

## Fase 17: Notificaciones VIP de Leads de Alta Calidad
- [x] Crear función notifyVIPLead en server/notification-helper.ts
- [x] Modificar mutation leads.create para detectar qualificationScore > 80
- [x] Llamar notifyVIPLead cuando se crea lead VIP con detalles completos
- [x] Incluir en notificación: nombre, empresa, score, title, email, link directo
- [x] Agregar badge "🌟 VIP" en tabla de leads para scores > 80
- [x] Crear botón filtro "🌟 VIP Only" en página Leads
- [x] Implementar lógica de filtrado VIP (showVIPOnly state)
- [ ] Probar creando lead con score alto
- [ ] Verificar que notificación llega correctamente

## Fase 15.1: Testing de Búsquedas Guardadas (Listo para testing manual)
- [ ] Probar flujo completo: guardar búsqueda → ejecutar → eliminar (MANUAL)
- [ ] Verificar que usageCount se incrementa al ejecutar (MANUAL)
- [ ] Verificar que filtros se pre-llenan correctamente (MANUAL)
- [ ] Probar con diferentes combinaciones de filtros (MANUAL)
- [ ] Verificar que eliminación funciona con confirmación (MANUAL)

## Fase 19: Enriquecimiento Automático de Leads VIP
- [x] Modificar leads.create para detectar leads VIP (score > 80)
- [x] Llamar automáticamente a LinkedIn API cuando se crea lead VIP
- [x] Actualizar lead con metadata enriquecida después de enrichment
- [x] Crear función updateLeadMetadata en server/db.ts
- [x] Manejar errores de enrichment sin bloquear creación de lead
- [x] Agregar logs de auto-enrichment con console.log
- [x] Agregar badge "⚡ Auto-Enriched" en tabla de leads para VIP con metadata
- [ ] Probar creando lead VIP y verificar enrichment automático (MANUAL)

## Fase 20: Dashboard de Conversión de Pipeline
- [x] Crear página PipelineDashboard.tsx
- [x] Agregar ruta /analytics/pipeline en App.tsx
- [x] Crear backend analytics.pipelineMetrics query
- [x] Calcular métricas: total por etapa, tasas de conversión, tiempo promedio
- [x] Implementar funnel chart con Recharts (new → contacted → qualified → converted)
- [x] Agregar gráfico de tiempo promedio por etapa (bar chart)
- [x] Mostrar tasas de conversión entre etapas (%)
- [x] Detectar y mostrar bottlenecks (etapa con menor conversión)
- [x] Agregar filtro por date range
- [x] Agregar KPI cards: conversion rate total, avg time to convert, bottleneck stage
- [x] Agregar navegación en DashboardLayout sidebar
- [x] Crear función getPipelineMetrics en server/db.ts

## Fase 21: Bulk Actions en Leads
- [x] Agregar checkboxes en tabla de Leads para selección múltiple
- [x] Crear estado selectedLeads para tracking de selección
- [x] Agregar checkbox "Select All" en table header
- [x] Crear barra de acciones cuando hay leads seleccionados
- [x] Implementar "Bulk Update Status" con dropdown y confirmación
- [x] Implementar "Export Selected" para leads seleccionados (CSV)
- [x] Implementar "Delete Selected" con confirmación
- [x] Crear mutation leads.bulkUpdateStatus en backend
- [x] Crear mutation leads.bulkDelete en backend
- [x] Mostrar contador de leads seleccionados en barra
- [x] Agregar feedback visual de selección (bg-muted/50 en row)

## Fase 22: Ivy-Call con Telnyx
- [x] Investigar y documentar Telnyx Voice API endpoints
- [x] Obtener TELNYX_API_KEY del usuario
- [x] Crear tabla calls en schema (leadId, status, duration, transcript, recording, sentiment, outcome)
- [x] Crear helper server/_core/telnyx.ts con funciones initiateCall, getCallStatus, hangupCall, speakText
- [x] Implementar calls router con initiate, list, listByLead, get, analyze, updateNotes
- [x] Crear funciones de base de datos: createCall, getCallById, getCallsByLeadId, updateCallStatus, updateCallTranscript
- [x] Agregar calls router a appRouter principal
- [x] Agregar botón "📞 Call" en tabla de Leads (placeholder)
- [x] Implementar análisis de transcripción con LLM (sentiment, outcome, keyPoints, nextSteps)
- [ ] Completar migración de base de datos (tabla calls)
- [ ] Implementar webhook endpoint /api/calls/webhook para eventos Telnyx
- [ ] Crear diálogo CallLead funcional con script y Start Call
- [ ] Crear página CallHistory.tsx para ver historial completo
- [ ] Integrar actualización automática de lead status según outcome

## Fase 23: Completar Ivy-Call Implementation
- [x] Ejecutar migración de base de datos para tabla calls
- [x] Crear webhook handler en server/webhooks/telnyx.ts
- [x] Registrar endpoint POST /api/webhooks/telnyx en server
- [x] Manejar eventos: call.initiated, call.answered, call.hangup, call.recording.saved
- [x] Actualizar status de llamadas automáticamente según eventos
- [x] Crear página CallHistory.tsx con tabla de llamadas
- [x] Agregar KPI cards: Total Calls, Success Rate, Avg Duration, Failed Calls
- [x] Implementar gráficos: Pie chart de outcomes, Bar chart de sentiment
- [x] Crear diálogo de detalles con reproductor de audio y transcripción
- [x] Agregar ruta /calls en App.tsx
- [x] Agregar Call History a navegación en DashboardLayout

## Fase 24: Activar Llamadas Funcionales
- [x] Crear componente CallDialog.tsx con script template editor
- [x] Agregar presets de scripts (intro call, follow-up, demo request, custom)
- [x] Implementar mutation trpc.calls.initiate en Leads page
- [x] Reemplazar botón placeholder con diálogo funcional
- [x] Mostrar loading state durante llamada (Loader2 spinner)
- [x] Agregar toast de confirmación al iniciar llamada
- [x] Botón Call solo visible cuando lead tiene email
- [ ] Backend validará TELNYX_PHONE_NUMBER en mutation

## Fase 25: Email Automation con Follow-ups
- [x] Crear tabla emailCampaigns en schema
- [x] Crear tabla emailLogs para tracking de envíos
- [x] Implementar helper sendEmail en server/_core/email.ts
- [x] Crear templates de email por outcome (callback, interested, notInterested, voicemail)
- [x] Crear mutation emails.sendFollowUp con validación de email
- [x] Mutation emails.listByLead para historial de emails por lead
- [x] Mutation emails.list para todos los emails de company
- [x] Agregar emails router a appRouter
- [ ] Agregar botón "Send Follow-up" en Call History (UI)
- [ ] Workflow automático post-llamada (trigger on call completion)
- [ ] Implementar tracking de opens/clicks (opcional, requiere SendGrid)

## Fase 26: Lead Scoring Automático
- [x] Agregar campo scoreHistory (JSON) en tabla leads
- [x] Crear función updateLeadScore en server/db.ts con history tracking
- [x] Implementar reglas de scoring (SCORING_RULES):
  * Llamada positiva: +10 puntos
  * Email abierto: +5 puntos  
  * Meeting completado: +15 puntos
  * Llamada negativa: -5 puntos
  * Demo requested: +20, Contract signed: +30, etc.
- [x] Scores clamped entre 0-100 automáticamente
- [x] History tracking con timestamp, userId, reason
- [ ] Crear mutation leads.updateScore (pending router edit)
- [ ] Actualizar score automáticamente después de llamadas
- [ ] Agregar badge de score change en tabla Leads (UI)
- [ ] Crear gráfico de score evolution en lead details (UI)
- [ ] Implementar threshold alerts (score > 90 = hot lead)

## Fase 27: Send Follow-up Button en Call History
- [x] Crear componente SendEmailDialog.tsx con template editor
- [x] Pre-seleccionar template según call outcome (callback, interested, notInterested, voicemail)
- [x] Permitir editar subject y body antes de enviar
- [x] Agregar botón "Send Follow-up" en cada fila de Call History
- [x] Integrar con trpc.emails.sendFollowUp mutation
- [x] Mostrar loading state y toast de confirmación
- [x] Deshabilitar botón si call no tiene outcome (no-answer, wrong-number)

## Fase 28: Workflow Automático Post-Llamada (Simplified)
- [x] Implementar auto-follow-up en webhook de Telnyx
- [x] Trigger automático después de completar llamada
- [x] Solo para outcomes: callback, interested
- [x] Envío inmediato (sin delay de 24h para MVP)
- [ ] Nota: Para delay de 24h, integrar con scheduled tasks o cron jobs
- [ ] Nota: Para producción, usar servicio como BullMQ o AWS SQS

## Fase 29: Score Evolution Chart en Lead Details
- [x] Crear componente ScoreEvolutionChart.tsx con Recharts
- [x] Parsear scoreHistory para datos del gráfico
- [x] Line chart con eje X (timestamp) y eje Y (score 0-100)
- [x] Tooltips mostrando reason, change (+10, -5, etc.), date y time
- [x] Color coding: verde para positivo, rojo para negativo en borders
- [x] KPI cards: initial score, current score, total change con trending icons
- [x] Recent changes list con últimos 5 cambios
- [x] Stats: positive changes count, negative changes count
- [ ] Agregar en página de lead details o modal (pendiente integración)

## Fase 30: Integrar ScoreEvolutionChart en Lead Details Modal
- [x] Crear nuevo modal de lead details en Leads.tsx
- [x] Agregar botón "View" en Actions column de tabla
- [x] Agregar estados detailsDialogOpen y selectedLead
- [x] Crear Dialog con 3 tabs: Overview, Enriched Data, Score History
- [x] Tab Overview muestra información básica del lead
- [x] Tab Enriched Data muestra EnrichedDataView component
- [x] Tab Score History renderiza ScoreEvolutionChart con scoreHistory
- [x] ScoreEvolutionChart maneja caso vacío automáticamente
- [x] Badges VIP y Auto-Enriched en título del modal

## Fase 31: Documentar Configuración de Telnyx
- [x] Crear documento TELNYX_SETUP.md con pasos detallados
- [x] Documentar cómo crear cuenta y obtener API Key
- [x] Documentar cómo comprar número de teléfono (local/toll-free/internacional)
- [x] Documentar configuración de Outbound Voice Profile
- [x] Documentar cómo configurar webhook URL
- [x] Documentar cómo actualizar secrets en Management Dashboard
- [x] Agregar sección de troubleshooting con 4 problemas comunes
- [x] Incluir tabla de costos estimados
- [x] Agregar mejores prácticas y recursos adicionales

## Fase 32: Implementar Scheduled Tasks con Delay 24h
- [x] Crear tabla scheduledTasks en schema con campos completos
- [x] Implementar processScheduledTasks en server/scheduled-tasks-processor.ts
- [x] Crear cron job que ejecuta cada 5 minutos
- [x] Implementar executeTask con soporte para send-email, update-lead-score, send-notification
- [x] Crear helper scheduleFollowUpEmail en server/schedule-helpers.ts
- [x] Crear helper scheduleLeadScoreUpdate en server/schedule-helpers.ts
- [x] Crear helper cancelScheduledTask en server/schedule-helpers.ts
- [x] Integrar processor startup en server/_core/index.ts
- [x] Sistema de retry automático (max 3 intentos, retry cada 1 hora)
- [ ] Modificar webhook Telnyx para usar scheduleFollowUpEmail (pendiente)
- [ ] Agregar mutation para listar/cancelar scheduled tasks via tRPC (pendiente)

## Fase 33: Completar Migración de Scheduled Tasks
- [ ] Ejecutar pnpm drizzle-kit push manualmente
- [ ] Confirmar creación de scheduledTasks table
- [ ] Verificar que processor puede consultar la tabla sin errores

## Fase 34: Agregar tRPC Mutations para Scheduled Tasks
- [x] Crear router scheduledTasks en server/scheduled-tasks-router.ts
- [x] Implementar query list (con filtros por status, taskType, limit)
- [x] Implementar mutation cancel para cancelar task pendiente
- [x] Implementar mutation retry para reintentar task fallido
- [x] Implementar mutation bulkCancel para cancelar múltiples tasks
- [x] Implementar query getById para ver detalles de task
- [x] Implementar query stats para estadísticas (total, pending, completed, failed, by type)
- [x] Agregar scheduledTasksRouter a appRouter principal

## Fase 35: Página de Scheduled Tasks Management
- [x] Crear página ScheduledTasksManagement.tsx
- [x] Agregar ruta /scheduled-tasks en App.tsx
- [x] Mostrar tabla con tasks (id, type, status, scheduledFor, retryCount)
- [x] Agregar filtros por status y taskType con Select components
- [x] Implementar botón Cancel para tasks pendientes con mutation
- [x] Implementar botón Retry para tasks fallidos con mutation
- [x] Mostrar error details con botón de AlertCircle
- [x] Agregar 4 KPI cards: pending, completed today, failed, total
- [x] Agregar navegación "Scheduled Tasks" en DashboardLayout sidebar
- [x] Badges con iconos para cada status (pending, processing, completed, failed, cancelled)
- [x] Task type labels con emojis (📧 Send Email, 📊 Update Score, etc.)

## Fase 36: Ejecutar Migración de scheduledTasks
- [ ] Intentar migración automática con script
- [ ] Verificar que tabla scheduledTasks existe en base de datos
- [ ] Verificar que processor deja de mostrar errores

## Fase 37: Integrar Auto-Scheduling en Webhook Telnyx
- [x] Modificar server/webhooks/telnyx.ts
- [x] Importar scheduleFollowUpEmail helper
- [x] Agregar lógica para outcomes callback e interested en call.hangup event
- [x] Configurar delay de 24 horas (delayHours: 24)
- [x] Obtener lead details para personalizar email (nombre, empresa)
- [x] Generar email subject y body desde templates por outcome
- [x] Solo enviar si lead tiene email válido
- [x] Logs detallados de scheduling exitoso y errores
- [ ] Probar con llamada de prueba (requiere tabla scheduledTasks)

## Fase 38: Dashboard de Task Analytics
- [x] Crear página TaskAnalytics.tsx
- [x] Agregar ruta /analytics/tasks en App.tsx
- [x] Usar stats query existente para obtener datos agregados
- [x] Crear gráfico de línea: tasks completados por día (Recharts LineChart)
- [x] Crear gráfico de barras: tasa de éxito vs fallos (BarChart con colores)
- [x] Crear gráfico de pie: distribución por tipo de task (PieChart con labels)
- [x] Agregar 4 KPI cards: success rate, avg completion time, failed tasks, most used type
- [x] Agregar sección Recent Activity con últimas 5 ejecuciones
- [x] Integrar DateRangePicker para filtrado por período
- [x] Agregar navegación "Task Analytics" en DashboardLayout sidebar
- [x] Trending indicators en KPI cards (+5.2%, -0.5h)

## Fase 39: Ejecutar Migración de scheduledTasks
- [ ] Intentar migración automática con timeout
- [ ] Verificar que tabla scheduledTasks se creó correctamente
- [ ] Verificar que processor deja de mostrar errores de tabla no existe
- [ ] Probar creación de scheduled task desde webhook

## Fase 40: Real-time Task Updates con Polling
- [x] Agregar useEffect con setInterval en ScheduledTasksManagement
- [x] Configurar polling cada 30 segundos
- [x] Usar refetch de tRPC query para actualizar datos
- [x] Agregar indicador visual de "Last updated" con timestamp (HH:mm:ss)
- [x] Limpiar interval en cleanup de useEffect
- [x] Agregar botón manual "Refresh Now" con icono RefreshCw
- [x] Toast de confirmación al hacer refresh manual
- [x] Actualizar lastUpdated state en cada refetch

## Fase 41: Historical Trends Query con Datos Reales
- [x] Crear query scheduledTasks.dailyStats en backend
- [x] Agrupar tasks por fecha (toISOString().split('T')[0])
- [x] Contar completed, failed, pending por día
- [x] Limitar a últimos 30 días por defecto (configurable 1-90)
- [x] Integrar query en TaskAnalytics.tsx con dateRange
- [x] Reemplazar mock data con datos reales de dailyStats
- [x] Formatear fechas para chart (MMM DD)
- [x] Inicializar todos los días con 0 para evitar gaps en gráfico
- [x] Manejar caso cuando no hay datos (array vacío)

## Fase 42: Fix TypeScript Errors en Schema
- [x] Cambiar leadId a nullable en emailLogs table
- [ ] Ejecutar migración de base de datos (MANUAL: `pnpm drizzle-kit push`)
- [ ] Nota: Migración requiere confirmaciones interactivas
- [ ] Verificar que errores de TypeScript desaparecen después de migración

## Fase 43: Implementar Average Completion Time
- [x] Agregar cálculo de avg completion time en dailyStats query
- [x] Calcular diferencia entre executedAt y createdAt para completed tasks
- [x] Convertir a horas con 1 decimal usando toFixed(1)
- [x] Retornar avgCompletionTime en response junto con daily array
- [x] Integrar en TaskAnalytics.tsx KPI card
- [x] Reemplazar valor mock "2.3" con dato real de backend
- [x] Actualizar dailyTasks mapping para usar dailyStatsData.daily

## Fase 44: Ejecutar Migración de Base de Datos
- [ ] Ejecutar `pnpm drizzle-kit push` manualmente
- [ ] Confirmar cada prompt de migración
- [ ] Verificar que tabla scheduledTasks se crea correctamente
- [ ] Verificar que emailLogs.leadId es nullable
- [ ] Verificar que scoreHistory existe en leads table
- [ ] Confirmar que errores de TypeScript desaparecen

## Fase 45: Crear Script de Seed Data
- [x] Crear archivo seed-data.mjs en root del proyecto
- [x] Generar 15 leads con datos realistas (nombres, empresas, títulos, industrias)
- [x] Generar 8 calls con diferentes outcomes (callback, interested, notInterested, voicemail, noAnswer)
- [x] Generar 15 scheduled tasks (pending, completed, failed) con diferentes tipos
- [x] Generar 10 email logs con statuses (sent, opened, clicked)
- [x] Generar 5 saved searches con filtros variados
- [x] Usar datos hardcoded realistas sin dependencias externas
- [ ] Ejecutar script con `node seed-data.mjs` (MANUAL, después de migración)

## Fase 46: Implementar Email Template Editor
- [ ] Crear página EmailTemplates.tsx
- [ ] Agregar ruta /email-templates en App.tsx
- [ ] Mostrar lista de templates existentes
- [ ] Crear formulario para nuevo template
- [ ] Implementar editor de template con preview
- [ ] Agregar variables dinámicas: {{leadName}}, {{company}}, {{title}}, etc.
- [ ] Crear mutation emailCampaigns.create
- [ ] Crear mutation emailCampaigns.update
- [ ] Crear mutation emailCampaigns.delete
- [ ] Agregar navegación en DashboardLayout


## Nuevas Tareas - Preparación para Lanzamiento con Clientes

### Configuración de Telnyx y Llamadas Automáticas
- [ ] Validar integración de Telnyx API en backend
- [ ] Crear endpoint para iniciar llamadas automáticas
- [ ] Implementar webhook handler para eventos de Telnyx
- [ ] Crear UI para configurar credenciales de Telnyx
- [ ] Implementar grabación y transcripción de llamadas
- [ ] Crear página de historial de llamadas con reproductor de audio

### Sistema de Workflows Personalizados
- [ ] Crear interfaz visual para diseñar workflows (drag & drop)
- [ ] Implementar backend para guardar workflows personalizados
- [ ] Crear biblioteca de acciones disponibles por agente
- [ ] Implementar sistema de triggers (eventos que inician workflows)
- [ ] Añadir validación de workflows antes de guardar
- [ ] Crear galería de templates de workflows predefinidos

### Integración CRM
- [ ] Implementar conector para Salesforce API
- [ ] Implementar conector para HubSpot API
- [ ] Implementar conector para Pipedrive API
- [ ] Crear UI para configurar credenciales de CRM
- [ ] Implementar sincronización bidireccional de leads
- [ ] Crear mapeo de campos personalizable (CRM ↔ Ivy.AI)
- [ ] Implementar sincronización automática cada 15 minutos
- [ ] Añadir logs de sincronización y manejo de errores

### Auditoría Completa de Funcionalidad
- [ ] Testing end-to-end de flujo de leads (crear → calificar → convertir)
- [ ] Testing end-to-end de flujo de tickets (crear → resolver → cerrar)
- [ ] Testing de workflows predefinidos (Sales Pipeline, Support Escalation)
- [ ] Verificar que todos los 6 agentes respondan correctamente
- [ ] Testing de Email Templates (crear, editar, eliminar, usar)
- [ ] Verificar analytics y métricas en tiempo real
- [ ] Testing de sistema multi-tenant (cambio entre empresas)
- [ ] Verificar permisos y roles (admin vs user)
- [ ] Testing de exportación CSV (leads, tickets, analytics)
- [ ] Verificar responsive design en móvil y tablet

### Preparación para Clientes
- [ ] Crear video demo de 3 minutos mostrando funcionalidades clave
- [ ] Crear guía de onboarding para nuevos clientes
- [ ] Preparar presentación de ventas con casos de uso
- [ ] Crear FAQ con preguntas frecuentes
- [ ] Configurar sistema de soporte para clientes
- [ ] Preparar plantillas de contratos y términos de servicio


## Nuevas Tareas - Preparación para Lanzamiento (Nov 18, 2025)
- [x] Validar integración de Telnyx
- [x] Crear página de Workflows
- [x] Implementar 4 workflows predefinidos
- [x] Testing end-to-end completo
- [x] Generar reporte de readiness
- [x] Crear timeline de lanzamiento
- [x] Documentar pricing recomendado
- [x] Definir KPIs de éxito

## Auditoría de Errores Críticos (Nov 19, 2025)
- [x] Corregir error de Select.Item en AuditLog (value="" no permitido)
- [x] Corregir dependencia de empresa en TaskAnalytics
- [x] Corregir dependencia de empresa en EmailTemplates
- [x] Agregar DashboardLayout a EmailTemplates
- [x] Crear tabla emailCampaigns en base de datos
- [x] Corregir tipo de companyId en queries (string → number)
- [x] Agregar alias 'company' en CompanyContext para backward compatibility

## Corrección de Seed Database (Nov 19, 2025)
- [x] Analizar error SQL en seed router
- [x] Corregir discrepancias entre schema y seed data
- [x] Agregar validación para evitar duplicados
- [x] Probar seed data exitosamente

## Mejoras Recomendadas (Nov 19, 2025)
- [x] Crear helper getCompanyId para estandarizar tipo de companyId
- [x] Expandir opciones de industrias en búsqueda (Packaging, Bottling, B2B, etc.)
- [x] Probar búsqueda con nuevas industrias (30 industrias disponibles)
- [ ] Sincronizar schema completo con pnpm db:push (pendiente, requiere intervención manual)

## Implementación EPM Construcciones SA de CV (Nov 19, 2025)
- [x] Analizar perfil de negocio de EPM Construcciones
- [x] Diseñar estrategia de 6 agentes IA especializados
- [x] Definir métricas KPI y alcances de Ivy.AI
- [x] Crear propuesta económica detallada ($180K MXN/año, ROI 21,539%)
- [x] Configurar empresa EPM en plataforma (Company ID: 4)
- [x] Documentar configuración de 6 agentes especializados
- [x] Crear plan de implementación completo (24 semanas)

## Configuración de Usuario y Agentes EPM (Nov 19, 2025)
- [x] Crear usuario admin para Arq. Leoncio Eloy Robledo L. (User ID: 8)
- [ ] Documentar proceso de creación de usuarios paso a paso
- [ ] Crear roadmap de configuración de agentes (métricas 1, 3, 6 meses)
- [ ] Implementar IVY-PROSPECT (generación de leads)
- [ ] Implementar IVY-QUALIFY (calificación inteligente)
- [ ] Implementar IVY-ENGAGE (seguimiento automatizado)
- [ ] Implementar IVY-SCHEDULE (gestión de servicios)
- [ ] Implementar IVY-TICKET (soporte y emergencias)
- [ ] Implementar IVY-ANALYTICS (inteligencia de negocio)
- [ ] Crear suite de pruebas funcionales para cada agente
- [ ] Ejecutar pruebas y documentar resultados

## Integraciones Externas para EPM Construcciones (Nov 19, 2025)
- [ ] Configurar Gmail API para epmconstrucciones@gmail.com
- [ ] Crear templates de email personalizados (educativo, hotelero, residencial)
- [ ] Implementar sistema de envío automático de emails
- [ ] Configurar WhatsApp Business API (+52 1 951 307 9830)
- [ ] Implementar seguimiento automático por WhatsApp
- [ ] Configurar Google Calendar API para calendario de técnicos
- [ ] Implementar asignación automática de servicios en calendario
- [ ] Crear dashboard ejecutivo personalizado para EPM
- [ ] Implementar métricas por sector (educativo, hotelero, residencial)
- [ ] Configurar sistema de clasificación automática de leads
- [ ] Configurar sistema de clasificación automática de emergencias
- [ ] Probar todas las integraciones end-to-end
- [ ] Documentar configuración y uso de integraciones

## Integraciones Externas para EPM (Nov 19, 2025)
- [x] Configurar módulo Gmail API para envío automático de emails
- [x] Crear templates de email por sector (educativo, hotelero, residencial)
- [x] Documentar configuración de WhatsApp Business API
- [x] Documentar configuración de Google Calendar API
- [x] Crear dashboard ejecutivo personalizado para EPM (/epm-dashboard)
- [x] Implementar sistema de clasificación automática de leads
- [x] Implementar sistema de clasificación de emergencias
- [x] Probar dashboard EPM (95 leads, 36.8% conversión, $1.93M MXN)
- [x] Documentar configuración completa

## Gmail API + Templates + ML Scoring para EPM (Nov 19, 2025)
- [x] Crear guía paso a paso de configuración de Gmail API en Google Cloud Console
- [x] Documentar proceso de obtención de credenciales OAuth 2.0
- [x] Crear 4 templates de email para sector educativo (primer contacto, seguimiento 1-2, última oportunidad)
- [x] Crear 4 templates de email para sector hotelero (primer contacto, seguimiento 1-2, última oportunidad)
- [x] Crear 4 templates de email para sector residencial (primer contacto, seguimiento 1-2, última oportunidad)
- [x] Implementar sistema de scoring predictivo con ML (7 factores: sector, tamaño, presupuesto, autoridad, engagement, urgencia, contexto)
- [x] Entrenar modelo con datos históricos de EPM (tasas de conversión: educativo 26.7%, hotelero 44.4%, residencial 46.9%)
- [x] Documentar estrategia de seguimiento automatizado (calendario 0-3-7-14 días)
- [x] Documentar métricas de éxito por template (tasas de apertura y respuesta objetivo)

## Activación Gmail API + Templates + ML Scoring (Nov 19, 2025)
- [ ] Crear página de configuración de integraciones (/admin/integrations)
- [ ] Implementar formulario de configuración de Gmail API (Client ID, Secret, Refresh Token)
- [ ] Crear sistema de gestión de templates de email en base de datos
- [ ] Importar 12 templates de email personalizados (4 educativo, 4 hotelero, 4 residencial)
- [ ] Crear router tRPC para envío de emails con Gmail API
- [ ] Integrar sistema de scoring ML con IVY-QUALIFY
- [ ] Crear endpoint de scoring en tiempo real
- [ ] Agregar columna de score predictivo en tabla de leads
- [ ] Crear dashboard de métricas de templates (tasas de apertura, respuesta, conversión)
- [ ] Probar envío de email con template personalizado
- [ ] Probar scoring ML con lead de prueba
- [ ] Documentar proceso completo de activación


## EPM Construcciones - Próximos Pasos

### Configuración de Gmail API
- [ ] Verificar interfaz de configuración en /admin/api-config
- [ ] Mejorar UI para ingreso de credenciales OAuth 2.0
- [ ] Agregar validación de credenciales en tiempo real
- [ ] Crear flujo de testing de envío de email
- [ ] Implementar refresh token automático

### Sistema de Importación de Leads
- [ ] Crear endpoint tRPC para importación CSV
- [ ] Implementar parser de CSV con validación de campos
- [ ] Agregar mapeo automático de columnas
- [ ] Crear página de importación en frontend (/admin/import-leads)
- [ ] Implementar preview de datos antes de importar
- [ ] Agregar detección automática de sector (educativo/hotelero/residencial)

### Tracking de Métricas de Email
- [ ] Implementar pixel de tracking para email opens
- [ ] Crear sistema de tracking de clicks en links
- [ ] Agregar webhook para respuestas de Gmail
- [ ] Crear dashboard de métricas de email campaigns
- [ ] Implementar almacenamiento de métricas en DB
- [ ] Agregar gráficos de tasas de apertura/clicks por sector

### Prueba Piloto de Templates
- [ ] Crear script de selección de leads de prueba (10-15 por sector)
- [ ] Implementar envío programado de secuencias (0-3-7-14 días)
- [ ] Crear reporte de resultados de prueba piloto
- [ ] Agregar A/B testing de asuntos de email
- [ ] Implementar comparación de performance entre sectores

### Calibración de Scoring ML
- [ ] Recopilar datos de conversión reales de EPM
- [ ] Ajustar pesos de factores de scoring basado en resultados
- [ ] Validar predicciones vs. resultados reales
- [ ] Crear dashboard de precisión del modelo ML
- [ ] Implementar re-entrenamiento automático mensual


## Progreso Actual (19 Nov 2025)

### Sistema de Importación de Leads ✅
- [x] Crear endpoint tRPC para importación CSV (import-router.ts)
- [x] Implementar parser de CSV con validación de campos
- [x] Agregar mapeo automático de columnas
- [x] Crear página de importación en frontend (/admin/import-leads)
- [x] Implementar preview de datos antes de importar
- [x] Agregar detección automática de sector (educativo/hotelero/residencial)
- [x] Implementar función de descarga de template CSV
- [x] Agregar opción de omitir duplicados
- [x] Integrar en navegación del dashboard


## EPM Construcciones - Implementación Completa ✅

### Sistema de Email Automation (19 Nov 2025)
- [x] Importar 12 templates de email (educativo, hotelero, residencial)
- [x] Agregar columnas sector, sequence, delayDays a emailCampaigns
- [x] Crear sistema de scoring ML con datos históricos EPM
- [x] Implementar 7 factores de scoring predictivo
- [x] Crear dashboard de ML Scoring (`/analytics/ml-scoring`)
- [x] Crear dashboard de Email Performance (`/analytics/email-performance`)
- [x] Implementar sistema de importación de leads desde CSV
- [x] Crear sistema de tracking de emails (opens, clicks, responses)
- [x] Implementar métricas por sector en tiempo real
- [x] Crear script de prueba piloto (`pilot-test-epm-templates.mjs`)
- [x] Crear guía visual de Gmail API (20 páginas con screenshots)
- [x] Crear documentación técnica completa (40+ páginas)
- [x] Integrar routers tRPC (import, emailTracking, mlScoring)
- [x] Agregar navegación en sidebar (Import Leads, ML Scoring, Email Performance)

### Pendiente (Requiere Cliente)
- [ ] Configurar credenciales Gmail API en `/admin/api-config`
- [ ] Importar leads históricos de EPM vía CSV
- [ ] Ejecutar prueba piloto con 15 leads (5 por sector)
- [ ] Monitorear métricas durante 2 semanas
- [ ] Ajustar templates basado en performance
- [ ] Lanzar campaña completa


## Bug Fixes (19 Nov 2025 - 22:35)
- [x] Fix tRPC error "No procedure found on path analytics.systemStatus"
- [x] Fix tRPC error "No procedure found on path analytics.companyMetrics"
- [x] Add systemStatus procedure to analytics router
- [x] Add companyMetrics procedure to analytics router
- [x] Add getAgentCount function to db.ts
- [x] Add getActiveAgentCount function to db.ts
- [x] Add getLeadCount function to db.ts
- [x] Add getTicketCount function to db.ts
- [x] Dashboard now loads without tRPC errors


## TypeScript & Database Fixes (19 Nov 2025 - 22:40)
- [x] Fix TypeScript errors in emailTracking schema (number | null issues)
- [x] Review emailTracking table definition in drizzle/schema.ts
- [x] Fix column type definitions to match Drizzle ORM requirements
- [x] Commented out emailTracking router (table doesn't exist in DB)
- [x] Dashboard now loads without tRPC errors
- [ ] Resolve database connection errors in scheduledTasks (requires DB admin access)
- [ ] Implement database reconnection logic
- [ ] Add tests for analytics.systemStatus procedure
- [ ] Add tests for analytics.companyMetrics procedure


## Implementación Enterprise Completa (19 Nov 2025 - 01:00)

### Fase 1: Base Técnica (45 min) ✅ COMPLETADA
- [x] Crear tabla emailLogs en base de datos
- [x] Activar emailTrackingRouter
- [x] Implementar reconexión automática de DB
- [x] Agregar tests unitarios para analytics (6 tests passing)

### Fase 2: Automatización de Emails (60 min) ✅ COMPLETADA
- [x] Sistema de envío automatizado de secuencias (0-3-7-14 días)
- [x] Webhook para recibir respuestas de Gmail
- [x] Dashboard de métricas de campaña en tiempo real

### Fase 3: Analytics Avanzado (45 min) ✅ COMPLETADA
- [x] Dashboard de ROI por sector
- [x] Exportación de reportes en PDF
- [x] Exportación de reportes en Excel/CSV

### Fase 4: Integraciones Externas (60 min) ✅ COMPLETADA
- [x] Integración con CRM (Salesforce/HubSpot)
- [x] Sistema de notificaciones push en tiempo real
- [x] Server-Sent Events para actualizaciones live
### Fase 5: UX Avanzado (45 min) ✅ COMPLETADA
- [x] Onboarding interactivo para nuevos usuarios (8 pasos)
- [x] Tour guiado de funcionalidades principales
- [x] Búsqueda global (Cmd+K) para navegación rápida
- [x] Sistema de navegación mejorado con shortcuts
