"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()

  const { count: vouchersCount } = await supabase
    .from("vouchers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { data: activeVouchers } = await supabase
    .from("vouchers")
    .select("*")
    .eq("status", "active")
    .or(`data_validade.is.null,data_validade.gt.${new Date().toISOString()}`)

  const activeVouchersCount = activeVouchers?.filter((v) => v.quantidade_usada < v.quantidade_total).length || 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayConnections } = await supabase
    .from("logs_atividades")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "connection")
    .gte("criado_em", today.toISOString())

  const { data: recentActivity } = await supabase
    .from("logs_atividades")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(10)

  return {
    vouchersCount: vouchersCount || 0,
    activeVouchersCount,
    todayConnections: todayConnections || 0,
    recentActivity: recentActivity || [],
  }
}
