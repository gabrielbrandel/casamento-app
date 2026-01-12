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

  const [imageUrlInput, setImageUrlInput] = useState("")
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
          
          window.open(data.checkoutUrl, '_blank')
          return
        }
      } catch (error) {
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
    setTimeout(() => {
      setShowSuccess(false)
      setNome("")
      setCpf("")
      setEmail("")
      setMensagem("")
      setTipoPagamento("fisico")
      setContribuirDinheiro(false)
      setMetodoPagamento("pix")
      setErrors({})
      onClose()
    }, 1600)
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}>
        {showSuccess ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
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

                {/* Opção: Contribuir em Dinheiro */}
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
                      <span className="text-base">Vou contribuir em dinheiro</span>
                    </Label>
                  </div>

                  {/* Sub-opções quando contribuir em dinheiro */}
                  {contribuirDinheiro && (
                    <div className="ml-8 space-y-3 animate-in slide-in-from-top-2">
                      <div
                        onClick={() => setMetodoPagamento("cartao")}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          metodoPagamento === "cartao" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 10L22 10" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Pagar com Cartão de Crédito</p>
                          <p className="text-sm text-muted-foreground">Parcelamento disponível</p>
                        </div>
                        {metodoPagamento === "cartao" && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>

                        <div
                          onClick={() => setMetodoPagamento("pix")}
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${metodoPagamento === "pix"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/30"
                            }`}
                        >
                          {/* Ícone Pix via base64 */}
                          <div className="flex-shrink-0">
                            <img
                              src="data:image/png;base64,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"
                              alt="Pix"
                              className="w-8 h-8 object-contain"
                            />
                          </div>

                          {/* Texto */}
                          <div className="flex-1">
                            <p className="font-medium">Pagar com Pix</p>
                            <p className="text-sm text-muted-foreground">
                              Transferência instantânea
                            </p>
                          </div>

                          {/* Check */}
                          {metodoPagamento === "pix" && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>


                      {/* Mensagem de redirecionamento */}
                      {metodoPagamento === "pix" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2">
                          <p className="text-sm text-green-900 font-medium">✅ Você será redirecionado ao checkout seguro do PagSeguro</p>
                          <p className="text-xs text-green-700 mt-1">Gere o QR Code Pix na tela de pagamento</p>
                        </div>
                      )}

                      {/* Mensagem de redirecionamento para cartão */}
                      {metodoPagamento === "cartao" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2">
                          <p className="text-sm text-green-900 font-medium">✅ Você será redirecionado ao checkout seguro do PagSeguro</p>
                          <p className="text-xs text-green-700 mt-1">Aceita todas as bandeiras de cartão com parcelamento</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" size="lg">
                {contribuirDinheiro ? "Ir para Pagamento" : "Confirmar Presente"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
