import { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Campaign, statusColors, agentColors } from '../../types/campaign';
import './CalendarView.css';

interface CalendarViewProps {
    campaigns: Campaign[];
    onUpdate: () => void;
}

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: es }),
    getDay,
    locales,
});

interface CampaignEvent extends Event {
    campaign: Campaign;
}

export default function CalendarView({ campaigns, onUpdate }: CalendarViewProps) {
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

    const events: CampaignEvent[] = useMemo(() => {
        return campaigns.map(campaign => ({
            title: `${campaign.clientName} - ${campaign.objective.substring(0, 30)}...`,
            start: new Date(campaign.publishDate),
            end: new Date(campaign.targetDate),
            campaign,
        }));
    }, [campaigns]);

    const eventStyleGetter = (event: CampaignEvent) => {
        const campaign = event.campaign;
        const statusColor = statusColors[campaign.status];

        return {
            style: {
                backgroundColor: statusColor.includes('green') ? '#10B981' :
                    statusColor.includes('blue') ? '#3B82F6' :
                        statusColor.includes('purple') ? '#8B5CF6' :
                            statusColor.includes('orange') ? '#FFA500' :
                                statusColor.includes('amber') ? '#F59E0B' : '#EF4444',
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: 'none',
                display: 'block',
            },
        };
    };

    return (
        <div className="calendar-container">
            <div className="h-[600px]">
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event: CampaignEvent) => setSelectedCampaign(event.campaign)}
                    messages={{
                        next: 'Siguiente',
                        previous: 'Anterior',
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        agenda: 'Agenda',
                        date: 'Fecha',
                        time: 'Hora',
                        event: 'Campaña',
                        noEventsInRange: 'No hay campañas en este rango',
                    }}
                />
            </div>

            {/* Campaign Detail Modal */}
            {selectedCampaign && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setSelectedCampaign(null)}
                >
                    <div
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                                {selectedCampaign.clientName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{selectedCampaign.clientName}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full border ${agentColors[selectedCampaign.agentType]}`}>
                                    {selectedCampaign.agentType}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-400">Objetivo</label>
                                <p className="text-white">{selectedCampaign.objective}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-400">Fecha de Publicación</label>
                                    <p className="text-white">{new Date(selectedCampaign.publishDate).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Fecha Objetivo</label>
                                    <p className="text-white">{new Date(selectedCampaign.targetDate).toLocaleDateString('es-ES')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#0a0a0a] rounded p-3">
                                    <label className="text-xs text-gray-400">Leads</label>
                                    <p className="text-lg font-bold text-cyan-400">{selectedCampaign.leadsGenerated}</p>
                                </div>
                                <div className="bg-[#0a0a0a] rounded p-3">
                                    <label className="text-xs text-gray-400">Convertidos</label>
                                    <p className="text-lg font-bold text-green-400">{selectedCampaign.leadsConverted}</p>
                                </div>
                                <div className="bg-[#0a0a0a] rounded p-3">
                                    <label className="text-xs text-gray-400">Conversión</label>
                                    <p className="text-lg font-bold text-purple-400">{selectedCampaign.conversionRate}%</p>
                                </div>
                            </div>

                            {selectedCampaign.notes && (
                                <div>
                                    <label className="text-sm text-gray-400">Notas</label>
                                    <p className="text-white text-sm">{selectedCampaign.notes}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedCampaign(null)}
                            className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-4 py-2 rounded-lg font-semibold transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
