"use client"

import { useState, useMemo, useEffect } from "react"
import type { Gift } from "@/data/gifts"
import { GiftCard } from "./gift-card"
import { GiftCardSkeleton } from "./gift-card-skeleton"
import { GiftFilters } from "./gift-filters"
import { GiftModal } from "./gift-modal"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, Shield, ArrowUp } from "lucide-react"

export function GiftList() {
  const { gifts, isLoading, purchaseGift, removeGiftPurchase } = useGiftsStore()
  const { isAdminLoggedIn, logout } = useAuthStore()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todas")
  const [priceRange, setPriceRange] = useState("todas")
  const [status, setStatus] = useState("todos")
  const [sortOrder, setSortOrder] = useState("none")
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const parsePrice = (p: string) => {
    if (!p) return 0
    const cleaned = p.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(/,/g, ".")
    return parseFloat(cleaned) || 0
  }

  const filteredGifts = useMemo(() => {
    const base = gifts.filter((gift) => {
      const matchesSearch = gift.nome.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === "Todas" || gift.categoria === category
      const matchesPriceRange = priceRange === "todas" || gift.faixaPreco === priceRange
      const matchesStatus = status === "todos" || gift.status === status

      return matchesSearch && matchesCategory && matchesPriceRange && matchesStatus
    })

    if (sortOrder === "price-asc") {
      return [...base].sort((a, b) => parsePrice(a.precoEstimado) - parsePrice(b.precoEstimado))
    }

    if (sortOrder === "price-desc") {
      return [...base].sort((a, b) => parsePrice(b.precoEstimado) - parsePrice(a.precoEstimado))
    }

    return base
  }, [gifts, search, category, priceRange, status, sortOrder])

  const handleConfirmGift = (data: {
    nome: string
    familia: string
    mensagem?: string
    tipoPagamento: "fisico" | "pix"
  }) => {
    if (selectedGift) {
      purchaseGift(selectedGift.id, {
        ...data,
        dataConfirmacao: new Date().toISOString(),
      })
    }
  }

  const handleRemoveGift = (giftId: string) => {
    if (confirm("Tem certeza que deseja remover a escolha deste presente? O presente voltará a ficar disponível.")) {
      removeGiftPurchase(giftId)
    }
  }

  const availableCount = gifts.filter((g) => g.status === "disponivel").length
  const purchasedCount = gifts.filter((g) => g.status === "comprado").length

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section id="presentes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">Lista de Presentes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha um presente especial para nos ajudar a começar nossa vida juntos.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <span>{availableCount} disponíveis</span>
            <span className="w-px h-4 bg-border" />
            <span>{purchasedCount} já escolhidos</span>
          </div>

          {isAdminLoggedIn && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Badge variant="default" className="bg-primary text-primary-foreground">
                <Shield className="w-3 h-3 mr-1" />
                Modo Administrador
              </Badge>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          )}
        </div>

        <GiftFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          status={status}
          onStatusChange={setStatus}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <GiftCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredGifts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onClick={() => setSelectedGift(gift)}
                onRemove={() => handleRemoveGift(gift.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum presente encontrado com os filtros selecionados.</p>
          </div>
        )}

        <GiftModal
          gift={selectedGift}
          isOpen={!!selectedGift}
          onClose={() => setSelectedGift(null)}
          onConfirm={handleConfirmGift}
        />
        {showBackToTop && (
          <div className="fixed right-6 bottom-6 z-50">
            <Button
              variant="ghost"
              className="w-10 h-10 rounded-full shadow-md"
              onClick={() => document.getElementById("presentes")?.scrollIntoView({ behavior: "smooth" })}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

