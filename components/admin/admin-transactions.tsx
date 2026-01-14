"use client"

import React, { useState, useEffect } from "react"
import { RefreshCw, Search, Download, AlertCircle, XCircle, CheckCircle2, Clock, DollarSign, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  transaction_code: string
  order_id: string
  charge_id?: string
  gift_id: string
  amount: number
  buyer_name: string
  buyer_email: string
  payment_method: string
  payment_details?: {
    type?: string
    installments?: number
    card?: {
      brand?: string
      first_digits?: string
      last_digits?: string
    }
  }
  status: "processing" | "completed" | "failed" | "refunded" | "PAID" | "PROCESSING"
  created_at: string
  updated_at: string
}

interface PagBankResponse {
  [key: string]: any
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [refundingTransaction, setRefundingTransaction] = useState<string | null>(null)
  const [confirmRefund, setConfirmRefund] = useState<Transaction | null>(null)
  const [consultingTransaction, setConsultingTransaction] = useState<string | null>(null)
  const [pagBankResponses, setPagBankResponses] = useState<Record<string, PagBankResponse>>({})
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/transaction/list")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      } else {
        toast({
          title: "Erro ao carregar transações",
          description: "Não foi possível buscar as transações.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error)
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.buyer_name?.toLowerCase().includes(search) ||
          t.buyer_email?.toLowerCase().includes(search) ||
          t.transaction_code?.toLowerCase().includes(search) ||
          t.gift_id?.toLowerCase().includes(search)
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleConsultPagBank = async (transaction: Transaction) => {
    setConsultingTransaction(transaction.id)
    try {
      const response = await fetch("/api/transaction/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionCode: transaction.transaction_code,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPagBankResponses((prev) => ({
          ...prev,
          [transaction.id]: data,
        }))
        setExpandedResponses((prev) => ({
          ...prev,
          [transaction.id]: true,
        }))

        // Se o pagamento foi confirmado mas o status ainda está como processing, atualiza automaticamente
        const isProcessing = transaction.status === "processing" || transaction.status === "PROCESSING"
        if (data.paid && isProcessing) {
          toast({
            title: "Pagamento confirmado!",
            description: "O status foi atualizado para pago. Atualizando lista...",
          })
          // Aguarda um momento e recarrega as transações para mostrar o novo status
          setTimeout(() => {
            fetchTransactions()
          }, 1500)
        } else {
          toast({
            title: "Consulta realizada!",
            description: data.paid 
              ? "Pagamento já está confirmado." 
              : "Aguardando confirmação do pagamento.",
          })
        }
      } else {
        toast({
          title: "Erro na consulta",
          description: data.error || "Não foi possível consultar o PagBank.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao consultar PagBank:", error)
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      })
    } finally {
      setConsultingTransaction(null)
    }
  }

  const toggleResponseExpansion = (transactionId: string) => {
    setExpandedResponses((prev) => ({
      ...prev,
      [transactionId]: !prev[transactionId],
    }))
  }

  const handleRefund = async (transaction: Transaction) => {
    setRefundingTransaction(transaction.id)
    try {
      const response = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionCode: transaction.transaction_code,
          orderId: transaction.order_id,
          amount: transaction.amount,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const refundMessage = data.refundedAmount 
          ? `Estorno de R$ ${(data.refundedAmount / 100).toFixed(2)} processado com sucesso.`
          : `Estorno de R$ ${transaction.amount.toFixed(2)} processado com sucesso.`
        
        toast({
          title: "Estorno realizado!",
          description: refundMessage,
        })
        fetchTransactions() // Recarrega as transações
      } else {
        const errorMsg = data.error || "Não foi possível processar o estorno."
        const detailMsg = data.message || data.details?.error_messages?.[0]?.description
        
        toast({
          title: "Erro no estorno",
          description: detailMsg || errorMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao processar estorno:", error)
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      })
    } finally {
      setRefundingTransaction(null)
      setConfirmRefund(null)
    }
  }

  const getStatusBadge = (status: string) => {
    // Normalizar status para lowercase
    const normalizedStatus = status.toLowerCase()
    
    const statusConfig = {
      processing: { label: "Processando", variant: "default" as const, icon: Clock },
      completed: { label: "Completo", variant: "default" as const, icon: CheckCircle2 },
      paid: { label: "Completo", variant: "default" as const, icon: CheckCircle2 },
      failed: { label: "Falhou", variant: "destructive" as const, icon: XCircle },
      refunded: { label: "Estornado", variant: "secondary" as const, icon: AlertCircle },
    }

    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.processing
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    total: transactions.length,
    completed: transactions.filter((t) => t.status === "completed" || t.status === "PAID").length,
    processing: transactions.filter((t) => t.status === "processing" || t.status === "PROCESSING").length,
    refunded: transactions.filter((t) => t.status === "refunded").length,
    totalAmount: transactions
      .filter((t) => t.status === "completed" || t.status === "PAID")
      .reduce((sum, t) => sum + t.amount, 0),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estornadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.refunded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            onClick={() => setStatusFilter("completed")}
            size="sm"
          >
            Completas
          </Button>
          <Button
            variant={statusFilter === "processing" ? "default" : "outline"}
            onClick={() => setStatusFilter("processing")}
            size="sm"
          >
            Processando
          </Button>
          <Button
            variant={statusFilter === "refunded" ? "default" : "outline"}
            onClick={() => setStatusFilter("refunded")}
            size="sm"
          >
            Estornadas
          </Button>
        </div>

        <Button variant="outline" onClick={fetchTransactions} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Presente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <React.Fragment key={transaction.id}>
                    <tr className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{formatDate(transaction.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{transaction.buyer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{transaction.buyer_email || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{transaction.gift_id}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        R$ {transaction.amount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm capitalize">{transaction.payment_method || "—"}</div>
                        {transaction.payment_details?.card && (
                          <div className="text-xs text-muted-foreground">
                            {transaction.payment_details.card.brand} •••• {transaction.payment_details.card.last_digits}
                            {transaction.payment_details.installments && transaction.payment_details.installments > 1 && (
                              <span> • {transaction.payment_details.installments}x</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {transaction.transaction_code?.slice(0, 12)}...
                        </code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConsultPagBank(transaction)}
                            disabled={consultingTransaction === transaction.id}
                          >
                            {consultingTransaction === transaction.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Consultando...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Consultar
                              </>
                            )}
                          </Button>
                          {(transaction.status === "completed" || transaction.status === "PAID") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmRefund(transaction)}
                              disabled={refundingTransaction === transaction.id}
                            >
                              {refundingTransaction === transaction.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Estornando...
                                </>
                              ) : (
                                "Estornar"
                              )}
                            </Button>
                          )}
                          {transaction.status === "refunded" && (
                            <span className="text-xs text-muted-foreground">Estornada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {pagBankResponses[transaction.id] && (
                      <tr key={`${transaction.id}-response`} className="bg-muted/30">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Resposta do PagBank
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date().toLocaleTimeString("pt-BR")}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleResponseExpansion(transaction.id)}
                              >
                                {expandedResponses[transaction.id] ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-2" />
                                    Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                    Expandir
                                  </>
                                )}
                              </Button>
                            </div>
                            {expandedResponses[transaction.id] && (
                              <div className="bg-background rounded-md border border-border p-4 overflow-auto max-h-96">
                                <pre className="text-xs font-mono">
                                  {JSON.stringify(pagBankResponses[transaction.id], null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Refund Dialog */}
      <AlertDialog open={!!confirmRefund} onOpenChange={() => setConfirmRefund(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Estorno</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-4">Tem certeza que deseja estornar esta transação?</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Comprador:</strong> {confirmRefund?.buyer_name}
                  </div>
                  <div>
                    <strong>Valor:</strong> R$ {confirmRefund?.amount.toFixed(2)}
                  </div>
                  <div>
                    <strong>Código:</strong> {confirmRefund?.transaction_code}
                  </div>
                </div>
                <p className="mt-4 text-destructive font-medium">
                  Esta ação não pode ser desfeita. O valor será devolvido ao comprador.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Nota: Apenas o valor original será estornado (juros de parcelamento não são estornados).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRefund && handleRefund(confirmRefund)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Estorno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
