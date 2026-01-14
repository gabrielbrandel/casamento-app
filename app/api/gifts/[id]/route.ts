import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const giftId = params.id

    if (!giftId) {
      return NextResponse.json(
        { error: 'ID do presente é obrigatório' },
        { status: 400 }
      )
    }

    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!dbUrl) {
      return NextResponse.json(
        { error: 'Banco de dados não configurado' },
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
      // Verificar se o presente existe
      const checkResult = await pool.query(
        'SELECT id, nome FROM gifts WHERE id = $1',
        [giftId]
      )

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Presente não encontrado' },
          { status: 404 }
        )
      }

      // Excluir o presente
      await pool.query('DELETE FROM gifts WHERE id = $1', [giftId])

      console.log(`✅ Presente ${giftId} (${checkResult.rows[0].nome}) excluído do banco`)

      return NextResponse.json({
        success: true,
        message: 'Presente excluído com sucesso',
        gift: checkResult.rows[0],
      })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Erro ao excluir presente:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir presente', details: String(error) },
      { status: 500 }
    )
  }
}
