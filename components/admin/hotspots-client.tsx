"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Wifi, MapPin, Server, Activity } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createHotspot, updateHotspotStatus } from "@/app/actions/hotspots-revenda"
import { useRouter } from "next/navigation"
import { useToastFeedback } from "@/hooks/use-toast-feedback"

interface Hotspot {
  id: string
  nome: string
  localizacao: string
  tipo: string
  status: string
  ip_servidor?: string
  usuarios?: { nome_completo: string; email: string }
}

export function HotspotsClient({ hotspots, revendaId }: { hotspots: Hotspot[]; revendaId: string }) {
  const router = useRouter()
  const feedback = useToastFeedback()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createHotspot({
      revendaId,
      clienteId: formData.get("clienteId") as string,
      nome: formData.get("nome") as string,
      localizacao: formData.get("localizacao") as string,
      tipo: formData.get("tipo") as string,
      ip_servidor: formData.get("ip_servidor") as string,
      porta: Number.parseInt(formData.get("porta") as string) || undefined,
      usuario_api: formData.get("usuario_api") as string,
      senha_api: formData.get("senha_api") as string,
    })

    setLoading(false)

    if (result.success) {
      feedback.success("Hotspot criado com sucesso!")
      setOpen(false)
      router.refresh()
    } else {
      feedback.error(result.error || "Erro ao criar hotspot")
    }
  }

  const toggleStatus = async (hotspotId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo"
    const result = await updateHotspotStatus(hotspotId, newStatus)

    if (result.success) {
      feedback.success(`Hotspot ${newStatus === "ativo" ? "ativado" : "desativado"} com sucesso!`)
      router.refresh()
    } else {
      feedback.error("Erro ao alterar status do hotspot")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Hotspots</h1>
          <p className="text-muted-foreground">Gerencie os pontos de acesso Wi-Fi dos seus clientes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Hotspot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Hotspot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Hotspot</Label>
                  <Input id="nome" name="nome" required placeholder="Ex: Shopping Center - Piso 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input id="localizacao" name="localizacao" required placeholder="Ex: Praça de Alimentação" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Controlador</Label>
                  <Select name="tipo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mikrotik">Mikrotik</SelectItem>
                      <SelectItem value="unifi">UniFi</SelectItem>
                      <SelectItem value="radius">RADIUS</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Input id="clienteId" name="clienteId" required placeholder="ID do Cliente" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip_servidor">IP do Servidor</Label>
                  <Input id="ip_servidor" name="ip_servidor" placeholder="192.168.1.1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porta">Porta</Label>
                  <Input id="porta" name="porta" type="number" placeholder="8728" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario_api">Usuário API</Label>
                  <Input id="usuario_api" name="usuario_api" placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha_api">Senha API</Label>
                  <Input id="senha_api" name="senha_api" type="password" placeholder="••••••••" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Hotspot"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotspots.map((hotspot) => (
          <Card key={hotspot.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{hotspot.nome}</CardTitle>
                </div>
                <Badge variant={hotspot.status === "ativo" ? "default" : "secondary"}>{hotspot.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {hotspot.localizacao}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4" />
                {hotspot.tipo}
              </div>
              {hotspot.ip_servidor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  {hotspot.ip_servidor}
                </div>
              )}
              {hotspot.usuarios && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">{hotspot.usuarios.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">{hotspot.usuarios.email}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => toggleStatus(hotspot.id, hotspot.status)}
              >
                {hotspot.status === "ativo" ? "Desativar" : "Ativar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {hotspots.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum hotspot cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece criando seu primeiro ponto de acesso Wi-Fi</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Hotspot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
