import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getIntegracoes, getWebhookLogs } from "@/app/actions/integracoes-revenda"
import IntegracoesClient from "@/components/admin/integracoes-client"

export default async function IntegracoesPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const revendaId = session.user.revenda_id
  if (!revendaId) {
    return <div>Erro: Revenda não encontrada</div>
  }

  const integracoes = await getIntegracoes(revendaId)
  const webhookLogs = await getWebhookLogs(revendaId, 20)

  return (
    <IntegracoesClient
      revendaId={revendaId}
      userId={session.user.id}
      integracoes={integracoes}
      webhookLogs={webhookLogs}
    />
  )
}
