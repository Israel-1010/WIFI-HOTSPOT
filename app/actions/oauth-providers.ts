"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface OAuthProvider {
  id: string
  provider: string
  nome_exibicao: string
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  ativo: boolean
  icone?: string
  cor_primaria?: string
  ordem: number
  configuracoes: any
  criado_em: string
  atualizado_em: string
}

// Buscar todos os providers (Admin Geral)
export async function getOAuthProviders() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("oauth_providers").select("*").order("ordem", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar providers:", error)
    return { providers: [], error: error.message }
  }

  return { providers: data as OAuthProvider[], error: null }
}

// Buscar providers ativos (para exibir no login)
export async function getActiveOAuthProviders() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("oauth_providers")
    .select("id, provider, nome_exibicao, icone, cor_primaria, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar providers ativos:", error)
    return { providers: [], error: error.message }
  }

  return { providers: data, error: null }
}

// Atualizar configuração de provider (Admin Geral)
export async function updateOAuthProvider(id: string, data: Partial<OAuthProvider>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("oauth_providers")
    .update({
      ...data,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar provider:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin-geral/oauth")
  return { success: true, error: null }
}

// Ativar/Desativar provider
export async function toggleOAuthProvider(id: string, ativo: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("oauth_providers")
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao toggle provider:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin-geral/oauth")
  return { success: true, error: null }
}

// Estatísticas de uso de OAuth
export async function getOAuthStats() {
  const supabase = await createClient()

  // Total de usuários por provider
  const { data: usersByProvider } = await supabase.from("usuarios_social").select("provider")

  // Total de autenticações hoje
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const { data: authsToday } = await supabase
    .from("logs_oauth")
    .select("provider")
    .gte("criado_em", hoje.toISOString())
    .eq("sucesso", true)

  // Agrupar por provider
  const stats = usersByProvider?.reduce((acc: any, user: any) => {
    acc[user.provider] = (acc[user.provider] || 0) + 1
    return acc
  }, {})

  const authsStats = authsToday?.reduce((acc: any, auth: any) => {
    acc[auth.provider] = (acc[auth.provider] || 0) + 1
    return acc
  }, {})

  return {
    totalUsuarios: usersByProvider?.length || 0,
    totalAutenticacoesHoje: authsToday?.length || 0,
    usuariosPorProvider: stats || {},
    autenticacoesPorProvider: authsStats || {},
  }
}
