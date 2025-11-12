"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, User, Mail, Phone, Building } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCliente, deleteCliente, updateCliente, type ClienteFormData } from "@/app/actions/revendas-crud"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Cliente {
  id: string
  nome_completo: string
  empresa: string
  cnpj?: string
  email: string
  telefone?: string
  username: string
  ativo: boolean
  criado_em: string
  plano_id?: string
}

interface Plano {
  id: string
  nome: string
  descricao: string
  preco_mensal: number
}

export function ClientesClient({
  clientes: initialClientes,
  revendaId,
  planos,
}: { clientes: Cliente[]; revendaId: string; planos: Plano[] }) {
  const [clientes, setClientes] = useState(initialClientes)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedPlano, setSelectedPlano] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const data: ClienteFormData = {
      nome_completo: formData.get("nome_completo") as string,
      empresa: formData.get("empresa") as string,
      cnpj: formData.get("cnpj") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      username: formData.get("username") as string,
      senha: formData.get("senha") as string,
      endereco: formData.get("endereco") as string,
      revenda_id: revendaId,
      plano_id: selectedPlano || undefined,
    }

    const result = await createCliente(data)

    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Cliente criado com sucesso!",
        description: `O cliente ${data.nome_completo} foi criado e já pode acessar o painel.`,
      })
      setIsCreateOpen(false)
      setSelectedPlano("")
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      toast({
        title: "Erro ao criar cliente",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCliente) return

    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const data: Partial<ClienteFormData> = {
      nome_completo: formData.get("nome_completo") as string,
      empresa: formData.get("empresa") as string,
      cnpj: formData.get("cnpj") as string,
      email: formData.get("email") as string,
      telefone: formData.get("telefone") as string,
      endereco: formData.get("endereco") as string,
      revenda_id: revendaId,
    }

    const senha = formData.get("senha") as string
    if (senha) {
      data.senha = senha
    }

    const result = await updateCliente(editingCliente.id, data)

    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso.",
      })
      setEditingCliente(null)
      router.refresh()
    } else {
      toast({
        title: "Erro ao atualizar cliente",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return

    const result = await deleteCliente(id)

    if (result.success) {
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido do sistema.",
      })
      setClientes(clientes.filter((c) => c.id !== id))
    } else {
      toast({
        title: "Erro ao excluir cliente",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input id="nome_completo" name="nome_completo" required />
                </div>
                <div>
                  <Label htmlFor="empresa">Nome da Empresa *</Label>
                  <Input id="empresa" name="empresa" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" required />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" name="endereco" placeholder="Rua, número, bairro, cidade" />
              </div>

              <div>
                <Label htmlFor="plano">Plano</Label>
                <Select value={selectedPlano} onValueChange={setSelectedPlano}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.preco_mensal.toFixed(2)}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Selecione o plano do cliente (opcional)</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Dados de Acesso ao Painel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário *</Label>
                    <Input id="username" name="username" placeholder="usuario" required />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <Input id="senha" name="senha" type="password" placeholder="••••••••" required />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Credenciais para acesso ao painel do cliente</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editingCliente} onOpenChange={(open) => !open && setEditingCliente(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingCliente && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome_completo">Nome Completo *</Label>
                  <Input
                    id="edit-nome_completo"
                    name="nome_completo"
                    defaultValue={editingCliente.nome_completo}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-empresa">Nome da Empresa *</Label>
                  <Input id="edit-empresa" name="empresa" defaultValue={editingCliente.empresa} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cnpj">CNPJ *</Label>
                  <Input id="edit-cnpj" name="cnpj" defaultValue={editingCliente.cnpj} required />
                </div>
                <div>
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input id="edit-telefone" name="telefone" defaultValue={editingCliente.telefone} />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={editingCliente.email} required />
              </div>

              <div>
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input id="edit-endereco" name="endereco" defaultValue={editingCliente.endereco} />
              </div>

              {/* Adicionado campo de seleção de plano para edição */}
              <div>
                <Label htmlFor="edit-plano">Plano</Label>
                <Select
                  value={editingCliente.plano_id || ""}
                  onValueChange={(value) => setEditingCliente({ ...editingCliente, plano_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.preco_mensal.toFixed(2)}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Selecione o plano do cliente (opcional)</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Alterar Senha (opcional)</h3>
                <div>
                  <Label htmlFor="edit-senha">Nova Senha</Label>
                  <Input id="edit-senha" name="senha" type="password" placeholder="Deixe em branco para manter" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientes.map((cliente) => (
          <Card key={cliente.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{cliente.nome_completo}</CardTitle>
                </div>
                <Badge variant={cliente.ativo ? "default" : "secondary"}>{cliente.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{cliente.empresa}</span>
              </div>

              {cliente.cnpj && (
                <div className="text-sm">
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{cliente.cnpj}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{cliente.email}</span>
              </div>

              {cliente.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{cliente.telefone}</span>
                </div>
              )}

              <div className="text-sm pt-2 border-t">
                <p className="text-muted-foreground">Usuário</p>
                <p className="font-medium">{cliente.username}</p>
              </div>

              {/* Exibindo plano do cliente */}
              {cliente.plano_id && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium">{planos.find((plano) => plano.id === cliente.plano_id)?.nome}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setEditingCliente(cliente)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(cliente.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum cliente cadastrado</p>
            <p className="text-sm text-muted-foreground mb-4">Comece criando seu primeiro cliente</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
