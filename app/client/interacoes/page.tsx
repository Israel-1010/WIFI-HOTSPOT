import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { InteracoesClient } from "@/components/client/interacoes-client"

export default async function InteracoesPage() {
  const session = await getSession()

  if (!session || session.user.role !== "cliente") {
    redirect("/auth/login")
  }

  const clienteId = session.user.cliente_id || session.user.id

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interações com Anúncios</h1>
        <p className="text-muted-foreground">Veja quem interagiu com seus anúncios e crie campanhas segmentadas</p>
      </div>

      <Suspense fallback={<div>Carregando interações...</div>}>
        <InteracoesClient clienteId={clienteId} />
      </Suspense>
    </div>
  )
}
