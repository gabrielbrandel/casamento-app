"use client"

import { useState } from "react"
import { Heart, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function FreeDonationCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [cpf, setCpf] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const cents = numbers.padStart(3, "0")
    const reais = cents.slice(0, -2)
    const centavos = cents.slice(-2)
    return `R$ ${parseInt(reais).toLocaleString("pt-BR")},${centavos}`
  }

  const handleAmountChange = (value: string) => {
    setAmount(formatCurrency(value))
  }

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim() || !cpf.trim() || !amount) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
      })
      return
    }

    const numericAmount = parseFloat(amount.replace(/[^\d,]/g, "").replace(",", "."))
    if (numericAmount < 5) {
      toast({
        variant: "destructive",
        title: "Valor mínimo",
        description: "O valor mínimo para doação é R$ 5,00",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: "doacao-livre",
          giftName: `Contribuição Livre - ${amount}`,
          amount: numericAmount,
          buyerName: nome,
          buyerEmail: email,
          buyerCpf: cpf.replace(/\D/g, ""),
          paymentMethod: "pix",
        }),
      })

      const data = await response.json()

      if (response.ok && data.checkoutUrl) {
        // Abre o checkout em nova aba
        const pagBankWindow = window.open(data.checkoutUrl, "_blank")
        
        // Salvar informações para redirecionar após fechar a aba
        localStorage.setItem('pendingPayment', JSON.stringify({
          giftId: data.orderId || 'donation',
          transactionCode: data.transactionCode,
          timestamp: Date.now(),
        }))
        
        // Detectar quando a aba do PagBank é fechada
        const checkWindowClosed = setInterval(() => {
          if (pagBankWindow && pagBankWindow.closed) {
            clearInterval(checkWindowClosed)
            
            // Redirecionar para página de sucesso após 1 segundo
            setTimeout(() => {
              const payment = localStorage.getItem('pendingPayment')
              if (payment) {
                const { giftId, transactionCode } = JSON.parse(payment)
                localStorage.removeItem('pendingPayment')
                window.location.href = `/pagamento/sucesso?gift=${giftId}&code=${transactionCode}`
              }
            }, 1000)
          }
        }, 500)
        
        // Limpar o intervalo após 30 minutos
        setTimeout(() => clearInterval(checkWindowClosed), 30 * 60 * 1000)
        
        toast({
          title: "Redirecionando...",
          description: "Você será redirecionado para o pagamento",
        })
        setIsOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: data.error || "Não foi possível processar a doação",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao conectar com o servidor",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="group relative overflow-hidden rounded-lg border-2 border-dashed border-primary/30 hover:border-primary transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 p-6 flex flex-col items-center justify-center min-h-[320px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-8 h-8 text-primary fill-current" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Contribua com o Valor que Desejar</h3>
            <p className="text-sm text-muted-foreground">
              Escolha o valor que cabe no seu bolso e ajude os noivos
            </p>
          </div>

          <Button variant="default" size="lg" className="mt-4">
            <DollarSign className="w-4 h-4 mr-2" />
            Fazer Doação
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-current" />
              Contribuição Livre
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Valor da Contribuição *</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="R$ 0,00"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground mt-1">Valor mínimo: R$ 5,00</p>
            </div>

            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                maxLength={11}
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </div>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Ir para Pagamento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
