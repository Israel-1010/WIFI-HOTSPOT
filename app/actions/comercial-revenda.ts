"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPropostas(revendaId: string) {
  const supabase = await createClient()

  const { data: propostas, error } = await supabase
    .from("propostas_comerciais")
    .select(`
      *,
      cliente:clientes(nome, email, cnpj)
    `)
    .eq("revenda_id", revendaId)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar propostas:", error)
    return []
  }

  return propostas || []
}

export async function createProposta(data: {
  revendaId: string
  clienteId: string
  titulo: string
  descricao: string
  valor: number
  validade: string
  itens: any[]
}) {
  const supabase = await createClient()

  const { data: proposta, error } = await supabase
    .from("propostas_comerciais")
    .insert({
      revenda_id: data.revendaId,
      cliente_id: data.clienteId,
      titulo: data.titulo,
      descricao: data.descricao,
      valor_total: data.valor,
      validade: data.validade,
      itens: data.itens,
      status: "enviada",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar proposta:", error)
    throw new Error("Erro ao criar proposta")
  }

  return proposta
}

export async function updatePropostaStatus(propostaId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("propostas_comerciais").update({ status }).eq("id", propostaId)

  if (error) {
    console.error("[v0] Erro ao atualizar proposta:", error)
    throw new Error("Erro ao atualizar proposta")
  }
}

export async function calcularSimulacao(params: {
  numHotspots: number
  numUsuarios: number
  plano: string
}) {
  // Tabela de preços base
  const precos = {
    basico: { hotspot: 50, usuario: 2 },
    profissional: { hotspot: 80, usuario: 3 },
    enterprise: { hotspot: 120, usuario: 5 },
  }

  const preco = precos[params.plano as keyof typeof precos] || precos.basico

  const custoHotspots = params.numHotspots * preco.hotspot
  const custoUsuarios = params.numUsuarios * preco.usuario
  const subtotal = custoHotspots + custoUsuarios

  // Descontos por volume
  let desconto = 0
  if (params.numHotspots >= 10) desconto = 0.1
  if (params.numHotspots >= 20) desconto = 0.15
  if (params.numHotspots >= 50) desconto = 0.2

  const valorDesconto = subtotal * desconto
  const total = subtotal - valorDesconto

  return {
    custoHotspots,
    custoUsuarios,
    subtotal,
    desconto: desconto * 100,
    valorDesconto,
    total,
  }
}

export async function getPipeline(revendaId: string) {
  const supabase = await createClient()

  const { data: leads, error } = await supabase
    .from("pipeline_vendas")
    .select("*")
    .eq("revenda_id", revendaId)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar pipeline:", error)
    return []
  }

  return leads || []
}

export async function createLead(data: {
  revendaId: string
  nome: string
  email: string
  telefone: string
  empresa: string
  valorEstimado: number
  estagio: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("pipeline_vendas").insert({
    revenda_id: data.revendaId,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    empresa: data.empresa,
    valor_estimado: data.valorEstimado,
    estagio: data.estagio,
  })

  if (error) {
    console.error("[v0] Erro ao criar lead:", error)
    throw new Error("Erro ao criar lead")
  }
}
