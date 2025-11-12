"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Mail, Users, Webhook, Zap, Plus, Check, X, TestTube, Trash2 } from "lucide-react"
import {
  createIntegracao,
  updateIntegracao,
  deleteIntegracao,
  testarIntegracao,
} from "@/app/actions/integracoes-revenda"
import { useRouter } from "next/navigation"

interface Integracao {
  id: string
  tipo: string
  nome: string
  provider?: string
  configuracoes: Record<string, any>
  ativo: boolean
  testado_em?: string
  teste_sucesso?: boolean
  criado_em: string
}

interface WebhookLog {
  id: string
  evento: string
  status_code?: number
  sucesso: boolean
  criado_em: string
  integracoes_revenda?: { nome: string; tipo: string }
}

export default function IntegracoesClient({
  revendaId,
  userId,
  integracoes: initialIntegracoes,
  webhookLogs,
}: {
  revendaId: string
  userId: string
  integracoes: Integracao[]
  webhookLogs: WebhookLog[]
}) {
  const router = useRouter()
  const [integracoes, setIntegracoes] = useState(initialIntegracoes)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const tiposIntegracao = [
    { tipo: "whatsapp", nome: "WhatsApp Business", icon: MessageSquare, color: "text-green-600" },
    { tipo: "sms", nome: "SMS", icon: Mail, color: "text-blue-600" },
    { tipo: "crm", nome: "CRM", icon: Users, color: "text-purple-600" },
    { tipo: "webhook", nome: "Webhooks", icon: Webhook, color: "text-orange-600" },
    { tipo: "automation", nome: "Automações", icon: Zap, color: "text-yellow-600" },
  ]

  const handleCreate = async (formData: FormData) => {
    setLoading(true)
    const tipo = formData.get("tipo") as string
    const nome = formData.get("nome") as string
    const provider = formData.get("provider") as string

    const configuracoes: Record<string, any> = {}
    formData.forEach((value, key) => {
      if (key.startsWith("config_")) {
        configuracoes[key.replace("config_", "")] = value
      }
    })

    const result = await createIntegracao({
      revenda_id: revendaId,
      tipo,
      nome,
      provider: provider || undefined,
      configuracoes,
      criado_por: userId,
    })

    if (result.success) {
      router.refresh()
      setDialogOpen(false)
    }
    setLoading(false)
  }

  const handleToggle = async (id: string, ativo: boolean) => {
    await updateIntegracao(id, { ativo })
    router.refresh()
  }

  const handleTest = async (integracao: Integracao) => {
    const result = await testarIntegracao(integracao.id, integracao.tipo, integracao.configuracoes)
    alert(result.message)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta integração?")) {
      await deleteIntegracao(id)
      router.refresh()
    }
  }

  const renderFormFields = (tipo: string) => {
    switch (tipo) {
      case "whatsapp":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="config_phone_number_id">Phone Number ID</Label>
              <Input id="config_phone_number_id" name="config_phone_number_id" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_access_token">Access Token</Label>
              <Input id="config_access_token" name="config_access_token" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_business_account_id">Business Account ID</Label>
              <Input id="config_business_account_id" name="config_business_account_id" />
            </div>
          </>
        )

      case "sms":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Input id="provider" name="provider" placeholder="twilio, nexmo, etc." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_account_sid">Account SID</Label>
              <Input id="config_account_sid" name="config_account_sid" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_auth_token">Auth Token</Label>
              <Input id="config_auth_token" name="config_auth_token" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_from_number">Número de Origem</Label>
              <Input id="config_from_number" name="config_from_number" placeholder="+5511999999999" />
            </div>
          </>
        )

      case "crm":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">CRM</Label>
              <Input id="provider" name="provider" placeholder="hubspot, pipedrive, etc." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_api_key">API Key</Label>
              <Input id="config_api_key" name="config_api_key" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_api_url">API URL</Label>
              <Input id="config_api_url" name="config_api_url" placeholder="https://api.crm.com" />
            </div>
          </>
        )

      case "webhook":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="config_url">URL do Webhook</Label>
              <Input id="config_url" name="config_url" type="url" placeholder="https://..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_secret">Secret (opcional)</Label>
              <Input id="config_secret" name="config_secret" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_eventos">Eventos</Label>
              <Textarea id="config_eventos" name="config_eventos" placeholder="novo_usuario, nova_conexao, etc." />
            </div>
          </>
        )

      case "automation":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="provider">Plataforma</Label>
              <Input id="provider" name="provider" placeholder="n8n, zapier, make" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_webhook_url">Webhook URL</Label>
              <Input id="config_webhook_url" name="config_webhook_url" type="url" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config_api_key">API Key (opcional)</Label>
              <Input id="config_api_key" name="config_api_key" type="password" />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">Configure WhatsApp Business, SMS, CRM, webhooks e automações</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Integração</DialogTitle>
              <DialogDescription>Configure uma nova integração para sua revenda</DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Integração</Label>
                <select
                  id="tipo"
                  name="tipo"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={tipoSelecionado}
                  onChange={(e) => setTipoSelecionado(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposIntegracao.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {tipoSelecionado && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Integração</Label>
                    <Input id="nome" name="nome" placeholder="Ex: WhatsApp Principal" required />
                  </div>

                  {renderFormFields(tipoSelecionado)}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Criando..." : "Criar Integração"}
                  </Button>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="integracoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integracoes">Integrações Ativas</TabsTrigger>
          <TabsTrigger value="logs">Logs de Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="integracoes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integracoes.map((integracao) => {
              const tipoInfo = tiposIntegracao.find((t) => t.tipo === integracao.tipo)
              const Icon = tipoInfo?.icon || Webhook

              return (
                <Card key={integracao.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${tipoInfo?.color}`} />
                        <CardTitle className="text-lg">{integracao.nome}</CardTitle>
                      </div>
                      <Switch
                        checked={integracao.ativo}
                        onCheckedChange={(checked) => handleToggle(integracao.id, checked)}
                      />
                    </div>
                    <CardDescription>
                      {tipoInfo?.nome}
                      {integracao.provider && ` • ${integracao.provider}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {integracao.testado_em && (
                      <div className="flex items-center gap-2 text-sm">
                        {integracao.teste_sucesso ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Testado com sucesso</span>
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Teste falhou</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTest(integracao)} className="flex-1">
                        <TestTube className="mr-2 h-4 w-4" />
                        Testar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(integracao.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {integracoes.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma integração configurada ainda.
                  <br />
                  Clique em "Nova Integração" para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Webhook</CardTitle>
              <CardDescription>Últimas 20 requisições de webhook</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhookLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium">{log.evento}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.integracoes_revenda?.nome} • {new Date(log.criado_em).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={log.sucesso ? "default" : "destructive"}>
                      {log.status_code || (log.sucesso ? "Sucesso" : "Erro")}
                    </Badge>
                  </div>
                ))}
                {webhookLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
