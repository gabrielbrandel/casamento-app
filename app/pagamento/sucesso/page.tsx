"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Clock, Package, CreditCard, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentStatus {
  status: 'processing' | 'completed' | 'failed'
  transactionCode?: string
  giftName?: string
  amount?: number
  paid?: boolean
  checkoutStatus?: string
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const giftId = searchParams.get('gift')
  const transactionCode = searchParams.get('code')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'processing' })
  const [isChecking, setIsChecking] = useState(true)
  const [checkCount, setCheckCount] = useState(0)
  const maxChecks = 10 // Máximo de 10 tentativas (30 segundos)

  // Buscar informações do presente
  useEffect(() => {
    if (giftId) {
      fetch(`/api/gifts`)
        .then(res => res.json())
        .then(data => {
          const gift = data.gifts?.find((g: any) => g.id === giftId)
          if (gift) {
            setPaymentStatus(prev => ({
              ...prev,
              giftName: gift.name,
              amount: gift.price,
            }))
          }
        })
        .catch(err => console.error('Erro ao buscar presente:', err))
    }
  }, [giftId])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!transactionCode || checkCount >= maxChecks) {
      setIsChecking(false)
      return
    }

    const checkPayment = async () => {
      try {
        const response = await fetch('/api/transaction/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionCode }),
        })

        const data = await response.json()
        
        if (data.paid) {
          setPaymentStatus({
            status: 'completed',
            transactionCode,
            giftName: paymentStatus.giftName,
            amount: paymentStatus.amount,
            paid: true,
            checkoutStatus: data.checkoutStatus,
          })
          setIsChecking(false)
        } else if (checkCount >= maxChecks - 1) {
          // Última tentativa, mostrar como processando
          setPaymentStatus(prev => ({
            ...prev,
            status: 'processing',
            transactionCode,
          }))
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
      }
    }

    // Verificar imediatamente e depois a cada 3 segundos
    checkPayment()
    const interval = setInterval(() => {
      setCheckCount(prev => prev + 1)
      checkPayment()
    }, 3000)

    return () => clearInterval(interval)
  }, [transactionCode, checkCount, maxChecks, paymentStatus.giftName, paymentStatus.amount])

  const handleCheckAgain = () => {
    setCheckCount(0)
    setIsChecking(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header com status */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              {paymentStatus.status === 'completed' ? (
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              ) : (
                <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
              )}
            </div>
            
            <CardTitle className="text-3xl mb-2">
              {paymentStatus.status === 'completed' 
                ? 'Pagamento Confirmado!' 
                : 'Processando Pagamento...'}
            </CardTitle>
            
            <p className="text-muted-foreground">
              {paymentStatus.status === 'completed' 
                ? 'Sua contribuição foi recebida com sucesso!' 
                : 'Aguarde enquanto confirmamos seu pagamento'}
            </p>

            {isChecking && (
              <div className="mt-4">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verificando pagamento... ({checkCount + 1}/{maxChecks})
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Informações do Presente */}
            {paymentStatus.giftName && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Presente</p>
                    <p className="font-medium truncate">{paymentStatus.giftName}</p>
                  </div>
                </div>

                {paymentStatus.amount && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">R$ {paymentStatus.amount.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {transactionCode && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Código da Transação</p>
                    <code className="text-xs bg-background px-2 py-1 rounded border border-border block overflow-x-auto">
                      {transactionCode}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Status do Pagamento */}
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={paymentStatus.status === 'completed' ? 'default' : 'secondary'}>
                  {paymentStatus.status === 'completed' ? 'Confirmado' : 'Processando'}
                </Badge>
              </div>
              
              {paymentStatus.status === 'completed' ? (
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    ✓ Pagamento confirmado pelo PagBank
                  </p>
                  <p className="text-muted-foreground">
                    Você receberá um email de confirmação em breve
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">
                    Seu pagamento está sendo processado...
                  </p>
                  <p className="text-muted-foreground">
                    {isChecking 
                      ? 'Verificando status com o PagBank' 
                      : 'A confirmação pode levar alguns minutos'}
                  </p>
                  {!isChecking && checkCount >= maxChecks && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCheckAgain}
                      className="mt-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar Novamente
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Informação sobre PIX */}
            {!isChecking && paymentStatus.status === 'processing' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Pagou com PIX?</strong> A confirmação geralmente é instantânea, 
                  mas pode levar até alguns minutos em casos raros.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/')} 
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar para Lista de Presentes
          </Button>
          
          {transactionCode && (
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(transactionCode)
                alert('Código copiado!')
              }}
              variant="outline"
              size="lg"
            >
              Copiar Código
            </Button>
          )}
        </div>

        {/* Nota */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Guarde o código da transação para consultas futuras
        </p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="space-y-4 text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
