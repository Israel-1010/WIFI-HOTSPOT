"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, RefreshCw } from "lucide-react"
import { useState } from "react"

export function MikrotikStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simular chamada API
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const mikrotikInfo = {
    status: "online",
    ip: "192.168.1.1",
    model: "hAP ac²",
    version: "7.16.1",
    uptime: "15d 8h 23m",
    cpu: "12%",
    memory: "45%",
    storage: "23%",
    temperature: "42°C",
    activeUsers: 23,
    totalBandwidth: "100 Mbps",
    usedBandwidth: "45 Mbps",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Status do Mikrotik</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={mikrotikInfo.status === "online" ? "default" : "destructive"}>
              {mikrotikInfo.status === "online" ? "Online" : "Offline"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Modelo</p>
            <p className="font-semibold">{mikrotikInfo.model}</p>
            <p className="text-xs text-gray-500">v{mikrotikInfo.version}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="font-semibold">{mikrotikInfo.uptime}</p>
            <p className="text-xs text-gray-500">Temperatura: {mikrotikInfo.temperature}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">CPU / Memória</p>
            <div className="flex space-x-2">
              <Badge variant="outline">{mikrotikInfo.cpu}</Badge>
              <Badge variant="outline">{mikrotikInfo.memory}</Badge>
            </div>
            <p className="text-xs text-gray-500">Storage: {mikrotikInfo.storage}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Banda</p>
            <p className="font-semibold">
              {mikrotikInfo.usedBandwidth} / {mikrotikInfo.totalBandwidth}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
