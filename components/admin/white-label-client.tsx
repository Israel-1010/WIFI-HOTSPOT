"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, RefreshCw, Palette, Type, Layout } from "lucide-react"
import { updateWhiteLabelConfig, type WhiteLabelConfig } from "@/app/actions/white-label"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WhiteLabelClientProps {
  initialConfig: WhiteLabelConfig | null
}

export function WhiteLabelClient({ initialConfig }: WhiteLabelClientProps) {
  const feedback = useToastFeedback()
  const [config, setConfig] = useState(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: config?.nome || "",
    dominio: config?.dominio || "",
    logo_url: config?.logo_url || "",
    favicon_url: config?.favicon_url || "",
    cor_primaria: config?.cor_primaria || "#3B82F6",
    cor_secundaria: config?.cor_secundaria || "#10B981",
    cor_texto: config?.cor_texto || "#1f2937",
    cor_fundo: config?.cor_fundo || "#ffffff",
    cor_sidebar: config?.cor_sidebar || "#1e293b",
    cor_header: config?.cor_header || "#ffffff",
    fonte_primaria: config?.fonte_primaria || "Inter",
    fonte_secundaria: config?.fonte_secundaria || "Inter",
    estilo_botao: config?.estilo_botao || "rounded",
    tema_escuro: config?.tema_escuro || false,
  })

  const handleSave = async () => {
    if (!config?.id) {
      feedback.error("Configuração não encontrada")
      return
    }

    setIsSaving(true)
    try {
      await updateWhiteLabelConfig(config.id, formData)
      feedback.success("Configurações salvas com sucesso! Recarregando...")
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      feedback.error("Erro ao salvar configurações")
    } finally {
      setIsSaving(false)
    }
  }

  if (!config) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração não encontrada</CardTitle>
            <CardDescription>Não foi possível carregar as configurações white label</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">White Label</h1>
        <p className="text-muted-foreground mt-2">Personalize completamente a aparência da sua plataforma</p>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identidade">
            <Layout className="h-4 w-4 mr-2" />
            Identidade
          </TabsTrigger>
          <TabsTrigger value="cores">
            <Palette className="h-4 w-4 mr-2" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="tipografia">
            <Type className="h-4 w-4 mr-2" />
            Tipografia
          </TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Configure o nome e domínio da sua marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Minha Empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dominio">Domínio Customizado</Label>
                <Input
                  id="dominio"
                  value={formData.dominio}
                  onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
                  placeholder="meudominio.com.br"
                />
                <p className="text-sm text-muted-foreground">Configure seu domínio próprio (opcional)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
                {formData.logo_url && (
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                    <img src={formData.logo_url || "/placeholder.svg"} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon_url">URL do Favicon</Label>
                <Input
                  id="favicon_url"
                  value={formData.favicon_url}
                  onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cores" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cores Principais</CardTitle>
                <CardDescription>Defina as cores da sua marca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_primaria}
                      onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_secundaria}
                      onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cores de Interface</CardTitle>
                <CardDescription>Personalize elementos da interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_texto}
                      onChange={(e) => setFormData({ ...formData, cor_texto: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_texto}
                      onChange={(e) => setFormData({ ...formData, cor_texto: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_fundo}
                      onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_fundo}
                      onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cores de Componentes</CardTitle>
                <CardDescription>Sidebar e Header</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor da Sidebar</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_sidebar}
                      onChange={(e) => setFormData({ ...formData, cor_sidebar: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_sidebar}
                      onChange={(e) => setFormData({ ...formData, cor_sidebar: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor do Header</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor_header}
                      onChange={(e) => setFormData({ ...formData, cor_header: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.cor_header}
                      onChange={(e) => setFormData({ ...formData, cor_header: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>Configurações de tema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tema Escuro</Label>
                    <p className="text-sm text-muted-foreground">Ativar tema escuro por padrão</p>
                  </div>
                  <Switch
                    checked={formData.tema_escuro}
                    onCheckedChange={(checked) => setFormData({ ...formData, tema_escuro: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estilo dos Botões</Label>
                  <Select
                    value={formData.estilo_botao}
                    onValueChange={(value) => setFormData({ ...formData, estilo_botao: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Arredondado</SelectItem>
                      <SelectItem value="square">Quadrado</SelectItem>
                      <SelectItem value="pill">Pílula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tipografia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fontes</CardTitle>
              <CardDescription>Escolha as fontes da sua marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fonte Primária (Títulos)</Label>
                <Select
                  value={formData.fonte_primaria}
                  onValueChange={(value) => setFormData({ ...formData, fonte_primaria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fonte Secundária (Corpo)</Label>
                <Select
                  value={formData.fonte_secundaria}
                  onValueChange={(value) => setFormData({ ...formData, fonte_secundaria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>Veja como ficará sua marca</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview da Sidebar */}
              <div>
                <Label className="mb-2 block">Sidebar</Label>
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: formData.cor_sidebar,
                    color: "white",
                    fontFamily: formData.fonte_primaria,
                  }}
                >
                  {formData.logo_url && (
                    <img src={formData.logo_url || "/placeholder.svg"} alt="Logo" className="h-8 mb-4 object-contain" />
                  )}
                  <h3 className="font-bold text-lg">{formData.nome || "Sua Empresa"}</h3>
                  <p className="text-sm opacity-90 mt-1">Menu de Navegação</p>
                </div>
              </div>

              {/* Preview do Header */}
              <div>
                <Label className="mb-2 block">Header</Label>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: formData.cor_header,
                    color: formData.cor_texto,
                    fontFamily: formData.fonte_secundaria,
                  }}
                >
                  <h3 className="font-semibold">Dashboard</h3>
                  <p className="text-sm opacity-75">Bem-vindo ao painel</p>
                </div>
              </div>

              {/* Preview de Botões */}
              <div>
                <Label className="mb-2 block">Botões</Label>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 text-white font-medium ${
                      formData.estilo_botao === "rounded"
                        ? "rounded-md"
                        : formData.estilo_botao === "square"
                          ? "rounded-none"
                          : "rounded-full"
                    }`}
                    style={{ backgroundColor: formData.cor_primaria }}
                  >
                    Primário
                  </button>
                  <button
                    className={`px-4 py-2 text-white font-medium ${
                      formData.estilo_botao === "rounded"
                        ? "rounded-md"
                        : formData.estilo_botao === "square"
                          ? "rounded-none"
                          : "rounded-full"
                    }`}
                    style={{ backgroundColor: formData.cor_secundaria }}
                  >
                    Secundário
                  </button>
                </div>
              </div>

              {/* Preview de Card */}
              <div>
                <Label className="mb-2 block">Card de Conteúdo</Label>
                <div
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: formData.cor_fundo,
                    color: formData.cor_texto,
                    fontFamily: formData.fonte_secundaria,
                  }}
                >
                  <h3 className="font-bold text-xl mb-2" style={{ fontFamily: formData.fonte_primaria }}>
                    Título do Card
                  </h3>
                  <p className="text-sm opacity-75">
                    Este é um exemplo de como o conteúdo ficará com suas configurações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
