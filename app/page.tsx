import { Navigation } from "@/components/navigation"
import { HeroBanner } from "@/components/hero-banner"
import { GiftList } from "@/components/gift-list"
import { MapSection } from "@/components/map-section"
// import { MessagesSection } from "@/components/messages-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroBanner />
      <GiftList />
      <MapSection />
      {/* <MessagesSection /> */}
      <Footer />
    </main>
  )
}
