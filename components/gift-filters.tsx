"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories, priceRanges } from "@/data/gifts"

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
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar presente..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-11 h-12 text-base md:h-10 md:text-sm"
        />
      </div>

      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full md:w-[180px] h-12 text-base md:h-10 md:text-sm">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priceRange} onValueChange={onPriceRangeChange}>
        <SelectTrigger className="w-full md:w-[180px] h-12 text-base md:h-10 md:text-sm">
          <SelectValue placeholder="Faixa de preço" />
        </SelectTrigger>
        <SelectContent>
          {priceRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px] h-12 text-base md:h-10 md:text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="disponivel">Disponíveis</SelectItem>
          {isAdmin && <SelectItem value="comprado">Comprados</SelectItem>}
          {isAdmin && <SelectItem value="todos">Todos</SelectItem>}
        </SelectContent>
      </Select>

      {onSortChange && (
        <Select value={sortOrder} onValueChange={onSortChange}>
          <SelectTrigger className="w-full md:w-[200px] h-12 text-base md:h-10 md:text-sm">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem ordenação</SelectItem>
            <SelectItem value="price-asc">Preço: mais barato</SelectItem>
            <SelectItem value="price-desc">Preço: mais caro</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
