"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const connectionData = [
  { day: "Seg", connections: 234 },
  { day: "Ter", connections: 189 },
  { day: "Qua", connections: 267 },
  { day: "Qui", connections: 298 },
  { day: "Sex", connections: 445 },
  { day: "Sab", connections: 567 },
  { day: "Dom", connections: 423 },
]

const campaignData = [
  { name: "Black Friday", value: 45, color: "#2563eb" },
  { name: "Newsletter", value: 30, color: "#7c3aed" },
  { name: "NPS Survey", value: 25, color: "#059669" },
]

const locationData = [
  { location: "Loja Centro", connections: 1234, leads: 456 },
  { location: "Loja Shopping", connections: 987, leads: 321 },
  { location: "Loja Norte", connections: 654, leads: 234 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Análise detalhada de performance e engajamento</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conexões por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={connectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="connections" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={campaignData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {campaignData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">2,847</p>
                  <p className="text-gray-600">Conexões Hoje</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">1,234</p>
                  <p className="text-gray-600">Leads Capturados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">43.2%</p>
                  <p className="text-gray-600">Taxa de Conversão</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">4.8</p>
                  <p className="text-gray-600">NPS Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationData.map((location) => (
                  <div key={location.location} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{location.location}</h3>
                      <p className="text-gray-600">
                        {location.connections} conexões • {location.leads} leads
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{((location.leads / location.connections) * 100).toFixed(1)}%</p>
                      <p className="text-gray-600">Taxa de Conversão</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
