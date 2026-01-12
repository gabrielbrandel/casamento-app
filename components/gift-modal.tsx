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
  const [telefone, setTelefone] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [tipoPagamento, setTipoPagamento] = useState<"fisico" | "pix" | "cartao">("fisico")
  const [contribuirDinheiro, setContribuirDinheiro] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">("pix")
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<{ nome?: string; telefone?: string; guestNotFound?: boolean }>({})

  const [imageUrlInput, setImageUrlInput] = useState("")
  const [priceInput, setPriceInput] = useState("")
  const [openImageEditor, setOpenImageEditor] = useState(false)
  const [openPriceEditor, setOpenPriceEditor] = useState(false)

  const { isAdminLoggedIn } = useAuthStore()
  const { updateGiftImage: updateAdminGiftImage, updateGiftPrice: updateAdminGiftPrice } = useAdminStore()
  const { updateGiftImage: updatePublicGiftImage, updateGiftPrice: updatePublicGiftPrice } = useGiftsStore()
  const { toast } = useToast()

  useEffect(() => {
    setImageUrlInput(gift?.imageUrl || "")
    setPriceInput(gift?.precoEstimado || "")
    setOpenImageEditor(false)
    setOpenPriceEditor(false)
  }, [gift])

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handleSubmit = () => {
    const newErrors: { nome?: string; telefone?: string; guestNotFound?: boolean } = {}
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (!telefone.trim()) newErrors.telefone = "Telefone é obrigatório"
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const guest = findGuest(nome)
    if (!guest) {
      setErrors({ guestNotFound: true })
      return
    }

    const finalTipoPagamento = contribuirDinheiro ? metodoPagamento : "fisico"
    
    onConfirm({
      nome: guest.nome,
      familia: guest.familia,
      telefone: telefone.replace(/\D/g, ""),
      mensagem: mensagem.trim() || undefined,
      tipoPagamento: finalTipoPagamento,
    })

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setNome("")
      setTelefone("")
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
      setTelefone("")
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

            {errors.guestNotFound && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Nome ou telefone não encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seus dados não foram localizados na lista de convidados, favor entrar em contato com os noivos.
                  </p>
                </div>
              </div>
            )}

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
                      if (errors.nome || errors.guestNotFound)
                        setErrors({ ...errors, nome: undefined, guestNotFound: false })
                    }}
                    className={errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
              </div>

              <div>
                <Label htmlFor="telefone">Número de Telefone *</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(formatPhone(e.target.value))
                      if (errors.telefone || errors.guestNotFound)
                        setErrors({ ...errors, telefone: undefined, guestNotFound: false })
                    }}
                    className={errors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}
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
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          metodoPagamento === "pix" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.007 1.5l4.29 4.29 2.79-2.79 1.42 1.42-2.79 2.79 4.29 4.29-1.42 1.42-4.29-4.29-2.79 2.79-1.42-1.42 2.79-2.79-4.29-4.29 1.42-1.42zm-6 6l2.79 2.79-4.29 4.29 1.42 1.42 4.29-4.29 2.79 2.79 1.42-1.42-2.79-2.79 4.29-4.29-1.42-1.42-4.29 4.29-2.79-2.79-1.42 1.42zm13.54 7.96l-4.29 4.29 2.79 2.79-1.42 1.42-2.79-2.79-4.29 4.29-1.42-1.42 4.29-4.29-2.79-2.79 1.42-1.42 2.79 2.79 4.29-4.29 1.42 1.42z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Pagar com Pix</p>
                          <p className="text-sm text-muted-foreground">Transferência instantânea</p>
                        </div>
                        {metodoPagamento === "pix" && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      {/* Mostra chave PIX */}
                      {metodoPagamento === "pix" && (
                        <div className="p-4 bg-secondary rounded-lg space-y-3 animate-in slide-in-from-top-2">
                          <p className="text-sm font-medium">Chave Pix:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-3 bg-background rounded text-sm break-all font-mono">{PIX_KEY}</code>
                            <Button variant="outline" size="icon" onClick={copyPixKey}>
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Placeholder para integração com cartão */}
                      {metodoPagamento === "cartao" && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2">
                          <p className="text-sm text-blue-900">🔄 Integração com gateway de pagamento em breve</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" size="lg">
                Confirmar Presente
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
