import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import type { FrequentClient } from './types';

interface FrequentClientsTableProps {
  data: FrequentClient[];
}

export function FrequentClientsTable({ data }: FrequentClientsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Clientes frecuentes
        </p>
      </div>
      {data.length === 0 && (
        <p className="px-4 py-3 text-sm text-gray-400">Sin datos para este período.</p>
      )}
      {data.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 text-right font-medium">Visitas</th>
              <th className="px-4 py-2 text-right font-medium">Total gastado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-2 text-right text-gray-600">{c.visits}</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">
                  {formatCLP(c.totalSpend)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
