"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function PaymentReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const giftId = searchParams.get('gift')
  const transactionCode = searchParams.get('code')

  useEffect(() => {
    // Se já tem o código da transação (vindo do PagBank), redireciona direto
    if (transactionCode) {
      // Buscar o gift_id pelo código da transação
      fetch(`/api/transaction/by-code?code=${transactionCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.giftId) {
            router.push(`/pagamento/sucesso?gift=${data.giftId}&code=${transactionCode}`)
          } else {
            // Se não encontrar o gift, redireciona só com o código
            router.push(`/pagamento/sucesso?code=${transactionCode}`)
          }
        })
        .catch(() => {
          router.push(`/pagamento/sucesso?code=${transactionCode}`)
        })
      return
    }

    // Se tem gift_id mas não tem código, busca o código mais recente
    if (giftId && !transactionCode) {
      fetch(`/api/transaction/latest?giftId=${giftId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.transactionCode) {
            router.push(`/pagamento/sucesso?gift=${giftId}&code=${data.transactionCode}`)
          } else {
            router.push(`/pagamento/sucesso?gift=${giftId}`)
          }
        })
        .catch(() => {
          router.push(`/pagamento/sucesso?gift=${giftId}`)
        })
      return
    }

    // Se não tem nada, volta para home
    console.error('Nenhum parâmetro encontrado')
    router.push('/')
  }, [giftId, transactionCode, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Processando seu pagamento...</p>
      </div>
    </div>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  )
}
