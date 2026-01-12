// Polling interval em milissegundos (30 segundos)
const POLLING_INTERVAL = 30000

// Map para rastrear polling em andamento
const activePollings = new Map<string, NodeJS.Timeout>()

export async function startPollingTransaction(transactionCode: string) {
  // Se já está fazendo polling, não inicia novamente
  if (activePollings.has(transactionCode)) {
    console.log(`Polling já em andamento para ${transactionCode}`)
    return
  }

  console.log(`🔄 Iniciando polling para transação ${transactionCode}`)

  // Executar verificação imediatamente
  await checkTransactionStatus(transactionCode)

  // Configurar polling periódico
  const pollingId = setInterval(async () => {
    const isCompleted = await checkTransactionStatus(transactionCode)
    
    // Parar polling se transação foi finalizada
    if (isCompleted) {
      stopPollingTransaction(transactionCode)
    }
  }, POLLING_INTERVAL)

  activePollings.set(transactionCode, pollingId)
}

export function stopPollingTransaction(transactionCode: string) {
  const pollingId = activePollings.get(transactionCode)
  if (pollingId) {
    clearInterval(pollingId)
    activePollings.delete(transactionCode)
    console.log(`⏹️ Polling parado para transação ${transactionCode}`)
  }
}

async function checkTransactionStatus(transactionCode: string): Promise<boolean> {
  try {
    const response = await fetch('/api/transaction/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionCode }),
    })

    const data = await response.json()

    if (!data.success && response.status !== 200) {
      console.error(`Erro ao consultar ${transactionCode}:`, data.error)
      return false
    }

    // A resposta agora inclui paid (baseado nas charges dos orders)
    const { paid, chargeId, amount } = data
    
    if (paid === true) {
      console.log(`✅ Pagamento confirmado!`, {
        transactionCode,
        chargeId,
        amount: amount ? `R$ ${(amount / 100).toFixed(2)}` : 'N/A'
      })
      
      // TODO: Atualizar status do presente para "comprado"
      // Recarregar lista de presentes para refletir mudança
      window.location.reload()
      
      return true
    }

    console.log(`⏳ Aguardando pagamento ${transactionCode}...`)
    return false
  } catch (error) {
    console.error(`Erro no polling de ${transactionCode}:`, error)
    return false
  }
}

// Retomar polling de transações pendentes ao iniciar (server-side only)
export async function resumeActivePolling() {
  try {
    // Apenas fazer log, o servidor vai retomar o polling automaticamente
    console.log(`🔄 Sistema de polling de transações inicializado`)
  } catch (error) {
    console.error('Erro ao inicializar polling:', error)
  }
}
