"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCampanhasMarketing(clienteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("campanhas_marketing")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })

  if (error) throw error
  return data
}

export async function createCampanhaMarketing(data: any) {
  const supabase = await createClient()

  const { data: campanha, error } = await supabase.from("campanhas_marketing").insert(data).select().single()

  if (error) throw error

  revalidatePath("/client/campanhas-marketing")
  return campanha
}

export async function updateCampanhaMarketing(id: string, data: any) {
  const supabase = await createClient()

  const { data: campanha, error } = await supabase
    .from("campanhas_marketing")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/client/campanhas-marketing")
  return campanha
}

export async function deleteCampanhaMarketing(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("campanhas_marketing").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/client/campanhas-marketing")
}

export async function getUsuariosSegmentados(filtros: {
  genero?: string
  idade_min?: number
  idade_max?: number
  interesse?: string
  anuncio_ids?: string[]
}) {
  const supabase = await createClient()

  let query = supabase.from("usuarios_social").select("*")

  if (filtros.genero) {
    query = query.eq("genero", filtros.genero)
  }

  if (filtros.idade_min) {
    query = query.gte("idade", filtros.idade_min)
  }

  if (filtros.idade_max) {
    query = query.lte("idade", filtros.idade_max)
  }

  const { data: usuarios, error } = await query

  if (error) throw error

  // Se houver filtro de interesse, buscar interações
  if (filtros.interesse && filtros.anuncio_ids && filtros.anuncio_ids.length > 0) {
    const { data: interacoes } = await supabase
      .from("interacoes_anuncios")
      .select("usuario_social_id")
      .in("anuncio_id", filtros.anuncio_ids)
      .eq("resposta", filtros.interesse)

    const usuariosComInteresse = new Set(interacoes?.map((i) => i.usuario_social_id))
    return usuarios?.filter((u) => usuariosComInteresse.has(u.id)) || []
  }

  return usuarios || []
}

export async function enviarCampanha(campanhaId: string) {
  const supabase = await createClient()

  // Buscar campanha
  const { data: campanha } = await supabase.from("campanhas_marketing").select("*").eq("id", campanhaId).single()

  if (!campanha) throw new Error("Campanha não encontrada")

  // Buscar usuários segmentados
  const usuarios = await getUsuariosSegmentados({
    genero: campanha.filtro_genero,
    idade_min: campanha.filtro_idade_min,
    idade_max: campanha.filtro_idade_max,
    interesse: campanha.filtro_interesse,
    anuncio_ids: campanha.filtro_anuncio_ids,
  })

  // Criar registros de envio
  const envios = usuarios.map((usuario) => ({
    campanha_id: campanhaId,
    usuario_social_id: usuario.id,
    status: "pendente",
  }))

  const { error } = await supabase.from("envios_campanha").insert(envios)

  if (error) throw error

  // Atualizar status da campanha
  await supabase
    .from("campanhas_marketing")
    .update({
      status: "ativa",
      total_enviados: usuarios.length,
    })
    .eq("id", campanhaId)

  revalidatePath("/client/campanhas-marketing")

  return { total_enviados: usuarios.length }
}
