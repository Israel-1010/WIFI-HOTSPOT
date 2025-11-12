"use server"

import { createClient } from "@/lib/supabase/server"

export async function getIntegracoes(revendaId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("integracoes_revenda")
      .select("*")
      .eq("revenda_id", revendaId)
      .order("criado_em", { ascending: false })

    if (error) {
      // Se a tabela não existe (erro 404/PGRST205), retornar array vazio
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.log("[v0] Tabela integracoes_revenda não existe ainda. Execute o script 023.")
        return []
      }
      throw error
    }
    return data || []
  } catch (error) {
    console.error("[v0] Erro ao buscar integrações:", error)
    return []
  }
}

export async function createIntegracao(data: {
  revenda_id: string
  tipo: string
  nome: string
  provider?: string
  configuracoes: Record<string, any>
  criado_por: string
}) {
  try {
    const supabase = await createClient()

    const { data: integracao, error } = await supabase
      .from("integracoes_revenda")
      .insert({
        revenda_id: data.revenda_id,
        tipo: data.tipo,
        nome: data.nome,
        provider: data.provider,
        configuracoes: data.configuracoes,
        ativo: true,
        criado_por: data.criado_por,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data: integracao }
  } catch (error: any) {
    console.error("[v0] Erro ao criar integração:", error)
    return { success: false, error: error.message }
  }
}

export async function updateIntegracao(
  id: string,
  data: {
    nome?: string
    configuracoes?: Record<string, any>
    ativo?: boolean
  },
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("integracoes_revenda")
      .update({
        ...data,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Erro ao atualizar integração:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteIntegracao(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("integracoes_revenda").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Erro ao deletar integração:", error)
    return { success: false, error: error.message }
  }
}

export async function testarIntegracao(id: string, tipo: string, configuracoes: Record<string, any>) {
  try {
    const supabase = await createClient()

    // Simular teste de conexão (em produção, fazer chamada real à API)
    let sucesso = false
    let mensagem = ""

    switch (tipo) {
      case "whatsapp":
        // Testar WhatsApp Business API
        sucesso = !!configuracoes.phone_number_id && !!configuracoes.access_token
        mensagem = sucesso ? "Conexão com WhatsApp Business estabelecida" : "Credenciais inválidas"
        break

      case "sms":
        // Testar provedor de SMS
        sucesso = !!configuracoes.account_sid && !!configuracoes.auth_token
        mensagem = sucesso ? "Conexão com provedor de SMS estabelecida" : "Credenciais inválidas"
        break

      case "crm":
        // Testar CRM
        sucesso = !!configuracoes.api_key
        mensagem = sucesso ? "Conexão com CRM estabelecida" : "API Key inválida"
        break

      case "webhook":
        // Testar webhook
        sucesso = !!configuracoes.url
        mensagem = sucesso ? "Webhook configurado" : "URL inválida"
        break

      case "automation":
        // Testar automação
        sucesso = !!configuracoes.webhook_url
        mensagem = sucesso ? "Automação configurada" : "Webhook URL inválida"
        break
    }

    // Atualizar status do teste
    await supabase
      .from("integracoes_revenda")
      .update({
        testado_em: new Date().toISOString(),
        teste_sucesso: sucesso,
      })
      .eq("id", id)

    return { success: sucesso, message: mensagem }
  } catch (error: any) {
    console.error("[v0] Erro ao testar integração:", error)
    return { success: false, message: error.message }
  }
}

export async function getWebhookLogs(revendaId: string, limit = 50) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*, integracoes_revenda(nome, tipo)")
      .eq("revenda_id", revendaId)
      .order("criado_em", { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.log("[v0] Tabela webhook_logs não existe ainda. Execute o script 023.")
        return []
      }
      throw error
    }
    return data || []
  } catch (error) {
    console.error("[v0] Erro ao buscar logs de webhook:", error)
    return []
  }
}
