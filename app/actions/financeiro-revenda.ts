"use server"

import { createClient } from "@/lib/supabase/server"

export async function getFaturasRevenda(revendaId: string) {
  try {
    const supabase = await createClient()

    const { data: faturas, error } = await supabase
      .from("faturas")
      .select(`
        *,
        usuarios!faturas_cliente_id_fkey(nome_completo, email, telefone),
        planos(nome, preco_mensal)
      `)
      .eq("revenda_id", revendaId)
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("[v0] Erro ao buscar faturas:", error)
      return []
    }

    return faturas || []
  } catch (error) {
    console.error("[v0] Erro ao buscar faturas:", error)
    return []
  }
}

export async function getReceitaRevenda(revendaId: string) {
  try {
    const supabase = await createClient()

    const { data: faturas } = await supabase.from("faturas").select("valor_final, status").eq("revenda_id", revendaId)

    const total = faturas?.reduce((acc, f) => acc + (f.valor_final || 0), 0) || 0
    const pago = faturas?.filter((f) => f.status === "paga").reduce((acc, f) => acc + (f.valor_final || 0), 0) || 0
    const pendente =
      faturas?.filter((f) => f.status === "pendente").reduce((acc, f) => acc + (f.valor_final || 0), 0) || 0
    const vencido =
      faturas?.filter((f) => f.status === "vencida").reduce((acc, f) => acc + (f.valor_final || 0), 0) || 0

    return { total, pago, pendente, vencido }
  } catch (error) {
    console.error("[v0] Erro ao buscar receita:", error)
    return { total: 0, pago: 0, pendente: 0, vencido: 0 }
  }
}

export async function getClientesComPlanos(revendaId: string) {
  try {
    const supabase = await createClient()

    const { data: clientes, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nome_completo,
        email,
        plano_id,
        planos(nome, preco_mensal)
      `)
      .eq("revenda_id", revendaId)
      .eq("role", "cliente")
      .eq("ativo", true)
      .not("plano_id", "is", null)

    if (error) throw error
    return clientes || []
  } catch (error) {
    console.error("[v0] Erro ao buscar clientes:", error)
    return []
  }
}

export async function createFatura(data: {
  revendaId: string
  clienteId: string
  valor: number
  vencimento: string
  descricao: string
  metodoPagamento: string
}) {
  try {
    const supabase = await createClient()

    // Busca informações do cliente e plano
    const { data: cliente } = await supabase
      .from("usuarios")
      .select("nome_completo, email, telefone, plano_id, planos(nome)")
      .eq("id", data.clienteId)
      .single()

    // Gera número da fatura
    const { data: numeroFatura } = await supabase.rpc("gerar_numero_fatura", {
      p_revenda_id: data.revendaId,
    })

    // Cria a fatura
    const { data: fatura, error } = await supabase
      .from("faturas")
      .insert({
        revenda_id: data.revendaId,
        cliente_id: data.clienteId,
        plano_id: cliente?.plano_id,
        numero_fatura: numeroFatura || `FAT-${Date.now()}`,
        descricao: data.descricao,
        valor: data.valor,
        valor_final: data.valor,
        data_vencimento: data.vencimento,
        metodo_pagamento: data.metodoPagamento,
        status: "pendente",
      })
      .select()
      .single()

    if (error) throw error

    // Envia notificação para o cliente
    await enviarNotificacaoFatura(fatura.id, data.revendaId)

    return fatura
  } catch (error) {
    console.error("[v0] Erro ao criar fatura:", error)
    throw error
  }
}

export async function enviarNotificacaoFatura(faturaId: string, revendaId: string) {
  try {
    const supabase = await createClient()

    // Busca dados da fatura e cliente
    const { data: fatura } = await supabase
      .from("faturas")
      .select(`
        *,
        usuarios!faturas_cliente_id_fkey(nome_completo, email, telefone)
      `)
      .eq("id", faturaId)
      .single()

    if (!fatura) return

    // Busca configurações de cobrança
    const { data: config } = await supabase
      .from("configuracoes_cobranca")
      .select("*")
      .eq("revenda_id", revendaId)
      .single()

    // TODO: Integrar com serviço de email/WhatsApp
    console.log("[v0] Enviando notificação de fatura:", {
      cliente: fatura.usuarios?.nome_completo,
      email: fatura.usuarios?.email,
      valor: fatura.valor_final,
      vencimento: fatura.data_vencimento,
    })

    // Atualiza flags de envio
    await supabase.from("faturas").update({ email_enviado: true }).eq("id", faturaId)

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao enviar notificação:", error)
    return { success: false, error }
  }
}

export async function gerarFaturasMensais(revendaId: string) {
  try {
    const supabase = await createClient()

    // Chama função SQL que gera faturas
    const { error } = await supabase.rpc("gerar_faturas_mensais")

    if (error) throw error

    return { success: true, message: "Faturas mensais geradas com sucesso" }
  } catch (error) {
    console.error("[v0] Erro ao gerar faturas mensais:", error)
    return { success: false, error }
  }
}

export async function marcarFaturaPaga(faturaId: string, transacaoId?: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("faturas")
      .update({
        status: "paga",
        data_pagamento: new Date().toISOString(),
        transacao_id: transacaoId,
      })
      .eq("id", faturaId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao marcar fatura como paga:", error)
    return { success: false, error }
  }
}

export async function atualizarConfiguracaoCobranca(revendaId: string, config: any) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("configuracoes_cobranca")
      .upsert({
        revenda_id: revendaId,
        ...config,
      })
      .eq("revenda_id", revendaId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao atualizar configuração:", error)
    return { success: false, error }
  }
}
