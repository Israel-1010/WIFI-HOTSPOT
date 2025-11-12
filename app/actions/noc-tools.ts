"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getNetworkDriver, type NetworkHotspotCredentials } from "@/lib/network/drivers"

interface ToolActionResult {
  success: boolean
  message: string
}

async function loadHotspotCredentials(hotspotId: string): Promise<NetworkHotspotCredentials | null> {
  const supabase = await createClient()

  const { data: hotspot, error } = await supabase
    .from("hotspots")
    .select("id, nome, tipo, ip_servidor, porta, usuario_api, senha_api, configuracoes")
    .eq("id", hotspotId)
    .maybeSingle()

  if (error || !hotspot) {
    console.error("[v0] Hotspot não encontrado para ação NOC:", error)
    return null
  }

  return hotspot as NetworkHotspotCredentials
}

async function logNocAction(
  hotspotId: string,
  acao: string,
  resultado: ToolActionResult,
  payload: Record<string, any>,
) {
  try {
    const supabase = await createClient()
    await supabase.from("logs_atividades").insert({
      tipo: "noc_action",
      hotspot_id: hotspotId,
      mensagem: resultado.message,
      detalhes: { acao, ...payload, sucesso: resultado.success },
    })
  } catch (error) {
    console.error("[v0] Não foi possível registrar log do NOC:", error)
  }
}

export async function kickClientFromHotspot({
  hotspotId,
  clientIdentifier,
}: {
  hotspotId: string
  clientIdentifier: string
}): Promise<ToolActionResult> {
  const credentials = await loadHotspotCredentials(hotspotId)

  if (!credentials) {
    return { success: false, message: "Hotspot não encontrado" }
  }

  const driver = await getNetworkDriver(credentials)

  if (!driver) {
    return { success: false, message: "Driver de rede não configurado" }
  }

  const result = await driver.kickClient(clientIdentifier)
  await logNocAction(hotspotId, "kick_client", result, { clientIdentifier })
  revalidatePath("/admin/operacoes")
  return result
}

export async function bounceHotspotSsid({
  hotspotId,
  ssid,
}: {
  hotspotId: string
  ssid?: string
}): Promise<ToolActionResult> {
  const credentials = await loadHotspotCredentials(hotspotId)

  if (!credentials) {
    return { success: false, message: "Hotspot não encontrado" }
  }

  const driver = await getNetworkDriver(credentials)

  if (!driver) {
    return { success: false, message: "Driver de rede não configurado" }
  }

  const result = await driver.bounceSsid(ssid)
  await logNocAction(hotspotId, "bounce_ssid", result, { ssid })
  revalidatePath("/admin/operacoes")
  return result
}

export async function triggerCaptivePortal({
  hotspotId,
  target,
}: {
  hotspotId: string
  target?: string
}): Promise<ToolActionResult> {
  const credentials = await loadHotspotCredentials(hotspotId)

  if (!credentials) {
    return { success: false, message: "Hotspot não encontrado" }
  }

  const driver = await getNetworkDriver(credentials)

  if (!driver) {
    return { success: false, message: "Driver de rede não configurado" }
  }

  const result = await driver.triggerCna(target)
  await logNocAction(hotspotId, "trigger_cna", result, { target })
  revalidatePath("/admin/operacoes")
  return result
}
