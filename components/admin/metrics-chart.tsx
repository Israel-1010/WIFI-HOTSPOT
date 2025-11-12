"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { time: "00:00", connections: 45 },
  { time: "04:00", connections: 23 },
  { time: "08:00", connections: 156 },
  { time: "12:00", connections: 234 },
  { time: "16:00", connections: 189 },
  { time: "20:00", connections: 167 },
  { time: "23:59", connections: 89 },
]

export function MetricsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="connections" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
