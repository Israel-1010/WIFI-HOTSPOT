import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuporteClient } from "@/components/admin/suporte-client"
import { getTickets, getBaseConhecimento } from "@/app/actions/suporte-revenda"
import { getClientes } from "@/app/actions/revendas-crud"
import { getEquipe } from "@/app/actions/equipe-revenda"

export default async function SuportePage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const revendaId = session.user.revenda_id || session.user.id

  const [tickets, artigos, clientes, equipe] = await Promise.all([
    getTickets(revendaId),
    getBaseConhecimento(revendaId),
    getClientes(revendaId),
    getEquipe(revendaId),
  ])

  return <SuporteClient tickets={tickets} artigos={artigos} clientes={clientes} equipe={equipe} revendaId={revendaId} />
}
