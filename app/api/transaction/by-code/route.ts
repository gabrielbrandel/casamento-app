import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'code é obrigatório' },
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
      // Buscar a transação pelo código
      const result = await pool.query(
        `SELECT gift_id, transaction_code, status
         FROM transactions
         WHERE transaction_code = $1
         LIMIT 1`,
        [code]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Transação não encontrada',
        })
      }

      const transaction = result.rows[0]
      console.log(`✅ Transação encontrada:`, transaction.transaction_code, 'gift:', transaction.gift_id)

      return NextResponse.json({
        success: true,
        giftId: transaction.gift_id,
        status: transaction.status,
      })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Erro ao buscar transação por código:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar transação' },
      { status: 500 }
    )
  }
}
