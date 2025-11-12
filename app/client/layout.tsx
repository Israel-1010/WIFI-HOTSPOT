import type React from "react"
import { redirect } from "next/navigation"
import { ClientSidebar } from "@/components/client/sidebar"
import { ClientHeader } from "@/components/client/header"
import { getSession } from "@/lib/auth"
import { WhiteLabelProvider } from "@/contexts/white-label-context"
import { DynamicThemeApplier } from "@/components/dynamic-theme-applier"
import { getWhiteLabelConfig } from "@/app/actions/white-label"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const whiteLabelConfig = session.user.revenda_id ? await getWhiteLabelConfig(session.user.revenda_id) : null

  return (
    <WhiteLabelProvider initialConfig={whiteLabelConfig}>
      <DynamicThemeApplier />
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <ClientSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ClientHeader user={session.user} />
          <main
            className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6"
            style={{ backgroundColor: "var(--color-fundo)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </WhiteLabelProvider>
  )
}
