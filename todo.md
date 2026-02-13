# Ivy.AI + ROPA (Meta-Agent) - Implementation TODO

## Phase 1: Foundation ✅
- [x] Rollback to stable version b6d2d1bc
- [x] Verify base application is working

## Phase 2: ROPA Core Implementation
- [x] Create ROPA database schema (agents, tasks, logs, metrics)
- [x] Implement ROPA backend router with 129 tools
- [x] Create ROPA service layer with autonomy logic
- [x] Add ROPA startup initialization
- [x] Configure 24/7 maintenance cycles

## Phase 3: ROPA Dashboard
- [x] Create ROPA dashboard page component
- [x] Implement real-time stats cards
- [x] Add interactive chat interface
- [x] Create tasks management tab
- [x] Add health monitoring tab
- [x] Implement recent activities feed

## Phase 4: Auto-Healing & Autonomy
- [x] Implement auto-fix for common errors
- [x] Add auto-restart on failures
- [x] Create self-learning system
- [x] Configure market intelligence scheduler
- [x] Add auto-training for agents

## Phase 5: Advanced Features
- [x] Create automation scripts
- [x] Implement notification system
- [x] Add performance optimization
- [x] Create backup & recovery system
- [x] Add comprehensive logging

## Phase 6: Testing & Deployment
- [x] Write unit tests for ROPA core
- [x] Write integration tests
- [x] Test autonomy cycles
- [x] Verify all 50+ tools work
- [ ] Create final checkpoint
- [x] Document ROPA system

## Phase 7: Delivery
- [ ] Final verification
- [ ] Create deployment guide
- [ ] Deliver to user

## Sales Campaign Management System with ROPA
- [x] Apply new color palette (black + cyan/teal) to ROPA dashboard
- [x] Create file upload system (Excel, PDF, images)
- [x] Create file download system for reports
- [x] Add database schema for client leads and campaigns
- [x] Implement client data parser (Excel/CSV)
- [x] Create campaign management interface
- [x] Add email campaign generation with ROPA
- [x] Add phone call script generation
- [x] Add social media content generation (LinkedIn, Instagram, Facebook)
- [x] Implement campaign tracking and metrics
- [ ] Test file upload/download
- [ ] Test campaign generation
- [ ] Create checkpoint

## Railway Deployment with Custom Domain
- [x] Review and create Railway configuration files (railway.json, Procfile)
- [x] Configure build scripts for production
- [x] Push latest code to GitHub
- [ ] Configure Railway environment variables
- [ ] Set up custom domain app.ivybyai.com in Railway
- [ ] Configure SSL certificate
- [ ] Test deployment
- [ ] Create deployment documentation

## Phase 8: ROPA Dashboard v2.0 Redesign
- [x] Create new professional dashboard layout with 3-column design
- [x] Implement left sidebar navigation menu with all options
- [x] Create central area with campaign analytics charts by company
- [x] Implement floating chat window with ROPA (text + voice)
- [x] Add voice input (speech-to-text) for ROPA interaction
- [x] Add voice output (text-to-speech) for ROPA responses
- [x] Maintain dark professional theme
- [x] Ensure white text color in chat input field
- [x] Add real-time campaign metrics per company
- [x] Add company selector/filter for campaign views
- [x] Test all features work correctly
- [ ] Create checkpoint
- [x] Create Kanban calendar page with drag & drop for campaign scheduling
- [x] Add calendar navigation button in sidebar menu
- [x] Add back button to return to ROPA dashboard from calendar
- [x] Filter campaigns by company in calendar view

## Phase 9: ROPA Chat Window Improvements
- [x] Make ROPA chat window draggable (drag & drop)
- [x] Add maximize/restore button to expand chat to full screen
- [x] Maintain voice interaction functionality
- [ ] Save checkpoint
- [x] Make ROPA logo in sidebar open chat on double-click


## Phase 10: ROPA UX Enhancements
- [x] Add notification sound when ROPA responds
- [x] Add badge indicator on logo for pending messages
- [x] Implement Ctrl+R keyboard shortcut to toggle chat


## Phase 11: Railway Deployment via GitHub
- [x] Verify ROPA market intelligence capabilities (8 new tools added)
- [x] Push code to GitHub
- [ ] Configure Railway deployment (user must do in Railway dashboard)


## Phase 12: GitHub Repository Corrections
- [x] Verify TypeScript compiles without errors
- [x] Run and pass all 16 tests
- [x] Verify production build works
- [x] Add /api/health endpoint for Railway healthcheck
- [x] Create comprehensive README.md
- [x] Push all corrections to GitHub

## Phase 13: ROPA Memory & Proactive Improvements
- [x] Remove "asteriscos" word from ROPA responses
- [x] Make ROPA proactive with immediate responses
- [x] Implement persistent memory for conversations and recommendations
- [x] Implement memory for agent training/orchestration history

## Phase 14: ROPA META-Agentic & Multilingual Enhancements
- [x] Add advanced META-agentic tools (web browsing, file management, code execution)
- [x] Add orchestration tools for managing multiple agents
- [x] Add self-improvement and learning tools
- [x] Implement multilingual support (ES, EN, EU, IT, FR, DE, ZH, HI, AR)
- [x] Fix chart tooltip visibility in campaign distribution
- [x] Fix Nueva Campaña button in calendar
- [ ] Deploy to Railway

## Phase 15: ROPA Configuration Page
- [x] Create ROPA Configuration page with all settings sections
- [x] Operation mode selector (Autonomous/Guided/Hybrid)
- [x] Language preference selector (9 languages)
- [x] Agent personality settings
- [x] Campaign limits and schedules
- [x] Integration status display
- [x] Notification preferences
- [x] LocalStorage persistence for config
- [x] Deploy to Railway

## Phase 16: Campaign Management Interface
- [x] Add "Nueva Empresa" button and dialog
- [x] Add "Nueva Campaña" button and dialog
- [x] Create companies list with edit/delete
- [x] Create campaigns table with status and metrics
- [x] Add campaign actions (start, pause, delete)
- [x] Deploy to Railway

## Phase 17: ROPA Email Sending Capability
- [x] Update ROPA system prompt to allow external email sending
- [x] Implement SendGrid email tool in ROPA service
- [x] Add send_campaign_email tool to ROPA tools
- [x] Add sendBulkCampaignEmails tool
- [x] Add sendFollowUpEmail tool
- [x] Add generateAndSendEmail tool
- [x] Add checkEmailDeliveryStatus tool
- [x] Deploy to Railway

## Phase 18: ROPA Direct Admin Commands
- [ ] Update ROPA prompt to obey admin commands without campaigns
- [ ] Add sendDirectEmail tool (any recipient)
- [ ] Add makeDirectCall tool (any number)
- [ ] Add sendDirectSMS tool (any number)
- [ ] Add searchInformation tool for research requests
- [ ] Deploy to Railway


## Phase 19: Campaign Content Validation Monitor
- [x] Create campaignContent table for storing email/call/SMS drafts pending validation
- [x] Build tRPC router for campaign content CRUD and approval workflow
- [x] Create Campaign Monitor page with tabs for Emails, Calls, SMS
- [ ] Implement email preview with company letterhead/branding
- [ ] Add call script preview with company info
- [ ] Add SMS preview component
- [ ] Add Approve/Reject/Edit buttons for each content item
- [ ] Add sidebar navigation link "Campaign Monitor"
- [ ] Integrate with ROPA chat commands to show content in monitor
- [ ] Deploy to Railway production


## Phase 20: Company Files Management System
- [x] Create companyFiles table for storing company assets (logos, email examples, etc.)
- [x] Create clientLists table for imported client databases
- [x] Build file upload router with S3 integration
- [x] Support multiple file formats (Excel, CSV, PDF, Word, images)
- [x] Create Company Files page with drag & drop upload
- [ ] Add file preview for images and PDFs
- [ ] Add Excel/CSV parser for client lists
- [ ] Create client list viewer with pagination
- [ ] Add sidebar navigation link "Archivos de Empresa"
- [ ] Integrate files with campaign content generation


## Phase 21: Calendar-Campaigns Integration Fix
- [x] Fix calendar to read campaigns from localStorage (same source as Campaigns menu)
- [x] Display campaigns in calendar according to their status/progress
- [x] Sync campaign dates with calendar view
- [ ] Deploy to Railway


## Phase 22: Monitor Section & Calendar Fixes
- [ ] Add Monitor section to ROPA sidebar navigation
- [ ] Verify calendar shows all FAGOR campaigns (user reports 3 campaigns created but only 2 visible)
- [ ] Deploy updated code to Railway


## Phase 23: Email Preview in Monitor + ROPA Fixes
- [x] Update ROPA system prompt to remove "asterisco" word
- [x] Add tool for ROPA to save email drafts to Monitor section
- [x] Create email preview component with company letterhead/branding
- [x] Display pending emails in Monitor with Approve/Reject buttons
- [x] ROPA context awareness (reads companies/campaigns from localStorage)
- [ ] Deploy to Railway


## Phase 24: ROPA Autonomous Meta-Agent System
- [x] Create comprehensive campaign management API (CRUD for companies, campaigns, leads)
- [x] Implement agent orchestration system (create, assign, monitor agents)
- [x] Add autonomous decision engine (auto-create campaigns, assign agents, optimize)
- [x] Create agent training and performance tracking system
- [x] Add ROPA tools for full platform control (manage companies, campaigns, agents)
- [x] Implement multi-agent coordination and task delegation
- [x] Add autonomous monitoring and self-healing capabilities
- [x] Document autonomous agent architecture
- [ ] Test complete autonomous workflow
- [ ] Deploy to Railway


## Phase 25: Browser Automation for ROPA
- [x] Install Puppeteer dependency
- [x] Create browser automation service module
- [x] Add ROPA browser control API endpoints
- [x] Implement UI navigation commands (click, type, scroll, navigate)
- [x] Add screenshot capture for ROPA vision
- [x] Add element inspection and interaction
- [x] Integrate browser control with ROPA chat
- [ ] Test browser automation with dashboard UI
- [ ] Deploy to Railway

## Phase 26: A/B Testing System
- [x] Create A/B test database schema (test_variants, test_results)
- [x] Implement campaign variant creation logic
- [x] Add statistical significance calculator
- [ ] Create A/B test dashboard UI component
- [x] Add automatic winner selection algorithm
- [ ] Integrate with autonomous decision engine
- [ ] Add ROPA tools for A/B test management
- [ ] Test complete A/B testing workflow
- [ ] Deploy to Railway

## Phase 27: Predictive Analytics with ML
- [x] Create campaign performance dataset collection
- [x] Implement ML model for campaign success prediction
- [x] Add training pipeline for model updates
- [x] Create prediction API endpoints
- [x] Add confidence scoring to predictions
- [ ] Integrate predictions into campaign creation flow
- [ ] Add ROPA tools for prediction insights
- [ ] Test prediction accuracy
- [ ] Deploy to Railway

## Etapa 1: Foundation UI (A/B Testing + Predictive Insights)
- [x] Create A/B Testing Dashboard UI component
- [x] Create Predictive Insights Panel UI component
- [x] Add routes and navigation links
- [x] Verify TypeScript compilation

## Etapa 2: Visual Autonomy (ROPA Vision + Browser Control)
- [x] Create ROPA vision service with screenshot analysis
- [x] Add vision tools to ROPA toolkit
- [x] Implement autonomous dashboard navigation
- [x] Test vision-based decision making

## Etapa 3: Multi-Agent System + Reinforcement Learning
- [x] Create specialized agent types (Email, Call, Analytics, Coordinator)
- [x] Implement agent collaboration system
- [x] Add reinforcement learning reward system
- [x] Create learning from campaign outcomes

## Etapas 4-7: Remaining Advanced Features (Batch Implementation)
- [x] Natural Language Reporting system
- [x] Self-Healing & Error Recovery
- [x] Budget Optimization engine
- [x] External API Integrations (Stripe, Zapier, Notion via MCP)
- [x] Voice Interface (speech-to-text)
- [x] Sentiment Analysis
- [x] Competitive Intelligence
- [x] Market Analysis automation

## Bug Fix: File Upload in Archivos Page
- [ ] Diagnose file upload issue in Archivos de Empresa page
- [ ] Fix file upload handler and S3 integration
- [ ] Test with FAGOR logo upload
- [ ] Verify all file types work (Excel, CSV, PDF, Word, Images)
- [ ] Deploy fix to Railway

## Google Drive Integration for sales@ivybai.com
- [ ] Obtain Google Cloud OAuth credentials (Client ID, Client Secret)
- [ ] Implement Google Drive API integration module
- [ ] Create folder structure in Google Drive
- [ ] Setup automatic file upload to Drive
- [ ] Implement database backup to Drive (daily/weekly)
- [ ] Auto-save reports generated by ROPA to Drive
- [ ] Sync templates to Drive
- [ ] Test bidirectional sync
- [ ] Deploy to production

## CRITICAL BUG FIXES - Phase 28 (COMPLETED ✅)
- [x] **PRIORITY 1**: Fix calendar drag-and-drop persistence (campaigns snap back to original position)
- [x] **PRIORITY 1**: Fix calendar date updates when moving campaigns between columns
- [x] Fix file upload functionality in Archivos page (not working from local PC)
- [x] Fix ROPA JSON context visibility (remove [CONTEXT] display in responses)
- [x] Fix asterisk formatting (ROPA still writes "asterisco" at start of sentences)
- [x] Implement automatic email draft window opening when ROPA generates emails
- [x] Test all fixes locally
- [x] Deploy to Railway production

## PRODUCTION ERRORS - Phase 30 (URGENT)
- [ ] Fix tRPC API returning HTML instead of JSON (Error: "<!doctype "... is not valid JSON)
- [ ] Fix Vite HMR reload failure for GoogleDriveSettings.tsx
- [ ] Fix Vite HMR reload failure for index.css
- [ ] Test all fixes locally
- [ ] Deploy to Railway production

## Performance Monitoring & Anomaly Detection - Phase 31 (COMPLETED ✅)
- [x] Create performance metrics collection service (CPU, memory, response times, DB queries)
- [x] Implement anomaly detection algorithms (baseline + threshold-based)
- [x] Create alert system for performance degradation
- [x] Add monitoring dashboard UI with real-time metrics
- [x] Integrate with ROPA for proactive issue resolution
- [x] Add notification system (email/webhook) for critical alerts
- [x] Test monitoring system locally
- [x] Deploy to Railway production

## Memory Optimization & Email Alerts - Phase 32 (URGENT)
- [x] Disable email notifications from performance monitoring system
- [x] Analyze high memory consumption (91.9% = 3620MB/3941MB)
- [x] Identify memory leaks or inefficient processes
- [x] Optimize ROPA autonomous operations memory usage (health check: 2min → 10min)
- [x] Reduce monitoring collection frequency (60s → 300s)
- [x] Test memory usage after optimizations
- [x] Deploy fixes to Railway production

## File Upload & ROPA Navigation - Phase 33 (CRITICAL)
- [x] Fix file upload functionality (files not uploading to any storage)
- [x] Integrate file upload with Google Drive storage
- [ ] Create Ivy.AI folder structure in Google Drive automatically
- [ ] Enable ROPA to navigate entire Ivy.AI platform (Dashboard, Monitor, Archivos, Campañas)
- [ ] Add ROPA tools for managing Monitor emails and campaign samples
- [ ] Test file upload to Google Drive
- [ ] Test ROPA platform navigation
- [ ] Deploy fixes to Railway production


## ROPA Google Drive Integration - Phase 34
- [ ] Crear servicio de acceso a Google Drive para ROPA
- [ ] Implementar lectura de archivos Excel, Word, PDF, imágenes
- [ ] Integrar con sistema de agentes para preparar campañas
- [ ] Agregar visualización de archivos en Monitor
- [ ] Permitir a ROPA responder consultas sobre archivos subidos

## ROPA Voice Toggle Fix - Phase 35
- [x] Fix voice toggle button - when disabled should stop ongoing speech and prevent new speech
- [x] Fix ROPA Google Drive subfolder navigation - ROPA cannot see subfolders inside FAGOR folder
- [x] Add ROPA capability to list subfolders and navigate folder tree
- [x] Add ROPA capability to create folders and subfolders
- [x] Add ROPA capability to delete folders
- [x] Add ROPA capability to move files between folders
- [x] Add ROPA capability to copy files between folders
- [x] Fix Google Drive connection persistence - should stay connected across page navigation
- [x] Fix email drafts not appearing in Monitor section
- [x] Analyze why ROPA cannot self-correct platform issues
- [x] Add debugging/diagnostic tools for ROPA to troubleshoot platform problems
- [x] Create UI state inspection tools for ROPA (see Monitor, localStorage, active section)
- [x] Create self-correction tools for ROPA (clear corrupted data, reset states)
- [x] Add real-time interface visibility for ROPA
- [x] Fix Monitor section not displaying email drafts - root cause bug investigation
- [x] Create database table for email drafts persistence
- [x] Create backend endpoints for email draft CRUD
- [x] Save approved/rejected emails to database permanently

## Google Drive Client Folder Structure - Phase 36
- [x] Design logical folder structure template for Ivy.AI clients
- [x] Create root Ivy.AI folder structure in Google Drive
- [x] Add ROPA tool to auto-create client folder structure
- [x] Link client management with Google Drive folders
- [x] Update ROPA to navigate client folders automatically

## Monitor Section Redesign - Phase 37
- [x] Create Monitor list view component showing all draft types (emails, calls, SMS)
- [x] Create full-screen popup modal for draft preview on double-click
- [x] Add approve/reject buttons to each draft item and popup
- [x] Implement Google Drive integration to save approved drafts to client campaign folders
- [x] Support different campaign types per client

## Railway Production Fix - email_drafts table missing
- [x] Create email_drafts table in production database via script
- [x] Add email_drafts table creation to startup script
- [ ] Verify table exists after deployment

## Draft Editing in Monitor - Phase 38
- [x] Add edit mode toggle to MonitorDraftPopup component
- [x] Add editable fields for subject and body in popup
- [x] Create backend endpoint to update draft content
- [x] Add save changes button before approve/reject
- [x] Deploy to Railway

## ROPA Not Responding Fix - Phase 39
- [x] Investigate why ROPA is not responding to messages
- [x] Fix ROPA chat endpoint or LLM integration issue - cleaned context from displayed messages


## ROPA LLM Error Fix - Phase 40 (COMPLETED ✅)
- [x] Diagnosticar error "hubo un error al procesar tu mensaje"
- [x] Identificar causa: contexto de conversación demasiado largo (50 mensajes, 27000 chars)
- [x] Reducir contexto de conversación de 20 a 6 mensajes
- [x] Simplificar system prompt de 8000 a 500 caracteres
- [x] Truncar mensajes largos a 1000 caracteres máximo
- [x] Mejorar manejo de errores con mensajes específicos
- [x] Verificar que ROPA responde correctamente
- [x] Tiempo de respuesta < 2 segundos


## Phase 30: SUPER META-AGENTE ROPA Reconstrucción
- [x] Auditar código existente de ROPA (ropa-tools.ts, ropa-router.ts)
- [x] Crear ropa-platform-tools.ts con herramientas de manipulación directa de BD
- [x] Crear ropa-super-tools.ts con 24+ herramientas avanzadas
- [x] Implementar acceso a internet (webSearch, fetchUrl, researchCompany)
- [x] Implementar IA generativa (generatePersonalizedEmail, generateCampaignStrategy)
- [x] Implementar automatización (createWorkflow, scheduleTask, batchOperation)
- [x] Implementar analytics (getDashboardMetrics, generatePerformanceReport)
- [x] Implementar comunicación multi-canal (sendEmail, queueSMS, notifyOwner)
- [x] Implementar gestión de datos (importLeadsFromData, exportData, syncWithCRM)
- [x] Integrar detección automática de comandos en el router
- [x] Optimizar system prompt con capacidades de SUPER META-AGENTE
- [x] Corregir error de LLM "hubo un error al procesar tu mensaje"
- [x] Reducir contexto de conversación de 20 a 6 mensajes
- [x] Verificar generación de emails en Monitor (3 borradores creados para FAGOR)
- [x] Verificar respuestas rápidas (<2 segundos)
- [ ] Guardar checkpoint final
- [ ] Publicar a producción


## Phase 32: Flujo Completo de Borradores y Auto-actualización ROPA
- [x] Borradores rechazados se eliminan de Monitor
- [x] Borradores aprobados pasan a Campañas como "En Progreso"
- [x] Borradores aprobados aparecen en Calendario como "En Progreso"
- [ ] ROPA trabaja automáticamente en campañas aprobadas
- [ ] ROPA auto-actualiza todas las páginas de Ivy.AI en tiempo real
- [ ] Seguimiento de ROI y progreso de campañas
- [ ] Desplegar a producción


## Bug Fix: Chat message not sending - Phase 36
- [ ] Change sendChatMessage to publicProcedure
- [ ] Deploy to GitHub/Railway
- [ ] Verify chat works in production


## DEFINITIVE FIX: ROPA Chat - Phase 37 (Expert Architect)
- [x] Root cause: Frontend sending massive JSON context with every message
- [x] Root cause: isSubmitting stuck on true when mutation fails (no onSettled)
- [x] Root cause: LLM quota exhausted (412 error) with no fast fallback
- [x] FIX: Remove context JSON from frontend messages (send clean text only)
- [x] FIX: Add onSettled to always reset isSubmitting
- [x] FIX: Simplify backend context parsing (remove 50-line bracket counter)
- [x] FIX: Immediate responses for navigation, greetings, Drive commands (no LLM needed)
- [x] FIX: Intelligent fallback when LLM fails (date, help, commands)
- [x] Verified: hola ROPA → instant response
- [x] Verified: ve a archivos → instant navigation
- [x] Verified: que dia es hoy → instant date response
- [x] Verified: campañas activas → fallback response (no LLM)
- [ ] Deploy to Railway production


## Phase 38: Integrar Google Gemini como LLM para ROPA
- [x] Investigar API de Google Gemini 2.5 Pro
- [x] Crear módulo de integración con Gemini en el backend
- [x] Configurar API key de Google AI (GOOGLE_AI_API_KEY)
- [x] Modificar ROPA router para usar Gemini en lugar del LLM de Manus
- [x] Agregar fallback: Gemini → Manus LLM → respuesta local
- [x] Probar que ROPA responde con Gemini
- [x] Desplegar a producción


## Phase 41: Fix ROPA Chat Delay - tRPC Batching Issue
- [x] Split tRPC links to use separate non-batched link for chat mutations
- [x] Reduce updateUIState frequency and remove from chat message batching
- [x] Add optimistic UI updates for instant message display
- [x] Fix isSubmitting state getting stuck when batch fails
- [x] Fix TypeScript compilation errors
- [x] Test chat response time in production
- [x] Deploy to Railway


## Phase 42: Typing Indicator + Streaming Responses for ROPA Chat
- [x] Verify production chat response time after Railway deploy
- [x] Add "ROPA está escribiendo..." typing indicator while LLM processes
- [x] Implement streaming endpoint for progressive text display
- [x] Update frontend to consume streaming responses
- [x] Test streaming and typing indicator end-to-end
- [ ] Deploy to Railway


## Phase 43: ROPA n8n Orchestration + Super Meta-Agent
- [ ] Create n8n workflow "ROPA Meta-Agent - Ivy.AI Orchestrator" with Code node
- [x] Test n8n webhook receives and processes messages correctly
- [ ] Add n8n as 4th tier LLM fallback in ROPA backend (Gemini → Manus → n8n → Local)
- [ ] Upgrade generateFallbackResponse to be a full intelligent ROPA Brain
- [ ] Ensure ALL production tools work: navigation, companies, campaigns, emails, Drive, web search, analytics
- [ ] Connect n8n webhook to Ivy.AI backend as orchestration proxy
- [ ] Test end-to-end ROPA chat with all tools working
- [ ] Save checkpoint

## Phase 44: Update Gemini API Key
- [ ] Update Gemini API key in n8n credentials
- [ ] Update Gemini API key in Ivy.AI backend environment
- [ ] Test Gemini LLM works with new key

## Phase 45: ROPA Speed Optimization
- [x] Optimize chat-stream endpoint to respond faster (< 2s for direct commands)
- [x] Prioritize ROPA Brain TIER 0 for instant responses before LLM calls
- [x] Reduce DB call overhead in chat flow

## Phase 46: CRITICAL - Fix ROPA Chat 30min Delay Bug
- [ ] Diagnose what is blocking/hanging in chat-stream endpoint
- [ ] Fix the blocking issue
- [ ] Verify response time < 3 seconds

## Phase 48: Fix ROPA Navigation Not Working
- [ ] Diagnose why ROPA says "Navegando a Campañas" but frontend doesn't change page
- [ ] Fix navigation command execution in frontend
- [ ] Verify navigation works for all sections

## Phase 44: Full Email Approval Flow + Campaign/Calendar Integration
- [x] Backend: sendApprovedEmails endpoint calls n8n mass email webhook (Outlook)
- [x] Backend: emailSendCallback endpoint receives n8n delivery results
- [x] Backend: When emails approved → auto-create/update campaign as "En Progreso" in DB
- [x] Backend: When emails approved → auto-update calendar with In Progress campaigns
- [x] Frontend: "Confirmar Envío" button for approved emails in Monitor (requires owner click)
- [x] Frontend: Cancel button to abort pending sends
- [x] Frontend: Update draft status to "sent" after n8n confirms delivery
- [x] Frontend: Professional HTML email preview in Monitor popup with FAGOR branding
- [x] Frontend: Rejected drafts removed from Monitor list
- [x] Frontend: Calendar auto-displays all In Progress campaigns from DB
- [x] Frontend: Dashboard auto-refresh on section navigation
- [x] Frontend: Real campaign progress tracking on dashboard
- [x] Write vitest tests for new endpoints (10 tests passing)
- [ ] Save checkpoint

## Phase 45: Bug Fixes - Calendar Route & ROPA Time-Aware Greeting
- [x] Fix /calendar route returning 404 (add route in App.tsx)
- [x] Make ROPA greeting time-aware based on user's local time/day
- [x] Add "Borrar Empresas" button in Campaigns page to delete companies
- [x] Write vitest tests (10 tests passing)

## Phase 46: Fix Production DB - sales_campaigns table missing
- [x] Verified sales_campaigns table exists in production DB (not missing)
- [x] Add try-catch protection to campaigns query to prevent error spam
- [x] Push fix to GitHub for Railway deployment
- [x] Reduced all polling intervals (5s→30s, 3s→30s, 2s→5s) to prevent DB connection exhaustion
- [ ] Verify production logs are clean

## Phase 47: Full-Screen Preview Button + Premium Email Template
- [x] Activate Preview button in MonitorDraftPopup to open full-screen email view
- [x] Upgrade email HTML template to high-end/premium quality for PDF attachment
- [x] Push to GitHub for Railway deployment

## Phase 48: Customizable CTA Button Text per Campaign
- [x] Add CTA text input field in MonitorDraftPopup (editable per email draft)
- [x] Pass CTA text to premium email template (generatePremiumFagorEmail)
- [x] Auto-suggest CTA text based on campaign name (e.g., CNC Upgrade → "Request CNC Demo")
- [x] Save CTA text with draft when editing
- [x] CTA editor visible in both edit mode and preview mode
- [x] Auto-suggest button with campaign-based intelligence
- [x] Live CTA button preview in both modes
- [x] 13 vitest tests passing
- [x] Push to GitHub for Railway deployment

## Phase 52: ROPA Sales Agency Orchestrator + Bug Fixes
- [x] Fix ivy_clients table - table already exists in DB, verified columns match schema
- [x] Company CRUD: create, read, update, delete with full fields
- [x] Immediate strategy generation on company creation (LLM-powered via invokeLLM)
- [x] Google Drive folder automation: create folder structure on company creation
- [x] Agent orchestration: assign tasks to ARIA/LUCA/NOVA/SAGE
- [x] KPI/ROI reporting system with campaign metrics (reportingTools.generateKPIReport/generateROIReport)
- [x] Company details reporting (reportingTools.getCompanyDetails)
- [ ] Auto-save reports to Google Drive (deferred - requires Drive write access)
- [x] Update ROPA Brain for new company/campaign commands
- [x] Fix createCompany platform tool to use ivy_clients table
- [x] Botones de borrado para empresas, campañas y tareas (delete campaign dialog + delete/clear tasks)
- [x] Auto-hide rejected emails from monitor list (filtered out unless explicit status filter)
- [x] FAGOR logo update in email templates (CDN: manuscdn.com)
- [x] Print/PDF format fix for email preview (new window approach with inline CSS)
- [x] ROPA Brain v3.0 expanded vocabulary (25+ intent categories, shouldDeferToLLM)
- [x] 89 vitest tests passing (8 test files)

## Phase 53: ROPA Company Filtering Tools + Drive Auto-Save + Notifications
- [x] DB: getTasksByCompany - filter tasks by company name (ropa-company-filters.ts)
- [x] DB: getCampaignsByCompany - filter campaigns by company name
- [x] DB: getEmailDraftsByCompany - filter email drafts by company (approved/rejected/pending)
- [x] DB: getAlertsByCompany - filter alerts by company name
- [x] DB: getLeadsByCompany - filter leads by company name
- [x] DB: getFilesByCompany - filter files by company name
- [x] DB: getCompanyOverview - full overview of a company (tasks, campaigns, emails, alerts, leads, files)
- [x] Platform tool: companyFilterTools - 8 filtering tools for ROPA
- [x] Platform tool: listTasksForCompany
- [x] Platform tool: listCampaignsForCompany
- [x] Platform tool: listEmailDraftsForCompany
- [x] Platform tool: listAlertsForCompany
- [x] Platform tool: listLeadsForCompany
- [x] Platform tool: listFilesForCompany
- [x] Platform tool: getCompanyFullOverview
- [x] Platform tool: getAllCompanySummaries
- [x] ROPA Brain: handle "tareas de empresa X", "campañas de X", "emails de X", "alertas de X"
- [x] ROPA Brain: handle "resumen de empresa X", "overview de X"
- [x] ROPA Brain: handle "leads de X", "archivos de X"
- [x] ROPA Brain: isCompanyFilterPattern guard prevents false matches in navigation/stats/funnel/drive
- [x] Google Drive: auto-save KPI/ROI reports to client folder (ropa-drive-reports.ts)
- [x] Push notifications: notifyTaskCompletion, notifyEmailsGenerated, notifyReportReady
- [x] Push notifications integrated into ROPA Brain email generation and KPI report flows
- [x] 99 vitest tests passing (8 test files, 34 in ropa-features.test.ts)

## Phase 54: Production Bug Fixes
- [x] Fix getCampaignsByCompany - removed .limit() from all queries (TiDB LIMIT parameter bug)
- [x] Verify all company filter DB queries match actual table columns
- [x] Added missing columns to sales_campaigns via ALTER TABLE

## Fix: Company Filter SQL Error in Production
- [x] Diagnose "Failed query" errors in production for company filtering
- [x] Rewrite ropa-company-filters.ts with safeQuery wrapper and raw SQL fallback
- [x] Handle both Drizzle field names (camelCase) and raw SQL field names (snake_case)
- [x] Handle taskType vs type field name mismatch in ropaTasks
- [x] Add 15 new tests for robust error handling (all passing)
- [x] Verify all 114 tests pass
- [x] Push to GitHub and deploy to Railway

## Fix: "Failed query" error when creating companies via ROPA chat
- [x] Apply safeQuery pattern to createCompany in ropa-platform-tools.ts
- [x] Apply safeQuery pattern to all other DB operations in ropa-platform-tools.ts (listCompanies, createCampaign, etc.)
- [ ] Apply safeQuery pattern to campaigns-router.ts DB queries
- [x] Run tests and verify
- [x] Push to GitHub for Railway deployment

## n8n Integration for Mass Outreach
- [x] Fix createCompany "Failed query" error with safeQuery/raw SQL fallback
- [x] Fix all other DB queries in ropa-platform-tools.ts with safeQuery pattern
- [x] Explore n8n instance and available workflows
- [x] Integrate existing n8n email workflow (Ivy.AI - Mass Email Sender via Outlook)
- [ ] Create n8n webhook workflow for phone calls (requires Twilio in n8n)
- [ ] Create n8n webhook workflow for SMS messages (requires Twilio in n8n)
- [x] Create n8n-integration.ts service (sendMassEmails, sendMassSMS, triggerMassCalls, executeMultiChannelCampaign)
- [x] Add ROPA Brain intents for mass email and send approved drafts
- [x] Update ROPA system prompt with n8n mass outreach capabilities
- [x] Add n8n webhook URL environment variables (N8N_WEBHOOK_BASE_URL, N8N_EMAIL_WEBHOOK_PATH, etc.)
- [x] Add 6 vitest tests for n8n integration (all passing)
- [x] All 120 tests passing
- [ ] Auto-trigger n8n workflows when new company is created
- [x] Push to GitHub for Railway deployment

## Phase 55: ROPA Autonomous Company Onboarding Workflow
- [x] Fix INSERT company error in production (safeQuery + raw SQL fallback)
- [x] Build autonomous onboarding engine: on company creation, read Google Drive docs
- [x] Parse company profile from Drive docs (industry, products, target market, brand voice)
- [x] Auto-generate marketing campaigns based on company profile
- [x] Create tasks per campaign in Tareas section with progress tracking
- [x] Generate market alerts in Alertas section (client preferences, market changes)
- [x] Auto-adjust campaigns based on market intelligence
- [x] Generate email/SMS/call drafts and present in Monitor for approval
- [x] Sync all campaigns to Calendar with company filter and drag-and-drop
- [x] Calendar drag-and-drop updates propagate to all sections (Tareas, Alertas, Monitor, ROPA)
- [ ] Company filter works across all pages (Dashboard, Campañas, Calendario, Tareas, Alertas)
- [x] Run tests and verify (132 tests passing)
- [ ] Push to GitHub for Railway deployment

## Phase 55b: ROPA Advanced Configuration - Autonomous Onboarding Engine
- [x] Create ropa-onboarding-engine.ts with full autonomous workflow (~950 lines)
- [x] Protocol 1: Google Drive ingestion - read all docs from company folder
- [x] Protocol 1: LLM analysis of company profile (brand, products, target market)
- [x] Protocol 1: Auto-generate marketing campaigns based on profile analysis
- [x] Protocol 2A: Task decomposition - break campaigns into granular executable tasks
- [x] Protocol 2B: Market Watch alerts - track consumer/market changes per company
- [x] Protocol 2B: Auto-propose campaign adjustments based on market alerts
- [x] Protocol 2C: Monitor approval workflow - email/SMS/call drafts pending approval
- [x] Protocol 3: Calendar multi-company visualization with company filter
- [x] Protocol 3: Drag-and-drop chain reaction - update Tasks, Monitor, Reports on date change
- [x] Protocol 3: Viability recalculation after calendar drag-and-drop
- [x] Protocol 4: 24/7 progress monitoring with KPI color coding in Calendar
- [x] Integrate onboarding engine into createCompany flow
- [x] Add ROPA Brain intents for onboarding commands (onboard_all, onboard_specific, monitor_progress)
- [x] Update campaigns-router.ts with calendar sync endpoints (moveCampaign, getCampaignContent, updateContentStatus, getCompanies)
- [x] Apply autonomous onboarding engine to ALL companies (existing like FAGOR, EPM, TechStart + new like PETLIFE 360)
- [x] Add "onboard existing companies" startup routine in ropa-autonomous.ts (30s delay after boot)
- [x] 132 tests passing (12 new onboarding engine tests)
