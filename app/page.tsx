import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function HomePage() {
  const session = await getSession()

  // Se já estiver autenticado, redirecionar para o painel apropriado
  if (session) {
    const role = session.user.role

    if (role === "admin_geral") {
      redirect("/admin-geral/dashboard")
    } else if (role === "admin_revenda") {
      redirect("/admin/dashboard")
    } else {
      redirect("/client/dashboard")
    }
  }

  // Se não estiver autenticado, redirecionar para login
  redirect("/auth/login")
}
