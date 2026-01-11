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
    address: "Av. Brasil, 2000 - Jardim América, São Paulo - SP",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Igreja+Nossa+Senhora+do+Brasil+São+Paulo",
  },
  {
    id: "festa",
    title: "Recepção",
    name: "Chácara Bela vista - Sarandi",
    address: "Rua das Flores, 500 - Moema, São Paulo - SP",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Espaço+Gardens+Moema+São+Paulo",
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
