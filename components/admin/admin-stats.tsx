import { Gift, CreditCard, Package, CheckCircle, Clock, DollarSign } from "lucide-react"

interface Stats {
  totalPresentes: number
  totalPix: number
  totalFisico: number
  valorTotalPix: number
  valorTotalFisico: number
  valorTotal: number
  recebidosConfirmados: number
  pendentesConferencia: number
}

interface AdminStatsProps {
  stats: Stats
}

export function AdminStats({ stats }: AdminStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground mb-6">Resumo Geral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total de Presentes</span>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stats.totalPresentes}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Conferidos</span>
            </div>
            <p className="text-3xl font-semibold text-green-600">{stats.recebidosConfirmados}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-3xl font-semibold text-amber-600">{stats.pendentesConferencia}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <DollarSign className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(stats.valorTotal)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl text-foreground mb-4">Por Tipo de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-md">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-foreground">Pix</span>
              </div>
              <span className="text-sm text-muted-foreground">{stats.totalPix} presentes</span>
            </div>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.valorTotalPix)}</p>
            <p className="text-sm text-muted-foreground mt-1">Valor total em Pix</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-foreground">Físico</span>
              </div>
              <span className="text-sm text-muted-foreground">{stats.totalFisico} presentes</span>
            </div>
            <p className="text-2xl font-semibold text-blue-600">{formatCurrency(stats.valorTotalFisico)}</p>
            <p className="text-sm text-muted-foreground mt-1">Valor estimado em presentes físicos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
