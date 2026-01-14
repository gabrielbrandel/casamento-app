import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const giftId = searchParams.get('giftId')

    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'giftId é obrigatório' },
        { status: 400 }
      )
    }

    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!dbUrl) {
      return NextResponse.json(
        { success: false, error: 'Banco de dados não configurado' },
        { status: 500 }
      )
    }

    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false }
    })

    try {
      // Buscar a transação mais recente deste presente
      const result = await pool.query(
        `SELECT transaction_code, status, created_at
         FROM transactions
         WHERE gift_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [giftId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Transação não encontrada',
        })
      }

      const transaction = result.rows[0]
      console.log(`✅ Transação encontrada para gift ${giftId}:`, transaction.transaction_code)

      return NextResponse.json({
        success: true,
        transactionCode: transaction.transaction_code,
        status: transaction.status,
      })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Erro ao buscar transação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar transação' },
      { status: 500 }
    )
  }
}
