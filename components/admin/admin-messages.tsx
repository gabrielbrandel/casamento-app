import { MessageSquare, Gift, Calendar, CreditCard, Package, Phone } from "lucide-react"

interface Message {
  id: string
  nome: string
  familia: string
  telefone?: string
  mensagem: string
  presente: string
  tipoPagamento: "fisico" | "pix"
  dataConfirmacao: string
  precoEstimado: string
}

interface AdminMessagesProps {
  messages: Message[]
}

export function AdminMessages({ messages }: AdminMessagesProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "")
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    return phone
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Mensagens dos Convidados</h2>
        <span className="text-sm text-muted-foreground">{messages.length} mensagens</span>
      </div>

      {messages.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma mensagem recebida ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-background rounded-lg border border-border p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{message.nome}</h3>
                  <p className="text-sm text-muted-foreground">{message.familia}</p>
                  {message.telefone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {formatPhone(message.telefone)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(message.dataConfirmacao)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">{message.presente}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{message.precoEstimado}</span>
                <span className="text-muted-foreground">•</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    message.tipoPagamento === "pix" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {message.tipoPagamento === "pix" ? (
                    <CreditCard className="w-3 h-3" />
                  ) : (
                    <Package className="w-3 h-3" />
                  )}
                  {message.tipoPagamento === "pix" ? "Pix" : "Físico"}
                </span>
              </div>

              {message.mensagem ? (
                <div className="bg-muted rounded-md p-4">
                  <p className="text-foreground italic">"{message.mensagem}"</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma mensagem deixada.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
