"use client"

import { useToast } from "@/hooks/use-toast"

export function useToastFeedback() {
  const { toast } = useToast()

  return {
    success: (message: string, description?: string) => {
      toast({
        title: "✓ Sucesso",
        description: message,
        variant: "default",
      })
    },
    error: (message: string, description?: string) => {
      toast({
        title: "✗ Erro",
        description: message,
        variant: "destructive",
      })
    },
    info: (message: string, description?: string) => {
      toast({
        title: "ℹ Informação",
        description: message,
      })
    },
    warning: (message: string, description?: string) => {
      toast({
        title: "⚠ Atenção",
        description: message,
      })
    },
  }
}
