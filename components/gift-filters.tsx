"use client"

import { useState, useMemo } from "react"
import { Search, Filter, X, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { categories, priceRanges } from "@/data/gifts"
import { Badge } from "@/components/ui/badge"

interface GiftFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  priceRange: string
  onPriceRangeChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  sortOrder?: string
  onSortChange?: (value: string) => void
  isAdmin?: boolean
}

export function GiftFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  status,
  onStatusChange,
  sortOrder,
  onSortChange,
  isAdmin = false,
}: GiftFiltersProps) {
  const [open, setOpen] = useState(false)
  
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category !== "todos") count++
    if (priceRange !== "todos") count++
    return count
  }, [category, priceRange])

  const clearFilters = () => {
    onCategoryChange("todos")
    onPriceRangeChange("todos")
  }

  const filterContentJSX = (
    <div className="space-y-6">
      {/* Busca */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="buscar produto na minha lista"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
      </div>

      {/* Categorias */}
      <div className="space-y-3">
        <h3 className="font-medium text-base">Categoria</h3>
        <div className="space-y-2.5">
          {categories.map((cat) => {
            return (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${cat}`}
                  checked={category === cat}
                  onCheckedChange={() => onCategoryChange(cat)}
                />
                <Label
                  htmlFor={`cat-${cat}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {cat}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      {/* Faixas de Preço */}
      <div className="space-y-3">
        <h3 className="font-medium text-base">Variação de preço</h3>
        <RadioGroup value={priceRange} onValueChange={onPriceRangeChange}>
          {priceRanges.map((range) => {
            return (
              <div key={range.value} className="flex items-center space-x-2">
                <RadioGroupItem value={range.value} id={`price-${range.value}`} />
                <Label
                  htmlFor={`price-${range.value}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {range.label}
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Limpar Filtros */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Limpar filtros
          <Badge variant="secondary" className="ml-2">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: Botão que abre Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full h-12 justify-center relative">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filtrar e ordenar
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {filterContentJSX}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Conteúdo direto */}
      <div className="hidden md:block bg-card border rounded-lg p-6">
        {filterContentJSX}
      </div>
    </>
  )
}
