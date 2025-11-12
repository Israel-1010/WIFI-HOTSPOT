"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { createTicket, updateTicketStatus, createArtigo } from "@/app/actions/suporte-revenda"
import { useRouter } from "next/navigation"

interface SuporteClientProps {
  tickets: any[]
  artigos: any[]
  clientes: any[]
  equipe: any[]
  revendaId: string
}

export function SuporteClient({ tickets, artigos, clientes, equipe, revendaId }: SuporteClientProps) {
  const router = useRouter()
  const [openTicket, setOpenTicket] = useState(false)
  const [openArtigo, setOpenArtigo] = useState(false)
  const [loading, setLoading] = useState(false)

  const ticketsAbertos = tickets.filter((t) => t.status === "aberto").length
  const ticketsEmAndamento = tickets.filter((t) => t.status === "em_andamento").length
  const ticketsResolvidos = tickets.filter((t) => t.status === "resolvido").length

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createTicket({
        revendaId,
        clienteId: formData.get("cliente_id") as string,
        assunto: formData.get("assunto") as string,
        descricao: formData.get("descricao") as string,
        prioridade: formData.get("prioridade") as string,
        categoria: formData.get("categoria") as string,
      })

      setOpenTicket(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao criar ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArtigo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const tags = (formData.get("tags") as string).split(",").map((t) => t.trim())

    try {
      await createArtigo({
        revendaId,
        titulo: formData.get("titulo") as string,
        conteudo: formData.get("conteudo") as string,
        categoria: formData.get("categoria") as string,
        tags,
      })

      setOpenArtigo(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao criar artigo:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status)
      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "destructive"
      case "media":
        return "default"
      case "baixa":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "destructive"
      case "em_andamento":
        return "default"
      case "resolvido":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suporte & Operação</h1>
          <p className="text-muted-foreground">Gerencie tickets, base de conhecimento e suporte aos clientes</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsAbertos}</div>
            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsEmAndamento}</div>
            <p className="text-xs text-muted-foreground">Sendo atendidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsResolvidos}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="base">Base de Conhecimento</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openTicket} onOpenChange={setOpenTicket}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket</DialogTitle>
                  <DialogDescription>Registre um novo chamado de suporte</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente</Label>
                    <Select name="cliente_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prioridade">Prioridade</Label>
                      <Select name="prioridade" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select name="categoria" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input id="assunto" name="assunto" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea id="descricao" name="descricao" rows={4} required />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenTicket(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Criando..." : "Criar Ticket"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{ticket.assunto}</CardTitle>
                      <CardDescription>
                        Cliente: {ticket.cliente?.nome} • {new Date(ticket.criado_em).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPrioridadeColor(ticket.prioridade)}>{ticket.prioridade}</Badge>
                      <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{ticket.descricao}</p>
                  <div className="flex gap-2">
                    {ticket.status === "aberto" && (
                      <Button size="sm" onClick={() => handleUpdateStatus(ticket.id, "em_andamento")}>
                        Iniciar Atendimento
                      </Button>
                    )}
                    {ticket.status === "em_andamento" && (
                      <Button size="sm" onClick={() => handleUpdateStatus(ticket.id, "resolvido")}>
                        Resolver
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="base" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openArtigo} onOpenChange={setOpenArtigo}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Artigo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Artigo</DialogTitle>
                  <DialogDescription>Adicione um novo artigo à base de conhecimento</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateArtigo} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título</Label>
                    <Input id="titulo" name="titulo" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select name="categoria" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="configuracao">Configuração</SelectItem>
                        <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input id="tags" name="tags" placeholder="hotspot, wifi, configuração" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conteudo">Conteúdo</Label>
                    <Textarea id="conteudo" name="conteudo" rows={8} required />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenArtigo(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Criando..." : "Criar Artigo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {artigos.map((artigo) => (
              <Card key={artigo.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="outline">{artigo.categoria}</Badge>
                  </div>
                  <CardTitle className="text-lg">{artigo.titulo}</CardTitle>
                  <CardDescription>{artigo.visualizacoes || 0} visualizações</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{artigo.conteudo}</p>
                  <div className="flex gap-2 mt-4">
                    {artigo.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
