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
import { GiftIcon, CreditCard, Check, Copy, AlertCircle } from "lucide-react"
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
    tipoPagamento: "fisico" | "pix"
  }) => void
}

const PIX_KEY = "thais@carvalho.co"

export function GiftModal({ gift, isOpen, onClose, onConfirm }: GiftModalProps) {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [tipoPagamento, setTipoPagamento] = useState<"fisico" | "pix">("fisico")
  const [showSuccess, setShowSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<{ nome?: string; telefone?: string; guestNotFound?: boolean }>({})

  const [imageUrlInput, setImageUrlInput] = useState("")
  const [priceInput, setPriceInput] = useState("")

  const { isAdminLoggedIn } = useAuthStore()
  const { updateGiftImage: updateAdminGiftImage, updateGiftPrice: updateAdminGiftPrice } = useAdminStore()
  const { updateGiftImage: updatePublicGiftImage, updateGiftPrice: updatePublicGiftPrice } = useGiftsStore()
  const { toast } = useToast()

  useEffect(() => {
    setImageUrlInput(gift?.imageUrl || "")
    setPriceInput(gift?.precoEstimado || "")
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

    const guest = findGuest(nome, telefone)
    if (!guest) {
      setErrors({ guestNotFound: true })
      return
    }

    onConfirm({
      nome: guest.nome,
      familia: guest.familia,
      telefone: telefone.replace(/\D/g, ""),
      mensagem: mensagem.trim() || undefined,
      tipoPagamento,
    })

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setNome("")
      setTelefone("")
      setMensagem("")
      setTipoPagamento("fisico")
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-muted-foreground">{isAdminLoggedIn ? priceInput || gift.precoEstimado : gift.precoEstimado}</p>
              </div>
            </div>

            {errors.guestNotFound && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Nome ou telefone não encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">Seus dados não foram localizados na lista de convidados. Por favor, entre em contato com os noivos para verificar sua inscrição.</p>
                </div>
              </div>
            )}

              <div className="space-y-6">
                {isAdminLoggedIn && (
                  <div className="space-y-6">
                    <div className="p-4 border rounded-md bg-secondary space-y-3">
                      <Label htmlFor="admin-image">Editar imagem (Admin)</Label>
                      <Input
                        id="admin-image"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Cole o endereço da imagem (https://...)"
                      />

                      {imageUrlInput ? (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 relative rounded overflow-hidden">
                            <Image
                              src={imageUrlInput}
                              alt="preview"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setImageUrlInput(gift.imageUrl || "")
                                onClose()
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => {
                                const url = imageUrlInput.trim()
                                if (!url) return
                                if (!/^https?:\/\//.test(url)) {
                                  alert(
                                    "Insira um endereço válido começando com http:// ou https://"
                                  )
                                  return
                                }
                                try {
                                  updateAdminGiftImage(gift.id, url)
                                  updatePublicGiftImage(gift.id, url)
                                  toast({
                                    title: "Imagem atualizada",
                                    description: "A imagem foi alterada com sucesso.",
                                  })
                                } finally {
                                  setImageUrlInput(url)
                                  onClose()
                                }
                              }}
                            >
                              Aplicar imagem
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4 border rounded-md bg-secondary space-y-3">
                      <Label htmlFor="admin-price">Editar preço (Admin)</Label>
                      <Input
                        id="admin-price"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        placeholder="Ex: R$ 199,99"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setPriceInput(gift.precoEstimado || "")}
                        >
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
                              parseFloat(
                                p
                                  .replace(/[^\d,\.]/g, "")
                                  .replace(/\./g, "")
                                  .replace(/,/g, ".")
                              ) || 0
                            const priceNum = parsePrice(newPrice)
                            const faixa: "baixo" | "medio" | "alto" =
                              priceNum <= 100
                                ? "baixo"
                                : priceNum <= 1000
                                  ? "medio"
                                  : "alto"
                            try {
                              updateAdminGiftPrice(gift.id, newPrice, faixa)
                              updatePublicGiftPrice(gift.id, newPrice, faixa)
                              toast({
                                title: "Preço atualizado",
                                description: "O preço foi atualizado com sucesso.",
                              })
                            } finally {
                              setPriceInput(newPrice)
                            }
                          }}
                        >
                          Aplicar preço
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              <div>
                <Label htmlFor="nome">Seu Nome Completo *</Label>
                <Input id="nome" value={nome} onChange={(e) => { setNome(e.target.value); if (errors.nome || errors.guestNotFound) setErrors({ ...errors, nome: undefined, guestNotFound: false }) }} placeholder="Digite seu nome completo" className={errors.nome ? "border-destructive" : ""} />
                {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Número de Telefone *</Label>
                <Input id="telefone" type="tel" value={telefone} onChange={(e) => { setTelefone(formatPhone(e.target.value)); if (errors.telefone || errors.guestNotFound) setErrors({ ...errors, telefone: undefined, guestNotFound: false }) }} placeholder="(11) 99999-9999" className={errors.telefone ? "border-destructive" : ""} />
                {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem para os Noivos</Label>
                <Textarea id="mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Deixe uma mensagem carinhosa..." rows={3} />
              </div>

              <div>
                <Label>Como deseja presentear?</Label>
                <RadioGroup value={tipoPagamento} onValueChange={(v) => setTipoPagamento(v as "fisico" | "pix")} className="mt-2">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="fisico" id="fisico" />
                    <Label htmlFor="fisico" className="flex items-center gap-2 cursor-pointer flex-1"><GiftIcon className="w-4 h-4" />Vou dar o presente físico</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1"><CreditCard className="w-4 h-4" />Vou contribuir via Pix</Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoPagamento === "pix" && (
                <div className="p-4 bg-secondary rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">Faça o Pix para a chave abaixo:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm break-all">{PIX_KEY}</code>
                    <Button variant="outline" size="icon" onClick={copyPixKey} className="flex-shrink-0 bg-transparent">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Após realizar o Pix, confirme abaixo para registrar seu presente.</p>
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full" size="lg">Confirmar Presente</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
