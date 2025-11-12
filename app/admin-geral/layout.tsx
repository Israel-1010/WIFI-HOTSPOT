import type React from "react"
import { redirect } from "next/navigation"
import { AdminGeralSidebar } from "@/components/admin-geral/sidebar"
import { AdminGeralHeader } from "@/components/admin-geral/header"
import { getSession } from "@/lib/auth"

export default async function AdminGeralLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Apenas admin_geral pode acessar
  if (session.user.role !== "admin_geral") {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminGeralSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminGeralHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
