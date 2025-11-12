"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react"
import { registrarInteracao } from "@/app/actions/interacoes-anuncios"

interface Anuncio {
  id: string
  titulo: string
  descricao: string
  imagem_url: string
  video_url: string
  tipo: string
  cta_texto_sim: string
  cta_texto_nao: string
  url_destino: string
}

interface AnunciosInterativosClientProps {
  anuncios: Anuncio[]
  sessao: any
  hotspotId: string
  config: any
}

export function AnunciosInterativosClient({ anuncios, sessao, hotspotId, config }: AnunciosInterativosClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, "sim" | "nao">>({})

  const anuncioAtual = anuncios[currentIndex]
  const progresso = ((currentIndex + 1) / anuncios.length) * 100
  const anunciosObrigatorios = config?.anuncios_obrigatorios ?? true

  const handleResposta = async (resposta: "sim" | "nao") => {
    if (!anuncioAtual) return

    setLoading(true)

    try {
      // Registrar interação
      await registrarInteracao({
        anuncio_id: anuncioAtual.id,
        usuario_social_id: sessao.usuario_social_id,
        resposta,
        sessao_id: sessao.id,
        hotspot_id: hotspotId,
        ip_address: sessao.ip_address,
        user_agent: sessao.user_agent,
      })

      // Salvar resposta localmente
      setRespostas((prev) => ({ ...prev, [anuncioAtual.id]: resposta }))

      // Se clicou em "Sim" e há URL de destino, abrir em nova aba
      if (resposta === "sim" && anuncioAtual.url_destino) {
        window.open(anuncioAtual.url_destino, "_blank")
      }

      // Avançar para próximo anúncio ou finalizar
      if (currentIndex < anuncios.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Todos os anúncios foram respondidos
        router.push(`/hotspot/${sessao.usuario_social.cliente_id}/obrigado?sessao=${sessao.token}`)
      }
    } catch (error) {
      console.error("[v0] Erro ao registrar resposta:", error)
      alert("Erro ao registrar sua resposta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handlePular = () => {
    if (anunciosObrigatorios) return

    if (currentIndex < anuncios.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      router.push(`/hotspot/${sessao.usuario_social.cliente_id}/obrigado?sessao=${sessao.token}`)
    }
  }

  if (!anuncioAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Nenhum anúncio disponível</h2>
          <p className="text-muted-foreground mb-6">Não há anúncios ativos no momento.</p>
          <Button onClick={() => router.push("/")}>Voltar</Button>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundColor: config?.cor_primaria || "#3b82f6",
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Progresso */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">
              Anúncio {currentIndex + 1} de {anuncios.length}
            </span>
            <span className="text-sm font-medium text-white">{Math.round(progresso)}%</span>
          </div>
          <Progress value={progresso} className="h-2 bg-white/20" />
        </div>

        {/* Card do Anúncio */}
        <Card className="overflow-hidden shadow-2xl">
          {/* Mídia */}
          {anuncioAtual.tipo === "imagem" && anuncioAtual.imagem_url && (
            <div className="relative w-full h-64 bg-gray-100">
              <img
                src={anuncioAtual.imagem_url || "/placeholder.svg"}
                alt={anuncioAtual.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {anuncioAtual.tipo === "video" && anuncioAtual.video_url && (
            <div className="relative w-full h-64 bg-black">
              <video src={anuncioAtual.video_url} controls autoPlay muted className="w-full h-full object-contain" />
            </div>
          )}

          {/* Conteúdo */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-3">{anuncioAtual.titulo}</h2>
            <p className="text-muted-foreground mb-6">{anuncioAtual.descricao}</p>

            {/* Botões de Resposta */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="default"
                className="h-16 text-lg font-semibold bg-green-600 hover:bg-green-700"
                onClick={() => handleResposta("sim")}
                disabled={loading}
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                {anuncioAtual.cta_texto_sim || "Tenho Interesse"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg font-semibold bg-transparent"
                onClick={() => handleResposta("nao")}
                disabled={loading}
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                {anuncioAtual.cta_texto_nao || "Não Tenho Interesse"}
              </Button>
            </div>

            {/* Botão Pular (se não obrigatório) */}
            {!anunciosObrigatorios && (
              <Button variant="ghost" className="w-full mt-4" onClick={handlePular} disabled={loading}>
                Pular anúncio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Informações do Usuário */}
        <div className="mt-4 text-center text-white/80 text-sm">
          Conectado como {sessao.usuario_social.nome_completo}
        </div>
      </div>
    </div>
  )
}
