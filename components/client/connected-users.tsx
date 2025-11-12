"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Ban } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"

const connectedUsers = [
  {
    id: 1,
    mac: "AA:BB:CC:DD:EE:FF",
    ip: "192.168.1.100",
    username: "João Silva",
    loginTime: "14:30",
    duration: "1h 23m",
    upload: "45 MB",
    download: "234 MB",
    signal: -45,
    status: "active",
  },
  {
    id: 2,
    mac: "11:22:33:44:55:66",
    ip: "192.168.1.101",
    username: "Maria Santos",
    loginTime: "13:15",
    duration: "2h 45m",
    upload: "12 MB",
    download: "89 MB",
    signal: -52,
    status: "active",
  },
  {
    id: 3,
    mac: "AA:11:BB:22:CC:33",
    ip: "192.168.1.102",
    username: "Pedro Costa",
    loginTime: "15:00",
    duration: "30m",
    upload: "8 MB",
    download: "156 MB",
    signal: -38,
    status: "active",
  },
]

export function ConnectedUsers() {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isAutoRefresh) {
      interval = setInterval(() => {
        fetchConnectedUsers()
      }, 5000) // Atualizar a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoRefresh])

  const fetchConnectedUsers = async () => {
    // Simular busca de usuários conectados via API Mikrotik
    setLastUpdate(new Date())
    // Aqui seria a chamada real para a API
  }

  const handleDisconnectUser = async (userId: number) => {
    try {
      // Simular desconexão via API Mikrotik
      console.log(`Desconectando usuário ${userId} via Mikrotik API`)

      // Remover usuário da lista temporariamente
      const updatedUsers = connectedUsers.filter((user) => user.id !== userId)
      // Atualizar estado local

      // Mostrar notificação de sucesso
      alert("Usuário desconectado com sucesso!")
    } catch (error) {
      alert("Erro ao desconectar usuário")
    }
  }

  const getSignalStrength = (signal: number) => {
    if (signal > -50) return { strength: "Excelente", color: "text-green-600" }
    if (signal > -60) return { strength: "Bom", color: "text-yellow-600" }
    return { strength: "Fraco", color: "text-red-600" }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Clientes Conectados ({connectedUsers.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Última atualização: {lastUpdate.toLocaleTimeString()}</span>
            <Button variant="outline" size="sm" onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
              {isAutoRefresh ? "Pausar" : "Retomar"} Auto-refresh
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {connectedUsers.map((user) => {
            const signal = getSignalStrength(user.signal)
            return (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.username
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h4 className="font-semibold">{user.username}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{user.ip}</span>
                      <span>•</span>
                      <span>{user.mac}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <p className="text-gray-600">Conectado</p>
                    <p className="font-medium">{user.duration}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Tráfego</p>
                    <p className="font-medium">
                      ↑{user.upload} ↓{user.download}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600">Sinal</p>
                    <p className={`font-medium ${signal.color}`}>{user.signal} dBm</p>
                  </div>

                  <div>
                    <Button variant="outline" size="sm" onClick={() => handleDisconnectUser(user.id)}>
                      <Ban className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
