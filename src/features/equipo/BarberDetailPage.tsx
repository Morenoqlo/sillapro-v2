import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { useBarberDetail } from './hooks/useBarberDetail';
import { useBarberMonthStats } from './hooks/useBarberMonthStats';
import { useBarberServiceCommissions } from './hooks/useBarberServiceCommissions';
import { BarberDetailHeader } from './BarberDetailHeader';
import { BarberDetailKPIs } from './BarberDetailKPIs';
import { BarberHistoryTab } from './BarberHistoryTab';
import { BarberServicesTab } from './BarberServicesTab';

type Tab = 'history' | 'services';

const TABS: { key: Tab; label: string }[] = [
  { key: 'history', label: 'Historial del mes' },
  { key: 'services', label: 'Servicios asignados' },
];

const EMPTY_STATS = {
  appointments: [],
  completedCount: 0,
  grossRevenue: 0,
  barberCommission: 0,
  barberTips: 0,
};

export function BarberDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: barber, isLoading: loadingBarber } = useBarberDetail(id);
  const { data: monthStats, isLoading: loadingStats } = useBarberMonthStats(id);
  const { data: services = [], isLoading: loadingServices } = useBarberServiceCommissions(id);
  const [activeTab, setActiveTab] = useState<Tab>('history');

  if (loadingBarber) return <p className="text-sm text-gray-500">Cargando...</p>;
  if (!barber) {
    return (
      <EmptyState
        title="Barbero no encontrado"
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/equipo')}>
            ← Volver a Equipo
          </Button>
        }
      />
    );
  }

  const stats = monthStats ?? EMPTY_STATS;
  const assignedCount = services.filter((s) => s.is_assigned).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="tertiary" size="sm" onClick={() => navigate('/admin/equipo')}>
          ← Equipo
        </Button>
      </div>

      <BarberDetailHeader barber={barber} />

      <BarberDetailKPIs
        stats={stats}
        assignedServicesCount={assignedCount}
        loadingStats={loadingStats}
        loadingServices={loadingServices}
      />

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        <BarberHistoryTab appointments={stats.appointments} loading={loadingStats} />
      )}

      {activeTab === 'services' && (
        <BarberServicesTab barberId={id} services={services} loading={loadingServices} />
      )}
    </div>
  );
}
