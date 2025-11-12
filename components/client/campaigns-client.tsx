"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Play, Pause } from "lucide-react"
import { createCampanha, updateCampanhaStatus, deleteCampanha, updateCampanha } from "@/app/actions/campanhas"

interface Campaign {
  id: string
  nome: string
  tipo: string
  status: string
  visualizacoes: number
  cliques: number
  conversoes: number
  data_inicio?: string
  data_fim?: string
  conteudo: any
  created_at: string
}

export function CampaignsClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    nome: "",
    tipo: "popup",
    conteudo: {
      title: "",
      description: "",
      buttonText: "Clique aqui",
      targetUrl: "",
    },
  })

  const handleCreateCampaign = async () => {
    if (!newCampaign.nome || !newCampaign.conteudo.title) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      await createCampanha(newCampaign)
      setIsCreating(false)
      setNewCampaign({
        nome: "",
        tipo: "popup",
        conteudo: {
          title: "",
          description: "",
          buttonText: "Clique aqui",
          targetUrl: "",
        },
      })
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error creating campaign:", error)
      alert("Erro ao criar campanha")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    try {
      await updateCampanhaStatus(id, newStatus)
      setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      alert("Erro ao atualizar campanha")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return

    try {
      await deleteCampanha(id)
      setCampaigns(campaigns.filter((c) => c.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting campaign:", error)
      alert("Erro ao excluir campanha")
    }
  }

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCampaign) return

    setIsSubmitting(true)
    try {
      await updateCampanha(editingCampaign.id, {
        nome: editingCampaign.nome,
        tipo: editingCampaign.tipo,
        conteudo: editingCampaign.conteudo,
      })

      setCampaigns(campaigns.map((c) => (c.id === editingCampaign.id ? editingCampaign : c)))
      setIsEditing(false)
      setEditingCampaign(null)
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      alert("Erro ao atualizar campanha")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case "popup":
        return "🪟"
      case "banner":
        return "🎯"
      case "redirect":
        return "🔗"
      case "survey":
        return "📋"
      default:
        return "📢"
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input
                      value={newCampaign.nome}
                      onChange={(e) => setNewCampaign({ ...newCampaign, nome: e.target.value })}
                      placeholder="Ex: Promoção de Verão"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newCampaign.tipo}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">🪟 Popup</SelectItem>
                        <SelectItem value="banner">🎯 Banner</SelectItem>
                        <SelectItem value="redirect">🔗 Redirecionamento</SelectItem>
                        <SelectItem value="survey">📋 Enquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newCampaign.conteudo.title}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        conteudo: { ...newCampaign.conteudo, title: e.target.value },
                      })
                    }
                    placeholder="Título da campanha"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newCampaign.conteudo.description}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        conteudo: { ...newCampaign.conteudo, description: e.target.value },
                      })
                    }
                    placeholder="Descrição da campanha"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={newCampaign.conteudo.buttonText}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          conteudo: { ...newCampaign.conteudo, buttonText: e.target.value },
                        })
                      }
                      placeholder="Ex: Saiba Mais"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL de Destino</Label>
                    <Input
                      value={newCampaign.conteudo.targetUrl}
                      onChange={(e) =>
                        setNewCampaign({
                          ...newCampaign,
                          conteudo: { ...newCampaign.conteudo, targetUrl: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="font-semibold mb-4">Preview da Campanha</h3>

                  {newCampaign.tipo === "popup" && (
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                      <h4 className="text-lg font-bold mb-2">{newCampaign.conteudo.title || "Título"}</h4>
                      <p className="text-gray-600 mb-4">{newCampaign.conteudo.description || "Descrição"}</p>
                      <Button className="w-full">{newCampaign.conteudo.buttonText || "Botão"}</Button>
                    </div>
                  )}

                  {newCampaign.tipo === "banner" && (
                    <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
                      <h4 className="font-bold">{newCampaign.conteudo.title || "Título"}</h4>
                      <p className="text-sm opacity-90">{newCampaign.conteudo.description || "Descrição"}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign} disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Campanha"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
          </DialogHeader>

          {editingCampaign && (
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input
                      value={editingCampaign.nome}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, nome: e.target.value })}
                      placeholder="Ex: Promoção de Verão"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={editingCampaign.tipo}
                      onValueChange={(value) => setEditingCampaign({ ...editingCampaign, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">🪟 Popup</SelectItem>
                        <SelectItem value="banner">🎯 Banner</SelectItem>
                        <SelectItem value="redirect">🔗 Redirecionamento</SelectItem>
                        <SelectItem value="survey">📋 Enquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editingCampaign.conteudo?.title || ""}
                    onChange={(e) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        conteudo: { ...editingCampaign.conteudo, title: e.target.value },
                      })
                    }
                    placeholder="Título da campanha"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={editingCampaign.conteudo?.description || ""}
                    onChange={(e) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        conteudo: { ...editingCampaign.conteudo, description: e.target.value },
                      })
                    }
                    placeholder="Descrição da campanha"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={editingCampaign.conteudo?.buttonText || ""}
                      onChange={(e) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          conteudo: { ...editingCampaign.conteudo, buttonText: e.target.value },
                        })
                      }
                      placeholder="Ex: Saiba Mais"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL de Destino</Label>
                    <Input
                      value={editingCampaign.conteudo?.targetUrl || ""}
                      onChange={(e) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          conteudo: { ...editingCampaign.conteudo, targetUrl: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="font-semibold mb-4">Preview da Campanha</h3>

                  {editingCampaign.tipo === "popup" && (
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
                      <h4 className="text-lg font-bold mb-2">{editingCampaign.conteudo?.title || "Título"}</h4>
                      <p className="text-gray-600 mb-4">{editingCampaign.conteudo?.description || "Descrição"}</p>
                      <Button className="w-full">{editingCampaign.conteudo?.buttonText || "Botão"}</Button>
                    </div>
                  )}

                  {editingCampaign.tipo === "banner" && (
                    <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
                      <h4 className="font-bold">{editingCampaign.conteudo?.title || "Título"}</h4>
                      <p className="text-sm opacity-90">{editingCampaign.conteudo?.description || "Descrição"}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditingCampaign(null)
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getCampaignIcon(campaign.tipo)}</div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold">{campaign.nome}</h3>
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "paused"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {campaign.status === "active" ? "Ativa" : campaign.status === "paused" ? "Pausada" : "Rascunho"}
                      </Badge>
                      <Badge variant="outline">{campaign.tipo}</Badge>
                    </div>
                    <p className="text-gray-600">{campaign.conteudo?.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="text-xl font-bold">{campaign.visualizacoes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cliques</p>
                    <p className="text-xl font-bold">{campaign.cliques}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversões</p>
                    <p className="text-xl font-bold">{campaign.conversoes}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleStatus(campaign.id, campaign.status)}>
                    {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(campaign)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">Nenhuma campanha criada ainda</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
