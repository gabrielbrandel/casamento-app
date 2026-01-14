"use client"

import { useState } from "react"
import { Heart, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function FreeDonationCard() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const pixKey = "gabrielbrandel@gmail.com"

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    
    toast({
      title: "✅ Chave PIX copiada!",
      description: "Cole no seu app de pagamento",
    })
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
            <Copy className="w-4 h-4 mr-2" />
            Ver Chave PIX
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-current" />
              Chave PIX para Doação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <Label className="text-sm font-medium">Chave PIX</Label>
              <div className="flex items-center gap-2 bg-background rounded-md p-3 border">
                <code className="flex-1 text-sm font-mono break-all">{pixKey}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPixKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                📱 Copie a chave e faça a transferência no seu app de pagamento
              </p>
            </div>

            <Button 
              onClick={copyPixKey} 
              className="w-full" 
              size="lg"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Chave PIX
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
