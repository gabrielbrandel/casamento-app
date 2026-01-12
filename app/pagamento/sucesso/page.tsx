"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const giftId = searchParams.get('gift')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
      <div className="max-w-md w-full bg-background rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Pagamento Concluído!</h1>
        <p className="text-muted-foreground mb-6">
          Seu pagamento foi processado com sucesso. Obrigado por presentear os noivos!
        </p>

        {giftId && (
          <p className="text-sm text-muted-foreground mb-6">
            Presente ID: <code className="bg-secondary px-2 py-1 rounded">{giftId}</code>
          </p>
        )}

        <div className="bg-secondary rounded-lg p-4 mb-6">
          <p className="text-sm">
            Você receberá um email de confirmação em breve.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Redirecionando em {countdown} segundos...
          </p>
        </div>

        <Button onClick={() => router.push('/')} className="w-full" size="lg">
          Voltar para Lista de Presentes
        </Button>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
