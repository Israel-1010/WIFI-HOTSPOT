import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TemplatesPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Biblioteca de Templates</h1>
      <p className="text-muted-foreground">
        Templates prontos de portais e campanhas segmentados por vertical (restaurantes, hotéis, shoppings).
      </p>
      <div className="text-center py-12 text-muted-foreground">Funcionalidade em desenvolvimento - Fase 2</div>
    </div>
  )
}
