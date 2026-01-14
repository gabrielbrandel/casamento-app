"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Gift } from "@/data/gifts"
import { findGuest } from "@/data/guests"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GiftIcon, CreditCard, Check, Copy, AlertCircle, ChevronDown } from "lucide-react"
import { useAuthStore } from "@/hooks/use-auth-store"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useToast } from "@/hooks/use-toast"
import { startPollingTransaction } from "@/lib/transaction-poller"
import { ConfettiEffect } from "@/components/confetti"

interface GiftModalProps {
  gift: Gift | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    nome: string
    familia: string
    telefone: string
    mensagem?: string
    tipoPagamento: "fisico" | "pix" | "cartao"
  }) => void
}

const PIX_KEY = "thais@carvalho.co"

export function GiftModal({ gift, isOpen, onClose, onConfirm }: GiftModalProps) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [email, setEmail] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [tipoPagamento, setTipoPagamento] = useState<"fisico" | "pix" | "cartao">("fisico")
  const [contribuirDinheiro, setContribuirDinheiro] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">("pix")
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<{ nome?: string; cpf?: string; email?: string }>({})
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [imageUrlInput, setImageUrlInput] = useState("")

  // Carregar dados salvos do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedData = localStorage.getItem('giftFormData')
    if (savedData) {
      try {
        const { nome: savedNome, cpf: savedCpf, email: savedEmail } = JSON.parse(savedData)
        if (savedNome) setNome(savedNome)
        if (savedCpf) setCpf(savedCpf)
        if (savedEmail) setEmail(savedEmail)
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error)
      }
    }
  }, [])

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (nome || cpf || email) {
      localStorage.setItem('giftFormData', JSON.stringify({ nome, cpf, email }))
    }
  }, [nome, cpf, email])
  const [priceInput, setPriceInput] = useState("")
  const [openImageEditor, setOpenImageEditor] = useState(false)
  const [openPriceEditor, setOpenPriceEditor] = useState(false)

  const { isAdminLoggedIn } = useAuthStore()
  const { updateGiftImage: updateAdminGiftImage, updateGiftPrice: updateAdminGiftPrice } = useAdminStore()
  const { updateGiftImage: updatePublicGiftImage, updateGiftPrice: updatePublicGiftPrice, setGiftPaymentProcessing } = useGiftsStore()
  const { toast } = useToast()

  useEffect(() => {
    setImageUrlInput(gift?.imageUrl || "")
    setPriceInput(gift?.precoEstimado || "")
    setOpenImageEditor(false)
    setOpenPriceEditor(false)
  }, [gift])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) return numbers
    return numbers.slice(0, 11)
  }

  const handleSubmit = async () => {
    const newErrors: { nome?: string; cpf?: string; email?: string } = {}
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (!cpf.trim()) newErrors.cpf = "CPF é obrigatório"
    if (!email.trim()) newErrors.email = "Email é obrigatório"
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const finalTipoPagamento = contribuirDinheiro ? metodoPagamento : "fisico"
    
    // Se for pagamento online (Pix ou Cartão), redireciona para PagSeguro
    if (finalTipoPagamento === "pix" || finalTipoPagamento === "cartao") {
      setIsLoadingPayment(true)
      try {
        const priceText = gift?.precoEstimado || "R$ 0,00"
        const amount = parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", "."))
        const cleanCpf = cpf.replace(/\D/g, "")

        const response = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            giftId: gift?.id,
            giftName: gift?.nome,
            amount,
            buyerName: nome,
            buyerEmail: email,
            buyerCpf: cleanCpf,
            paymentMethod: finalTipoPagamento,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setIsLoadingPayment(false)
          toast({
            variant: "destructive",
            title: "Erro ao criar pagamento",
            description: data.error || "Tente novamente mais tarde",
          })
          return
        }

        // Abre checkout do PagSeguro em nova aba
        if (data.checkoutUrl) {
          // Marca o presente como processando pagamento
          setGiftPaymentProcessing(gift.id)
          
          // Inicia polling para monitorar status da transação
          if (data.transactionCode) {
            startPollingTransaction(data.transactionCode)
          }
          
          // Abre o checkout em nova aba
          const pagBankWindow = window.open(data.checkoutUrl, '_blank')
          
          // Salvar informações para redirecionar após fechar a aba
          localStorage.setItem('pendingPayment', JSON.stringify({
            giftId: gift.id,
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
          }, 500) // Verifica a cada 500ms
          
          // Limpar o intervalo após 30 minutos (timeout de segurança)
          setTimeout(() => {
            clearInterval(checkWindowClosed)
          }, 30 * 60 * 1000)
          
          // Aguarda 2 segundos antes de fechar o loading
          setTimeout(() => {
            setIsLoadingPayment(false)
          }, 2000)
          return
        }
      } catch (error) {
        setIsLoadingPayment(false)
        toast({
          variant: "destructive",
          title: "Erro ao processar pagamento",
          description: "Não foi possível conectar ao gateway de pagamento",
        })
        return
      }
    }

    // Fluxo normal apenas para presente físico
    onConfirm({
      nome: nome,
      familia: "",
      telefone: cpf.replace(/\D/g, ""),
      mensagem: mensagem.trim() || undefined,
      tipoPagamento: finalTipoPagamento,
    })

    setShowSuccess(true)
    setShowConfetti(true)
    setTimeout(() => {
      setShowSuccess(false)
      setShowConfetti(false)
      setNome("")
      setCpf("")
      setEmail("")
      setMensagem("")
      setTipoPagamento("fisico")
      setContribuirDinheiro(false)
      setMetodoPagamento("pix")
      setErrors({})
      onClose()
    }, 3000)
  }

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const handleClose = () => {
    if (!showSuccess) {
      setNome("")
      setCpf("")
      setEmail("")
      setMensagem("")
      setTipoPagamento("fisico")
      setErrors({})
      onClose()
    }
  }

  if (!gift) return null

  return (
    <>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}>
          {showSuccess ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Presente Confirmado!</h3>
              <p className="text-muted-foreground">Obrigado por presentear os noivos!</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">Presentear os Noivos</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg mb-6">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={gift.imageUrl || "/placeholder.svg"} alt={gift.nome} fill className="object-cover" />
              </div>
              <div>
                <h4 className="font-medium">{gift.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  {isAdminLoggedIn ? priceInput || gift.precoEstimado : gift.precoEstimado}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {isAdminLoggedIn && (
                <div className="space-y-6">
                  <div className="p-4 border rounded-md bg-secondary">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenImageEditor((v) => !v)
                        setOpenPriceEditor(false)
                      }}
                      className="w-full flex items-center justify-between font-medium"
                    >
                      <span>Editar imagem (Admin)</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openImageEditor ? "rotate-180" : ""}`} />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${openImageEditor ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden space-y-3">
                        <Input
                          id="admin-image"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Cole o endereço da imagem (https://...)"
                        />

                        {imageUrlInput && (
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-20 relative rounded overflow-hidden">
                              <Image src={imageUrlInput} alt="preview" fill className="object-contain" unoptimized />
                            </div>
                            <div className="flex gap-2 ml-auto">
                              <Button variant="outline" onClick={() => setImageUrlInput(gift.imageUrl || "")}>
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => {
                                  const url = imageUrlInput.trim()
                                  if (!url) return
                                  if (!/^https?:\/\//.test(url)) {
                                    alert("Insira um endereço válido começando com http:// ou https://")
                                    return
                                  }
                                  updateAdminGiftImage(gift.id, url)
                                  updatePublicGiftImage(gift.id, url)
                                  toast({ title: "Imagem atualizada", description: "A imagem foi alterada com sucesso." })
                                }}
                              >
                                Aplicar imagem
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md bg-secondary">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPriceEditor((v) => !v)
                        setOpenImageEditor(false)
                      }}
                      className="w-full flex items-center justify-between font-medium"
                    >
                      <span>Editar preço (Admin)</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openPriceEditor ? "rotate-180" : ""}`} />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${openPriceEditor ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden space-y-3">
                        <Input
                          id="admin-price"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          placeholder="Ex: R$ 199,99"
                        />

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setPriceInput(gift.precoEstimado || "")}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => {
                              const newPrice = priceInput.trim()
                              if (!newPrice) {
                                alert("Insira um preço válido")
                                return
                              }
                              const parsePrice = (p: string) =>
                                parseFloat(p.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(/,/g, ".")) || 0
                              const priceNum = parsePrice(newPrice)
                              const faixa: "baixo" | "medio" | "alto" =
                                priceNum <= 100 ? "baixo" : priceNum <= 1000 ? "medio" : "alto"

                              updateAdminGiftPrice(gift.id, newPrice, faixa)
                              updatePublicGiftPrice(gift.id, newPrice, faixa)
                              toast({ title: "Preço atualizado", description: "O preço foi atualizado com sucesso." })
                            }}
                          >
                            Aplicar preço
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="nome">Seu Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      if (errors.nome)
                        setErrors({ ...errors, nome: undefined })
                    }}
                    className={errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => {
                      setCpf(formatPhone(e.target.value))
                      if (errors.cpf)
                        setErrors({ ...errors, cpf: undefined })
                    }}
                    placeholder="Digite seus 11 dígitos"
                    className={errors.cpf ? "border-destructive focus-visible:ring-destructive" : ""}
                  />

              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email)
                        setErrors({ ...errors, email: undefined })
                    }}
                    placeholder="seu@email.com"
                    className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  />

              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem para os Noivos</Label>
                <Textarea id="mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} />
              </div>

              <div className="space-y-4">
                <Label className="text-base">Como deseja presentear?</Label>
                
                {/* Opção: Presente Físico */}
                <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    id="fisico"
                    checked={!contribuirDinheiro}
                    onChange={(e) => {
                      setContribuirDinheiro(!e.target.checked)
                    }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 cursor-pointer"
                  />
                  <Label htmlFor="fisico" className="flex items-start gap-3 flex-1 cursor-pointer">
                    <GiftIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-base">Vou comprar o presente físico e entregar aos noivos.</span>
                  </Label>
                </div>

                {/* Opção: Contribuir com PagSeguro */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-primary/50 transition-colors">
                    <input
                      type="checkbox"
                      id="dinheiro"
                      checked={contribuirDinheiro}
                      onChange={(e) => setContribuirDinheiro(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 cursor-pointer"
                    />
                    <Label htmlFor="dinheiro" className="flex items-start gap-3 flex-1 cursor-pointer">
                      <CreditCard className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-base block">Pagar com PagSeguro</span>
                        <span className="text-sm text-muted-foreground">Pix, Cartão e Parcelamento</span>
                      </div>
                    </Label>
                  </div>

                  {/* Mensagem quando PagSeguro selecionado */}
                  {contribuirDinheiro && (
                    <div className="ml-8 space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-4 p-4 border-2 border-primary bg-primary/5 rounded-lg">
                        {/* Ícone Pix via base64 */}
                        <div className="flex-shrink-0">
                          <img
                              src="https://media.licdn.com/dms/image/v2/C4D0BAQGFyxSovkESiA/company-logo_200_200/company-logo_200_200/0/1630534278219/pagseguro_pagbank_logo?e=2147483647&v=beta&t=tFTTBv04rSjaXA7PqKcDOyT364FoRYlwybp7ZovA9s0"
                            alt="Pix"
                            className="w-10 h-10 object-contain"
                          />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium">Pagar com PagSeguro</p>
                          <p className="text-sm text-muted-foreground">Pix, Cartão e Parcelamento disponível</p>
                        </div>

                        <Check className="w-5 h-5 text-primary" />
                      </div>

                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2">
                        <p className="text-sm text-green-900 font-medium">✅ Você será redirecionado ao checkout seguro do PagSeguro</p>
                        <p className="text-xs text-green-700 mt-1">Escolha entre Pix (instantâneo) ou Cartão de Crédito com parcelamento</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isLoadingPayment}>
                {isLoadingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Abrindo checkout...
                  </div>
                ) : (
                  contribuirDinheiro ? "Ir para Pagamento" : "Confirmar Presente"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
