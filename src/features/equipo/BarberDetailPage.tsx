import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { StatusBadge } from '@/ui/StatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import { useBarberDetail } from './hooks/useBarberDetail';
import { useBarberMonthStats } from './hooks/useBarberMonthStats';
import { useBarberServiceCommissions, useToggleBarberService } from './hooks/useBarberServiceCommissions';

export function BarberDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: barber, isLoading: loadingBarber } = useBarberDetail(id);
  const { data: monthStats, isLoading: loadingStats } = useBarberMonthStats(id);
  const { data: services = [], isLoading: loadingServices } = useBarberServiceCommissions(id);
  const toggleService = useToggleBarberService(id);
  const [activeTab, setActiveTab] = useState<'history' | 'services'>('history');

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

  async function handleToggle(serviceId: string, currentlyEnabled: boolean) {
    try {
      await toggleService.mutateAsync({ serviceId, enabled: !currentlyEnabled });
      toast.success(currentlyEnabled ? 'Servicio removido' : 'Servicio asignado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  const stats = monthStats ?? {
    appointments: [],
    completedCount: 0,
    grossRevenue: 0,
    barberCommission: 0,
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="tertiary" size="sm" onClick={() => navigate('/admin/equipo')}>
          ← Equipo
        </Button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{barber.full_name}</h2>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge tone={barber.active ? 'active' : 'inactive'}>
            {barber.active ? 'Activo' : 'Inactivo'}
          </StatusBadge>
          <span className="text-sm text-gray-500">{barber.chair_label}</span>
          <span className="text-sm text-gray-500">· Comisión base {barber.commission_default}%</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Citas este mes</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {loadingStats ? '...' : stats.completedCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Facturación</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {loadingStats ? '...' : formatCLP(stats.grossRevenue)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Comisiones</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {loadingStats ? '...' : formatCLP(stats.barberCommission)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Servicios asignados</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {loadingServices ? '...' : services.filter((s) => s.is_assigned).length}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {(
          [
            { key: 'history', label: 'Historial del mes' },
            { key: 'services', label: 'Servicios asignados' },
          ] as const
        ).map((tab) => (
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
        <>
          {loadingStats && <p className="text-sm text-gray-500">Cargando historial...</p>}
          {!loadingStats && stats.appointments.length === 0 && (
            <EmptyState
              title="Sin citas este mes"
              description="Las citas completadas en el mes actual aparecerán aquí."
            />
          )}
          {stats.appointments.length > 0 && (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Servicio</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 text-right font-medium">Precio</th>
                    <th className="px-4 py-2 text-right font-medium">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.appointments.map((a) => {
                    const commission = Math.round(
                      (Number(a.price_amount) * Number(a.commission_percent)) / 100,
                    );
                    const starts = parseISOToDate(a.starts_at);
                    return (
                      <tr key={a.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2 text-gray-600">
                          <p>{formatDateLong(starts)}</p>
                          <p className="text-xs text-gray-400">{formatTime(starts)}</p>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {a.client?.full_name ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{a.service?.name ?? '—'}</td>
                        <td className="px-4 py-2">
                          <AppointmentStatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700">
                          {formatCLP(a.price_amount)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {a.status === 'completed' ? formatCLP(commission) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {activeTab === 'services' && (
        <>
          {loadingServices && <p className="text-sm text-gray-500">Cargando servicios...</p>}
          {!loadingServices && services.length === 0 && (
            <EmptyState
              title="Sin servicios activos"
              description="Crea servicios en la sección Servicios para asignarlos aquí."
            />
          )}
          {services.length > 0 && (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Servicio</th>
                    <th className="px-4 py-2 font-medium">Precio</th>
                    <th className="px-4 py-2 font-medium">Comisión</th>
                    <th className="px-4 py-2 font-medium">Asignado</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const isAssigned = s.is_assigned;
                    return (
                      <tr key={s.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-2 text-gray-600">{formatCLP(s.price_amount)}</td>
                        <td className="px-4 py-2 text-gray-600">{s.commission_percent}%</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                              isAssigned
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {isAssigned ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggle(s.id, isAssigned)}
                            className="text-sm text-brand hover:underline"
                            disabled={toggleService.isPending}
                          >
                            {isAssigned ? 'Quitar' : 'Asignar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
