import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AnunciosInterativosClient } from "@/components/hotspot/anuncios-interativos-client"
import { createClient } from "@/lib/supabase/server"

export default async function AnunciosInterativosPage({
  params,
  searchParams,
}: {
  params: { clienteId: string }
  searchParams: { sessao?: string; hotspot?: string }
}) {
  const supabase = await createClient()

  // Verificar se há sessão social ativa
  if (!searchParams.sessao) {
    redirect(`/hotspot/${params.clienteId}`)
  }

  // Buscar sessão
  const { data: sessao } = await supabase
    .from("sessoes_social")
    .select("*, usuario_social:usuarios_social(*)")
    .eq("token", searchParams.sessao)
    .single()

  if (!sessao) {
    redirect(`/hotspot/${params.clienteId}`)
  }

  // Buscar anúncios ativos do cliente
  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*")
    .eq("cliente_id", params.clienteId)
    .eq("ativo", true)
    .lte("data_inicio", new Date().toISOString())
    .gte("data_fim", new Date().toISOString())
    .order("ordem", { ascending: true })

  // Buscar configurações do portal
  const { data: config } = await supabase
    .from("configuracoes_portal")
    .select("*")
    .eq("cliente_id", params.clienteId)
    .single()

  return (
    <Suspense fallback={<div>Carregando anúncios...</div>}>
      <AnunciosInterativosClient
        anuncios={anuncios || []}
        sessao={sessao}
        hotspotId={searchParams.hotspot || ""}
        config={config}
      />
    </Suspense>
  )
}
