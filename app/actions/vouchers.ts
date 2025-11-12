"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getVouchers() {
  const supabase = await createClient()

  const { data: vouchers, error } = await supabase.from("vouchers").select("*").order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching vouchers:", error)
    return []
  }

  return vouchers
}

export async function createVoucher(formData: {
  codigo: string
  titulo: string
  tipo: string
  valor?: number
  porcentagem?: number
  quantidade_total: number
  data_validade?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Não autorizado")
  }

  const { error } = await supabase.from("vouchers").insert({
    codigo: formData.codigo,
    titulo: formData.titulo,
    tipo: formData.tipo,
    valor: formData.valor,
    porcentagem: formData.porcentagem,
    quantidade_total: formData.quantidade_total,
    quantidade_usada: 0,
    data_validade: formData.data_validade,
    status: "active",
    criado_por: user.id,
  })

  if (error) {
    console.error("[v0] Error creating voucher:", error)
    throw new Error("Falha ao criar voucher")
  }

  revalidatePath("/client/vouchers")
  return { success: true }
}

export async function deleteVoucher(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("vouchers").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting voucher:", error)
    throw new Error("Falha ao deletar voucher")
  }

  revalidatePath("/client/vouchers")
  return { success: true }
}

export async function updateVoucher(
  id: string,
  formData: {
    codigo?: string
    titulo?: string
    tipo?: string
    valor?: number
    porcentagem?: number
    quantidade_total?: number
    data_validade?: string
    status?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Não autorizado")
  }

  const { error } = await supabase.from("vouchers").update(formData).eq("id", id)

  if (error) {
    console.error("[v0] Error updating voucher:", error)
    throw new Error("Falha ao atualizar voucher")
  }

  revalidatePath("/client/vouchers")
  return { success: true }
}
