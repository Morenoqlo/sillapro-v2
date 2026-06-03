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
import { Input } from '@/ui/Input';
import { useBarberDetail } from './hooks/useBarberDetail';
import { useBarberMonthStats } from './hooks/useBarberMonthStats';
import {
  useBarberServiceCommissions,
  useToggleBarberService,
  useUpdateBarberServiceOverride,
} from './hooks/useBarberServiceCommissions';
import { useUpdateBarberLevel } from './hooks/useUpdateBarberLevel';
import { useCreateBarberInvite } from './hooks/useBarberInvite';

export function BarberDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: barber, isLoading: loadingBarber } = useBarberDetail(id);
  const { data: monthStats, isLoading: loadingStats } = useBarberMonthStats(id);
  const { data: services = [], isLoading: loadingServices } = useBarberServiceCommissions(id);
  const toggleService = useToggleBarberService(id);
  const updateOverride = useUpdateBarberServiceOverride(id);
  const updateLevel = useUpdateBarberLevel(id);
  const [activeTab, setActiveTab] = useState<'history' | 'services'>('history');
  const createInvite = useCreateBarberInvite();
  const [inviteCopied, setInviteCopied] = useState(false);
  const [levelDraft, setLevelDraft] = useState<string | null>(null);

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

  async function handleGenerateInvite() {
    try {
      const token = await createInvite.mutateAsync(id);
      const url = `${window.location.origin}/unirse?token=${token}`;
      await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      toast.success('¡Link copiado! Envíalo al barbero por WhatsApp.');
      setTimeout(() => setInviteCopied(false), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar el link');
    }
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
    barberTips: 0,
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="tertiary" size="sm" onClick={() => navigate('/admin/equipo')}>
          ← Equipo
        </Button>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{barber.full_name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge tone={barber.active ? 'active' : 'inactive'}>
              {barber.active ? 'Activo' : 'Inactivo'}
            </StatusBadge>
            <span className="text-sm text-gray-500">{barber.chair_label}</span>
            <span className="text-sm text-gray-500">· Comisión base {barber.commission_default}%</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-gray-600">Nivel:</label>
            <Input
              className="!w-44"
              placeholder="Ej: Senior, Junior…"
              value={levelDraft ?? barber.experience_level}
              onChange={(e) => setLevelDraft(e.target.value)}
              onBlur={async () => {
                if (levelDraft != null && levelDraft !== barber.experience_level) {
                  try {
                    await updateLevel.mutateAsync(levelDraft);
                    toast.success('Nivel actualizado');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Error');
                  }
                }
                setLevelDraft(null);
              }}
            />
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleGenerateInvite}
          disabled={createInvite.isPending}
        >
          {inviteCopied ? '✓ Link copiado' : '🔗 Generar enlace de acceso'}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
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
          <p className="text-xs uppercase tracking-wide text-gray-500">Propinas</p>
          <p className="mt-1 text-xl font-bold text-green-700">
            {loadingStats ? '...' : formatCLP(stats.barberTips)}
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
              <p className="border-b border-gray-100 bg-amber-50/50 px-4 py-2 text-xs text-gray-600">
                💡 Para cada servicio asignado puedes sobrescribir el <strong>precio</strong> y la <strong>comisión</strong> específicos de este barbero. Si dejas el campo vacío, se usa el precio base del servicio.
              </p>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Servicio</th>
                    <th className="px-4 py-2 font-medium">Precio base</th>
                    <th className="px-4 py-2 font-medium">Precio del barbero</th>
                    <th className="px-4 py-2 font-medium">Comisión</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      onToggle={(enabled) => handleToggle(s.id, !enabled)}
                      onSaveOverride={async (price, commission) => {
                        try {
                          await updateOverride.mutateAsync({
                            serviceId: s.id,
                            price,
                            commission,
                          });
                          toast.success('Precio actualizado');
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Error');
                        }
                      }}
                      togglePending={toggleService.isPending}
                      savePending={updateOverride.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

interface ServiceRowProps {
  service: {
    id: string;
    name: string;
    price_amount: number;
    commission_percent: number;
    is_assigned: boolean;
    override_price: number | null;
    override_commission: number | null;
  };
  onToggle: (currentlyAssigned: boolean) => void;
  onSaveOverride: (price: number | null, commission: number | null) => Promise<void>;
  togglePending: boolean;
  savePending: boolean;
}

function ServiceRow({ service, onToggle, onSaveOverride, togglePending, savePending }: ServiceRowProps) {
  const [priceDraft, setPriceDraft] = useState<string>(
    service.override_price != null ? String(service.override_price) : '',
  );
  const [commDraft, setCommDraft] = useState<string>(
    service.override_commission != null ? String(service.override_commission) : '',
  );
  const isAssigned = service.is_assigned;

  const initialPrice = service.override_price != null ? String(service.override_price) : '';
  const initialComm = service.override_commission != null ? String(service.override_commission) : '';
  const dirty = priceDraft !== initialPrice || commDraft !== initialComm;

  async function handleSave() {
    const price = priceDraft.trim() === '' ? null : Number(priceDraft);
    const commission = commDraft.trim() === '' ? null : Number(commDraft);
    if (price != null && (!Number.isFinite(price) || price < 0)) return;
    if (commission != null && (!Number.isFinite(commission) || commission < 0 || commission > 100)) return;
    await onSaveOverride(price, commission);
  }

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2 font-medium text-gray-900">{service.name}</td>
      <td className="px-4 py-2 text-gray-500">{formatCLP(service.price_amount)}</td>
      <td className="px-4 py-2">
        {isAssigned ? (
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(service.price_amount)}
            value={priceDraft}
            onChange={(e) => setPriceDraft(e.target.value)}
            className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        {isAssigned ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              placeholder={String(service.commission_percent)}
              value={commDraft}
              onChange={(e) => setCommDraft(e.target.value)}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          {isAssigned && dirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={savePending}
              className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
            >
              Guardar
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggle(isAssigned)}
            className="text-sm text-brand hover:underline"
            disabled={togglePending}
          >
            {isAssigned ? 'Quitar' : 'Asignar'}
          </button>
        </div>
      </td>
    </tr>
  );
}
