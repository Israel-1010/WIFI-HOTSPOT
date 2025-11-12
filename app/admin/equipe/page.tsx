import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getEquipeRevenda } from "@/app/actions/equipe-revenda"
import { EquipeClient } from "@/components/admin/equipe-client"

export default async function EquipePage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const revendaId = session.user.revenda_id
  if (!revendaId) {
    return <div>Erro: Revenda não encontrada</div>
  }

  const equipe = await getEquipeRevenda(revendaId)

  return <EquipeClient equipe={equipe} revendaId={revendaId} />
}
