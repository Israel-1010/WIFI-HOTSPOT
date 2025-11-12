import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClientesByRevenda } from "@/app/actions/revendas-crud"
import { getPlanos } from "@/app/actions/planos"
import { ClientesClient } from "@/components/admin/clientes-client"

export default async function ClientesPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const [clientes, planos] = await Promise.all([getClientesByRevenda(session.user.revenda_id!), getPlanos()])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Clientes</h1>
        <p className="text-muted-foreground">Crie e gerencie os clientes da sua revenda</p>
      </div>

      <ClientesClient clientes={clientes} revendaId={session.user.revenda_id!} planos={planos} />
    </div>
  )
}
