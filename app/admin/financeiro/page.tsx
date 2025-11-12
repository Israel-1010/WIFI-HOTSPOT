import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getFaturasRevenda, getReceitaRevenda } from "@/app/actions/financeiro-revenda"
import { FinanceiroClient } from "@/components/admin/financeiro-client"

export default async function FinanceiroPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const revendaId = session.user.revenda_id
  if (!revendaId) {
    return <div>Erro: Revenda não encontrada</div>
  }

  const faturas = await getFaturasRevenda(revendaId)
  const receita = await getReceitaRevenda(revendaId)

  return <FinanceiroClient faturas={faturas} receita={receita} revendaId={revendaId} />
}
