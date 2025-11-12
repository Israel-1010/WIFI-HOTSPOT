"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ThumbsUp, ThumbsDown, Users, TrendingUp, Mail, MessageSquare, Send, Smartphone } from "lucide-react"
import {
  getEstatisticasInteracoes,
  getUsuariosPorResposta,
  enviarMensagem,
  getTemplatesMensagens,
} from "@/app/actions/interacoes-anuncios"
import { toast } from "sonner"

interface InteracoesClientProps {
  clienteId: string
}

export function InteracoesClient({ clienteId }: InteracoesClientProps) {
  const [stats, setStats] = useState<any>(null)
  const [usuariosSim, setUsuariosSim] = useState<any[]>([])
  const [usuariosNao, setUsuariosNao] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showEnvioDialog, setShowEnvioDialog] = useState(false)
  const [tipoEnvio, setTipoEnvio] = useState<"email" | "sms" | "whatsapp">("email")
  const [templateSelecionado, setTemplateSelecionado] = useState("")
  const [assunto, setAssunto] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [templates, setTemplates] = useState<any[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    loadData()
    loadTemplates()
  }, [clienteId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, simData, naoData] = await Promise.all([
        getEstatisticasInteracoes(clienteId),
        getUsuariosPorResposta(clienteId, "sim"),
        getUsuariosPorResposta(clienteId, "nao"),
      ])

      setStats(statsData)
      setUsuariosSim(simData)
      setUsuariosNao(naoData)
    } catch (error) {
      console.error("[v0] Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    const templatesData = await getTemplatesMensagens()
    setTemplates(templatesData)
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const selectAllUsers = (usuarios: any[]) => {
    const newSelected = new Set(selectedUsers)
    usuarios.forEach((u) => newSelected.add(u.id))
    setSelectedUsers(newSelected)
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
  }

  const handleTemplateChange = (templateId: string) => {
    setTemplateSelecionado(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setAssunto(template.assunto || "")
      setMensagem(template.mensagem)
      setTipoEnvio(template.tipo)
    }
  }

  const handleEnviar = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Selecione pelo menos um usuário")
      return
    }

    if (!mensagem.trim()) {
      toast.error("Digite uma mensagem")
      return
    }

    if (tipoEnvio === "email" && !assunto.trim()) {
      toast.error("Digite um assunto para o email")
      return
    }

    setEnviando(true)
    try {
      const result = await enviarMensagem({
        usuario_ids: Array.from(selectedUsers),
        tipo: tipoEnvio,
        assunto: tipoEnvio === "email" ? assunto : undefined,
        mensagem,
        template_id: templateSelecionado || undefined,
      })

      toast.success(`Mensagem enviada para ${result.total_enviados} usuário(s)!`)
      setShowEnvioDialog(false)
      clearSelection()
      setMensagem("")
      setAssunto("")
      setTemplateSelecionado("")
    } catch (error) {
      console.error("[v0] Erro ao enviar mensagem:", error)
      toast.error("Erro ao enviar mensagem")
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>
  }

  const renderUserList = (usuarios: any[], tipo: "sim" | "nao") => (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {usuarios.map((usuario: any) => (
            <div key={usuario.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
              <Checkbox
                checked={selectedUsers.has(usuario.id)}
                onCheckedChange={() => toggleUserSelection(usuario.id)}
              />
              <Avatar>
                <AvatarImage src={usuario.foto_perfil || "/placeholder.svg"} />
                <AvatarFallback>{usuario.nome_completo?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{usuario.nome_completo}</p>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                {usuario.telefone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {usuario.telefone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline">{usuario.provider}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(usuario.respondido_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          ))}

          {usuarios.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum usuário {tipo === "sim" ? "interessado" : "não interessado"} ainda
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Interações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_visualizacoes}</div>
            <p className="text-xs text-muted-foreground">{stats.usuarios_unicos} usuários únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interessados</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_sim}</div>
            <p className="text-xs text-muted-foreground">Clicaram em "Tenho Interesse"</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Interessados</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.total_nao}</div>
            <p className="text-xs text-muted-foreground">Clicaram em "Não Tenho Interesse"</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Interesse</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxa_interesse}%</div>
            <p className="text-xs text-muted-foreground">Percentual de interessados</p>
          </CardContent>
        </Card>
      </div>

      {/* Seleção e Ações */}
      {selectedUsers.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{selectedUsers.size} selecionado(s)</Badge>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpar Seleção
              </Button>
            </div>
            <Button onClick={() => setShowEnvioDialog(true)}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs com Listas de Usuários */}
      <Tabs defaultValue="sim" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sim">Interessados ({usuariosSim.length})</TabsTrigger>
          <TabsTrigger value="nao">Não Interessados ({usuariosNao.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sim" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuários Interessados</h3>
            <Button size="sm" variant="outline" onClick={() => selectAllUsers(usuariosSim)}>
              Selecionar Todos
            </Button>
          </div>
          {renderUserList(usuariosSim, "sim")}
        </TabsContent>

        <TabsContent value="nao" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Usuários Não Interessados</h3>
            <Button size="sm" variant="outline" onClick={() => selectAllUsers(usuariosNao)}>
              Selecionar Todos
            </Button>
          </div>
          {renderUserList(usuariosNao, "nao")}
        </TabsContent>
      </Tabs>

      {/* Dialog de Envio */}
      <Dialog open={showEnvioDialog} onOpenChange={setShowEnvioDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Envie email, SMS ou WhatsApp para {selectedUsers.size} usuário(s) selecionado(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo de Envio */}
            <div className="space-y-2">
              <Label>Tipo de Envio</Label>
              <div className="flex gap-2">
                <Button
                  variant={tipoEnvio === "email" ? "default" : "outline"}
                  onClick={() => setTipoEnvio("email")}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant={tipoEnvio === "sms" ? "default" : "outline"}
                  onClick={() => setTipoEnvio("sms")}
                  className="flex-1"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  SMS
                </Button>
                <Button
                  variant={tipoEnvio === "whatsapp" ? "default" : "outline"}
                  onClick={() => setTipoEnvio("whatsapp")}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label>Template (Opcional)</Label>
              <Select value={templateSelecionado} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template ou escreva sua mensagem" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((t) => t.tipo === tipoEnvio)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assunto (apenas para email) */}
            {tipoEnvio === "email" && (
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Digite o assunto do email"
                />
              </div>
            )}

            {/* Mensagem */}
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar com o nome do usuário"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Dica: Use {`{{nome}}`} para inserir o nome do usuário automaticamente
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnvioDialog(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={enviando}>
              {enviando ? "Enviando..." : `Enviar para ${selectedUsers.size} usuário(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
