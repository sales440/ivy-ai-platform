import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { Campaign, statusColors, agentColors, statusLabels, campaignTypeIcons } from '../../types/campaign';
import { updateCampaign, deleteCampaign } from '../../lib/campaigns';

interface TableViewProps {
    campaigns: Campaign[];
    onUpdate: () => void;
}

export default function TableView({ campaigns, onUpdate }: TableViewProps) {
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [noteValue, setNoteValue] = useState('');

    const handleSaveNotes = (id: string) => {
        updateCampaign(id, { notes: noteValue });
        setEditingNotes(null);
        onUpdate();
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar la campaña "${name}"?`)) {
            deleteCampaign(id);
            onUpdate();
        }
    };

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No hay campañas</h3>
                <p className="text-gray-500">Crea tu primera campaña para comenzar</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Cliente</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Agente</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Tipo</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Estado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Objetivo</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Fecha Objetivo</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Leads</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Conversión</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Notas</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((campaign) => (
                        <tr
                            key={campaign.id}
                            className="border-b border-gray-800 hover:bg-[#2a2a2a] transition-colors"
                        >
                            {/* Client Name */}
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                                        {campaign.clientName.charAt(0)}
                                    </div>
                                    <span className="font-semibold">{campaign.clientName}</span>
                                </div>
                            </td>

                            {/* Agent Type */}
                            <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${agentColors[campaign.agentType]}`}>
                                    {campaign.agentType}
                                </span>
                            </td>

                            {/* Campaign Type */}
                            <td className="py-4 px-4">
                                <span className="flex items-center gap-2">
                                    <span>{campaignTypeIcons[campaign.campaignType]}</span>
                                    <span className="capitalize">{campaign.campaignType}</span>
                                </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[campaign.status]}`}>
                                    {statusLabels[campaign.status]}
                                </span>
                            </td>

                            {/* Objective */}
                            <td className="py-4 px-4 max-w-xs">
                                <p className="truncate text-gray-300" title={campaign.objective}>
                                    {campaign.objective}
                                </p>
                            </td>

                            {/* Target Date */}
                            <td className="py-4 px-4 text-gray-400">
                                {new Date(campaign.targetDate).toLocaleDateString('es-ES')}
                            </td>

                            {/* Leads */}
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-cyan-400">{campaign.leadsGenerated}</span>
                                    <span className="text-xs text-gray-500">generados</span>
                                </div>
                            </td>

                            {/* Conversion */}
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${campaign.conversionRate > 20 ? 'text-green-400' : 'text-amber-400'}`}>
                                        {campaign.conversionRate}%
                                    </span>
                                    {campaign.conversionRate > 20 ? (
                                        <TrendingUp size={16} className="text-green-400" />
                                    ) : (
                                        <TrendingDown size={16} className="text-amber-400" />
                                    )}
                                </div>
                            </td>

                            {/* Notes */}
                            <td className="py-4 px-4 max-w-xs">
                                {editingNotes === campaign.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={noteValue}
                                            onChange={(e) => setNoteValue(e.target.value)}
                                            className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500"
                                            autoFocus
                                            onBlur={() => handleSaveNotes(campaign.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveNotes(campaign.id);
                                                if (e.key === 'Escape') setEditingNotes(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <p
                                        className="truncate text-gray-400 cursor-pointer hover:text-white"
                                        title={campaign.notes}
                                        onClick={() => {
                                            setEditingNotes(campaign.id);
                                            setNoteValue(campaign.notes);
                                        }}
                                    >
                                        {campaign.notes || 'Click para agregar...'}
                                    </p>
                                )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                    {campaign.links.length > 0 && (
                                        <a
                                            href={campaign.links[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-[#3a3a3a] rounded transition-colors"
                                            title="Ver enlace"
                                        >
                                            <ExternalLink size={16} className="text-gray-400 hover:text-cyan-400" />
                                        </a>
                                    )}
                                    <button
                                        className="p-2 hover:bg-[#3a3a3a] rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={16} className="text-gray-400 hover:text-blue-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(campaign.id, campaign.clientName)}
                                        className="p-2 hover:bg-[#3a3a3a] rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
