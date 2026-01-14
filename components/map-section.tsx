"use client"

import { MapPin, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const locations = [
  {
    id: "cerimonia",
    title: "Cerimônia",
    name: "Igreja Santa Maria Goretti",
    address: "R. Visc. de Nassau, 534 A - Zona 7, Maringá - PR, 87020-030",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Igreja+Santa+Maria+Goretti+Maringá+PR",
  },
  {
    id: "festa",
    title: "Recepção",
    name: "Chácara Bela vista - Sarandi",
    address: "Estr.Eldorado, 1921 - Chácaras Eldorado, Sarandi - PR, 87114 - 636",
    mapsUrl: "https://www.google.com/maps/place/Ch%C3%A1cara+Bela+Vista+Sarandi./@-23.441217,-51.8494107,17z/data=!3m1!4b1!4m6!3m5!1s0x94ecc50a1ff09f67:0xe89ec6b10387d9ea!8m2!3d-23.4412219!4d-51.8468358!16s%2Fg%2F11fvpvqqsj?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D",
  },
]

export function MapSection() {
  return (
    <section id="como-chegar" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-4 text-foreground">Como Chegar</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Confira os endereços da cerimônia e da recepção.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="cerimonia" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="cerimonia">Cerimônia</TabsTrigger>
              <TabsTrigger value="festa">Recepção</TabsTrigger>
            </TabsList>

            {locations.map((location) => (
              <TabsContent key={location.id} value={location.id}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MapPin className="w-5 h-5" />
                      {location.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{location.name}</h4>
                      <p className="text-muted-foreground">{location.address}</p>
                    </div>
                    <Button asChild className="w-full">
                      <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir no Google Maps
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  )
}
