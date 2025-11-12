"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function getUsuariosOAuth() {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) {
    return []
  }

  const clienteId = session.user.cliente_id

  const { data: usuarios, error } = await supabase
    .from("usuarios_social")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("ultima_conexao", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching usuarios OAuth:", error)
    return []
  }

  return usuarios
}

export async function getEstatisticasOAuth() {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) {
    return {
      total: 0,
      hoje: 0,
      semana: 0,
      mes: 0,
      porProvider: {},
    }
  }

  const clienteId = session.user.cliente_id

  const { data: usuarios, error } = await supabase.from("usuarios_social").select("*").eq("cliente_id", clienteId)

  if (error || !usuarios) {
    return {
      total: 0,
      hoje: 0,
      semana: 0,
      mes: 0,
      porProvider: {},
    }
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const semanaAtras = new Date()
  semanaAtras.setDate(semanaAtras.getDate() - 7)

  const mesAtras = new Date()
  mesAtras.setMonth(mesAtras.getMonth() - 1)

  const porProvider: Record<string, number> = {}

  usuarios.forEach((u) => {
    porProvider[u.provider] = (porProvider[u.provider] || 0) + 1
  })

  return {
    total: usuarios.length,
    hoje: usuarios.filter((u) => new Date(u.primeira_conexao) >= hoje).length,
    semana: usuarios.filter((u) => new Date(u.primeira_conexao) >= semanaAtras).length,
    mes: usuarios.filter((u) => new Date(u.primeira_conexao) >= mesAtras).length,
    porProvider,
  }
}
