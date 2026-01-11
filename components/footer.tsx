import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span>Feito com</span>
          <Heart className="w-4 h-4 fill-current text-destructive" />
          <span>para Thais & Gabriel</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">25 de Abril de 2026</p>
      </div>
    </footer>
  )
}
