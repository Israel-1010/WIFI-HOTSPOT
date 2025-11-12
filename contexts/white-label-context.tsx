"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { WhiteLabelConfig } from "@/app/actions/white-label"
import { getWhiteLabelConfig } from "@/app/actions/white-label"

interface WhiteLabelContextType {
  config: WhiteLabelConfig | null
  loading: boolean
  refreshConfig: () => Promise<void>
}

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  config: null,
  loading: true,
  refreshConfig: async () => {},
})

export function WhiteLabelProvider({
  children,
  initialConfig,
}: {
  children: React.ReactNode
  initialConfig?: WhiteLabelConfig | null
}) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(initialConfig || null)
  const [loading, setLoading] = useState(!initialConfig)

  const refreshConfig = async () => {
    setLoading(true)
    try {
      const newConfig = await getWhiteLabelConfig()
      setConfig(newConfig)
    } catch (error) {
      console.error("[v0] Erro ao carregar configuração white label:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialConfig) {
      refreshConfig()
    }
  }, [initialConfig])

  // Aplica as cores CSS customizadas
  useEffect(() => {
    if (config?.cor_primaria) {
      document.documentElement.style.setProperty("--color-primary", config.cor_primaria)
    }
    if (config?.cor_secundaria) {
      document.documentElement.style.setProperty("--color-secondary", config.cor_secundaria)
    }
  }, [config])

  return <WhiteLabelContext.Provider value={{ config, loading, refreshConfig }}>{children}</WhiteLabelContext.Provider>
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext)
  if (!context) {
    throw new Error("useWhiteLabel deve ser usado dentro de WhiteLabelProvider")
  }
  return context
}
