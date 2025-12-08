import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, TrendingUp, Users, Target } from 'lucide-react';
import { Campaign, agentColors, campaignTypeIcons } from '../../types/campaign';

interface CampaignCardProps {
    campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: campaign.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all cursor-move"
        >
            {/* Drag Handle */}
            <div className="flex items-start gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
                    <GripVertical size={16} className="text-gray-600" />
                </div>

                <div className="flex-1">
                    {/* Client Info */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                            {campaign.clientName.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">{campaign.clientName}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${agentColors[campaign.agentType]}`}>
                                {campaign.agentType}
                            </span>
                        </div>
                    </div>

                    {/* Campaign Type */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{campaignTypeIcons[campaign.campaignType]}</span>
                        <span className="text-sm text-gray-400 capitalize">{campaign.campaignType}</span>
                    </div>

                    {/* Objective */}
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {campaign.objective}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-[#0a0a0a] rounded p-2">
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                <Users size={12} />
                                <span>Leads</span>
                            </div>
                            <div className="font-semibold text-cyan-400">{campaign.leadsGenerated}</div>
                        </div>
                        <div className="bg-[#0a0a0a] rounded p-2">
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                <TrendingUp size={12} />
                                <span>Conversión</span>
                            </div>
                            <div className={`font-semibold ${campaign.conversionRate > 20 ? 'text-green-400' : 'text-amber-400'}`}>
                                {campaign.conversionRate}%
                            </div>
                        </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Target size={12} />
                        <span>Objetivo: {new Date(campaign.targetDate).toLocaleDateString('es-ES')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
