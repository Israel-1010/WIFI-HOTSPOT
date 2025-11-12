"use server"

import { createClient } from "@/lib/supabase/server"

export async function logAuthentication(data: {
  login_type: "voucher" | "username_password" | "facebook" | "google" | "instagram" | "whatsapp" | "email" | "phone"
  user_name?: string
  user_email?: string
  user_phone?: string
  ip_address?: string
  mac_address?: string
  success: boolean
  error_message?: string
  additional_data?: any
}) {
  const supabase = await createClient()

  try {
    const { error: logError } = await supabase.from("logs_atividades").insert({
      tipo: "authentication",
      mensagem: `User authenticated via ${data.login_type}${data.success ? " successfully" : " failed"}`,
      usuario_nome: data.user_name,
      ip_address: data.ip_address,
      mac_address: data.mac_address,
      detalhes: {
        login_type: data.login_type,
        user_email: data.user_email,
        user_phone: data.user_phone,
        success: data.success,
        error_message: data.error_message,
        timestamp: new Date().toISOString(),
        ...data.additional_data,
      },
    })

    if (logError) {
      console.error("[v0] Error logging authentication:", logError)
      return { success: false, error: logError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error logging authentication:", error)
    return { success: false, error: "Failed to log authentication" }
  }
}

export async function getAuthenticationLogs(filters?: { login_type?: string; success?: boolean; limit?: number }) {
  const supabase = await createClient()

  let query = supabase
    .from("logs_atividades")
    .select("*")
    .eq("tipo", "authentication")
    .order("criado_em", { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching authentication logs:", error)
    return []
  }

  let filteredData = data

  if (filters?.login_type) {
    filteredData = filteredData.filter((log: any) => log.detalhes?.login_type === filters.login_type)
  }

  if (filters?.success !== undefined) {
    filteredData = filteredData.filter((log: any) => log.detalhes?.success === filters.success)
  }

  return filteredData
}
