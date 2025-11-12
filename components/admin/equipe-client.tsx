"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus, Shield } from "lucide-react"
import { createMembroEquipe } from "@/app/actions/equipe-revenda"
import { useToastFeedback } from "@/hooks/use-toast-feedback"

interface EquipeClientProps {
  equipe: any[]
  revendaId: string
}

const PERMISSOES_DISPONIVEIS = [
  { id: "clientes.criar", label: "Criar Clientes" },
  { id: "clientes.editar", label: "Editar Clientes" },
  { id: "clientes.excluir", label: "Excluir Clientes" },
  { id: "hotspots.criar", label: "Criar Hotspots" },
  { id: "hotspots.editar", label: "Editar Hotspots" },
  { id: "financeiro.visualizar", label: "Ver Financeiro" },
  { id: "financeiro.criar", label: "Criar Faturas" },
  { id: "relatorios.visualizar", label: "Ver Relatórios" },
]

export function EquipeClient({ equipe, revendaId }: EquipeClientProps) {
  const feedback = useToastFeedback()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [permissoes, setPermissoes] = useState<string[]>([])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createMembroEquipe({
        revendaId,
        nome: formData.get("nome") as string,
        email: formData.get("email") as string,
        senha: formData.get("senha") as string,
        papel: formData.get("papel") as string,
        permissoes,
      })

      if (result.success) {
        feedback.success("Membro da equipe adicionado com sucesso!")
        setOpen(false)
        setPermissoes([])
        window.location.reload()
      } else {
        feedback.error(result.error || "Erro ao criar membro da equipe")
      }
    } catch (error) {
      feedback.error("Erro ao criar membro da equipe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Equipe da Revenda</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" name="nome" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" required />
                </div>
                <div>
                  <Label htmlFor="papel">Papel</Label>
                  <Select name="papel" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PERMISSOES_DISPONIVEIS.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={permissoes.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPermissoes([...permissoes, perm.id])
                          } else {
                            setPermissoes(permissoes.filter((p) => p !== perm.id))
                          }
                        }}
                      />
                      <label htmlFor={perm.id} className="text-sm cursor-pointer">
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adicionando..." : "Adicionar Membro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipe.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{equipe.filter((m) => m.ativo).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{equipe.filter((m) => !m.ativo).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equipe.map((membro) => (
              <div key={membro.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">{membro.nome}</p>
                  <p className="text-sm text-muted-foreground">{membro.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium capitalize">{membro.papel}</p>
                  <p className={`text-sm ${membro.ativo ? "text-green-600" : "text-red-600"}`}>
                    {membro.ativo ? "Ativo" : "Inativo"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
