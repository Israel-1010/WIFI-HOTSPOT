import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Mail } from "lucide-react"

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Conta criada com sucesso!</CardTitle>
              <CardDescription>Verifique seu email para confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Próximos passos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Verifique sua caixa de entrada</li>
                    <li>Clique no link de confirmação no email</li>
                    <li>Faça login com suas credenciais</li>
                  </ol>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Não recebeu o email?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Verifique sua pasta de spam</li>
                  <li>Aguarde alguns minutos</li>
                  <li>Certifique-se de que o email está correto</li>
                </ul>
              </div>

              <Link href="/auth/login" className="block">
                <Button className="w-full bg-transparent" variant="outline">
                  Ir para Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
