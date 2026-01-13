import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado' },
        { status: 500 }
      )
    }

    // Buscar transações em "processing" criadas há mais de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: oldTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo)

    if (fetchError) {
      console.error('Erro ao buscar transações antigas:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar transações antigas' },
        { status: 500 }
      )
    }

    if (!oldTransactions || oldTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação antiga encontrada',
        cleaned: 0
      })
    }

    console.log(`🧹 Encontradas ${oldTransactions.length} transações antigas para limpar`)

    // Conectar ao PostgreSQL para liberar os presentes
    const { Pool } = await import('pg')
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    })

    const results = []

    for (const transaction of oldTransactions) {
      try {
        // Extrair o ID numérico do gift_id (remove "gift_")
        const giftId = transaction.gift_id?.replace('gift_', '')
        
        if (giftId) {
          // Voltar o presente para "disponivel" no PostgreSQL
          await pool.query(`
            UPDATE gifts 
            SET status = 'disponivel', buyer_name = NULL, updated_at = NOW()
            WHERE id = $1
          `, [parseInt(giftId)])

          console.log(`✅ Gift ${giftId} voltou para disponível`)
        }

        // Deletar a transação do Supabase
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id)

        if (deleteError) {
          console.error(`Erro ao deletar transação ${transaction.id}:`, deleteError)
          results.push({
            transactionId: transaction.id,
            giftId: transaction.gift_id,
            status: 'error',
            error: deleteError.message
          })
        } else {
          console.log(`🗑️ Transação ${transaction.id} deletada`)
          results.push({
            transactionId: transaction.id,
            giftId: transaction.gift_id,
            status: 'cleaned',
            age: transaction.created_at
          })
        }
      } catch (error: any) {
        console.error(`Erro ao processar transação ${transaction.id}:`, error)
        results.push({
          transactionId: transaction.id,
          giftId: transaction.gift_id,
          status: 'error',
          error: error.message
        })
      }
    }

    await pool.end()

    const successCount = results.filter(r => r.status === 'cleaned').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída: ${successCount} transações removidas, ${errorCount} erros`,
      cleaned: successCount,
      errors: errorCount,
      details: results
    })

  } catch (error: any) {
    console.error('Erro ao limpar transações antigas:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar transações antigas', details: error.message },
      { status: 500 }
    )
  }
}
