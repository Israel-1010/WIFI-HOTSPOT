"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Monitor, Wifi, RefreshCw, Settings, AlertCircle, CheckCircle } from "lucide-react"

export default function MikrotikStatusPage() {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected")
  const [mikrotikConfig, setMikrotikConfig] = useState({
    ip: "192.168.1.1",
    port: "8728",
    username: "admin",
    password: "",
  })
  const [systemInfo, setSystemInfo] = useState({
    identity: "MikroTik",
    model: "hAP ac²",
    version: "7.16.1",
    uptime: "15d 8h 23m",
    cpu: 12,
    memory: 45,
    temperature: 42,
    voltage: 24.1,
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus("connecting")

    // Simular teste de conexão com Mikrotik
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Simular resultado (90% chance de sucesso)
    const success = Math.random() > 0.1
    setConnectionStatus(success ? "connected" : "disconnected")
    setIsTestingConnection(false)
  }

  const handleSaveConfig = () => {
    console.log("Salvando configuração Mikrotik:", mikrotikConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Status Mikrotik</h1>
          <p className="text-gray-600">Monitoramento e configuração do roteador</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              connectionStatus === "connected"
                ? "default"
                : connectionStatus === "connecting"
                  ? "secondary"
                  : "destructive"
            }
          >
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "connecting"
                ? "Conectando..."
                : "Desconectado"}
          </Badge>
          <Button variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? "animate-spin" : ""}`} />
            Testar Conexão
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {connectionStatus === "disconnected" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível conectar ao Mikrotik. Verifique as configurações de conexão.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === "connected" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Conectado com sucesso ao Mikrotik {mikrotikConfig.ip}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configuração de Conexão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ip">IP do Roteador</Label>
                <Input
                  id="ip"
                  value={mikrotikConfig.ip}
                  onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, ip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta API</Label>
                <Input
                  id="port"
                  value={mikrotikConfig.port}
                  onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, port: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={mikrotikConfig.username}
                  onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={mikrotikConfig.password}
                  onChange={(e) => setMikrotikConfig({ ...mikrotikConfig, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleTestConnection} disabled={isTestingConnection}>
                Testar Conexão
              </Button>
              <Button variant="outline" onClick={handleSaveConfig}>
                Salvar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Informações do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus === "connected" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Identidade</p>
                    <p className="font-semibold">{systemInfo.identity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-semibold">{systemInfo.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Versão</p>
                    <p className="font-semibold">{systemInfo.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="font-semibold">{systemInfo.uptime}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{systemInfo.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemInfo.cpu}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Memória</span>
                      <span>{systemInfo.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${systemInfo.memory}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-600">Temperatura</p>
                    <p className="font-semibold">{systemInfo.temperature}°C</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Voltagem</p>
                    <p className="font-semibold">{systemInfo.voltage}V</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Conecte-se ao Mikrotik para ver as informações do sistema</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comandos Rápidos */}
      {connectionStatus === "connected" && (
        <Card>
          <CardHeader>
            <CardTitle>Comandos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <Wifi className="h-6 w-6 mb-2" />
                <span className="text-sm">Reiniciar Hotspot</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col">
                <RefreshCw className="h-6 w-6 mb-2" />
                <span className="text-sm">Reiniciar Sistema</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col">
                <Monitor className="h-6 w-6 mb-2" />
                <span className="text-sm">Backup Config</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col">
                <Settings className="h-6 w-6 mb-2" />
                <span className="text-sm">Logs Sistema</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
