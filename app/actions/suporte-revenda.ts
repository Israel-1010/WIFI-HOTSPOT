"use server"

import { createClient } from "@/lib/supabase/server"

export async function getTickets(revendaId: string) {
  const supabase = await createClient()

  const { data: tickets, error } = await supabase
    .from("tickets_suporte")
    .select(`
      *,
      cliente:clientes(nome, email),
      atribuido_para:equipe_revenda(nome, email)
    `)
    .eq("revenda_id", revendaId)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar tickets:", error)
    return []
  }

  return tickets || []
}

export async function createTicket(data: {
  revendaId: string
  clienteId: string
  assunto: string
  descricao: string
  prioridade: string
  categoria: string
}) {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from("tickets_suporte")
    .insert({
      revenda_id: data.revendaId,
      cliente_id: data.clienteId,
      assunto: data.assunto,
      descricao: data.descricao,
      prioridade: data.prioridade,
      categoria: data.categoria,
      status: "aberto",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar ticket:", error)
    throw new Error("Erro ao criar ticket")
  }

  return ticket
}

export async function updateTicketStatus(ticketId: string, status: string, atribuidoPara?: string) {
  const supabase = await createClient()

  const updateData: any = { status }
  if (atribuidoPara) {
    updateData.atribuido_para = atribuidoPara
  }

  const { error } = await supabase.from("tickets_suporte").update(updateData).eq("id", ticketId)

  if (error) {
    console.error("[v0] Erro ao atualizar ticket:", error)
    throw new Error("Erro ao atualizar ticket")
  }
}

export async function addTicketResposta(ticketId: string, usuarioId: string, mensagem: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("respostas_ticket").insert({
    ticket_id: ticketId,
    usuario_id: usuarioId,
    mensagem,
  })

  if (error) {
    console.error("[v0] Erro ao adicionar resposta:", error)
    throw new Error("Erro ao adicionar resposta")
  }
}

export async function getBaseConhecimento(revendaId: string) {
  const supabase = await createClient()

  const { data: artigos, error } = await supabase
    .from("base_conhecimento")
    .select("*")
    .eq("revenda_id", revendaId)
    .order("visualizacoes", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar base de conhecimento:", error)
    return []
  }

  return artigos || []
}

export async function createArtigo(data: {
  revendaId: string
  titulo: string
  conteudo: string
  categoria: string
  tags: string[]
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("base_conhecimento").insert({
    revenda_id: data.revendaId,
    titulo: data.titulo,
    conteudo: data.conteudo,
    categoria: data.categoria,
    tags: data.tags,
    publicado: true,
  })

  if (error) {
    console.error("[v0] Erro ao criar artigo:", error)
    throw new Error("Erro ao criar artigo")
  }
}
