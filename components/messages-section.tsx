"use client"

import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, MessageCircle, Gift } from "lucide-react"
import { useMemo } from "react"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-rose-500",
    "bg-pink-500",
    "bg-fuchsia-500",
    "bg-purple-500",
    "bg-violet-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-green-500",
    "bg-lime-500",
    "bg-amber-500",
    "bg-orange-500",
    "bg-red-500",
  ]
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function MessagesSection() {
  const { getMessages } = useGiftsStore()
  const messages = useMemo(() => getMessages(), [getMessages])
  const { isAdminLoggedIn } = useAuthStore()

  if (messages.length === 0) {
    return (
      <section id="mensagens" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">
              Mensagens para os Noivos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">As mensagens dos convidados aparecerão aqui.</p>
          </div>

          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-lg">Ainda não há mensagens. Seja o primeiro a deixar um recado!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="mensagens" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">Mensagens para os Noivos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Recados carinhosos dos nossos queridos convidados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {messages.map((message, index) => {
            const initials = getInitials(message.nome)
            const avatarColor = getColorFromName(message.nome)

            return (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm shadow-md`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{message.nome}</h4>
                      <p className="text-sm text-muted-foreground truncate">{message.familia}</p>
                    </div>
                  </div>

                  <div className="relative pl-1 border-l-2 border-primary/20 mb-4">
                    <p className="text-foreground/90 leading-relaxed pl-3 italic">
                      &ldquo;{message.mensagem}&rdquo;
                    </p>
                  </div>

                  {isAdminLoggedIn && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <Gift className="w-3 h-3" />
                      <span className="truncate">{message.presente}</span>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 opacity-10">
                    <Heart className="w-8 h-8 fill-current text-primary" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
