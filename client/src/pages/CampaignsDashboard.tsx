import { useState, useEffect } from 'react';
import { LayoutGrid, Table, Calendar, Plus, Search, Filter } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { getCampaigns, calculateMetrics } from '../lib/campaigns';
import TableView from '../components/campaigns/TableView';
import KanbanView from '../components/campaigns/KanbanView';
import CalendarView from '../components/campaigns/CalendarView';

type ViewMode = 'table' | 'kanban' | 'calendar';

export default function CampaignsDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = () => {
        const data = getCampaigns();
        setCampaigns(data);
    };

    const metrics = calculateMetrics(campaigns);

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            campaign.objective.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Meta-Agent Campaign Dashboard</h1>
                        <p className="text-gray-400">Gestiona todas tus campañas de marketing y ventas</p>
                    </div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105">
                        <Plus size={20} />
                        Nueva Campaña
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        title="Total Campañas"
                        value={metrics.total}
                        icon="🎯"
                        color="from-blue-500 to-cyan-500"
                    />
                    <MetricCard
                        title="Campañas Activas"
                        value={metrics.active}
                        icon="⚡"
                        color="from-green-500 to-emerald-500"
                    />
                    <MetricCard
                        title="Leads Generados"
                        value={metrics.totalLeads}
                        icon="👥"
                        color="from-purple-500 to-pink-500"
                    />
                    <MetricCard
                        title="Tasa de Conversión"
                        value={`${metrics.avgConversion}%`}
                        icon="📈"
                        color="from-amber-500 to-orange-500"
                    />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-gray-800">
                    {/* Search */}
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar campañas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="active">Activo</option>
                            <option value="in-progress">En Progreso</option>
                            <option value="paused">Pausado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>

                    {/* View Mode Switcher */}
                    <div className="flex gap-2 bg-[#0a0a0a] p-1 rounded-lg border border-gray-700">
                        <ViewButton
                            icon={<Table size={18} />}
                            label="Tabla"
                            active={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                        />
                        <ViewButton
                            icon={<LayoutGrid size={18} />}
                            label="Kanban"
                            active={viewMode === 'kanban'}
                            onClick={() => setViewMode('kanban')}
                        />
                        <ViewButton
                            icon={<Calendar size={18} />}
                            label="Calendario"
                            active={viewMode === 'calendar'}
                            onClick={() => setViewMode('calendar')}
                        />
                    </div>
                </div>
            </div>

            {/* Views */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
                {viewMode === 'table' && <TableView campaigns={filteredCampaigns} onUpdate={loadCampaigns} />}
                {viewMode === 'kanban' && <KanbanView campaigns={filteredCampaigns} onUpdate={loadCampaigns} />}
                {viewMode === 'calendar' && <CalendarView campaigns={filteredCampaigns} onUpdate={loadCampaigns} />}
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
    return (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{title}</span>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {value}
            </div>
        </div>
    );
}

// View Button Component
function ViewButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
