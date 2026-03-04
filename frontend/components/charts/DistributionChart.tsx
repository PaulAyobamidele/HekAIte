'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RISK_COLORS: Record<string, string> = {
  low: '#30A46C',
  medium: '#FFB224',
  high: '#FF8B3E',
  critical: '#E5484D',
};

interface Props {
  data: Record<string, number>;
  color?: string;
}

export default function DistributionChart({ data, color }: Props) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#56545E' }}
          stroke="rgba(255,255,255,0.04)"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#56545E' }}
          allowDecimals={false}
          stroke="rgba(255,255,255,0.04)"
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: '#1C1C21',
            fontSize: 12,
            color: '#878593',
          }}
          labelStyle={{ color: '#EDEDEF' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={color || RISK_COLORS[entry.name] || '#7C5CFC'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
