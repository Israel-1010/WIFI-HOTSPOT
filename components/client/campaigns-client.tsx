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
import { useToast } from "@/hooks/use-toast"

interface Campaign {
  id: string
  nome: string
  tipo: string
  status: "ativa" | "pausada" | "concluida" | string
  visualizacoes: number
  cliques: number
  conversoes: number
  data_inicio?: string
  data_fim?: string
  descricao?: string | null
  conteudo?: {
    title?: string
    description?: string
    buttonText?: string
    targetUrl?: string
    mediaType?: string
    imageUrl?: string
    videoUrl?: string
    html?: string
  } | null
  created_at: string
}

export function CampaignsClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const defaultConteudo = {
    title: "",
    description: "",
    buttonText: "Saiba mais",
    targetUrl: "",
    mediaType: "image",
    imageUrl: "",
    videoUrl: "",
    html: "",
  }

  const [newCampaign, setNewCampaign] = useState({
    nome: "",
    tipo: "popup",
    descricao: "",
    conteudo: { ...defaultConteudo },
  })

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (event) => reject(event)
      reader.readAsDataURL(file)
    })

  const handleUploadImage = async (file: File | null, mode: "new" | "edit") => {
    if (!file) return
    try {
      const base64 = await fileToBase64(file)
      if (mode === "new") {
        setNewCampaign((prev) => ({
          ...prev,
          conteudo: { ...prev.conteudo, imageUrl: base64 },
        }))
      } else {
        setEditingCampaign((prev) =>
          prev
            ? {
                ...prev,
                conteudo: { ...prev.conteudo, imageUrl: base64 },
              }
            : prev,
        )
      }
      toast({
        title: "Imagem carregada",
        description: "Convertida para Base64 e pronta para publicação.",
      })
    } catch (error) {
      console.error("[v0] Erro ao converter imagem:", error)
      toast({ title: "Erro ao carregar imagem", description: "Tente outro arquivo.", variant: "destructive" })
    }
  }

  const resetNewCampaign = () => {
    setNewCampaign({ nome: "", tipo: "popup", descricao: "", conteudo: { ...defaultConteudo } })
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.nome || !newCampaign.conteudo.title) {
      toast({ title: "Campos obrigatórios", description: "Informe nome e título da campanha.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createCampanha(newCampaign)
      setCampaigns((prev) => [created as Campaign, ...prev])
      toast({ title: "Campanha criada", description: "Seu criativo já está disponível para seleção." })
      resetNewCampaign()
      setIsCreating(false)
    } catch (error) {
      console.error("[v0] Error creating campaign:", error)
      toast({ title: "Erro ao criar campanha", description: "Tente novamente mais tarde.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativa" ? "pausada" : "ativa"
    try {
      await updateCampanhaStatus(id, newStatus)
      setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
      toast({
        title: "Status atualizado",
        description: `Campanha ${newStatus === "ativa" ? "ativada" : "pausada"}.`,
      })
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      toast({ title: "Erro ao atualizar campanha", description: "Tente novamente.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return

    try {
      await deleteCampanha(id)
      setCampaigns(campaigns.filter((c) => c.id !== id))
      toast({ title: "Campanha removida" })
    } catch (error) {
      console.error("[v0] Error deleting campaign:", error)
      toast({ title: "Erro ao excluir", description: "Não foi possível remover a campanha.", variant: "destructive" })
    }
  }

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign({
      ...campaign,
      descricao: campaign.descricao || "",
      conteudo: { ...defaultConteudo, ...(campaign.conteudo || {}) },
    })
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
        descricao: editingCampaign.descricao,
      })

      setCampaigns(campaigns.map((c) => (c.id === editingCampaign.id ? editingCampaign : c)))
      setIsEditing(false)
      setEditingCampaign(null)
      toast({ title: "Campanha atualizada" })
    } catch (error) {
      console.error("[v0] Error updating campaign:", error)
      toast({ title: "Erro ao atualizar", description: "Reveja os campos e tente novamente.", variant: "destructive" })
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

                <div className="space-y-2">
                  <Label>Descrição resumida</Label>
                  <Textarea
                    value={newCampaign.descricao}
                    onChange={(e) => setNewCampaign({ ...newCampaign, descricao: e.target.value })}
                    placeholder="Texto que aparece na lista de campanhas"
                    rows={2}
                  />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato do criativo</Label>
                    <Select
                      value={newCampaign.conteudo.mediaType}
                      onValueChange={(value) =>
                        setNewCampaign({
                          ...newCampaign,
                          conteudo: { ...newCampaign.conteudo, mediaType: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Imagem (URL)</SelectItem>
                        <SelectItem value="video">Vídeo (MP4)</SelectItem>
                        <SelectItem value="html">HTML/Embed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {newCampaign.conteudo.mediaType === "image" && (
                      <>
                        <Label>URL da imagem</Label>
                        <Input
                          value={newCampaign.conteudo.imageUrl}
                          onChange={(e) =>
                            setNewCampaign({
                              ...newCampaign,
                              conteudo: { ...newCampaign.conteudo, imageUrl: e.target.value },
                            })
                          }
                          placeholder="https://cdn.meusite.com/banner.jpg"
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0] || null
                            await handleUploadImage(file, "new")
                            event.target.value = ""
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Você pode colar uma URL ou enviar um arquivo (armazenado como Base64).
                        </p>
                      </>
                    )}

                    {newCampaign.conteudo.mediaType === "video" && (
                      <>
                        <Label>URL do vídeo</Label>
                        <Input
                          value={newCampaign.conteudo.videoUrl}
                          onChange={(e) =>
                            setNewCampaign({
                              ...newCampaign,
                              conteudo: { ...newCampaign.conteudo, videoUrl: e.target.value },
                            })
                          }
                          placeholder="https://cdn.meusite.com/video.mp4"
                        />
                      </>
                    )}

                    {newCampaign.conteudo.mediaType === "html" && (
                      <>
                        <Label>Código HTML</Label>
                        <Textarea
                          value={newCampaign.conteudo.html}
                          onChange={(e) =>
                            setNewCampaign({
                              ...newCampaign,
                              conteudo: { ...newCampaign.conteudo, html: e.target.value },
                            })
                          }
                          rows={4}
                          placeholder="<div>Conteúdo customizado</div>"
                        />
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="font-semibold mb-4">Preview da Campanha</h3>

                  {newCampaign.conteudo.mediaType === "image" && newCampaign.conteudo.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={newCampaign.conteudo.imageUrl}
                      alt="Prévia da campanha"
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  {newCampaign.conteudo.mediaType === "video" && newCampaign.conteudo.videoUrl && (
                    <video src={newCampaign.conteudo.videoUrl} className="w-full h-48 rounded-md mb-4" controls muted />
                  )}

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

                <div className="space-y-2">
                  <Label>Descrição resumida</Label>
                  <Textarea
                    value={editingCampaign.descricao || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, descricao: e.target.value })}
                    rows={2}
                  />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato do criativo</Label>
                    <Select
                      value={editingCampaign.conteudo?.mediaType || "image"}
                      onValueChange={(value) =>
                        setEditingCampaign({
                          ...editingCampaign,
                          conteudo: { ...editingCampaign.conteudo, mediaType: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Imagem (URL)</SelectItem>
                        <SelectItem value="video">Vídeo (MP4)</SelectItem>
                        <SelectItem value="html">HTML/Embed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    {editingCampaign.conteudo?.mediaType === "video" ? (
                      <>
                        <Label>URL do vídeo</Label>
                        <Input
                          value={editingCampaign.conteudo?.videoUrl || ""}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              conteudo: { ...editingCampaign.conteudo, videoUrl: e.target.value },
                            })
                          }
                        />
                      </>
                    ) : editingCampaign.conteudo?.mediaType === "html" ? (
                      <>
                        <Label>Código HTML</Label>
                        <Textarea
                          value={editingCampaign.conteudo?.html || ""}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              conteudo: { ...editingCampaign.conteudo, html: e.target.value },
                            })
                          }
                          rows={4}
                        />
                      </>
                    ) : (
                      <>
                        <Label>URL da imagem</Label>
                        <Input
                          value={editingCampaign.conteudo?.imageUrl || ""}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              conteudo: { ...editingCampaign.conteudo, imageUrl: e.target.value },
                            })
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (event) => {
                            const file = event.target.files?.[0] || null
                            await handleUploadImage(file, "edit")
                            event.target.value = ""
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Faça upload para salvar o arquivo como Base64 na campanha.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6 bg-gray-50">
                  <h3 className="font-semibold mb-4">Preview da Campanha</h3>

                  {editingCampaign.conteudo?.mediaType === "image" && editingCampaign.conteudo?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editingCampaign.conteudo.imageUrl}
                      alt="Prévia da campanha"
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  {editingCampaign.conteudo?.mediaType === "video" && editingCampaign.conteudo?.videoUrl && (
                    <video src={editingCampaign.conteudo.videoUrl} className="w-full h-48 rounded-md mb-4" controls muted />
                  )}

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
        {campaigns.map((campaign) => {
          const mediaType = campaign.conteudo?.mediaType
          const hasImage = mediaType === "image" && campaign.conteudo?.imageUrl
          const hasVideo = mediaType === "video" && campaign.conteudo?.videoUrl
          return (
            <Card key={campaign.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={campaign.conteudo?.imageUrl} alt="thumb" className="h-full w-full object-cover" />
                      ) : hasVideo ? (
                        <video src={campaign.conteudo?.videoUrl} className="h-full w-full object-cover" muted loop />
                      ) : (
                        <span className="text-2xl">{getCampaignIcon(campaign.tipo)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{campaign.nome}</h3>
                        <Badge
                          variant={
                            campaign.status === "ativa"
                              ? "default"
                              : campaign.status === "pausada"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {campaign.status === "ativa"
                            ? "Ativa"
                            : campaign.status === "pausada"
                              ? "Pausada"
                              : campaign.status === "concluida"
                                ? "Concluída"
                                : "Status desconhecido"}
                        </Badge>
                        <Badge variant="outline">{campaign.tipo}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {campaign.descricao || campaign.conteudo?.description || "Sem descrição"}
                      </p>
                      {campaign.conteudo?.targetUrl && (
                        <p className="text-xs text-muted-foreground mt-1">{campaign.conteudo.targetUrl}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(campaign.id, campaign.status)}>
                      {campaign.status === "ativa" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(campaign)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              </CardContent>
            </Card>
          )
        })}

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
