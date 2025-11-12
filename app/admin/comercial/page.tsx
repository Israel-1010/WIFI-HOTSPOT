import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ComercialClient } from "@/components/admin/comercial-client"
import { getPropostas, getPipeline } from "@/app/actions/comercial-revenda"
import { getClientes } from "@/app/actions/revendas-crud"

export default async function ComercialPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const revendaId = session.user.revenda_id || session.user.id

  const [propostas, pipeline, clientes] = await Promise.all([
    getPropostas(revendaId),
    getPipeline(revendaId),
    getClientes(revendaId),
  ])

  return <ComercialClient propostas={propostas} pipeline={pipeline} clientes={clientes} revendaId={revendaId} />
}
