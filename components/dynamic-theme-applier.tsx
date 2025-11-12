"use client"

import { useEffect } from "react"
import { useWhiteLabel } from "@/contexts/white-label-context"

export function DynamicThemeApplier() {
  const { config } = useWhiteLabel()

  useEffect(() => {
    if (!config) return

    const root = document.documentElement

    if (config.cor_primaria) {
      root.style.setProperty("--color-primary", config.cor_primaria)
    }

    if (config.cor_secundaria) {
      root.style.setProperty("--color-secondary", config.cor_secundaria)
    }

    if (config.cor_fundo) {
      root.style.setProperty("--color-background", config.cor_fundo)
    }

    if (config.cor_texto) {
      root.style.setProperty("--color-text", config.cor_texto)
    }

    if (config.cor_sidebar) {
      root.style.setProperty("--color-sidebar", config.cor_sidebar)
    }

    if (config.cor_header) {
      root.style.setProperty("--color-header", config.cor_header)
    }

    if (config.fonte_primaria) {
      root.style.setProperty("--font-primary", config.fonte_primaria)
    }

    if (config.fonte_secundaria) {
      root.style.setProperty("--font-secondary", config.fonte_secundaria)
    }

    if (config.favicon_url) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (favicon) {
        favicon.href = config.favicon_url
      } else {
        const newFavicon = document.createElement("link")
        newFavicon.rel = "icon"
        newFavicon.href = config.favicon_url
        document.head.appendChild(newFavicon)
      }
    }

    console.log("[v0] Tema aplicado:", {
      cor_primaria: config.cor_primaria,
      cor_secundaria: config.cor_secundaria,
      cor_fundo: config.cor_fundo,
      cor_sidebar: config.cor_sidebar,
      cor_header: config.cor_header,
    })
  }, [config])

  return null
}
