"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Clock, AlertCircle, Plus, RefreshCw, Send, CheckCircle, Calendar } from "lucide-react"
import {
  createFatura,
  getClientesComPlanos,
  gerarFaturasMensais,
  marcarFaturaPaga,
  enviarNotificacaoFatura,
} from "@/app/actions/financeiro-revenda"
import { useToastFeedback } from "@/hooks/use-toast-feedback"

interface FinanceiroClientProps {
  faturas: any[]
  receita: {
    total: number
    pago: number
    pendente: number
    vencido: number
  }
  revendaId: string
}

export function FinanceiroClient({ faturas, receita, revendaId }: FinanceiroClientProps) {
  const feedback = useToastFeedback()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [gerandoFaturas, setGerandoFaturas] = useState(false)

  useEffect(() => {
    async function loadClientes() {
      const data = await getClientesComPlanos(revendaId)
      setClientes(data)
    }
    loadClientes()
  }, [revendaId])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await createFatura({
        revendaId,
        clienteId: formData.get("clienteId") as string,
        valor: Number.parseFloat(formData.get("valor") as string),
        vencimento: formData.get("vencimento") as string,
        descricao: formData.get("descricao") as string,
        metodoPagamento: formData.get("metodoPagamento") as string,
      })

      feedback.success("Fatura criada com sucesso!")
      setOpen(false)
      window.location.reload()
    } catch (error) {
      feedback.error("Erro ao criar fatura")
    } finally {
      setLoading(false)
    }
  }

  const handleGerarFaturasMensais = async () => {
    setGerandoFaturas(true)
    try {
      const result = await gerarFaturasMensais(revendaId)
      if (result.success) {
        feedback.success("Faturas mensais geradas com sucesso!")
        window.location.reload()
      } else {
        feedback.error("Erro ao gerar faturas mensais")
      }
    } catch (error) {
      feedback.error("Erro ao gerar faturas mensais")
    } finally {
      setGerandoFaturas(false)
    }
  }

  const handleMarcarPaga = async (faturaId: string) => {
    const result = await marcarFaturaPaga(faturaId)
    if (result.success) {
      feedback.success("Fatura marcada como paga!")
      window.location.reload()
    } else {
      feedback.error("Erro ao marcar fatura como paga")
    }
  }

  const handleReenviarNotificacao = async (faturaId: string) => {
    const result = await enviarNotificacaoFatura(faturaId, revendaId)
    if (result.success) {
      feedback.success("Notificação enviada com sucesso!")
    } else {
      feedback.error("Erro ao enviar notificação")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGerarFaturasMensais} disabled={gerandoFaturas}>
            <RefreshCw className={`mr-2 h-4 w-4 ${gerandoFaturas ? "animate-spin" : ""}`} />
            Gerar Faturas Mensais
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Fatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Fatura</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Select name="clienteId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_completo} - {cliente.planos?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" name="valor" type="number" step="0.01" required />
                </div>
                <div>
                  <Label htmlFor="vencimento">Vencimento</Label>
                  <Input id="vencimento" name="vencimento" type="date" required />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" name="descricao" required />
                </div>
                <div>
                  <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
                  <Select name="metodoPagamento" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Criando..." : "Criar Fatura"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {receita.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {receita.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {receita.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {receita.vencido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="pagas">Pagas</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faturas.map((fatura) => (
                  <div key={fatura.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{fatura.numero_fatura}</p>
                        <Badge
                          variant={
                            fatura.status === "paga"
                              ? "default"
                              : fatura.status === "pendente"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {fatura.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{fatura.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {fatura.usuarios?.nome_completo} - {fatura.usuarios?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="font-bold">
                          R$ {fatura.valor_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">{fatura.metodo_pagamento?.toUpperCase()}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {fatura.status === "pendente" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarcarPaga(fatura.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marcar Paga
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleReenviarNotificacao(fatura.id)}>
                          <Send className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faturas
                  .filter((f) => f.status === "pendente")
                  .map((fatura) => (
                    <div key={fatura.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{fatura.numero_fatura}</p>
                          <Badge variant="secondary">{fatura.status.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{fatura.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {fatura.usuarios?.nome_completo} - {fatura.usuarios?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold">
                            R$ {fatura.valor_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">{fatura.metodo_pagamento?.toUpperCase()}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleMarcarPaga(fatura.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marcar Paga
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReenviarNotificacao(fatura.id)}>
                            <Send className="h-3 w-3 mr-1" />
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagas">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faturas
                  .filter((f) => f.status === "paga")
                  .map((fatura) => (
                    <div key={fatura.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{fatura.numero_fatura}</p>
                          <Badge variant="default">{fatura.status.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{fatura.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {fatura.usuarios?.nome_completo} - {fatura.usuarios?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold">
                            R$ {fatura.valor_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">{fatura.metodo_pagamento?.toUpperCase()}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleReenviarNotificacao(fatura.id)}>
                            <Send className="h-3 w-3 mr-1" />
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencidas">
          <Card>
            <CardHeader>
              <CardTitle>Faturas Vencidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faturas
                  .filter((f) => f.status === "vencida")
                  .map((fatura) => (
                    <div key={fatura.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{fatura.numero_fatura}</p>
                          <Badge variant="destructive">{fatura.status.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{fatura.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          {fatura.usuarios?.nome_completo} - {fatura.usuarios?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold">
                            R$ {fatura.valor_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">{fatura.metodo_pagamento?.toUpperCase()}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {fatura.status === "pendente" && (
                            <Button size="sm" variant="outline" onClick={() => handleMarcarPaga(fatura.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marcar Paga
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleReenviarNotificacao(fatura.id)}>
                            <Send className="h-3 w-3 mr-1" />
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
