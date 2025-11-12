"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAnuncios(clienteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("anuncios")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("ordem", { ascending: true })

  if (error) throw error
  return data
}

export async function getAnunciosAtivos(clienteId: string) {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("anuncios")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("ativo", true)
    .or(`data_inicio.is.null,data_inicio.lte.${now}`)
    .or(`data_fim.is.null,data_fim.gte.${now}`)
    .order("ordem", { ascending: true })

  if (error) throw error
  return data
}

export async function createAnuncio(data: any) {
  const supabase = await createClient()

  const { data: anuncio, error } = await supabase.from("anuncios").insert(data).select().single()

  if (error) throw error

  revalidatePath("/client/anuncios")
  return anuncio
}

export async function updateAnuncio(id: string, data: any) {
  const supabase = await createClient()

  const { data: anuncio, error } = await supabase.from("anuncios").update(data).eq("id", id).select().single()

  if (error) throw error

  revalidatePath("/client/anuncios")
  return anuncio
}

export async function deleteAnuncio(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("anuncios").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/client/anuncios")
}

export async function getInteracoesAnuncio(anuncioId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interacoes_anuncios")
    .select("*")
    .eq("anuncio_id", anuncioId)
    .order("criado_em", { ascending: false })

  if (error) throw error
  return data
}

export async function getEstatisticasAnuncios(clienteId: string) {
  const supabase = await createClient()

  // Buscar todos os anúncios do cliente
  const { data: anuncios } = await supabase.from("anuncios").select("id, titulo").eq("cliente_id", clienteId)

  if (!anuncios) return []

  // Buscar estatísticas para cada anúncio
  const estatisticas = await Promise.all(
    anuncios.map(async (anuncio) => {
      const { data: interacoes } = await supabase
        .from("interacoes_anuncios")
        .select("resposta")
        .eq("anuncio_id", anuncio.id)

      const total = interacoes?.length || 0
      const sim = interacoes?.filter((i) => i.resposta === "sim").length || 0
      const nao = interacoes?.filter((i) => i.resposta === "nao").length || 0

      return {
        anuncio_id: anuncio.id,
        titulo: anuncio.titulo,
        total_visualizacoes: total,
        total_sim: sim,
        total_nao: nao,
        taxa_interesse: total > 0 ? ((sim / total) * 100).toFixed(1) : "0",
      }
    }),
  )

  return estatisticas
}

export async function registrarInteracao(data: {
  anuncio_id: string
  usuario_social_id?: string
  sessao_id?: string
  resposta: "sim" | "nao"
  ip_address?: string
  user_agent?: string
  hotspot_id?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("interacoes_anuncios").insert(data)

  if (error) throw error
}
