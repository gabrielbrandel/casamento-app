"use client"

import { useState, useMemo, useEffect } from "react"
import type { Gift } from "@/data/gifts"
import { GiftCard } from "./gift-card"
import { GiftCardSkeleton } from "./gift-card-skeleton"
import { GiftFilters } from "./gift-filters"
import { GiftModal } from "./gift-modal"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/hooks/use-auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogOut, Shield, ArrowUp, Heart } from "lucide-react"
import { PublicStats } from "./public-stats"
import { FreeDonationCard } from "./free-donation-card"
import { useFavoritesStore } from "@/hooks/use-favorites-store"

export function GiftList() {
  const { gifts, isLoading, purchaseGift, removeGiftPurchase } = useGiftsStore()
  const { addGift: addPublicGift } = useGiftsStore()
  const { addGift: addAdminGift } = useAdminStore()
  const { isAdminLoggedIn, logout } = useAuthStore()
  const { favorites } = useFavoritesStore()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todas")
  const [priceRange, setPriceRange] = useState("todas")
  const [status, setStatus] = useState("disponivel")
  const [sortOrder, setSortOrder] = useState("none")
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [newNome, setNewNome] = useState("")
  const [newPreco, setNewPreco] = useState("")
  const [newImage, setNewImage] = useState("")
  const [newCategoria, setNewCategoria] = useState("")
  const [adminHighlightId, setAdminHighlightId] = useState<string | null>(null)
  const [showHiddenPhysicalOnly, setShowHiddenPhysicalOnly] = useState(false)
  const handleAddGift = () => {
    if (!newNome.trim() || !newPreco.trim()) {
      alert("Nome e preço são obrigatórios!")
      return
    }

    const priceNum = parsePrice(newPreco)
    const faixa: "baixo" | "medio" | "alto" = priceNum <= 100 ? "baixo" : priceNum <= 1000 ? "medio" : "alto"
    
    // Format price as R$ currency
    const formattedPrice = `R$ ${priceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    
    const gift: Gift = {
      id: Date.now().toString(),
      nome: newNome.trim(),
      categoria: newCategoria.trim() || "Outros",
      precoEstimado: formattedPrice,
      faixaPreco: faixa,
      imageUrl: newImage.trim() || "/placeholder.svg",
      status: "disponivel",
      ativo: true,
    }

    // admin store: prepend so admin sees it first; public store: append
    addAdminGift(gift)
    addPublicGift(gift)
    setAdminHighlightId(gift.id)
    // clear highlight after a short period
    setTimeout(() => setAdminHighlightId(null), 6000)
    toast({ title: 'Item adicionado', description: `${gift.nome} foi adicionado ao catálogo.` })

    setNewNome("")
    setNewPreco("")
    setNewImage("")
    setNewCategoria("")
  }

  const parsePrice = (p: string) => {
    if (!p) return 0
    const cleaned = p.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(/,/g, ".")
    return parseFloat(cleaned) || 0
  }

  const filteredGifts = useMemo(() => {
    const base = gifts.filter((gift) => {
      // hide deactivated items (ativo === false)
      if (gift.ativo === false) return false
      // skip gifts with missing nome
      if (!gift.nome) return false
      
      // Filter by favorites if enabled - se não tem favoritos, mostrar todos
      if (showFavoritesOnly && favorites.length > 0 && !favorites.includes(gift.id)) return false
      // Admin: filtrar apenas itens com físico oculto
      if (showHiddenPhysicalOnly && !gift.ocultarFisico) return false
      
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

    // If admin added a new item, show it first only for admin
    if (isAdminLoggedIn && adminHighlightId) {
      const idx = base.findIndex((g) => g.id === adminHighlightId)
      if (idx > -1) {
        const item = base.splice(idx, 1)[0]
        return [item, ...base]
      }
    }

    return base
  }, [gifts, search, category, priceRange, status, sortOrder, isAdminLoggedIn, adminHighlightId, showFavoritesOnly, favorites, showHiddenPhysicalOnly])

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
    <section id="presentes" className="py-20 bg-background scroll-mt-20">
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

        {isAdminLoggedIn && (
          <div className="mb-6 p-4 border rounded-lg bg-secondary">
            <h3 className="text-sm font-medium mb-2">Adicionar novo item (Admin)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                className="input input-sm p-2 border rounded"
                placeholder="Nome do presente"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
              />
              <input
                className="input input-sm p-2 border rounded"
                placeholder="Preço estimado (ex: R$ 199,99)"
                value={newPreco}
                onChange={(e) => setNewPreco(e.target.value)}
              />
              <input
                className="input input-sm p-2 border rounded"
                placeholder="URL da imagem (https://...)"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
              />
              <input
                className="input input-sm p-2 border rounded"
                placeholder="Categoria"
                value={newCategoria}
                onChange={(e) => setNewCategoria(e.target.value)}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="default" size="sm" onClick={handleAddGift}>
                Adicionar item
              </Button>
            </div>
          </div>
        )}

        {/* Estatísticas Públicas */}
        {!isAdminLoggedIn && <PublicStats />}

        {/* Botão de Favoritos */}
        {!isAdminLoggedIn && favorites.length > 0 && (
          <div className="mb-6">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="w-full md:w-auto"
            >
              <Heart className={`w-4 h-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
              {showFavoritesOnly ? "Mostrar Todos" : `Meus Favoritos (${favorites.length})`}
            </Button>
          </div>
        )}

        {/* Filtro Admin: presentes com opção física oculta */}
        {isAdminLoggedIn && (
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant={showHiddenPhysicalOnly ? "default" : "outline"}
              onClick={() => setShowHiddenPhysicalOnly(!showHiddenPhysicalOnly)}
              className="w-full sm:w-auto"
            >
              <Shield className={`w-4 h-4 mr-2 ${showHiddenPhysicalOnly ? "fill-current" : ""}`} />
              {showHiddenPhysicalOnly ? "Mostrar todos" : "Somente sem físico"}
            </Button>
          </div>
        )}

        {/* Se não há favoritos e o filtro está ativo, mostrar todos */}
        {showFavoritesOnly && favorites.length === 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Você não tem favoritos marcados. Mostrando todos os presentes.
            </p>
          </div>
        )}

        {/* Filtros Mobile - Renderiza o botão sheet */}
        <div className="md:hidden">
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
            isAdmin={isAdminLoggedIn}
          />
        </div>

        {/* Layout responsivo: Sidebar no desktop */}
        <div className="md:grid md:grid-cols-[300px_1fr] md:gap-6">
          {/* Filtros Desktop - Sidebar */}
          <div className="hidden md:block sticky top-18 h-fit">
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
              isAdmin={isAdminLoggedIn}
            />
          </div>

          {/* Lista de presentes */}
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <GiftCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredGifts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {/* Card de Doação Livre - Primeiro item */}
                {!isAdminLoggedIn && !showFavoritesOnly && <FreeDonationCard />}
                
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
          </div>
        </div>

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

