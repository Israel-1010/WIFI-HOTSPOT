"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Globe,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react"
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
  senha_hash?: string | null
}

interface Plano {
  id: string
  nome: string
  preco_mensal: number
}

interface RevendaFormState {
  nome: string
  cnpj: string
  email: string
  telefone: string
  dominio: string
  plano_id: string
  cor_primaria: string
  cor_secundaria: string
  limite_clientes: string
  limite_hotspots: string
  limite_usuarios_simultaneos: string
  username: string
  senha: string
}

const INITIAL_CREATE_FORM: RevendaFormState = {
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  dominio: "",
  plano_id: "",
  cor_primaria: "#3b82f6",
  cor_secundaria: "#1e40af",
  limite_clientes: "10",
  limite_hotspots: "5",
  limite_usuarios_simultaneos: "100",
  username: "",
  senha: "",
}

const formatCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14)

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

const normalizeCNPJ = (value: string) => value.replace(/\D/g, "").slice(0, 14)

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 11)

const formatEmail = (value: string) => value.replace(/\s+/g, "").toLowerCase()

const normalizeDomain = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .toLowerCase()

const PASSWORD_PLACEHOLDER = "********"

export function RevendasClient({ revendas: initialRevendas }: { revendas: Revenda[] }) {
  const [revendas, setRevendas] = useState(initialRevendas)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRevenda, setEditingRevenda] = useState<Revenda | null>(null)
  const [createForm, setCreateForm] = useState<RevendaFormState>(INITIAL_CREATE_FORM)
  const [editForm, setEditForm] = useState<RevendaFormState | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isCreatePasswordVisible, setIsCreatePasswordVisible] = useState(false)
  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false)
  const [isEditPasswordDirty, setIsEditPasswordDirty] = useState(false)
  const [editPasswordInitialValue, setEditPasswordInitialValue] = useState(PASSWORD_PLACEHOLDER)
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

    if (!createForm.plano_id) {
      alert("Selecione um plano antes de criar a revenda")
      return
    }

    const payload: RevendaFormData = {
      nome: createForm.nome.trim(),
      cnpj: normalizeCNPJ(createForm.cnpj),
      email: formatEmail(createForm.email),
      telefone: normalizePhone(createForm.telefone),
      dominio: normalizeDomain(createForm.dominio),
      plano_id: createForm.plano_id,
      cor_primaria: createForm.cor_primaria,
      cor_secundaria: createForm.cor_secundaria,
      limite_clientes: Number.parseInt(createForm.limite_clientes || "0", 10),
      limite_hotspots: Number.parseInt(createForm.limite_hotspots || "0", 10),
      limite_usuarios_simultaneos: Number.parseInt(createForm.limite_usuarios_simultaneos || "0", 10),
      username: createForm.username.trim(),
      senha: createForm.senha,
    }

    const result = await createRevenda(payload)

    if (result.success) {
      if (result.data) {
        const novaRevenda = result.data as Revenda
        setRevendas((prev) => {
          const filtered = prev.filter((revenda) => revenda.id !== novaRevenda.id)
          return [novaRevenda, ...filtered]
        })
      }

      setIsCreateOpen(false)
      setCreateForm(INITIAL_CREATE_FORM)
      setIsCreatePasswordVisible(false)
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRevenda || !editForm) return

    if (!editForm.plano_id) {
      alert("Selecione um plano para a revenda")
      return
    }

    const payload: Partial<RevendaFormData> = {
      nome: editForm.nome.trim(),
      cnpj: normalizeCNPJ(editForm.cnpj),
      email: formatEmail(editForm.email),
      telefone: normalizePhone(editForm.telefone),
      dominio: normalizeDomain(editForm.dominio),
      cor_primaria: editForm.cor_primaria,
      cor_secundaria: editForm.cor_secundaria,
      limite_clientes: Number.parseInt(editForm.limite_clientes || "0", 10),
      limite_hotspots: Number.parseInt(editForm.limite_hotspots || "0", 10),
      limite_usuarios_simultaneos: Number.parseInt(editForm.limite_usuarios_simultaneos || "0", 10),
      plano_id: editForm.plano_id,
      username: editForm.username.trim(),
    }

    if (isEditPasswordDirty) {
      if (!editForm.senha.trim()) {
        alert("Informe uma senha válida ou mantenha a atual")
        return
      }
      payload.senha = editForm.senha
    }

    const result = await updateRevenda(editingRevenda.id, payload)

    if (result.success) {
      if (result.data) {
        const revendaAtualizada = result.data as Revenda
        setRevendas((prev) =>
          prev.map((revenda) => (revenda.id === revendaAtualizada.id ? revendaAtualizada : revenda)),
        )
      }

      setEditingRevenda(null)
      setEditForm(null)
      setIsEditPasswordVisible(false)
      setIsEditPasswordDirty(false)
      setEditPasswordInitialValue(PASSWORD_PLACEHOLDER)
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta revenda?")) return

    const result = await deleteRevenda(id)

    if (result.success) {
      setRevendas((prev) => prev.filter((r) => r.id !== id))
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
              setCreateForm(INITIAL_CREATE_FORM)
              setIsCreatePasswordVisible(false)
            }
          }}
        >
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
                  <Input
                    id="nome"
                    name="nome"
                    value={createForm.nome}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, nome: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={createForm.cnpj}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, cnpj: formatCNPJ(event.target.value) }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={createForm.email}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, email: formatEmail(event.target.value) }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    placeholder="(00) 00000-0000"
                    value={createForm.telefone}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, telefone: formatPhone(event.target.value) }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dominio">Domínio *</Label>
                <Input
                  id="dominio"
                  name="dominio"
                  placeholder="minharevenda.com.br"
                  value={createForm.dominio}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, dominio: event.target.value }))
                  }
                  onBlur={(event) =>
                    setCreateForm((prev) => ({ ...prev, dominio: normalizeDomain(event.target.value) }))
                  }
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Domínio personalizado para acesso white label</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Dados de Acesso ao Painel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário *</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="admin"
                      value={createForm.username}
                      onChange={(event) =>
                        setCreateForm((prev) => ({ ...prev, username: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        name="senha"
                        type={isCreatePasswordVisible ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        value={createForm.senha}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, senha: event.target.value }))
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                        onClick={() => setIsCreatePasswordVisible((prev) => !prev)}
                      >
                        {isCreatePasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isCreatePasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Credenciais para acesso ao painel administrativo da revenda
                </p>
              </div>

              <div>
                <Label htmlFor="plano_id">Plano *</Label>
                <Select
                  value={createForm.plano_id}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, plano_id: value }))
                  }
                  required
                >
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
                  <Input
                    id="cor_primaria"
                    name="cor_primaria"
                    type="color"
                    value={createForm.cor_primaria}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, cor_primaria: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <Input
                    id="cor_secundaria"
                    name="cor_secundaria"
                    type="color"
                    value={createForm.cor_secundaria}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, cor_secundaria: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limite_clientes">Limite de Clientes</Label>
                  <Input
                    id="limite_clientes"
                    name="limite_clientes"
                    type="number"
                    min={0}
                    value={createForm.limite_clientes}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, limite_clientes: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="limite_hotspots">Limite de Hotspots</Label>
                  <Input
                    id="limite_hotspots"
                    name="limite_hotspots"
                    type="number"
                    min={0}
                    value={createForm.limite_hotspots}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, limite_hotspots: event.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="limite_usuarios_simultaneos">Usuários Simultâneos</Label>
                  <Input
                    id="limite_usuarios_simultaneos"
                    name="limite_usuarios_simultaneos"
                    type="number"
                    min={0}
                    value={createForm.limite_usuarios_simultaneos}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, limite_usuarios_simultaneos: event.target.value }))
                    }
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

      <Dialog
        open={!!editingRevenda}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRevenda(null)
            setEditForm(null)
            setIsEditPasswordVisible(false)
            setIsEditPasswordDirty(false)
            setEditPasswordInitialValue(PASSWORD_PLACEHOLDER)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Revenda</DialogTitle>
          </DialogHeader>
          {editingRevenda && editForm && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome da Revenda *</Label>
                  <Input
                    id="edit-nome"
                    name="nome"
                    value={editForm.nome}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, nome: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cnpj">CNPJ *</Label>
                  <Input
                    id="edit-cnpj"
                    name="cnpj"
                    value={editForm.cnpj}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, cnpj: formatCNPJ(event.target.value) } : prev,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, email: formatEmail(event.target.value) } : prev,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-telefone">Telefone *</Label>
                  <Input
                    id="edit-telefone"
                    name="telefone"
                    value={editForm.telefone}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, telefone: formatPhone(event.target.value) } : prev,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-dominio">Domínio *</Label>
                <Input
                  id="edit-dominio"
                  name="dominio"
                  value={editForm.dominio}
                  placeholder="minharevenda.com.br"
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, dominio: event.target.value } : prev,
                    )
                  }
                  onBlur={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, dominio: normalizeDomain(event.target.value) } : prev,
                    )
                  }
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
                      value={editForm.username}
                      placeholder="admin"
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, username: event.target.value } : prev,
                        )
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-senha">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="edit-senha"
                        name="senha"
                        type={isEditPasswordVisible ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10"
                        value={editForm.senha}
                        onChange={(event) => {
                          const value = event.target.value
                          setEditForm((prev) => (prev ? { ...prev, senha: value } : prev))
                          setIsEditPasswordDirty(value !== editPasswordInitialValue)
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                        onClick={() => setIsEditPasswordVisible((prev) => !prev)}
                      >
                        {isEditPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {isEditPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      A senha atual é carregada automaticamente; altere apenas se desejar uma nova.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Credenciais para acesso ao painel administrativo da revenda
                </p>
              </div>

              <div>
                <Label htmlFor="edit-plano_id">Plano *</Label>
                <Select
                  value={editForm.plano_id}
                  onValueChange={(value) =>
                    setEditForm((prev) => (prev ? { ...prev, plano_id: value } : prev))
                  }
                  required
                >
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
                    value={editForm.cor_primaria}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, cor_primaria: event.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cor_secundaria">Cor Secundária</Label>
                  <Input
                    id="edit-cor_secundaria"
                    name="cor_secundaria"
                    type="color"
                    value={editForm.cor_secundaria}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, cor_secundaria: event.target.value } : prev,
                      )
                    }
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
                    min={0}
                    value={editForm.limite_clientes}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, limite_clientes: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-limite_hotspots">Limite de Hotspots</Label>
                  <Input
                    id="edit-limite_hotspots"
                    name="limite_hotspots"
                    type="number"
                    min={0}
                    value={editForm.limite_hotspots}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, limite_hotspots: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-limite_usuarios_simultaneos">Usuários Simultâneos</Label>
                  <Input
                    id="edit-limite_usuarios_simultaneos"
                    name="limite_usuarios_simultaneos"
                    type="number"
                    min={0}
                    value={editForm.limite_usuarios_simultaneos}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev
                          ? { ...prev, limite_usuarios_simultaneos: event.target.value }
                          : prev,
                      )
                    }
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
                  <p className="font-medium">{formatCNPJ(revenda.cnpj)}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{revenda.dominio}</span>
              </div>

              {revenda.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatEmail(revenda.email)}</span>
                </div>
              )}

              {revenda.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatPhone(revenda.telefone)}</span>
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
                  onClick={() => {
                    setEditingRevenda(revenda)
                    setIsEditPasswordVisible(false)
                    const hasStoredPassword = Boolean(revenda.senha_hash)
                    const initialPasswordValue = hasStoredPassword ? revenda.senha_hash! : ""
                    setEditPasswordInitialValue(initialPasswordValue)
                    setIsEditPasswordDirty(!hasStoredPassword)
                    setEditForm({
                      nome: revenda.nome,
                      cnpj: formatCNPJ(revenda.cnpj || ""),
                      email: formatEmail(revenda.email || ""),
                      telefone: formatPhone(revenda.telefone || ""),
                      dominio: normalizeDomain(revenda.dominio),
                      plano_id: revenda.plano_id || "",
                      cor_primaria: revenda.cor_primaria || "#3b82f6",
                      cor_secundaria: revenda.cor_secundaria || "#1e40af",
                      limite_clientes: String(revenda.limite_clientes ?? 0),
                      limite_hotspots: String(revenda.limite_hotspots ?? 0),
                      limite_usuarios_simultaneos: String(revenda.limite_usuarios_simultaneos ?? 0),
                      username: revenda.username || "",
                      senha: initialPasswordValue,
                    })
                  }}
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
