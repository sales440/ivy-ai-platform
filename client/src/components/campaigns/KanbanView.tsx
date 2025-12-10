import { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Campaign, CampaignStatus, statusLabels, statusColors } from '../../types/campaign';
import { trpc } from '../../lib/trpc';
import CampaignCard from './CampaignCard';

interface KanbanViewProps {
    campaigns: Campaign[];
    onUpdate: () => void;
}

const columns: CampaignStatus[] = ['pending', 'active', 'in-progress', 'paused', 'completed'];

export default function KanbanView({ campaigns, onUpdate }: KanbanViewProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const utils = trpc.useContext();
    const updateStatus = trpc.multiChannelCampaigns.updateStatus.useMutation({
        onSuccess: () => {
            utils.multiChannelCampaigns.list.invalidate();
            onUpdate();
        }
    });

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const newStatus = over.id as CampaignStatus;
            updateStatus.mutate({
                id: Number(active.id),
                status: newStatus
            });
        }

        setActiveId(null);
    };

    const activeCampaign = campaigns.find(c => c.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {columns.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        campaigns={campaigns.filter(c => c.status === status)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeCampaign && (
                    <div className="opacity-50">
                        <CampaignCard campaign={activeCampaign} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ status, campaigns }: { status: CampaignStatus; campaigns: Campaign[] }) {
    return (
        <div className="flex flex-col h-full">
            {/* Column Header */}
            <div className={`px-4 py-3 rounded-t-lg border-t-4 ${statusColors[status]} bg-[#2a2a2a] mb-3`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{statusLabels[status]}</h3>
                    <span className="text-sm bg-[#1a1a1a] px-2 py-1 rounded-full">{campaigns.length}</span>
                </div>
            </div>

            {/* Cards Container */}
            <SortableContext
                id={status}
                items={campaigns.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 space-y-3 min-h-[200px]">
                    {campaigns.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-sm">No hay campañas</p>
                        </div>
                    ) : (
                        campaigns.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
