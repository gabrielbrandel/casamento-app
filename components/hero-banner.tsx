"use client"

import { Heart, MapPin, Calendar, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/hooks/use-auth-store"
import { useRouter } from "next/navigation"

export function HeroBanner() {
  const { isAdminLoggedIn } = useAuthStore()
  const router = useRouter()

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-secondary overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 border border-foreground/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-foreground/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-foreground/10 rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-16 text-center relative z-10">
        
        <div className="mb-8">
          <Heart className="w-12 h-12 mx-auto text-foreground/60 mb-6" />
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-light tracking-tight mb-6 text-foreground text-balance">
          Thais & Gabriel
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-light mb-12 tracking-wide">Vamos nos casar!</p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="text-lg">25 de Abril de 2026</span>
          </div>

          <div className="hidden md:block w-px h-6 bg-border" />

          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span className="text-lg">Maringá, PR</span>
          </div>
        </div>

        <div className="mt-16 space-y-2 text-muted-foreground">
          <p className="text-sm uppercase tracking-widest">Cerimônia</p>
          <p className="text-lg">Igreja Santa Maria Goretti</p>
          <p className="text-sm mt-4 uppercase tracking-widest">Recepção</p>
          <p className="text-lg">Chácara Bela vista - Sarandi</p>
        </div>
        {isAdminLoggedIn && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="default"
              size="md"
              onClick={() => router.push("/admin")}
              className="flex items-center gap-3 px-4 py-2 rounded-md shadow-lg hover:shadow-xl transition-all"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Área Administrativa</span>
            </Button>
          </div>
        )}

        {/* Admin image-edit moved to Gift Modal; removed inline admin dialog to avoid event bubbling */}
      </div>
    </section>
  )
}
