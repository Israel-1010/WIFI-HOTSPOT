"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Search, Download, RefreshCw, Filter } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LogEntry {
  id: string
  criado_em: string // Alterado de created_at para criado_em
  tipo: string // Alterado de type para tipo
  usuario_nome?: string
  ip_address?: string
  mac_address?: string
  mensagem?: string // Alterado de action para mensagem
  detalhes?: any
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [searchTerm, typeFilter, logs])

  const fetchLogs = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.from("logs_atividades").select("*").order("criado_em", { ascending: false })

    if (error) {
      console.error("Error fetching logs:", error)
    } else if (data) {
      setLogs(data)
    }

    setIsLoading(false)
  }

  const filterLogs = () => {
    let filtered = logs

    if (typeFilter !== "all") {
      filtered = filtered.filter((log) => log.tipo === typeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.mensagem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ip_address?.includes(searchTerm) ||
          log.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredLogs(filtered)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLogs()
    setIsRefreshing(false)
  }

  const getLogIcon = (tipo: string) => {
    switch (tipo) {
      case "connection":
        return "🟢"
      case "disconnection":
        return "🔴"
      case "voucher":
        return "🎫"
      case "authentication":
        return "🔐"
      case "error":
        return "❌"
      case "system":
        return "⚙️"
      default:
        return "📝"
    }
  }

  const getLogBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "connection":
        return "default"
      case "disconnection":
        return "secondary"
      case "voucher":
        return "outline"
      case "authentication":
        return "default"
      case "error":
        return "destructive"
      case "system":
        return "secondary"
      default:
        return "outline"
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Type", "User", "IP", "MAC", "Action", "Details"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.criado_em,
          log.tipo,
          log.usuario_nome || "",
          log.ip_address || "",
          log.mac_address || "",
          log.mensagem || "",
          JSON.stringify(log.detalhes || ""),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hotspot-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Logs do Sistema</h1>
            <p className="text-gray-600">Histórico de atividades e eventos</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Carregando logs...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="text-gray-600">Histórico de atividades e eventos</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por usuário, IP, MAC ou ação..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="connection">Conexões</SelectItem>
                <SelectItem value="disconnection">Desconexões</SelectItem>
                <SelectItem value="authentication">Autenticações</SelectItem>
                <SelectItem value="voucher">Vouchers</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Logs ({filteredLogs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="text-xl">{getLogIcon(log.tipo)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant={getLogBadgeVariant(log.tipo)}>{log.tipo}</Badge>
                    <span className="text-sm text-gray-500">{formatTimestamp(log.criado_em)}</span>
                  </div>

                  <p className="font-medium text-gray-900">{log.mensagem || "Ação não especificada"}</p>

                  {log.usuario_nome && (
                    <p className="text-sm text-gray-600">
                      Usuário: {log.usuario_nome} • IP: {log.ip_address} • MAC: {log.mac_address}
                    </p>
                  )}

                  {log.detalhes && typeof log.detalhes === "object" && (
                    <p className="text-sm text-gray-500 mt-1">{JSON.stringify(log.detalhes)}</p>
                  )}
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado com os filtros aplicados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
