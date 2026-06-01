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
import type { DailyRevenue } from './types';

interface DailyRevenueChartProps {
  data: DailyRevenue[];
}

function formatDate(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return `${d}/${m}`;
}

const tickStyle = { fontSize: 11, fill: '#9ca3af' } as unknown as TextProps;

export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    revenue: d.revenue,
  }));

  return (
    <Card>
      <p className="mb-3 text-xs uppercase tracking-wide text-gray-500">Ingresos diarios</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCLP(v)}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            formatter={(v) => [formatCLP(Number(v)), 'Ingresos'] as [string, string]}
            contentStyle={{
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          <Bar dataKey="revenue" fill="#0F172A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
