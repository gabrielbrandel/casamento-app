"use client"

import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle } from "lucide-react"

export function MessagesSection() {
  const { getMessages } = useGiftsStore()
  const messages = getMessages()
  const { isAdminLoggedIn } = useAuthStore()

  if (messages.length === 0) {
    return (
      <section id="mensagens" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">
              Mensagens para os Noivos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">As mensagens dos convidados aparecerão aqui.</p>
          </div>

          <div className="max-w-md mx-auto text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ainda não há mensagens. Seja o primeiro a deixar um recado!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="mensagens" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">Mensagens para os Noivos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Recados carinhosos dos nossos queridos convidados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {messages.map((message, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-foreground/60" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{message.nome}</h4>
                    <p className="text-sm text-muted-foreground">{message.familia}</p>
                  </div>
                </div>
                <p className="text-foreground/80 italic">&ldquo;{message.mensagem}&rdquo;</p>
                {isAdminLoggedIn && (
                  <p className="text-xs text-muted-foreground mt-3">Presente: {message.presente}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
