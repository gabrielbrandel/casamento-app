import { NextRequest, NextResponse } from 'next/server'

// Disable TLS verification for Supabase self-signed certificates
if (process.env.NODE_ENV === "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

export async function POST(req: NextRequest) {
  try {
    const { giftId } = await req.json()

    if (!giftId) {
      return NextResponse.json(
        { error: 'giftId é obrigatório' },
        { status: 400 }
      )
    }

    // Usar a biblioteca pg para conectar diretamente ao PostgreSQL
    const { Pool } = await import("pg")
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!dbUrl) {
      console.error('POSTGRES_URL ou DATABASE_URL não configurada')
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
        { status: 500 }
      )
    }

    const pool = new Pool({ connectionString: dbUrl })
    
    try {
      const result = await pool.query(
        `UPDATE gifts 
         SET status = 'comprado', updated_at = NOW()
         WHERE id = $1
         RETURNING id, nome, status`,
        [giftId]
      )

      if (!result.rows || result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Presente não encontrado' },
          { status: 404 }
        )
      }

      console.log(`✅ Presente marcado como comprado:`, result.rows[0])

      return NextResponse.json({
        success: true,
        gift: result.rows[0],
      })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Erro ao marcar presente como pago:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar presente', details: String(error) },
      { status: 500 }
    )
  }
}
