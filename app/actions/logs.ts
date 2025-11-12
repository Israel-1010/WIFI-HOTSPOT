"use server"

import { createClient } from "@/lib/supabase/server"

export async function getLogs(filters?: {
  type?: string
  search?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase.from("logs_atividades").select("*").order("criado_em", { ascending: false })

  if (filters?.type && filters.type !== "all") {
    query = query.eq("tipo", filters.type)
  }

  if (filters?.search) {
    query = query.or(
      `mensagem.ilike.%${filters.search}%,usuario_nome.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%`,
    )
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error("[v0] Error fetching logs:", error)
    return []
  }

  return logs
}

export async function createLog(logData: {
  tipo: string
  mensagem: string
  usuario_nome?: string
  ip_address?: string
  mac_address?: string
  detalhes?: any
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("logs_atividades").insert(logData)

  if (error) {
    console.error("[v0] Error creating log:", error)
    return { success: false }
  }

  return { success: true }
}
