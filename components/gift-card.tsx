"use client"

import type React from "react"

import Image from "next/image"
import type { Gift } from "@/data/gifts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Check, X } from "lucide-react"
import { useAuthStore } from "@/hooks/use-auth-store"

interface GiftCardProps {
  gift: Gift
  onClick: () => void
  onRemove?: () => void
}

export function GiftCard({ gift, onClick, onRemove }: GiftCardProps) {
  const isComprado = gift.status === "comprado"
  const { isAdminLoggedIn } = useAuthStore()

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 overflow-hidden ${
        isComprado && !isAdminLoggedIn
          ? "opacity-75 cursor-not-allowed bg-destructive/5"
          : "hover:shadow-lg hover:-translate-y-1"
      } ${isComprado && isAdminLoggedIn ? "bg-destructive/5 ring-2 ring-primary/20" : ""}`}
      onClick={isComprado && !isAdminLoggedIn ? undefined : onClick}
    >
      <div className="flex sm:flex-col">
        <div className="relative w-32 h-32 sm:w-full sm:h-48 md:h-56 flex-shrink-0 overflow-hidden bg-secondary flex items-center justify-center">
          <Image
            src={gift.imageUrl || "/placeholder.svg"}
            alt={gift.nome}
            fill
            unoptimized={Boolean(gift.imageUrl?.startsWith("http"))}
            className={`object-contain object-center transition-transform duration-300 ${
              isComprado ? "grayscale" : "group-hover:scale-105"
            }`}
          />
          {isComprado && (
            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
              <div className="bg-background/90 rounded-full p-1.5 sm:p-3">
                <Check className="w-4 h-4 sm:w-6 sm:h-6 text-destructive" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-2.5 sm:p-4 flex-1 min-w-0">
          <h3 className="font-medium text-foreground leading-tight line-clamp-1 sm:line-clamp-2 text-sm sm:text-base mb-1 sm:mb-2">
            {gift.nome}
          </h3>

          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 flex-wrap">
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0 sm:py-0.5">
              {gift.categoria}
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground">{gift.precoEstimado}</span>
          </div>

          {isComprado ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1 sm:gap-2 text-destructive">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <span className="text-xs sm:text-sm">Já escolhido</span>
              </div>
              {isAdminLoggedIn && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                  onClick={handleRemoveClick}
                >
                  <X className="w-3 h-3 mr-1" />
                  Remover escolha
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">Clique para presentear</p>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
