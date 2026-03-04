'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface DataPoint {
  date: string;
  total: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export default function RiskOverTimeChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#30A46C" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#30A46C" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFB224" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#FFB224" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF8B3E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#FF8B3E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E5484D" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#56545E' }}
          tickFormatter={v => v.slice(5)}
          stroke="rgba(255,255,255,0.04)"
        />
        <YAxis tick={{ fontSize: 11, fill: '#56545E' }} allowDecimals={false} stroke="rgba(255,255,255,0.04)" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: '#1C1C21',
            fontSize: 12,
            color: '#878593',
          }}
          labelStyle={{ color: '#EDEDEF' }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#878593' }} />
        <Area type="monotone" dataKey="low" stackId="1" stroke="#30A46C" fill="url(#colorLow)" name="Low" />
        <Area type="monotone" dataKey="medium" stackId="1" stroke="#FFB224" fill="url(#colorMedium)" name="Medium" />
        <Area type="monotone" dataKey="high" stackId="1" stroke="#FF8B3E" fill="url(#colorHigh)" name="High" />
        <Area type="monotone" dataKey="critical" stackId="1" stroke="#E5484D" fill="url(#colorCritical)" name="Critical" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
