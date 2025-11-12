"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Wifi, Facebook } from "lucide-react"

export default function PortalPage() {
  const [loginMethod, setLoginMethod] = useState<"social" | "email">("social")
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Wifi className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Wi-Fi Gratuito</CardTitle>
          <p className="text-gray-600">Conecte-se e aproveite nossa internet</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Método de Login */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={loginMethod === "social" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setLoginMethod("social")}
              >
                Redes Sociais
              </Button>
              <Button
                variant={loginMethod === "email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setLoginMethod("email")}
              >
                Email/Telefone
              </Button>
            </div>

            {loginMethod === "social" ? (
              <div className="space-y-3">
                <Button variant="outline" className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  <Facebook className="h-4 w-4 mr-2" />
                  Continuar com Facebook
                </Button>
                <Button variant="outline" className="w-full bg-red-600 text-white hover:bg-red-700">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar com Google
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
              </div>
            )}
          </div>

          {/* Termos e Condições */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                Aceito os{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  termos de uso
                </a>{" "}
                e autorizo o uso dos meus dados para marketing conforme a{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  política de privacidade
                </a>
                .
              </Label>
            </div>
          </div>

          {/* Botão de Conexão */}
          <Button className="w-full" disabled={!acceptedTerms} size="lg">
            <Wifi className="h-4 w-4 mr-2" />
            Conectar ao Wi-Fi
          </Button>

          {/* Informações Adicionais */}
          <div className="text-center text-sm text-gray-500">
            <p>Velocidade: 100 Mbps</p>
            <p>Tempo ilimitado</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
