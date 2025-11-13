import { getConfiguracaoPortal, getProvidersOAuth } from "@/app/actions/portal-hotspot"
import { PortalPreviewClient } from "@/components/client/portal-preview-client"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCampanhasDoCliente } from "@/app/actions/campanhas"
import { getEnquetesDoCliente } from "@/app/actions/enquetes"
import { createClient } from "@/lib/supabase/server"
import { ensurePerfilForUser } from "@/lib/perfis"

export default async function PortalPreviewPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { perfilId } = await ensurePerfilForUser(supabase, session.user)

  const clienteId = session.user.cliente_id || perfilId

  if (!clienteId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Erro: Cliente não encontrado</p>
      </div>
    )
  }

  const [configuracao, providers, campanhas, enquetes] = await Promise.all([
    getConfiguracaoPortal(clienteId),
    getProvidersOAuth(),
    getCampanhasDoCliente(clienteId),
    getEnquetesDoCliente(clienteId),
  ])

  return (
    <PortalPreviewClient
      clienteId={clienteId}
      configuracaoInicial={configuracao}
      providersInicial={providers}
      campanhasDisponiveis={campanhas}
      enquetesDisponiveis={enquetes}
    />
  )
}
