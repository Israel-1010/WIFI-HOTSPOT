"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Building2, Globe, Mail, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createRevenda,
  deleteRevenda,
  updateRevenda,
  getPlanos,
  type RevendaFormData,
} from "@/app/actions/revendas-crud"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Revenda {
  id: string
  nome: string
  cnpj?: string
  email?: string
  telefone?: string
  dominio: string
  status: string
  limite_clientes: number
  limite_hotspots: number
  limite_usuarios_simultaneos?: number
  plano_id?: string
  total_clientes?: number
  plano?: { nome: string; preco_mensal: number }
  cor_primaria?: string
  cor_secundaria?: string
  username?: string | null
}

interface Plano {
  id: string
  nome: string
  preco_mensal: number
}

export function RevendasClient({ revendas: initialRevendas }: { revendas: Revenda[] }) {
  const [revendas, setRevendas] = useState(initialRevendas)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRevenda, setEditingRevenda] = useState<Revenda | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const router = useRouter()

  useEffect(() => {
    loadPlanos()
  }, [])

  const loadPlanos = async () => {
    const data = await getPlanos()
    setPlanos(data)
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data: RevendaFormData = {
      nome: formData.get("nome") as string,
      cnpj: formData.get("cnpj") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      dominio: formData.get("dominio") as string,
      plano_id: formData.get("plano_id") as string,
      cor_primaria: formData.get("cor_primaria") as string,
      cor_secundaria: formData.get("cor_secundaria") as string,
      limite_clientes: Number.parseInt(formData.get("limite_clientes") as string),
      limite_hotspots: Number.parseInt(formData.get("limite_hotspots") as string),
      limite_usuarios_simultaneos: Number.parseInt(formData.get("limite_usuarios_simultaneos") as string),
      username: formData.get("username") as string,
      senha: formData.get("senha") as string,
    }

    const result = await createRevenda(data)

    if (result.success) {
      setIsCreateOpen(false)
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRevenda) return

    const formData = new FormData(e.currentTarget)

    const data: Partial<RevendaFormData> = {
      nome: formData.get("nome") as string,
      cnpj: formData.get("cnpj") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      dominio: formData.get("dominio") as string,
      cor_primaria: formData.get("cor_primaria") as string,
      cor_secundaria: formData.get("cor_secundaria") as string,
      limite_clientes: Number.parseInt(formData.get("limite_clientes") as string),
      limite_hotspots: Number.parseInt(formData.get("limite_hotspots") as string),
      limite_usuarios_simultaneos: Number.parseInt(formData.get("limite_usuarios_simultaneos") as string),
      plano_id: formData.get("plano_id") as string,
      username: formData.get("username") as string,
      senha: formData.get("senha") as string,
    }

    const result = await updateRevenda(editingRevenda.id, data)

    if (result.success) {
      setEditingRevenda(null)
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta revenda?")) return

    const result = await deleteRevenda(id)

    if (result.success) {
      setRevendas(revendas.filter((r) => r.id !== id))
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Revenda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Revenda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Revenda *</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" required />
                </div>
              </div>

              <div>
                <Label htmlFor="dominio">Domínio *</Label>
                <Input id="dominio" name="dominio" placeholder="minharevenda.com.br" required />
                <p className="text-xs text-muted-foreground mt-1">Domínio personalizado para acesso white label</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Dados de Acesso ao Painel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário *</Label>
                    <Input id="username" name="username" placeholder="admin" required />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <Input id="senha" name="senha" type="password" placeholder="••••••••" required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Credenciais para acesso ao painel administrativo da revenda
                </p>
              </div>

              <div>
                <Label htmlFor="plano_id">Plano *</Label>
                <Select name="plano_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.preco_mensal}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <Input id="cor_primaria" name="cor_primaria" type="color" defaultValue="#3b82f6" />
                </div>
                <div>
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <Input id="cor_secundaria" name="cor_secundaria" type="color" defaultValue="#1e40af" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limite_clientes">Limite de Clientes</Label>
                  <Input id="limite_clientes" name="limite_clientes" type="number" defaultValue={10} required />
                </div>
                <div>
                  <Label htmlFor="limite_hotspots">Limite de Hotspots</Label>
                  <Input id="limite_hotspots" name="limite_hotspots" type="number" defaultValue={5} required />
                </div>
                <div>
                  <Label htmlFor="limite_usuarios_simultaneos">Usuários Simultâneos</Label>
                  <Input
                    id="limite_usuarios_simultaneos"
                    name="limite_usuarios_simultaneos"
                    type="number"
                    defaultValue={100}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Criar Revenda
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingRevenda} onOpenChange={(open) => !open && setEditingRevenda(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Revenda</DialogTitle>
          </DialogHeader>
          {editingRevenda && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome da Revenda *</Label>
                  <Input id="edit-nome" name="nome" defaultValue={editingRevenda.nome} required />
                </div>
                <div>
                  <Label htmlFor="edit-cnpj">CNPJ *</Label>
                  <Input id="edit-cnpj" name="cnpj" defaultValue={editingRevenda.cnpj || ""} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={editingRevenda.email || ""} required />
                </div>
                <div>
                  <Label htmlFor="edit-telefone">Telefone *</Label>
                  <Input id="edit-telefone" name="telefone" defaultValue={editingRevenda.telefone || ""} required />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-dominio">Domínio *</Label>
                <Input
                  id="edit-dominio"
                  name="dominio"
                  defaultValue={editingRevenda.dominio}
                  placeholder="minharevenda.com.br"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Domínio personalizado para acesso white label</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Dados de Acesso ao Painel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-username">Usuário *</Label>
                    <Input
                      id="edit-username"
                      name="username"
                      defaultValue={editingRevenda.username || ""}
                      placeholder="admin"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-senha">Senha *</Label>
                    <Input id="edit-senha" name="senha" type="password" placeholder="••••••••" required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Credenciais para acesso ao painel administrativo da revenda
                </p>
              </div>

              <div>
                <Label htmlFor="edit-plano_id">Plano *</Label>
                <Select name="plano_id" defaultValue={editingRevenda.plano_id} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.preco_mensal}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cor_primaria">Cor Primária</Label>
                  <Input
                    id="edit-cor_primaria"
                    name="cor_primaria"
                    type="color"
                    defaultValue={editingRevenda.cor_primaria || "#3b82f6"}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cor_secundaria">Cor Secundária</Label>
                  <Input
                    id="edit-cor_secundaria"
                    name="cor_secundaria"
                    type="color"
                    defaultValue={editingRevenda.cor_secundaria || "#1e40af"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-limite_clientes">Limite de Clientes</Label>
                  <Input
                    id="edit-limite_clientes"
                    name="limite_clientes"
                    type="number"
                    defaultValue={editingRevenda.limite_clientes}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-limite_hotspots">Limite de Hotspots</Label>
                  <Input
                    id="edit-limite_hotspots"
                    name="limite_hotspots"
                    type="number"
                    defaultValue={editingRevenda.limite_hotspots}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-limite_usuarios_simultaneos">Usuários Simultâneos</Label>
                  <Input
                    id="edit-limite_usuarios_simultaneos"
                    name="limite_usuarios_simultaneos"
                    type="number"
                    defaultValue={editingRevenda.limite_usuarios_simultaneos || 0}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {revendas.map((revenda) => (
          <Card key={revenda.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{revenda.nome}</CardTitle>
                </div>
                <Badge variant={revenda.status === "ativo" ? "default" : "secondary"}>{revenda.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {revenda.cnpj && (
                <div className="text-sm">
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{revenda.cnpj}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{revenda.dominio}</span>
              </div>

              {revenda.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{revenda.email}</span>
                </div>
              )}

              {revenda.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{revenda.telefone}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div>
                  <p className="text-muted-foreground">Clientes</p>
                  <p className="font-medium">
                    {revenda.total_clientes || 0} / {revenda.limite_clientes}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hotspots</p>
                  <p className="font-medium">0 / {revenda.limite_hotspots}</p>
                </div>
              </div>

              {revenda.plano && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium">{revenda.plano.nome}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setEditingRevenda(revenda)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(revenda.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
