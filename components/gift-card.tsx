"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import type { Gift } from "@/data/gifts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Check, X, EyeOff, Eye, Ban } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuthStore } from "@/hooks/use-auth-store"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useFavoritesStore } from "@/hooks/use-favorites-store"
import { useToast } from "@/hooks/use-toast"
import { LazyImage } from "@/components/lazy-image"

interface GiftCardProps {
  gift: Gift
  onClick: () => void
  onRemove?: () => void
}

export function GiftCard({ gift, onClick, onRemove }: GiftCardProps) {
  const isComprado = gift.status === "comprado"
  const { isAdminLoggedIn } = useAuthStore()
  const { setGiftVisibility: setAdminVisibility, setGiftObtained: setAdminObtained, setGiftHidePhysical } = useAdminStore()
  const { setGiftVisibility: setPublicVisibility, setGiftObtained: setPublicObtained } = useGiftsStore()
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  const { toast } = useToast()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<null | "toggleActive" | "toggleObtained">(null)
  
  const isFav = isFavorite(gift.id)
  const isPhysicalHidden = gift.ocultarFisico === true

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(gift.id)
    toast({
      title: isFav ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: isFav ? "" : "Veja seus favoritos no topo da página",
    })
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <Card
      onClick={isComprado && !isAdminLoggedIn ? undefined : onClick}
      className={`
        group cursor-pointer overflow-hidden transition-all
        hover:shadow-xl hover:-translate-y-1
        ${isComprado && !isAdminLoggedIn ? "opacity-70 cursor-not-allowed" : ""}
        ${gift.ativo === false ? "ring-1 ring-destructive/30" : ""}
      `}
    >
      <div className="relative h-44 bg-background overflow-hidden">
        <LazyImage
          src={gift.imageUrl || "/placeholder.svg"}
          alt={gift.nome}
          fill
          className={`object-contain p-1 transition-transform duration-300 ${isComprado ? "grayscale" : "group-hover:scale-105"
            }`}
        />

        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-secondary/80 to-transparent" />

        {/* Botão de Favorito */}
        {!isAdminLoggedIn && !isComprado && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </button>
        )}

        {/* Botão Admin: ocultar opção de presente físico */}
        {isAdminLoggedIn && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const next = !isPhysicalHidden
              setGiftHidePhysical(gift.id, next)
              toast({
                title: next ? "Opção física oculta" : "Opção física liberada",
                description: next ? "O público verá apenas pagamento online." : "O público volta a ver a opção de presente físico.",
              })
            }}
            className={`absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-colors ${
              isPhysicalHidden ? "text-amber-600 border border-amber-500/40" : "text-muted-foreground"
            }`}
            title={isPhysicalHidden ? "Mostrar opção física para o público" : "Ocultar opção física para o público"}
          >
            <Ban className={`w-5 h-5 ${isPhysicalHidden ? "fill-amber-500/50" : ""}`} />
          </button>
        )}

        {isComprado && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 rounded-full p-3 shadow">
              <Check className="w-6 h-6 text-primary" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 pt-3 space-y-3 bg-secondary">
        <h3 className="font-medium leading-snug line-clamp-2">
          {gift.nome}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{gift.categoria}</Badge>
          <span className="text-sm text-muted-foreground">
            {gift.precoEstimado}
          </span>
        </div>

        {isAdminLoggedIn && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className={`flex-1 ${gift.ativo === false
                  ? "border-destructive text-destructive hover:bg-destructive hover:text-white"
                  : "border-muted text-muted-foreground hover:bg-muted"
                }`}
              onClick={(e) => {
                e.stopPropagation()
                setConfirmAction("toggleActive")
                setConfirmOpen(true)
              }}
            >
              {gift.ativo === false ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              {gift.ativo === false ? "Ativar" : "Desativar"}
            </Button>

            <Button
              size="sm"
              className={`flex-1 ${gift.status === "obtido"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              onClick={(e) => {
                e.stopPropagation()
                setConfirmAction("toggleObtained")
                setConfirmOpen(true)
              }}
            >
              {gift.status === "obtido" ? "Obtido" : "Marcar obtido"}
            </Button>
          </div>
        )}

        {isComprado ? (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-4 h-4 fill-current" />
              <span className="text-sm">Já escolhido</span>
            </div>

            {isAdminLoggedIn && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={handleRemoveClick}
              >
                <X className="w-4 h-4 mr-1" />
                Remover escolha
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2">
            Clique para presentear
          </p>
        )}
      </CardContent>

      {confirmAction && (
        <ConfirmDialog
          open={confirmOpen}
          title={
            confirmAction === "toggleActive"
              ? gift.ativo === false
                ? "Ativar presente"
                : "Desativar presente"
              : gift.status === "obtido"
                ? "Remover de obtidos"
                : "Marcar como obtido"
          }
          description={`Tem certeza que deseja alterar o estado do presente "${gift.nome}"?`}
          confirmText="Confirmar"
          cancelText="Cancelar"
          onCancel={() => {
            setConfirmOpen(false)
            setConfirmAction(null)
          }}
          onConfirm={() => {
            setConfirmOpen(false)

            if (confirmAction === "toggleActive") {
              const newState = gift.ativo === false ? true : false
              setAdminVisibility(gift.id, newState)
              setPublicVisibility(gift.id, newState)
              toast({ title: newState ? "Item ativado" : "Item desativado" })
            }

            if (confirmAction === "toggleObtained") {
              const newState = gift.status !== "obtido"
              setAdminObtained(gift.id, newState)
              setPublicObtained(gift.id, newState)
              toast({ title: newState ? "Item marcado como obtido" : "Item removido de obtidos" })
            }

            setConfirmAction(null)
          }}
        />
      )}
    </Card>
  )
}
