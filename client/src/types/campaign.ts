// Campaign Data Types
export interface Campaign {
    id: number | string;
    companyId: number;
    clientName?: string;
    agentType?: 'IVY-PROSPECT' | 'IVY-QUALIFY' | 'IVY-ENGAGE' | 'IVY-SCHEDULE' | 'IVY-SUPPORT';
    campaignType?: 'email' | 'cold-call' | 'linkedin' | 'multi-channel';
    status: 'draft' | 'pending' | 'active' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
    objective?: string;
    targetDate?: string;
    publishDate?: string;
    leadsGenerated?: number;
    leadsConverted?: number;
    conversionRate?: number;
    notes?: string;
    links?: string[];
    createdAt: string | Date;
    updatedAt: string | Date;
}

export type CampaignStatus = Campaign['status'];
export type AgentType = Campaign['agentType'];
export type CampaignType = Campaign['campaignType'];

// Status color mapping
export const statusColors: Record<CampaignStatus, string> = {
    pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// Agent type color mapping
export const agentColors: Record<AgentType, string> = {
    'IVY-PROSPECT': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'IVY-QUALIFY': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'IVY-ENGAGE': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'IVY-SCHEDULE': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'IVY-SUPPORT': 'bg-green-500/20 text-green-400 border-green-500/30',
};

// Campaign type icons
export const campaignTypeIcons: Record<CampaignType, string> = {
    email: '📧',
    'cold-call': '📞',
    linkedin: '💼',
    'multi-channel': '🎯',
};

// Status labels
export const statusLabels: Record<CampaignStatus, string> = {
    pending: 'Pendiente',
    active: 'Activo',
    'in-progress': 'En Progreso',
    paused: 'Pausado',
    completed: 'Completado',
    cancelled: 'Cancelado',
};
