import { Campaign } from '../types/campaign';
import campaignsData from '../data/campaigns.json';

// Local storage key
const STORAGE_KEY = 'meta-agent-campaigns';

// Get all campaigns
export const getCampaigns = (): Campaign[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize with default data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(campaignsData.campaigns));
        return campaignsData.campaigns as Campaign[];
    } catch (error) {
        console.error('Error loading campaigns:', error);
        return campaignsData.campaigns as Campaign[];
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
