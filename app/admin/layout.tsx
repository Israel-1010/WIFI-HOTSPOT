import type React from "react"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/admin/sidebar"
import { Header } from "@/components/admin/header"
import { WhiteLabelProvider } from "@/contexts/white-label-context"
import { DynamicThemeApplier } from "@/components/dynamic-theme-applier"
import { getWhiteLabelConfig } from "@/app/actions/white-label"
import { getSession } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Apenas admin_geral e admin_revenda podem acessar
  if (!["admin_geral", "admin_revenda", "operador_noc"].includes(session.user.role)) {
    redirect("/auth/login")
  }

  const whiteLabelConfig = await getWhiteLabelConfig()

  return (
    <WhiteLabelProvider initialConfig={whiteLabelConfig}>
      <DynamicThemeApplier />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
          <Header user={session.user} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </WhiteLabelProvider>
  )
}
