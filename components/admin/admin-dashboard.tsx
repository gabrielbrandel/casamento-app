"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminStore } from "@/hooks/use-admin-store"
import { AdminStats } from "./admin-stats"
import { AdminGiftList } from "./admin-gift-list"
import { AdminMessages } from "./admin-messages"
import { Gift, LayoutDashboard, MessageSquare, LogOut, Home } from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

type Tab = "dashboard" | "presentes" | "mensagens"

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const { isLoading, getPurchasedGifts, getMessages, getStats, markAsReceived } = useAdminStore()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  const stats = getStats()
  const messages = getMessages()

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-xl text-foreground">Painel Administrativo</h1>
              <span className="text-sm text-muted-foreground hidden sm:block">Thais & Gabriel</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Site</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "dashboard"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Resumo
            </button>
            <button
              onClick={() => setActiveTab("presentes")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "presentes"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Gift className="w-4 h-4" />
              Presentes
            </button>
            <button
              onClick={() => setActiveTab("mensagens")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "mensagens"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && <AdminStats stats={stats} />}
        {activeTab === "presentes" && (
          <AdminGiftList getPurchasedGifts={getPurchasedGifts} markAsReceived={markAsReceived} />
        )}
        {activeTab === "mensagens" && <AdminMessages messages={messages} />}
      </main>
    </div>
  )
}
