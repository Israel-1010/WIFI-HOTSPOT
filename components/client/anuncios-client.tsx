"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, ThumbsUp, ThumbsDown, Edit, Trash2, Play, Pause } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAnuncio, updateAnuncio, deleteAnuncio } from "@/app/actions/anuncios"
import { useRouter } from "next/navigation"

interface Anuncio {
  id: string
  titulo: string
  descricao: string
  tipo: string
  imagem_url?: string
  video_url?: string
  cta_texto_sim: string
  cta_texto_nao: string
  tempo_exibicao: number
  ativo: boolean
  ordem: number
}

interface Estatistica {
  anuncio_id: string
  titulo: string
  total_visualizacoes: number
  total_sim: number
  total_nao: number
  taxa_interesse: string
}

export function AnunciosClient({
  anuncios,
  estatisticas,
  userId,
}: {
  anuncios: Anuncio[]
  estatisticas: Estatistica[]
  userId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "imagem",
    imagem_url: "",
    video_url: "",
    cta_texto_sim: "Tenho interesse",
    cta_texto_nao: "Não tenho interesse",
    tempo_exibicao: 30,
    ordem: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await updateAnuncio(editingId, formData)
      } else {
        await createAnuncio({
          ...formData,
          cliente_id: userId,
          ativo: true,
        })
      }

      setOpen(false)
      setEditingId(null)
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "imagem",
        imagem_url: "",
        video_url: "",
        cta_texto_sim: "Tenho interesse",
        cta_texto_nao: "Não tenho interesse",
        tempo_exibicao: 30,
        ordem: 0,
      })
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar anúncio:", error)
    }
  }

  const handleEdit = (anuncio: Anuncio) => {
    setEditingId(anuncio.id)
    setFormData({
      titulo: anuncio.titulo,
      descricao: anuncio.descricao || "",
      tipo: anuncio.tipo,
      imagem_url: anuncio.imagem_url || "",
      video_url: anuncio.video_url || "",
      cta_texto_sim: anuncio.cta_texto_sim,
      cta_texto_nao: anuncio.cta_texto_nao,
      tempo_exibicao: anuncio.tempo_exibicao,
      ordem: anuncio.ordem,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este anúncio?")) {
      try {
        await deleteAnuncio(id)
        router.refresh()
      } catch (error) {
        console.error("Erro ao excluir anúncio:", error)
      }
    }
  }

  const handleToggleAtivo = async (anuncio: Anuncio) => {
    try {
      await updateAnuncio(anuncio.id, { ativo: !anuncio.ativo })
      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const getEstatistica = (anuncioId: string) => {
    return estatisticas.find((e) => e.anuncio_id === anuncioId)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anúncios Wi-Fi</h1>
          <p className="text-muted-foreground">Gerencie os anúncios exibidos no portal de conexão</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                setFormData({
                  titulo: "",
                  descricao: "",
                  tipo: "imagem",
                  imagem_url: "",
                  video_url: "",
                  cta_texto_sim: "Tenho interesse",
                  cta_texto_nao: "Não tenho interesse",
                  tempo_exibicao: 30,
                  ordem: 0,
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Anúncio" : "Novo Anúncio"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imagem">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempo">Tempo de Exibição (segundos)</Label>
                  <Input
                    id="tempo"
                    type="number"
                    value={formData.tempo_exibicao}
                    onChange={(e) => setFormData({ ...formData, tempo_exibicao: Number.parseInt(e.target.value) })}
                    min={5}
                    required
                  />
                </div>
              </div>

              {formData.tipo === "imagem" && (
                <div className="space-y-2">
                  <Label htmlFor="imagem_url">URL da Imagem</Label>
                  <Input
                    id="imagem_url"
                    value={formData.imagem_url}
                    onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.tipo === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do Vídeo</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_sim">Texto Botão "Sim"</Label>
                  <Input
                    id="cta_sim"
                    value={formData.cta_texto_sim}
                    onChange={(e) => setFormData({ ...formData, cta_texto_sim: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta_nao">Texto Botão "Não"</Label>
                  <Input
                    id="cta_nao"
                    value={formData.cta_texto_nao}
                    onChange={(e) => setFormData({ ...formData, cta_texto_nao: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingId ? "Salvar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {anuncios.map((anuncio) => {
          const stats = getEstatistica(anuncio.id)

          return (
            <Card key={anuncio.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{anuncio.titulo}</CardTitle>
                      <Badge variant={anuncio.ativo ? "default" : "secondary"}>
                        {anuncio.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">{anuncio.tipo}</Badge>
                    </div>
                    <CardDescription>{anuncio.descricao}</CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleAtivo(anuncio)}>
                      {anuncio.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(anuncio)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(anuncio.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {stats && (
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{stats.total_visualizacoes}</p>
                        <p className="text-xs text-muted-foreground">Visualizações</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.total_sim}</p>
                        <p className="text-xs text-muted-foreground">Interessados</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">{stats.total_nao}</p>
                        <p className="text-xs text-muted-foreground">Não Interessados</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-bold">{stats.taxa_interesse}%</p>
                      <p className="text-xs text-muted-foreground">Taxa de Interesse</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}

        {anuncios.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum anúncio cadastrado</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Anúncio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
