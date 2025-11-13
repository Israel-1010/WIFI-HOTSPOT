"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Save,
  Info,
  Mail,
  Ticket,
  Sparkles,
  ListChecks,
} from "lucide-react"
import { PortalHotspotClient } from "@/components/hotspot/portal-hotspot-client"
import { updateConfiguracaoPortal } from "@/app/actions/portal-hotspot"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (event) => reject(event)
    reader.readAsDataURL(file)
  })

export type FluxoAutenticacao = "multi" | "single"
export type MetodoPreferido = "social" | "email" | "voucher"
export type LoginLayout = "grid" | "lista"

interface ConfiguracaoPortal {
  id: string
  cliente_id: string
  logo_url: string | null
  cor_primaria: string | null
  cor_secundaria: string | null
  mensagem_boas_vindas: string | null
  slideshow_ativo: boolean
  slideshow_imagens: string[] | null
  slideshow_videos: string[] | null
  slideshow_tempo_minimo: number
  auth_social_ativo: boolean
  auth_email_ativo: boolean
  auth_voucher_ativo: boolean
  fluxo_autenticacao?: FluxoAutenticacao
  metodo_preferido?: MetodoPreferido
  login_layout?: LoginLayout
}

interface Provider {
  id: string
  provider: string // ex.: "google", "facebook", "google_oauth2", "appleid"
  nome_exibicao: string
  icone: string | null
  cor_primaria: string | null
  ativo: boolean
}

interface CampanhaConteudo {
  title?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  imageUrl?: string
  videoUrl?: string
  html?: string
  mediaType?: string
  exibirNoPortal?: boolean
}

interface Campanha {
  id: string
  tipo: string
  titulo?: string
  nome?: string
  descricao?: string | null
  url?: string | null
  ativo?: boolean
  status?: string
  conteudo?: CampanhaConteudo | null
}

interface EnqueteQuestao {
  id: string
  pergunta: string
  tipo: string
  opcoes?: string[] | null
}

interface Enquete {
  id: string
  titulo: string
  descricao?: string | null
  status: string
  questoes?: EnqueteQuestao[]
}

interface PortalPreviewClientProps {
  clienteId: string
  configuracaoInicial: ConfiguracaoPortal | null
  providersInicial: Provider[]
  campanhasDisponiveis?: Campanha[] | null
  enquetesDisponiveis?: Enquete[] | null
}

/** ErrorBoundary simples para segurar erros de render no preview */
class ErrorBoundary extends (require("react").Component as any) {
  state = { hasError: false, error: null as any }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    if (typeof window !== "undefined") console.error("[PortalPreviewClient ErrorBoundary]", error, info)
  }
  render() {
    return this.state.hasError ? (
      <div className="p-4 border rounded-md text-sm text-red-600 bg-red-50">
        Ocorreu um erro ao renderizar o preview. Veja o console para detalhes.
      </div>
    ) : (
      this.props.children
    )
  }
}

export function PortalPreviewClient({
  clienteId,
  configuracaoInicial,
  providersInicial,
  campanhasDisponiveis = [],
  enquetesDisponiveis = [],
}: PortalPreviewClientProps) {
  const { toast } = useToast()
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("mobile")
  const [saving, setSaving] = useState(false)

  const [config, setConfig] = useState<ConfiguracaoPortal>(
    configuracaoInicial || {
      id: "",
      cliente_id: clienteId,
      logo_url: null,
      cor_primaria: "#3b82f6",
      cor_secundaria: "#1e40af",
      mensagem_boas_vindas: "Bem-vindo! Conecte-se ao Wi-Fi gratuito",
      slideshow_ativo: false,
      slideshow_imagens: [],
      slideshow_videos: [],
      slideshow_tempo_minimo: 10,
      auth_social_ativo: true,
      auth_email_ativo: true,
      auth_voucher_ativo: false,
      fluxo_autenticacao: "multi",
      metodo_preferido: "social",
      login_layout: "grid",
    },
  )

  const [providers, setProviders] = useState<Provider[]>(providersInicial)

  const [campanhasSelecionadas, setCampanhasSelecionadas] = useState<string[]>(() => {
    if (!campanhasDisponiveis?.length) return []
    return campanhasDisponiveis
      .filter((camp) => {
        if (typeof camp.conteudo?.exibirNoPortal === "boolean") {
          return camp.conteudo.exibirNoPortal
        }
        if (typeof camp.ativo === "boolean") return camp.ativo
        if (camp.status) {
          const normalized = camp.status.toLowerCase()
          return normalized === "ativa" || normalized === "active"
        }
        return true
      })
      .map((camp) => camp.id)
  })

  const [enquetesSelecionadas, setEnquetesSelecionadas] = useState<string[]>(() => {
    if (!enquetesDisponiveis?.length) return []
    return enquetesDisponiveis
      .filter((enquete) => {
        if (!enquete.status) return true
        const normalized = enquete.status.toLowerCase()
        return normalized === "ativa" || normalized === "active" || normalized === "agendada"
      })
      .map((enquete) => enquete.id)
  })

  const activeProviders = useMemo(() => providers.filter((p) => p.ativo), [providers])

  const campanhasParaPreview = useMemo(
    () => (campanhasDisponiveis || []).filter((camp) => campanhasSelecionadas.includes(camp.id)),
    [campanhasDisponiveis, campanhasSelecionadas],
  )

  const enquetesParaPreview = useMemo(
    () => (enquetesDisponiveis || []).filter((enquete) => enquetesSelecionadas.includes(enquete.id)),
    [enquetesDisponiveis, enquetesSelecionadas],
  )

  const totalCampanhasDisponiveis = campanhasDisponiveis?.length || 0
  const totalEnquetesDisponiveis = enquetesDisponiveis?.length || 0

  const toggleCampanhaSelecionada = (campanhaId: string) => {
    setCampanhasSelecionadas((prev) =>
      prev.includes(campanhaId) ? prev.filter((value) => value !== campanhaId) : [...prev, campanhaId],
    )
  }

  const toggleEnqueteSelecionada = (enqueteId: string) => {
    setEnquetesSelecionadas((prev) =>
      prev.includes(enqueteId) ? prev.filter((value) => value !== enqueteId) : [...prev, enqueteId],
    )
  }

  const nomeCampanha = (camp: Campanha) => camp.nome || camp.titulo || "Campanha sem título"

  const deviceDimensions = {
    desktop: { width: "1200px", height: "800px", scale: 0.6 },
    tablet: { width: "768px", height: "1024px", scale: 0.6 },
    mobile: { width: "375px", height: "667px", scale: 0.9 },
  }

  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/hotspot/${clienteId}`

  const toggleProvider = (providerId: string) => {
    setProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, ativo: !p.ativo } : p)))
  }

  // ====== Chip inline (substitui Badge) ======
  const Chip = ({
    active = true,
    children,
    onClick,
  }: {
    active?: boolean
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded-full text-xs border ${
        active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-muted"
      }`}
    >
      {children}
    </button>
  )

  // ====== Ícones sociais (SVG) + normalização ======
  const socialIcons: Record<string, JSX.Element> = {
    google: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.6h5.1c-.2 1.3-1.5 3.8-5.1 3.8-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.8 0 3 .8 3.7 1.5l2.6-2.5C16.8 3.8 14.7 2.7 12 2.7 6.8 2.7 2.7 6.8 2.7 12s4.1 9.3 9.3 9.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1-.2-1.4H12z"
        />
      </svg>
    ),
    facebook: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#1877F2"
          d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.406.593 24 1.325 24h11.495v-9.294H9.691V11.01h3.129V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.765v2.316h3.588l-.467 3.696h-3.121V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .593 23.406 0 22.675 0z"
        />
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M16.365 1.43c0 1.14-.42 2.09-1.25 2.86-.85.8-1.84 1.26-2.98 1.18-.03-1.08.44-2 .1-2.71.73-.06 1.41.3 2.05.3.64 0 1.2-.36 2.08-.63zM21.63 17.15c-.38.9-.83 1.72-1.36 2.46-.72 1-1.31 1.69-1.78 2.07-.69.63-1.43.95-2.22.95-.55 0-1.22-.16-1.99-.49-.77-.33-1.48-.49-2.14-.49-.69 0-1.42.16-2.2.49-.78.33-1.41.5-1.89.5-.76 0-1.48-.31-2.16-.94-.47-.39-1.09-1.11-1.86-2.17-.8-1.12-1.46-2.42-1.99-3.9-.55-1.54-.82-3-.82-4.37 0-1.62.35-3.02 1.03-4.21.54-.97 1.26-1.74 2.18-2.31.92-.58 1.9-.88 2.95-.9.58 0 1.34.18 2.27.53.93.35 1.53.53 1.8.53.2 0 .83-.2 1.9-.6 1.03-.38 1.9-.54 2.62-.48 1.94.16 3.4.92 4.36 2.27-1.73 1.05-2.6 2.52-2.62 4.41 0 1.47.55 2.69 1.66 3.66.49.44 1.04.77 1.66.98-.13.33-.27.68-.42 1.04z"
        />
      </svg>
    ),
  }

  const iconForProvider = (prov?: string, name?: string) => {
    const raw = (prov || "").toLowerCase().trim()
    const normalized = raw
      .replace(/[^a-z]/g, "")
      .replace(/^googleoauth2?$/, "google")
      .replace(/^googleworkspace$/, "google")
      .replace(/^facebookoauth?$/, "facebook")
      .replace(/^meta$/, "facebook")
      .replace(/^appleid$/, "apple")

    const icon = socialIcons[normalized]
    if (icon) return icon
    const initial = (name || prov || "?").slice(0, 1).toUpperCase()
    return (
      <span className="h-4 w-4 rounded-full bg-muted inline-flex items-center justify-center text-[10px]">
        {initial}
      </span>
    )
  }

  // ===== Helpers UI =====
  const colorSwatch = (hex?: string | null) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="h-4 w-4 rounded" style={{ background: hex || "#000" }} />
      <span>{hex || "—"}</span>
    </div>
  )

  const visibleLoginMethods = () => {
    const methods: Array<"social" | "email" | "voucher"> = []
    if (config.fluxo_autenticacao === "single") {
      if (config.metodo_preferido) methods.push(config.metodo_preferido)
    } else {
      if (config.auth_social_ativo && activeProviders.length > 0) methods.push("social")
      if (config.auth_email_ativo) methods.push("email")
      if (config.auth_voucher_ativo) methods.push("voucher")
    }
    return methods
  }

  const renderLoginPreview = () => {
    const methods = visibleLoginMethods()
    const asGrid = config.login_layout === "grid"

    const socialButtons = (
      <div className={asGrid ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
        {activeProviders.map((p) => (
          <Button key={p.id} variant="outline" className="justify-start">
            <span className="mr-2 inline-flex items-center">
              {iconForProvider(p.provider, p.nome_exibicao)}
            </span>
            Entrar com {p.nome_exibicao}
          </Button>
        ))}
      </div>
    )

    return (
      <>
        {methods.includes("social") && socialButtons}
        {methods.includes("email") && (
          <Button variant="outline" className="justify-start">
            <Mail className="h-4 w-4 mr-2" /> Entrar com E-mail
          </Button>
        )}
        {methods.includes("voucher") && (
          <Button variant="outline" className="justify-start">
            <Ticket className="h-4 w-4 mr-2" /> Entrar com Voucher
          </Button>
        )}
      </>
    )
  }

  // Tabs controladas para side-effects
  const [tabValue, setTabValue] = useState<string>("aparencia")

  const validateBeforeSave = (): string | null => {
    if (config.slideshow_ativo && (!config.slideshow_tempo_minimo || config.slideshow_tempo_minimo < 5)) {
      return "Defina um tempo mínimo de slideshow de pelo menos 5 segundos."
    }

    if (config.fluxo_autenticacao === "single") {
      const map: Record<MetodoPreferido, boolean> = {
        social: !!config.auth_social_ativo && activeProviders.length > 0,
        email: !!config.auth_email_ativo,
        voucher: !!config.auth_voucher_ativo,
      }
      if (!map[config.metodo_preferido || "social"]) {
        return "O método de login preferido está desativado. Ative-o ou escolha outro."
      }
    }

    return null
  }

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return
    try {
      const base64 = await fileToBase64(file)
      setConfig((prev) => ({ ...prev, logo_url: base64 }))
      toast({ title: "Logo atualizado", description: "Arquivo convertido para Base64." })
    } catch (error) {
      console.error("[v0] Erro ao enviar logo:", error)
      toast({ title: "Erro ao enviar logo", description: "Tente novamente.", variant: "destructive" })
    }
  }

  const handleSlideshowUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const base64List = await Promise.all(Array.from(files).map((file) => fileToBase64(file)))
      setConfig((prev) => ({
        ...prev,
        slideshow_imagens: [...(prev.slideshow_imagens || []), ...base64List],
      }))
      toast({
        title: "Slideshow atualizado",
        description: `${base64List.length} imagem(ns) convertidas para Base64.`,
      })
    } catch (error) {
      console.error("[v0] Erro ao enviar imagens do slideshow:", error)
      toast({ title: "Erro ao enviar imagens", description: "Tente novamente.", variant: "destructive" })
    }
  }

  const handleSave = async () => {
    const errorMsg = validateBeforeSave()
    if (errorMsg) {
      toast({ title: "Validação", description: errorMsg, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload: ConfiguracaoPortal = { ...config }
      const result = await updateConfiguracaoPortal(clienteId, payload)
      if (result?.success) {
        toast({ title: "Configurações salvas", description: "Portal atualizado com sucesso." })
      } else {
        toast({
          title: "Erro ao salvar",
          description: result?.error || "Não foi possível salvar as configurações.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "Erro ao salvar", description: "Ocorreu um erro ao salvar.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Painel de Configurações */}
      <Card className="lg:w-[28rem] p-6 overflow-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Configurações do Portal</h2>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="aparencia">Aparência</TabsTrigger>
              <TabsTrigger value="slideshow">Slideshow</TabsTrigger>
              <TabsTrigger value="autenticacao">Auth</TabsTrigger>
              <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
              <TabsTrigger value="enquetes">Enquetes</TabsTrigger>
            </TabsList>

            {/* Aparência */}
            <TabsContent value="aparencia" className="space-y-4">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12">
                  <Label htmlFor="logo">URL do Logo</Label>
                  <Input
                    id="logo"
                    value={config.logo_url || ""}
                    onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    onChange={async (event) => {
                      await handleLogoUpload(event.target.files?.[0] || null)
                      event.target.value = ""
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Faça upload para armazenar o logo diretamente em Base64.
                  </p>
                </div>

                {/* Paletas rápidas */}
                <div className="col-span-12">
                  <p className="text-xs text-muted-foreground mb-2">Paletas rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { p: "#3b82f6", s: "#1e40af", name: "Azul" },
                      { p: "#10b981", s: "#065f46", name: "Verde" },
                      { p: "#f59e0b", s: "#b45309", name: "Âmbar" },
                      { p: "#ef4444", s: "#991b1b", name: "Vermelho" },
                      { p: "#8b5cf6", s: "#4c1d95", name: "Violeta" },
                    ].map((pal) => (
                      <button
                        key={pal.name}
                        type="button"
                        className="flex items-center gap-2 border rounded-md px-2 py-1"
                        onClick={() => setConfig((c) => ({ ...c, cor_primaria: pal.p, cor_secundaria: pal.s }))}
                        title={`Aplicar tema ${pal.name}`}
                      >
                        <span className="h-4 w-4 rounded" style={{ background: pal.p }} />
                        <span className="h-4 w-4 rounded" style={{ background: pal.s }} />
                        <span className="text-xs">{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 sm:col-span-6 space-y-2">
                  <Label htmlFor="cor-primaria">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor-primaria"
                      type="color"
                      value={config.cor_primaria || "#3b82f6"}
                      onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={config.cor_primaria || "#3b82f6"}
                      onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                  {colorSwatch(config.cor_primaria)}
                </div>

                <div className="col-span-12 sm:col-span-6 space-y-2">
                  <Label htmlFor="cor-secundaria">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor-secundaria"
                      type="color"
                      value={config.cor_secundaria || "#1e40af"}
                      onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={config.cor_secundaria || "#1e40af"}
                      onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                      placeholder="#1e40af"
                    />
                  </div>
                  {colorSwatch(config.cor_secundaria)}
                </div>

                <div className="col-span-12 space-y-2">
                  <Label htmlFor="mensagem">Mensagem de Boas-Vindas</Label>
                  <Textarea
                    id="mensagem"
                    value={config.mensagem_boas_vindas || ""}
                    onChange={(e) => setConfig({ ...config, mensagem_boas_vindas: e.target.value })}
                    placeholder="Bem-vindo! Conecte-se ao Wi-Fi gratuito"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Slideshow */}
            <TabsContent value="slideshow" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="slideshow-ativo">Ativar Slideshow</Label>
                <Switch
                  id="slideshow-ativo"
                  checked={config.slideshow_ativo}
                  onCheckedChange={(checked) => setConfig({ ...config, slideshow_ativo: checked })}
                />
              </div>

              {config.slideshow_ativo && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tempo-minimo">Tempo Mínimo (segundos)</Label>
                    <Input
                      id="tempo-minimo"
                      type="number"
                      min={5}
                      max={180}
                      value={config.slideshow_tempo_minimo}
                      onChange={(e) =>
                        setConfig({ ...config, slideshow_tempo_minimo: Number.parseInt(e.target.value) || 10 })
                      }
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Esse tempo trava o botão "Conectar" até a campanha rodar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Imagens do Slideshow (URLs separadas por vírgula)</Label>
                    <Textarea
                      value={(config.slideshow_imagens || []).join(", ")}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          slideshow_imagens: e.target.value.split(",").map((url) => url.trim()).filter(Boolean),
                        })
                      }
                      placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
                      rows={3}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (event) => {
                        await handleSlideshowUpload(event.target.files)
                        event.target.value = ""
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Arraste ou selecione múltiplas imagens para convertê-las automaticamente em Base64.
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Autenticação */}
            <TabsContent value="autenticacao" className="space-y-5">
              <div className="space-y-2">
                <Label>Fluxo de Autenticação</Label>
                <RadioGroup
                  value={config.fluxo_autenticacao || "multi"}
                  onValueChange={(v: FluxoAutenticacao) => setConfig({ ...config, fluxo_autenticacao: v })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="multi" id="fluxo-multi" />
                    <Label htmlFor="fluxo-multi" className="font-normal">
                      Multi (exibe todos os métodos disponíveis)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="single" id="fluxo-single" />
                    <Label htmlFor="fluxo-single" className="font-normal">
                      Single (escolha 1 método principal)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {config.fluxo_autenticacao === "single" && (
                <div className="space-y-2">
                  <Label>Método Preferido</Label>
                  <Select
                    value={config.metodo_preferido}
                    onValueChange={(v: MetodoPreferido) => setConfig({ ...config, metodo_preferido: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="social"
                        disabled={!config.auth_social_ativo || activeProviders.length === 0}
                      >
                        Login Social
                      </SelectItem>
                      <SelectItem value="email" disabled={!config.auth_email_ativo}>
                        E-mail
                      </SelectItem>
                      <SelectItem value="voucher" disabled={!config.auth_voucher_ativo}>
                        Voucher
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Se o método estiver desativado, habilite-o abaixo.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Layout dos botões</Label>
                <Select
                  value={config.login_layout || "grid"}
                  onValueChange={(v: LoginLayout) => setConfig({ ...config, login_layout: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grade</SelectItem>
                    <SelectItem value="lista">Lista vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-social">Login Social</Label>
                  <Switch
                    id="auth-social"
                    checked={config.auth_social_ativo}
                    onCheckedChange={(checked) => setConfig({ ...config, auth_social_ativo: checked })}
                  />
                </div>

                {config.auth_social_ativo && providers.length > 0 && (
                  <div className="ml-4 space-y-3 border-l-2 border-muted pl-4 rounded-sm">
                    <p className="text-sm text-muted-foreground">Providers habilitados</p>
                    <div className="flex flex-wrap gap-2">
                      {providers.map((p) => (
                        <Chip key={p.id} active={p.ativo} onClick={() => toggleProvider(p.id)}>
                          <span className="inline-flex items-center gap-1">
                            {iconForProvider(p.provider, p.nome_exibicao)}
                            {p.nome_exibicao}
                          </span>
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {config.auth_social_ativo && providers.length === 0 && (
                  <p className="text-sm text-muted-foreground ml-4">
                    Nenhum provider OAuth configurado. Execute o script 028 para adicionar providers padrão.
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-email">Login com E-mail</Label>
                  <Switch
                    id="auth-email"
                    checked={config.auth_email_ativo}
                    onCheckedChange={(checked) => setConfig({ ...config, auth_email_ativo: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-voucher">Login com Voucher</Label>
                  <Switch
                    id="auth-voucher"
                    checked={config.auth_voucher_ativo}
                    onCheckedChange={(checked) => setConfig({ ...config, auth_voucher_ativo: checked })}
                  />
                </div>
              </div>

              {/* Preview dos métodos exibidos */}
              <div className="border rounded-md p-3">
                <p className="text-sm font-medium mb-2">Preview dos métodos exibidos</p>
                <div className={config.login_layout === "grid" ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
                  {renderLoginPreview()}
                </div>
              </div>
            </TabsContent>

            {/* Campanhas */}
            <TabsContent value="campanhas" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Biblioteca de campanhas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Escolha quais criativos aparecem no portal antes do usuário se conectar.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/client/campaigns" className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Gerenciar campanhas
                  </Link>
                </Button>
              </div>

              {totalCampanhasDisponiveis > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Chip>Selecionadas: {campanhasParaPreview.length}</Chip>
                  <Chip active={false}>Disponíveis: {totalCampanhasDisponiveis}</Chip>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma campanha cadastrada. Crie uma campanha e ela aparecerá automaticamente aqui.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campanhasDisponiveis?.map((camp) => {
                  const selecionada = campanhasSelecionadas.includes(camp.id)
                  const mediaType = camp.conteudo?.mediaType || (camp.conteudo?.videoUrl ? "video" : "image")
                  const temImagem = mediaType === "image" && camp.conteudo?.imageUrl
                  const temVideo = mediaType === "video" && camp.conteudo?.videoUrl
                  const descricaoCampanha = camp.conteudo?.description || camp.descricao || "Sem descrição"

                  return (
                    <Card key={camp.id} className={`relative overflow-hidden ${selecionada ? "border-primary" : ""}`}>
                      <div className="absolute right-3 top-3 rounded-full bg-white/80 p-1 shadow">
                        <Checkbox
                          checked={selecionada}
                          onCheckedChange={() => toggleCampanhaSelecionada(camp.id)}
                          aria-label={`Selecionar campanha ${nomeCampanha(camp)}`}
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="relative h-32 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {temImagem && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={camp.conteudo?.imageUrl || ""} alt={nomeCampanha(camp)} className="h-full w-full object-cover" />
                          )}
                          {temVideo && (
                            <video src={camp.conteudo?.videoUrl} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                          )}
                          {!temImagem && !temVideo && (
                            <div className="flex flex-col items-center text-xs text-muted-foreground">
                              <Sparkles className="h-5 w-5 mb-1" />
                              Sem prévia visual
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                            <span>{camp.tipo}</span>
                            <span>{camp.status || (camp.ativo ? "ativa" : "rascunho")}</span>
                          </div>
                          <p className="font-medium text-sm truncate" title={nomeCampanha(camp)}>
                            {nomeCampanha(camp)}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{descricaoCampanha}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Campanhas selecionadas são enviadas para o preview e para o portal público automaticamente.
              </p>
            </TabsContent>

            {/* Enquetes */}
            <TabsContent value="enquetes" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Engaje com enquetes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ative as pesquisas que os visitantes verão antes ou depois do login.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/client/surveys" className="inline-flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Gerenciar enquetes
                  </Link>
                </Button>
              </div>

              {totalEnquetesDisponiveis > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Chip>Selecionadas: {enquetesParaPreview.length}</Chip>
                  <Chip active={false}>Disponíveis: {totalEnquetesDisponiveis}</Chip>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma enquete criada ainda.</p>
              )}

              <div className="space-y-3">
                {enquetesDisponiveis?.map((enquete) => {
                  const selecionada = enquetesSelecionadas.includes(enquete.id)
                  return (
                    <Card key={enquete.id} className={`p-4 ${selecionada ? "border-primary" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">{enquete.titulo}</p>
                          <p className="text-xs text-muted-foreground">{enquete.descricao || "Sem descrição"}</p>
                        </div>
                        <Checkbox
                          checked={selecionada}
                          onCheckedChange={() => toggleEnqueteSelecionada(enquete.id)}
                          aria-label={`Selecionar enquete ${enquete.titulo}`}
                        />
                      </div>
                      <div className="mt-3 space-y-2">
                        {(enquete.questoes || []).slice(0, 2).map((questao) => (
                          <div key={questao.id} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{questao.pergunta}</span>
                            {questao.opcoes && questao.opcoes.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {questao.opcoes.map((opcao) => (
                                  <span key={opcao} className="rounded-full border px-2 py-0.5 text-[10px]">
                                    {opcao}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Lembre-se de configurar as perguntas obrigatórias e consentimentos antes de publicar.
              </p>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t space-y-2">
            <Button onClick={() => window.open(portalUrl, "_blank")} variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Portal em Nova Aba
            </Button>
            <p className="text-xs text-muted-foreground text-center">URL: {portalUrl}</p>
          </div>
        </div>
      </Card>

      {/* Preview do Portal */}
      <Card className="flex-1 p-6 overflow-hidden">
        <div className="space-y-4 h-full flex flex-col">
          {/* Controles de Dispositivo */}
          <div className="flex items-center justify-center gap-2">
            <Button variant={device === "desktop" ? "default" : "outline"} size="sm" onClick={() => setDevice("desktop")}>
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button variant={device === "tablet" ? "default" : "outline"} size="sm" onClick={() => setDevice("tablet")}>
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </Button>
            <Button variant={device === "mobile" ? "default" : "outline"} size="sm" onClick={() => setDevice("mobile")}>
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>

          {/* Preview Container */}
          <div className="flex-1 flex items-center justify-center overflow-auto bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4">
            <div
              className="transition-all duration-300 origin-center shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: deviceDimensions[device].width,
                height: deviceDimensions[device].height,
                transform: `scale(${deviceDimensions[device].scale})`,
              }}
            >
              <ErrorBoundary>
                {/* Observação: PortalHotspotClient pode (ou não) usar os novos campos. */}
                <PortalHotspotClient
                  configuracao={config}
                  providers={activeProviders}
                  clienteId={clienteId}
                  campanhas={campanhasParaPreview}
                  enquetes={enquetesParaPreview}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
