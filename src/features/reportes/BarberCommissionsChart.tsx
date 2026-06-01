import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TextProps,
} from 'recharts';
import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import type { BarberCommission } from './types';

interface BarberCommissionsChartProps {
  data: BarberCommission[];
}

const tickStyleSm = { fontSize: 11, fill: '#9ca3af' } as unknown as TextProps;
const tickStyleMd = { fontSize: 12, fill: '#374151' } as unknown as TextProps;

export function BarberCommissionsChart({ data }: BarberCommissionsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Comisiones por barbero</p>
        <p className="text-sm text-gray-400">Sin datos para este período.</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-3 text-xs uppercase tracking-wide text-gray-500">Comisiones por barbero</p>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatCLP(v)}
            tick={tickStyleSm}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={tickStyleMd}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(v, name) => [
              formatCLP(Number(v)),
              name === 'commission' ? 'Comisión' : 'Facturado',
            ] as [string, string]}
            contentStyle={{ borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Bar dataKey="commission" fill="#B45309" radius={[0, 3, 3, 0]} name="commission" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
