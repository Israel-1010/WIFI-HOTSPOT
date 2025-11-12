"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMarketingStats() {
  const supabase = await createClient()

  // Buscar conexões de hoje por rede social
  const hoje = new Date().toISOString().split("T")[0]

  const { data: conexoesHoje } = await supabase
    .from("logs_atividades")
    .select("detalhes")
    .gte("criado_em", hoje)
    .maybeSingle()

  // Buscar usuários online agora
  const { data: usuariosOnline, error: onlineError } = await supabase
    .from("logs_atividades")
    .select("*")
    .eq("tipo", "conexao")
    .gte("criado_em", new Date(Date.now() - 30 * 60 * 1000).toISOString())

  // Buscar últimas conexões
  const { data: ultimasConexoes } = await supabase
    .from("logs_atividades")
    .select("*")
    .eq("tipo", "conexao")
    .order("criado_em", { ascending: false })
    .limit(10)

  // Dados demográficos simulados (em produção viriam do banco)
  const demograficos = {
    faixaEtaria: [
      { name: "Criança", value: 15, fill: "#10b981" },
      { name: "Jovem", value: 45, fill: "#ef4444" },
      { name: "Adulto", value: 35, fill: "#3b82f6" },
      { name: "Idoso", value: 5, fill: "#ec4899" },
    ],
    genero: [
      { name: "Homem", value: 55, fill: "#3b82f6" },
      { name: "Mulher", value: 42, fill: "#ec4899" },
      { name: "Outros", value: 3, fill: "#6b7280" },
    ],
  }

  // Conexões por rede social (simulado)
  const conexoesSociais = {
    facebook: 0,
    google: 0,
    linkedin: 0,
    twitter: 0,
    email: 0,
    youtube: 0,
    reddit: 0,
  }

  return {
    conexoesSociais,
    usuariosOnlineAgora: usuariosOnline?.length || 0,
    ultimasConexoes: ultimasConexoes || [],
    demograficos,
  }
}
