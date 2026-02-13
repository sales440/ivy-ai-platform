import { describe, it, expect, vi } from 'vitest';
import { processWithRopaBrain } from './ropa-brain';

// Mock the platform tools and services to avoid DB/API calls
vi.mock('./ropa-platform-tools', () => ({
  ropaPlatformTools: {
    createCompany: vi.fn().mockResolvedValue({ success: true, clientId: 'test-001', companyName: 'TestCo' }),
    listCompanies: vi.fn().mockResolvedValue({ success: true, companies: [] }),
    generateCampaignEmailDrafts: vi.fn().mockResolvedValue({ success: true, count: 3, drafts: [] }),
    createCampaign: vi.fn().mockResolvedValue({ success: true, campaignId: 1 }),
  },
  reportingTools: {
    generateKPIReport: vi.fn().mockResolvedValue({
      success: true,
      report: {
        summary: { totalCompanies: 5, activeCompanies: 3, totalCampaigns: 10, activeCampaigns: 4, completedCampaigns: 6, totalEmailDrafts: 50, approvedEmails: 30, sentEmails: 20, totalLeads: 25, qualifiedLeads: 10, closedWon: 5, closedLost: 3 },
        kpis: { emailApprovalRate: '60%', leadConversionRate: '20%', campaignCompletionRate: '60%', avgCampaignsPerCompany: '2.0', avgLeadsPerCampaign: '2.5' },
        companiesDetail: [],
      },
    }),
    generateROIReport: vi.fn().mockResolvedValue({
      success: true,
      report: {
        costs: { emailCosts: '$1.00', agencyCost: '$2000', totalCost: '$2001.00' },
        revenue: { qualifiedLeadValue: '$5000.00', closedDealValue: '$25000.00', totalRevenue: '$30000.00' },
        roi: '1399.4%',
        metrics: { emailsSent: 20, leadsGenerated: 25, leadsQualified: 10, dealsClosed: 5, conversionRate: '20.0%' },
      },
    }),
    getCompanyDetails: vi.fn().mockResolvedValue({
      success: true,
      company: {
        clientId: 'test-001',
        companyName: 'FAGOR',
        industry: 'Automation',
        status: 'active',
        plan: 'premium',
        contactName: 'John',
        contactEmail: 'john@fagor.com',
        campaigns: 3,
        emailDrafts: 10,
        pendingDrafts: 2,
        approvedDrafts: 5,
        sentDrafts: 3,
        googleDriveFolderId: 'abc123',
        createdAt: new Date(),
      },
    }),
  },
  PLATFORM_TOOLS_COUNT: 22,
}));

vi.mock('./ropa-super-tools', () => ({
  ropaSuperTools: {
    getDashboardMetrics: vi.fn().mockResolvedValue({ health: 'Operativa', tasksCompleted: 100, successRate: 98 }),
    getLeadFunnelAnalytics: vi.fn().mockResolvedValue({ summary: 'Funnel data' }),
    webSearch: vi.fn().mockResolvedValue({ results: [] }),
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
    researchCompany: vi.fn().mockResolvedValue({ summary: 'Research data' }),
  },
  SUPER_TOOLS_COUNT: 10,
}));

vi.mock('./ropa-navigation-service', () => ({
  ropaNavigationTools: {
    navigateTo: vi.fn().mockResolvedValue({ success: true, message: 'Navegado' }),
    openNewCompanyDialog: vi.fn().mockResolvedValue({ success: true }),
    openNewCampaignDialog: vi.fn().mockResolvedValue({ success: true }),
    maximizeChat: vi.fn().mockResolvedValue({ success: true }),
    closeChat: vi.fn().mockResolvedValue({ success: true }),
  },
  IVY_SECTIONS: {},
}));

vi.mock('./ropa-drive-service', () => ({
  default: {
    listAllClients: vi.fn().mockResolvedValue({ clients: [] }),
    getFullFolderTree: vi.fn().mockResolvedValue({ tree: [] }),
    searchFiles: vi.fn().mockResolvedValue({ files: [] }),
    listAllFiles: vi.fn().mockResolvedValue({ files: [] }),
  },
}));

describe('ROPA Brain v3.0', () => {
  describe('Greetings', () => {
    it('should respond to "hola" with a greeting', async () => {
      const result = await processWithRopaBrain('hola', 10);
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenos días');
    });

    it('should respond to "buenas tardes" with afternoon greeting', async () => {
      const result = await processWithRopaBrain('buenas tardes', 15);
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenas tardes');
    });

    it('should respond to "buenas noches" with evening greeting', async () => {
      const result = await processWithRopaBrain('buenas noches', 21);
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenas noches');
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard', async () => {
      const result = await processWithRopaBrain('ve a dashboard');
      expect(result.intent).toBe('navigation');
      expect(result.command?.type).toBe('navigate');
      expect(result.command?.section).toBe('dashboard');
    });

    it('should navigate to campaigns', async () => {
      const result = await processWithRopaBrain('abre campañas');
      expect(result.intent).toBe('navigation');
      expect(result.command?.section).toBe('campaigns');
    });

    it('should navigate to monitor', async () => {
      const result = await processWithRopaBrain('muestra monitor');
      expect(result.intent).toBe('navigation');
      expect(result.command?.section).toBe('monitor');
    });

    it('should navigate to calendar', async () => {
      const result = await processWithRopaBrain('abre calendario');
      expect(result.intent).toBe('navigation');
      expect(result.command?.section).toBe('calendar');
    });
  });

  describe('Company Creation', () => {
    it('should create a company when asked', async () => {
      const result = await processWithRopaBrain('crea empresa PETLIFE 360');
      expect(result.intent).toBe('create_company');
      expect(result.platformActionExecuted).toBe(true);
    });

    it('should prompt for name when no company name given', async () => {
      const result = await processWithRopaBrain('crea empresa');
      expect(result.intent).toBe('create_company');
      expect(result.response).toContain('crea empresa');
    });
  });

  describe('Email Generation', () => {
    it('should generate emails for a company', async () => {
      const result = await processWithRopaBrain('genera 3 emails para FAGOR');
      expect(result.intent).toBe('generate_emails');
      expect(result.platformActionExecuted).toBe(true);
    });
  });

  describe('KPI Report', () => {
    it('should generate KPI report', async () => {
      const result = await processWithRopaBrain('reporte kpi');
      expect(result.intent).toBe('kpi_report');
      expect(result.platformActionExecuted).toBe(true);
      expect(result.response).toContain('REPORTE KPI');
    });
  });

  describe('ROI Report', () => {
    it('should generate ROI report', async () => {
      const result = await processWithRopaBrain('dame el roi');
      expect(result.intent).toBe('roi_report');
      expect(result.platformActionExecuted).toBe(true);
      expect(result.response).toContain('REPORTE ROI');
    });
  });

  describe('Company Details', () => {
    it('should get company details', async () => {
      const result = await processWithRopaBrain('detalles de empresa FAGOR');
      expect(result.intent).toBe('company_details');
      expect(result.platformActionExecuted).toBe(true);
      expect(result.response).toContain('FAGOR');
    });
  });

  describe('Dashboard Stats', () => {
    it('should return dashboard metrics', async () => {
      const result = await processWithRopaBrain('muestra estadísticas');
      expect(result.intent).toBe('dashboard_stats');
      expect(result.platformActionExecuted).toBe(true);
      expect(result.response).toContain('Estado del Sistema');
    });
  });

  describe('Help', () => {
    it('should show help when asked', async () => {
      const result = await processWithRopaBrain('ayuda');
      expect(result.intent).toBe('help');
      expect(result.response).toContain('ROPA');
      expect(result.response).toContain('NAVEGACIÓN');
    });
  });

  describe('Identity', () => {
    it('should identify itself', async () => {
      const result = await processWithRopaBrain('quién eres');
      expect(result.intent).toBe('identity');
      expect(result.response).toContain('ROPA');
      expect(result.response).toContain('meta-agente');
    });
  });

  describe('Gratitude', () => {
    it('should respond to thanks', async () => {
      const result = await processWithRopaBrain('gracias');
      expect(result.intent).toBe('gratitude');
    });
  });

  describe('Farewell', () => {
    it('should respond to goodbye', async () => {
      const result = await processWithRopaBrain('adiós');
      expect(result.intent).toBe('farewell');
      expect(result.response).toContain('Hasta luego');
    });
  });

  describe('Affirmative/Negative', () => {
    it('should handle affirmative', async () => {
      const result = await processWithRopaBrain('ok');
      expect(result.intent).toBe('affirmative');
    });

    it('should handle negative', async () => {
      const result = await processWithRopaBrain('no');
      expect(result.intent).toBe('negative');
    });
  });

  describe('shouldDeferToLLM', () => {
    it('should defer complex questions to LLM', async () => {
      const result = await processWithRopaBrain('explica la diferencia entre inbound y outbound marketing y cuál es mejor para mi negocio');
      expect(result.shouldDeferToLLM).toBe(true);
    });

    it('should defer list queries to LLM', async () => {
      const result = await processWithRopaBrain('cuántas empresas tengo');
      expect(result.shouldDeferToLLM).toBe(true);
    });
  });

  describe('Chat Control', () => {
    it('should maximize chat', async () => {
      const result = await processWithRopaBrain('maximiza el chat');
      expect(result.intent).toBe('maximize_chat');
    });
  });

  describe('Date/Time', () => {
    it('should return date/time', async () => {
      const result = await processWithRopaBrain('qué hora es');
      expect(result.intent).toBe('date_time');
      expect(result.response).toContain('Hoy es');
    });
  });
});
