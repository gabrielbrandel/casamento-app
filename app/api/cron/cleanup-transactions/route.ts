import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint público para ser chamado por cron jobs (Vercel Cron, etc)
 * Executa automaticamente a limpeza de transações antigas
 * 
 * Para configurar no Vercel:
 * 1. Criar arquivo vercel.json na raiz:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-transactions",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * Isso executará a cada hora
 */
export async function GET(req: NextRequest) {
  try {
    // Validar que é uma requisição autorizada (opcional)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Se CRON_SECRET estiver definido, valida
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Chamar o endpoint de cleanup
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${appUrl}/api/transaction/cleanup-old`, {
      method: 'POST',
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao executar limpeza', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: data
    })

  } catch (error: any) {
    console.error('Erro no cron job de limpeza:', error)
    return NextResponse.json(
      { error: 'Erro ao executar cron job', details: error.message },
      { status: 500 }
    )
  }
}
