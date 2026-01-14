"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function PaymentReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const giftId = searchParams.get('gift')

  useEffect(() => {
    // Buscar o código da transação mais recente para este presente
    const fetchTransactionCode = async () => {
      if (!giftId) {
        console.error('Gift ID não encontrado na URL')
        router.push('/')
        return
      }

      try {
        // Buscar a transação mais recente deste presente
        const response = await fetch(`/api/transaction/latest?giftId=${giftId}`)
        const data = await response.json()

        if (data.success && data.transactionCode) {
          // Redirecionar para página de sucesso com o código
          router.push(`/pagamento/sucesso?gift=${giftId}&code=${data.transactionCode}`)
        } else {
          console.error('Código de transação não encontrado')
          // Mesmo sem código, redireciona para a página de sucesso
          router.push(`/pagamento/sucesso?gift=${giftId}`)
        }
      } catch (error) {
        console.error('Erro ao buscar código da transação:', error)
        router.push(`/pagamento/sucesso?gift=${giftId}`)
      }
    }

    fetchTransactionCode()
  }, [giftId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Processando seu pagamento...</p>
      </div>
    </div>
  )
}
