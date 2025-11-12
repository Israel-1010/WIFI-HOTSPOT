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
import { FileText, Calculator, Plus, DollarSign, Users, Target } from "lucide-react"
import { createProposta, updatePropostaStatus, calcularSimulacao, createLead } from "@/app/actions/comercial-revenda"
import { useRouter } from "next/navigation"

interface ComercialClientProps {
  propostas: any[]
  pipeline: any[]
  clientes: any[]
  revendaId: string
}

export function ComercialClient({ propostas, pipeline, clientes, revendaId }: ComercialClientProps) {
  const router = useRouter()
  const [openProposta, setOpenProposta] = useState(false)
  const [openLead, setOpenLead] = useState(false)
  const [loading, setLoading] = useState(false)

  // Simulador
  const [numHotspots, setNumHotspots] = useState(5)
  const [numUsuarios, setNumUsuarios] = useState(100)
  const [planoSelecionado, setPlanoSelecionado] = useState("profissional")
  const [simulacao, setSimulacao] = useState<any>(null)

  const propostasEnviadas = propostas.filter((p) => p.status === "enviada").length
  const propostasAceitas = propostas.filter((p) => p.status === "aceita").length
  const valorTotal = propostas.filter((p) => p.status === "aceita").reduce((sum, p) => sum + (p.valor_total || 0), 0)

  const leadsQualificados = pipeline.filter((l) => l.estagio === "qualificado").length
  const leadsNegociacao = pipeline.filter((l) => l.estagio === "negociacao").length
  const leadsConvertidos = pipeline.filter((l) => l.estagio === "convertido").length

  const handleCreateProposta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createProposta({
        revendaId,
        clienteId: formData.get("cliente_id") as string,
        titulo: formData.get("titulo") as string,
        descricao: formData.get("descricao") as string,
        valor: Number.parseFloat(formData.get("valor") as string),
        validade: formData.get("validade") as string,
        itens: [],
      })

      setOpenProposta(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao criar proposta:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createLead({
        revendaId,
        nome: formData.get("nome") as string,
        email: formData.get("email") as string,
        telefone: formData.get("telefone") as string,
        empresa: formData.get("empresa") as string,
        valorEstimado: Number.parseFloat(formData.get("valor_estimado") as string),
        estagio: formData.get("estagio") as string,
      })

      setOpenLead(false)
      router.refresh()
    } catch (error) {
      console.error("Erro ao criar lead:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSimular = async () => {
    const resultado = await calcularSimulacao({
      numHotspots,
      numUsuarios,
      plano: planoSelecionado,
    })
    setSimulacao(resultado)
  }

  const handleUpdateStatus = async (propostaId: string, status: string) => {
    try {
      await updatePropostaStatus(propostaId, status)
      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enviada":
        return "default"
      case "aceita":
        return "secondary"
      case "recusada":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getEstagioColor = (estagio: string) => {
    switch (estagio) {
      case "lead":
        return "outline"
      case "qualificado":
        return "default"
      case "negociacao":
        return "default"
      case "convertido":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ferramentas Comerciais</h1>
          <p className="text-muted-foreground">Propostas, simulador de preço e pipeline de vendas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propostasEnviadas}</div>
            <p className="text-xs text-muted-foreground">Aguardando resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Aceitas</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propostasAceitas}</div>
            <p className="text-xs text-muted-foreground">Taxa de conversão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotal)}
            </div>
            <p className="text-xs text-muted-foreground">Propostas aceitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.length}</div>
            <p className="text-xs text-muted-foreground">{leadsNegociacao} em negociação</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="propostas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="propostas">Propostas</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="propostas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openProposta} onOpenChange={setOpenProposta}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Proposta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Proposta Comercial</DialogTitle>
                  <DialogDescription>Gere uma nova proposta para enviar ao cliente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProposta} className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título da Proposta</Label>
                    <Input id="titulo" name="titulo" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea id="descricao" name="descricao" rows={4} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor Total (R$)</Label>
                      <Input id="valor" name="valor" type="number" step="0.01" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validade">Validade</Label>
                      <Input id="validade" name="validade" type="date" required />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenProposta(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Criando..." : "Criar Proposta"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {propostas.map((proposta) => (
              <Card key={proposta.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{proposta.titulo}</CardTitle>
                      <CardDescription>
                        Cliente: {proposta.cliente?.nome} • {new Date(proposta.criado_em).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(proposta.status)}>{proposta.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{proposta.descricao}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        proposta.valor_total,
                      )}
                    </div>
                    <div className="flex gap-2">
                      {proposta.status === "enviada" && (
                        <>
                          <Button size="sm" onClick={() => handleUpdateStatus(proposta.id, "aceita")}>
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(proposta.id, "recusada")}
                          >
                            Recusar
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="simulador" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulador de Preço</CardTitle>
              <CardDescription>Calcule o valor estimado baseado nos recursos necessários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Número de Hotspots</Label>
                    <Input
                      type="number"
                      value={numHotspots}
                      onChange={(e) => setNumHotspots(Number.parseInt(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Usuários Simultâneos</Label>
                    <Input
                      type="number"
                      value={numUsuarios}
                      onChange={(e) => setNumUsuarios(Number.parseInt(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Plano</Label>
                    <Select value={planoSelecionado} onValueChange={setPlanoSelecionado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSimular} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular
                  </Button>
                </div>

                {simulacao && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <h3 className="font-semibold">Resultado da Simulação</h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hotspots ({numHotspots}x)</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              simulacao.custoHotspots,
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Usuários ({numUsuarios}x)</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              simulacao.custoUsuarios,
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              simulacao.subtotal,
                            )}
                          </span>
                        </div>

                        {simulacao.desconto > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto ({simulacao.desconto}%)</span>
                            <span className="font-medium">
                              -
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                simulacao.valorDesconto,
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Total Mensal</span>
                          <span className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                              simulacao.total,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openLead} onOpenChange={setOpenLead}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Lead</DialogTitle>
                  <DialogDescription>Registre um novo lead no pipeline de vendas</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateLead} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Contato</Label>
                    <Input id="nome" name="nome" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" name="telefone" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input id="empresa" name="empresa" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                      <Input id="valor_estimado" name="valor_estimado" type="number" step="0.01" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estagio">Estágio</Label>
                      <Select name="estagio" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="negociacao">Negociação</SelectItem>
                          <SelectItem value="convertido">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenLead(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Criando..." : "Criar Lead"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadsQualificados}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadsNegociacao}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{leadsConvertidos}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pipeline.map((lead) => (
              <Card key={lead.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{lead.nome}</CardTitle>
                      <CardDescription>{lead.empresa}</CardDescription>
                    </div>
                    <Badge variant={getEstagioColor(lead.estagio)}>{lead.estagio}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{lead.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{lead.telefone}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Valor Estimado:</span>
                      <span className="font-semibold text-green-600">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          lead.valor_estimado,
                        )}
                      </span>
                    </div>
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
