import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import type { TopService } from './types';

interface TopServicesTableProps {
  data: TopService[];
}

export function TopServicesTable({ data }: TopServicesTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Top servicios
        </p>
      </div>
      {data.length === 0 && (
        <p className="px-4 py-3 text-sm text-gray-400">Sin datos para este período.</p>
      )}
      {data.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Servicio</th>
              <th className="px-4 py-2 text-right font-medium">Citas</th>
              <th className="px-4 py-2 text-right font-medium">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-2 text-right text-gray-600">{s.count}</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">
                  {formatCLP(s.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
