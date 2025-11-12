"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"

interface RetentionPoint {
  periodo: string
  retorno: number
}

export function NocRetentionChart({ data }: { data: RetentionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="retention" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="periodo" tickLine={false} axisLine={false} tickMargin={12} />
        <YAxis width={32} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip formatter={(value: number) => `${value}%`} labelClassName="text-sm font-medium" />
        <Area
          type="monotone"
          dataKey="retorno"
          stroke="#2563eb"
          fillOpacity={1}
          fill="url(#retention)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
