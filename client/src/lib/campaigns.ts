import { Campaign } from '../types/campaign';

// Local storage key
const STORAGE_KEY = 'meta-agent-campaigns';

// Default campaigns data
const defaultCampaigns: Campaign[] = [
    {
        id: "camp-001",
        clientId: 1,
        clientName: "Ivy.AI Platform",
        agentType: "IVY-PROSPECT",
        campaignType: "multi-channel",
        status: "active",
        objective: "Generar 100 leads calificados para la plataforma SaaS",
        targetDate: "2025-12-31",
        publishDate: "2025-12-08",
        leadsGenerated: 47,
        leadsConverted: 12,
        conversionRate: 25.5,
        notes: "Campaña inicial de prospección. Enfocada en CTOs y VPs de Engineering.",
        links: ["https://ivy.ai/campaign-001"],
        createdAt: "2025-12-08T00:00:00Z",
        updatedAt: "2025-12-08T00:00:00Z"
    },
    {
        id: "camp-002",
        clientId: 2,
        clientName: "FAGOR Automation",
        agentType: "IVY-ENGAGE",
        campaignType: "email",
        status: "in-progress",
        objective: "Nutrir leads existentes con contenido técnico",
        targetDate: "2025-12-20",
        publishDate: "2025-12-10",
        leadsGenerated: 35,
        leadsConverted: 8,
        conversionRate: 22.9,
        notes: "Drip campaign de 3 emails. Enfoque en automatización industrial.",
        links: ["https://fagor.com/campaign-002"],
        createdAt: "2025-12-07T00:00:00Z",
        updatedAt: "2025-12-07T12:00:00Z"
    },
    {
        id: "camp-003",
        clientId: 3,
        clientName: "PET LIFE 360",
        agentType: "IVY-QUALIFY",
        campaignType: "linkedin",
        status: "pending",
        objective: "Calificar leads de dueños de mascotas premium",
        targetDate: "2025-12-25",
        publishDate: "2025-12-15",
        leadsGenerated: 0,
        leadsConverted: 0,
        conversionRate: 0,
        notes: "Campaña de LinkedIn targeting. Esperando aprobación de contenido.",
        links: [],
        createdAt: "2025-12-08T00:00:00Z",
        updatedAt: "2025-12-08T00:00:00Z"
    }
];

// Get all campaigns
export const getCampaigns = (): Campaign[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize with default data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCampaigns));
        return defaultCampaigns;
    } catch (error) {
        console.error('Error loading campaigns:', error);
        return defaultCampaigns;
    }
};

// Get campaign by ID
export const getCampaignById = (id: string): Campaign | undefined => {
    const campaigns = getCampaigns();
    return campaigns.find(c => c.id === id);
};

// Create new campaign
export const createCampaign = (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign => {
    const campaigns = getCampaigns();
    const newCampaign: Campaign = {
        ...campaign,
        id: `camp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    campaigns.push(newCampaign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    return newCampaign;
};

// Update campaign
export const updateCampaign = (id: string, updates: Partial<Campaign>): Campaign | null => {
    const campaigns = getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;

    campaigns[index] = {
        ...campaigns[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    return campaigns[index];
};

// Delete campaign
export const deleteCampaign = (id: string): boolean => {
    const campaigns = getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    if (filtered.length === campaigns.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
};

// Update campaign status
export const updateCampaignStatus = (id: string, status: Campaign['status']): Campaign | null => {
    return updateCampaign(id, { status });
};

// Calculate metrics
export const calculateMetrics = (campaigns: Campaign[]) => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + c.leadsConverted, 0);
    const avgConversion = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;

    return {
        total,
        active,
        completed,
        totalLeads,
        totalConverted,
        avgConversion: Math.round(avgConversion * 10) / 10,
    };
};
