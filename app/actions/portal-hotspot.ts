"use server"

import { createClient } from "@/lib/supabase/server"

export async function getConfiguracaoPortal(clienteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("configuracoes_portal")
    .select("*")
    .eq("cliente_id", clienteId)
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao buscar configuração do portal:", error)
    return null
  }

  return data
}

export async function getAnunciosAtivos(clienteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("anuncios")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("ativo", true)
    .lte("data_inicio", new Date().toISOString())
    .gte("data_fim", new Date().toISOString())
    .order("ordem", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar anúncios ativos:", error)
    return []
  }

  return data || []
}

export async function registrarInteracaoAnuncio(data: {
  anuncio_id: string
  resposta: "sim" | "nao"
  usuario_social_id?: string
  hotspot_id?: string
  sessao_id?: string
  ip_address?: string
  user_agent?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("interacoes_anuncios").insert({
    anuncio_id: data.anuncio_id,
    resposta: data.resposta,
    usuario_social_id: data.usuario_social_id,
    hotspot_id: data.hotspot_id,
    sessao_id: data.sessao_id,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
  })

  if (error) {
    console.error("[v0] Erro ao registrar interação:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getProvidersOAuth() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("oauth_providers")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar providers OAuth:", error)
    return []
  }

  return data || []
}

export async function updateConfiguracaoPortal(
  clienteId: string,
  config: {
    logo_url?: string | null
    cor_primaria?: string | null
    cor_secundaria?: string | null
    mensagem_boas_vindas?: string | null
    slideshow_ativo?: boolean
    slideshow_imagens?: string[] | null
    slideshow_videos?: string[] | null
    slideshow_tempo_minimo?: number
    auth_social_ativo?: boolean
    auth_email_ativo?: boolean
    auth_voucher_ativo?: boolean
  },
) {
  const supabase = await createClient()

  console.log("[v0] Atualizando configuração do portal para cliente:", clienteId)
  console.log("[v0] Configuração:", config)

  // Verificar se já existe configuração
  const { data: existing } = await supabase
    .from("configuracoes_portal")
    .select("id")
    .eq("cliente_id", clienteId)
    .maybeSingle()

  if (existing) {
    // Atualizar configuração existente
    const { error } = await supabase
      .from("configuracoes_portal")
      .update({
        ...config,
        atualizado_em: new Date().toISOString(),
      })
      .eq("cliente_id", clienteId)

    if (error) {
      console.error("[v0] Erro ao atualizar configuração:", error)
      return { success: false, error: error.message }
    }
  } else {
    // Criar nova configuração
    const { error } = await supabase.from("configuracoes_portal").insert({
      cliente_id: clienteId,
      ...config,
    })

    if (error) {
      console.error("[v0] Erro ao criar configuração:", error)
      return { success: false, error: error.message }
    }
  }

  console.log("[v0] Configuração do portal atualizada com sucesso")
  return { success: true }
}
