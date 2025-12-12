import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Plus, Search, Filter, LayoutGrid, List, Calendar as CalendarIcon, RefreshCw, Smartphone, Monitor, Mail, MessageCircle, BarChart2 } from 'lucide-react';
import TableView from '../components/campaigns/TableView';
import KanbanView from '../components/campaigns/KanbanView';
import CalendarView from '../components/campaigns/CalendarView';
import { Campaign, CampaignStatus, CampaignType } from '@/types/campaign';

type ViewType = 'table' | 'kanban' | 'calendar';

export default function CampaignsDashboard() {
    const [view, setView] = useState<ViewType>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all');

    // Fetch campaigns
    const { data: campaigns = [], isLoading, refetch } = trpc.multiChannelCampaigns.list.useQuery();

    // Stats calculation
    const stats = React.useMemo(() => {
        const total = campaigns.length;
        const active = campaigns.filter(c => c.status === 'active' || c.status === 'in-progress').length;
        const leads = campaigns.reduce((acc, c) => acc + c.leadsGenerated, 0);
        const conversions = campaigns.reduce((acc, c) => acc + c.leadsConverted, 0);
        const avgConversion = total > 0 ? (conversions / leads * 100).toFixed(1) : '0.0';

        return { total, active, leads, avgConversion };
    }, [campaigns]);

    // Filter campaigns
    const filteredCampaigns = React.useMemo(() => {
        return campaigns.filter(c => {
            const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.objective.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesType = typeFilter === 'all' || c.campaignType === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [campaigns, searchQuery, statusFilter, typeFilter]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#111111]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#111111] text-white p-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <BarChart2 className="text-blue-500" size={20} />
                        </div>
                        <span className="text-gray-400 text-sm">Total Campañas</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <RefreshCw className="text-green-500" size={20} />
                        </div>
                        <span className="text-gray-400 text-sm">Activas</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <MessageCircle className="text-purple-500" size={20} />
                        </div>
                        <span className="text-gray-400 text-sm">Leads Generados</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.leads}</p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <TrendingUpIcon />
                        </div>
                        <span className="text-gray-400 text-sm">Conv. Promedio</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.avgConversion}%</p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Meta-Agent Campaigns
                    </h1>
                    <div className="h-8 w-px bg-gray-800 hidden md:block"></div>
                    <div className="bg-[#1a1a1a] flex p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setView('kanban')}
                            className={`p-2 rounded-md transition-all ${view === 'kanban' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`p-2 rounded-md transition-all ${view === 'table' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`p-2 rounded-md transition-all ${view === 'calendar' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <CalendarIcon size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar campaña..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <button className="p-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Filter size={20} />
                    </button>

                    <button
                        onClick={() => refetch()}
                        className="p-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-900/20">
                        <Plus size={20} />
                        <span>Nueva Campaña</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 min-h-[600px] p-4">
                {view === 'kanban' && <KanbanView campaigns={filteredCampaigns} onUpdate={refetch} />}
                {view === 'table' && <TableView campaigns={filteredCampaigns} onUpdate={refetch} />}
                {view === 'calendar' && <CalendarView campaigns={filteredCampaigns} onUpdate={refetch} />}
            </div>
        </div>
    );
}

function TrendingUpIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}
