"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Wifi, Clock, ChevronLeft, ChevronRight, Sparkles, ListChecks } from "lucide-react"
import Image from "next/image"

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
}

interface Provider {
  id: string
  provider: string
  nome_exibicao: string
  icone: string | null
  cor_primaria: string | null
}

interface HotspotCampanhaConteudo {
  title?: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  buttonText?: string
  buttonUrl?: string
  mediaType?: string
}

interface HotspotCampanha {
  id: string
  nome?: string
  titulo?: string
  descricao?: string | null
  tipo?: string
  conteudo?: HotspotCampanhaConteudo | null
}

interface HotspotEnqueteQuestao {
  id: string
  pergunta: string
  tipo: string
  opcoes?: string[] | null
}

interface HotspotEnquete {
  id: string
  titulo: string
  descricao?: string | null
  questoes?: HotspotEnqueteQuestao[]
}

interface PortalHotspotClientProps {
  configuracao: ConfiguracaoPortal
  providers: Provider[]
  clienteId: string
  campanhas?: HotspotCampanha[] | null
  enquetes?: HotspotEnquete[] | null
}

export function PortalHotspotClient({
  configuracao,
  providers,
  clienteId,
  campanhas = [],
  enquetes = [],
}: PortalHotspotClientProps) {
  const [tempoRestante, setTempoRestante] = useState(configuracao.slideshow_tempo_minimo)
  const [slideAtual, setSlideAtual] = useState(0)
  const [podeConectar, setPodeConectar] = useState(!configuracao.slideshow_ativo)
  const [campanhaIndex, setCampanhaIndex] = useState(0)
  const [respostasEnquete, setRespostasEnquete] = useState<Record<string, Record<string, string>>>({})

  const slides = [...(configuracao.slideshow_imagens || []), ...(configuracao.slideshow_videos || [])]
  const campanhasDisponiveis = (campanhas || []).filter(Boolean)
  const campanhaEmDestaque =
    campanhasDisponiveis.length > 0 ? campanhasDisponiveis[campanhaIndex % campanhasDisponiveis.length] : null
  const temCampanhas = campanhasDisponiveis.length > 0
  const temEnquetes = (enquetes || []).length > 0

  const proximaCampanha = () => {
    if (!temCampanhas) return
    setCampanhaIndex((prev) => (prev + 1) % campanhasDisponiveis.length)
  }

  const campanhaAnterior = () => {
    if (!temCampanhas) return
    setCampanhaIndex((prev) => (prev - 1 + campanhasDisponiveis.length) % campanhasDisponiveis.length)
  }

  const handleRespostaEnquete = (enqueteId: string, questaoId: string, valor: string) => {
    setRespostasEnquete((prev) => ({
      ...prev,
      [enqueteId]: {
        ...(prev[enqueteId] || {}),
        [questaoId]: valor,
      },
    }))
  }

  useEffect(() => {
    setCampanhaIndex(0)
  }, [campanhas.length])

  useEffect(() => {
    if (!configuracao.slideshow_ativo || podeConectar) return

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          setPodeConectar(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [configuracao.slideshow_ativo, podeConectar])

  useEffect(() => {
    if (slides.length <= 1) return

    const slideTimer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(slideTimer)
  }, [slides.length])

  const proximoSlide = () => {
    setSlideAtual((prev) => (prev + 1) % slides.length)
  }

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const corPrimaria = configuracao.cor_primaria || "#3b82f6"
  const corSecundaria = configuracao.cor_secundaria || "#1e40af"

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
      }}
    >
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          {configuracao.logo_url && (
            <div className="mb-4 flex justify-center">
              <Image
                src={configuracao.logo_url || "/placeholder.svg"}
                alt="Logo"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wifi className="h-8 w-8" style={{ color: corPrimaria }} />
            <h1 className="text-3xl font-bold">Wi-Fi Gratuito</h1>
          </div>
          <p className="text-muted-foreground">
            {configuracao.mensagem_boas_vindas || "Conecte-se à nossa rede Wi-Fi"}
          </p>
        </div>

        {/* Slideshow */}
        {configuracao.slideshow_ativo && slides.length > 0 && (
          <div className="mb-8">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {slides[slideAtual]?.endsWith(".mp4") ? (
                <video src={slides[slideAtual]} autoPlay muted loop className="w-full h-full object-cover" />
              ) : (
                <Image
                  src={slides[slideAtual] || "/placeholder.svg"}
                  alt={`Slide ${slideAtual + 1}`}
                  fill
                  className="object-cover"
                />
              )}

              {/* Controles do Slideshow */}
              {slides.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={slideAnterior}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={proximoSlide}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>

                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === slideAtual ? "bg-white w-8" : "bg-white/50"
                        }`}
                        onClick={() => setSlideAtual(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Timer */}
            {!podeConectar && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Aguarde {tempoRestante} segundo{tempoRestante !== 1 ? "s" : ""} para conectar
                  </span>
                </div>
                <Progress
                  value={
                    ((configuracao.slideshow_tempo_minimo - tempoRestante) / configuracao.slideshow_tempo_minimo) * 100
                  }
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Botões de Autenticação */}
        <div className="space-y-4">
          {configuracao.auth_social_ativo && providers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Conecte-se usando:</p>
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  className="w-full text-white hover:opacity-90"
                  size="lg"
                  disabled={!podeConectar}
                  style={{
                    backgroundColor: provider.cor_primaria || corPrimaria,
                  }}
                  onClick={() => {
                    console.log("[v0] Clicou no provider:", provider.provider)
                    // Redirecionar para OAuth
                    window.location.href = `/api/auth/${provider.provider}?client_id=${clienteId}`
                  }}
                >
                  {provider.nome_exibicao}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              {!configuracao.auth_social_ativo && <p>Autenticação social desativada</p>}
              {configuracao.auth_social_ativo && providers.length === 0 && (
                <p>Nenhum provider OAuth configurado. Execute o script 028.</p>
              )}
            </div>
          )}

          {configuracao.auth_email_ativo && (
            <Button className="w-full bg-transparent" size="lg" variant="outline" disabled={!podeConectar}>
              Conectar com E-mail
            </Button>
          )}

          {configuracao.auth_voucher_ativo && (
            <Button className="w-full bg-transparent" size="lg" variant="outline" disabled={!podeConectar}>
              Usar Voucher
            </Button>
          )}
        </div>

        {temCampanhas && campanhaEmDestaque && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Campanhas em destaque
              </span>
              <div className="flex items-center gap-2">
                <span>
                  {campanhaIndex + 1}/{campanhasDisponiveis.length}
                </span>
                {campanhasDisponiveis.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={campanhaAnterior} className="h-7 w-7">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={proximaCampanha} className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Card className="overflow-hidden border border-dashed border-primary/30 bg-muted/30">
              {campanhaEmDestaque.conteudo?.videoUrl ? (
                <video
                  src={campanhaEmDestaque.conteudo.videoUrl}
                  className="w-full h-48 object-cover"
                  controls
                  muted
                  playsInline
                />
              ) : campanhaEmDestaque.conteudo?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campanhaEmDestaque.conteudo.imageUrl}
                  alt={campanhaEmDestaque.nome || campanhaEmDestaque.titulo || "Campanha"}
                  className="w-full h-48 object-cover"
                />
              ) : null}

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">
                    {campanhaEmDestaque.nome || campanhaEmDestaque.titulo || "Campanha especial"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {campanhaEmDestaque.conteudo?.description || campanhaEmDestaque.descricao ||
                      "Aproveite esta oferta exclusiva ao se conectar."}
                  </p>
                </div>
                {campanhaEmDestaque.conteudo?.buttonText && (
                  <Button
                    disabled={!campanhaEmDestaque.conteudo.buttonUrl}
                    onClick={() =>
                      campanhaEmDestaque.conteudo?.buttonUrl &&
                      window.open(campanhaEmDestaque.conteudo.buttonUrl, "_blank")
                    }
                    className="w-full"
                  >
                    {campanhaEmDestaque.conteudo.buttonText}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {temEnquetes && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListChecks className="h-4 w-4" /> Enquetes rápidas
            </div>
            {(enquetes || []).map((enquete) => (
              <Card key={enquete.id} className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">{enquete.titulo}</p>
                  <p className="text-xs text-muted-foreground">{enquete.descricao || "Conte-nos sua opinião"}</p>
                </div>
                {(enquete.questoes || []).map((questao) => (
                  <div key={questao.id} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{questao.pergunta}</p>
                    {questao.opcoes && questao.opcoes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {questao.opcoes.map((opcao) => {
                          const selecionada = respostasEnquete[enquete.id]?.[questao.id] === opcao
                          return (
                            <button
                              key={opcao}
                              type="button"
                              onClick={() => handleRespostaEnquete(enquete.id, questao.id, opcao)}
                              className={`rounded-full border px-3 py-1 text-xs transition ${
                                selecionada
                                  ? "bg-primary text-white border-primary"
                                  : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
                              }`}
                            >
                              {opcao}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Resposta livre</p>
                    )}
                  </div>
                ))}
                <Button variant="secondary" className="w-full" disabled>
                  Em breve: enviar respostas
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Termos */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Ao conectar, você concorda com nossos{" "}
          <a href="#" className="underline">
            Termos de Uso
          </a>{" "}
          e{" "}
          <a href="#" className="underline">
            Política de Privacidade
          </a>
        </p>
      </Card>
    </div>
  )
}
