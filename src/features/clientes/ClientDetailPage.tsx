import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { StatusBadge } from '@/ui/StatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import { useClientDetail } from './hooks/useClientDetail';
import { useClientAppointments } from './hooks/useClientAppointments';

const STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo', blocked: 'Bloqueado' } as const;

export function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading: loadingClient } = useClientDetail(id);
  const { data: appointments = [], isLoading: loadingAppts } = useClientAppointments(id);

  if (loadingClient) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }
  if (!client) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/clientes')}>
            ← Volver a Clientes
          </Button>
        }
      />
    );
  }

  const completed = appointments.filter((a) => a.status === 'completed');
  const totalSpend = completed.reduce((s, a) => s + Number(a.price_amount), 0);
  const avgTicket = completed.length > 0 ? Math.round(totalSpend / completed.length) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="tertiary" size="sm" onClick={() => navigate('/admin/clientes')}>
          ← Clientes
        </Button>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{client.full_name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge tone={client.status}>{STATUS_LABEL[client.status]}</StatusBadge>
            {client.phone && (
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
            )}
          </div>
          {client.notes && (
            <p className="mt-1 text-sm text-gray-500">{client.notes}</p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Visitas</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{completed.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Total gastado</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(totalSpend)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Ticket promedio</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(avgTicket)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Teléfono</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{client.phone || '—'}</p>
        </Card>
      </div>

      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Historial ({appointments.length} citas)
        </p>
      </div>
      {loadingAppts && <p className="text-sm text-gray-500">Cargando historial...</p>}
      {!loadingAppts && appointments.length === 0 && (
        <EmptyState title="Sin citas aún" description="Las citas de este cliente aparecerán aquí." />
      )}
      {appointments.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Servicio</th>
                <th className="px-4 py-2 font-medium">Barbero</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 text-right font-medium">Precio</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const starts = parseISOToDate(a.starts_at);
                return (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 text-gray-600">
                      <p>{formatDateLong(starts)}</p>
                      <p className="text-xs text-gray-400">{formatTime(starts)}</p>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{a.service?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{a.barber?.full_name ?? '—'}</td>
                    <td className="px-4 py-2">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {formatCLP(a.price_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
