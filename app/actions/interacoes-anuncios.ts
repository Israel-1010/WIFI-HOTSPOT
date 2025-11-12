"use server"

import { createClient } from "@/lib/supabase/server"

export async function registrarInteracao(data: {
  anuncio_id: string
  usuario_social_id: string
  resposta: "sim" | "nao"
  sessao_id: string
  hotspot_id: string
  ip_address?: string
  user_agent?: string
}) {
  const supabase = await createClient()

  const { data: interacao, error } = await supabase
    .from("interacoes_anuncios")
    .insert({
      anuncio_id: data.anuncio_id,
      usuario_social_id: data.usuario_social_id,
      resposta: data.resposta,
      sessao_id: data.sessao_id,
      hotspot_id: data.hotspot_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao registrar interação:", error)
    throw new Error("Erro ao registrar interação")
  }

  return interacao
}

export async function getInteracoesPorAnuncio(anuncio_id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("interacoes_anuncios")
    .select(`
      *,
      usuario_social:usuarios_social(
        nome_completo,
        email,
        telefone,
        foto_perfil,
        provider,
        dados_adicionais
      )
    `)
    .eq("anuncio_id", anuncio_id)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar interações:", error)
    return []
  }

  return data || []
}

export async function getEstatisticasInteracoes(cliente_id: string) {
  const supabase = await createClient()

  if (!cliente_id || cliente_id === "null" || cliente_id === "undefined") {
    return {
      total_visualizacoes: 0,
      total_sim: 0,
      total_nao: 0,
      taxa_interesse: 0,
      usuarios_unicos: 0,
    }
  }

  // Buscar todos os anúncios do cliente
  const { data: anuncios } = await supabase.from("anuncios").select("id").eq("cliente_id", cliente_id)

  if (!anuncios || anuncios.length === 0) {
    return {
      total_visualizacoes: 0,
      total_sim: 0,
      total_nao: 0,
      taxa_interesse: 0,
      usuarios_unicos: 0,
    }
  }

  const anuncioIds = anuncios.map((a) => a.id)

  // Buscar interações
  const { data: interacoes } = await supabase
    .from("interacoes_anuncios")
    .select("resposta, usuario_social_id")
    .in("anuncio_id", anuncioIds)

  if (!interacoes || interacoes.length === 0) {
    return {
      total_visualizacoes: 0,
      total_sim: 0,
      total_nao: 0,
      taxa_interesse: 0,
      usuarios_unicos: 0,
    }
  }

  const total_sim = interacoes.filter((i) => i.resposta === "sim").length
  const total_nao = interacoes.filter((i) => i.resposta === "nao").length
  const usuarios_unicos = new Set(interacoes.map((i) => i.usuario_social_id)).size
  const taxa_interesse = interacoes.length > 0 ? (total_sim / interacoes.length) * 100 : 0

  return {
    total_visualizacoes: interacoes.length,
    total_sim,
    total_nao,
    taxa_interesse: Math.round(taxa_interesse),
    usuarios_unicos,
  }
}

export async function getUsuariosPorResposta(cliente_id: string, resposta: "sim" | "nao", anuncio_id?: string) {
  const supabase = await createClient()

  if (!cliente_id || cliente_id === "null" || cliente_id === "undefined") {
    console.log("[v0] cliente_id inválido:", cliente_id)
    return []
  }

  let query = supabase
    .from("interacoes_anuncios")
    .select(`
      usuario_social:usuarios_social(
        id,
        nome_completo,
        email,
        telefone,
        foto_perfil,
        provider,
        primeira_conexao,
        ultima_conexao,
        total_conexoes,
        dados_adicionais
      ),
      anuncio:anuncios(titulo),
      criado_em
    `)
    .eq("resposta", resposta)

  if (anuncio_id) {
    query = query.eq("anuncio_id", anuncio_id)
  } else {
    // Buscar anúncios do cliente
    const { data: anuncios } = await supabase.from("anuncios").select("id").eq("cliente_id", cliente_id)

    if (!anuncios || anuncios.length === 0) {
      console.log("[v0] Nenhum anúncio encontrado para cliente_id:", cliente_id)
      return []
    }

    const anuncioIds = anuncios.map((a) => a.id)
    query = query.in("anuncio_id", anuncioIds)
  }

  const { data, error } = await query.order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar usuários por resposta:", error)
    return []
  }

  // Remover duplicatas (mesmo usuário pode ter respondido múltiplos anúncios)
  const usuariosUnicos = new Map()
  data?.forEach((item: any) => {
    if (item.usuario_social && !usuariosUnicos.has(item.usuario_social.id)) {
      usuariosUnicos.set(item.usuario_social.id, {
        ...item.usuario_social,
        anuncio: item.anuncio,
        respondido_em: item.criado_em,
      })
    }
  })

  return Array.from(usuariosUnicos.values())
}

export async function enviarMensagem(data: {
  usuario_ids: string[]
  tipo: "email" | "sms" | "whatsapp"
  assunto?: string
  mensagem: string
  template_id?: string
}) {
  const supabase = await createClient()

  // Buscar dados dos usuários
  const { data: usuarios, error: usuariosError } = await supabase
    .from("usuarios_social")
    .select("id, nome_completo, email, telefone")
    .in("id", data.usuario_ids)

  if (usuariosError || !usuarios) {
    console.error("[v0] Erro ao buscar usuários:", usuariosError)
    throw new Error("Erro ao buscar usuários")
  }

  // Registrar envios
  const envios = usuarios.map((usuario) => ({
    usuario_social_id: usuario.id,
    tipo_envio: data.tipo,
    assunto: data.assunto,
    mensagem: data.mensagem,
    template_id: data.template_id,
    status: "pendente",
    destinatario: data.tipo === "email" ? usuario.email : usuario.telefone,
  }))

  const { data: enviosData, error: enviosError } = await supabase.from("envios_campanha").insert(envios).select()

  if (enviosError) {
    console.error("[v0] Erro ao registrar envios:", enviosError)
    throw new Error("Erro ao registrar envios")
  }

  // Aqui você integraria com serviços reais de envio (SendGrid, Twilio, etc.)
  // Por enquanto, apenas simulamos o envio

  return {
    success: true,
    total_enviados: enviosData.length,
    usuarios,
  }
}

export async function getTemplatesMensagens() {
  return [
    {
      id: "1",
      nome: "Boas-vindas",
      tipo: "email",
      assunto: "Bem-vindo ao nosso Wi-Fi!",
      mensagem:
        "Olá {{nome}},\n\nObrigado por se conectar ao nosso Wi-Fi! Ficamos felizes em tê-lo(a) conosco.\n\nAproveite sua conexão!\n\nAtenciosamente,\nEquipe",
    },
    {
      id: "2",
      nome: "Promoção - Interessados",
      tipo: "email",
      assunto: "Oferta Especial para Você!",
      mensagem:
        "Olá {{nome}},\n\nVimos que você demonstrou interesse em nossa oferta! Temos uma promoção exclusiva para você:\n\n🎉 20% de desconto em todos os produtos!\n\nUse o cupom: WIFI20\n\nAtenciosamente,\nEquipe",
    },
    {
      id: "3",
      nome: "SMS - Promoção",
      tipo: "sms",
      mensagem: "Oi {{nome}}! Oferta especial: 20% OFF com cupom WIFI20. Válido até amanhã! 🎉",
    },
    {
      id: "4",
      nome: "WhatsApp - Feedback",
      tipo: "whatsapp",
      mensagem:
        "Olá {{nome}}! 👋\n\nComo foi sua experiência com nosso Wi-Fi?\n\nGostaríamos muito de ouvir seu feedback!\n\nResponda esta mensagem com sua opinião. 😊",
    },
    {
      id: "5",
      nome: "Remarketing - Não Interessados",
      tipo: "email",
      assunto: "Talvez você goste desta oferta!",
      mensagem:
        "Olá {{nome}},\n\nNotamos que você não se interessou pela nossa última oferta, mas temos algo diferente que pode te agradar!\n\n✨ Confira nossas novidades em nosso site.\n\nAtenciosamente,\nEquipe",
    },
  ]
}
