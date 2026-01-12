import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

// Disable TLS verification for Supabase self-signed certificates
if (process.env.NODE_ENV === "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado' },
        { status: 500 }
      )
    }

    const token = process.env.PAGSEGURO_TOKEN
    const env = process.env.PAGSEGURO_ENV || 'sandbox'

    if (!token) {
      return NextResponse.json(
        { error: 'Token PagBank não configurado' },
        { status: 500 }
      )
    }

    // Buscar todas as transações com status "processing" ou "ACTIVE"
    const { data: pendingTransactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .in('status', ['processing', 'ACTIVE'])

    if (fetchError) {
      console.error('Erro ao buscar transações pendentes:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      )
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma transação em processamento',
        updated: [],
        total: 0,
      })
    }

    console.log(`🔍 Verificando ${pendingTransactions.length} transações pendentes...`)

    const results = []
    const { Pool } = await import("pg")
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    })

    try {
      // Verificar cada transação
      for (const transaction of pendingTransactions) {
        try {
          const checkoutId = transaction.transaction_code
          const checkoutBaseUrl = env === 'production'
            ? 'https://api.pagseguro.com/checkouts'
            : 'https://sandbox.api.pagseguro.com/checkouts'

          // Obter o checkout para pegar os orders
          const checkoutResponse = await fetch(`${checkoutBaseUrl}/${checkoutId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!checkoutResponse.ok) {
            console.warn(`⚠️ Checkout não encontrado: ${checkoutId}`)
            results.push({
              transactionCode: checkoutId,
              status: 'not_found',
              giftId: transaction.gift_id,
            })
            continue
          }

          const checkoutData = await checkoutResponse.json()

          if (!checkoutData.orders || checkoutData.orders.length === 0) {
            console.log(`⏳ Sem orders ainda: ${checkoutId}`)
            results.push({
              transactionCode: checkoutId,
              status: 'pending',
              giftId: transaction.gift_id,
            })
            continue
          }

          // Verificar cada order
          const orderBaseUrl = env === 'production'
            ? 'https://api.pagseguro.com/orders'
            : 'https://sandbox.api.pagseguro.com/orders'

          let isPaid = false
          let chargeId = null
          let paidAmount = 0

          for (const order of checkoutData.orders) {
            const orderResponse = await fetch(`${orderBaseUrl}/${order.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            if (orderResponse.ok) {
              const orderData = await orderResponse.json()

              // Verificar se há charges pagas
              if (orderData.charges && orderData.charges.length > 0) {
                const paidCharge = orderData.charges.find((charge: any) => charge.status === 'PAID')

                if (paidCharge) {
                  isPaid = true
                  chargeId = paidCharge.id
                  paidAmount = paidCharge.amount?.value || 0

                  // Atualizar transaction no Supabase - apenas para ESTA transação
                  try {
                    const { error: updateError } = await supabase
                      .from('transactions')
                      .update({
                        status: 'PAID',
                      })
                      .eq('id', transaction.id)

                    if (updateError) {
                      console.error('Erro ao atualizar transação no Supabase:', updateError)
                    } else {
                      console.log(`✅ Transaction ID ${transaction.id} atualizada para PAID no Supabase`)
                    }
                  } catch (error) {
                    console.error('Erro ao atualizar transação:', error)
                  }

                  // Atualizar o gift no PostgreSQL para "comprado" com o nome do comprador
                  if (transaction.gift_id) {
                    const buyerName = transaction.buyer_name || 'Anônimo'
                    const giftId = transaction.gift_id.replace('gift_', '')
                    try {
                      const giftResult = await pool.query(
                        `UPDATE gifts 
                         SET status = 'comprado', buyer_name = $1, updated_at = NOW()
                         WHERE id = $2
                         RETURNING id, nome, status, buyer_name`,
                        [buyerName, parseInt(giftId)]
                      )

                      if (giftResult.rows && giftResult.rows.length > 0) {
                        console.log(`✅ Gift ${giftId} marcado como comprado para: ${buyerName}`)
                      } else {
                        console.log(`⚠️ Nenhum gift encontrado com ID ${giftId}`)
                      }
                    } catch (columnError: any) {
                      // Se a coluna buyer_name não existir, tenta sem ela
                      if (columnError.message.includes('buyer_name')) {
                        console.log('⚠️ Coluna buyer_name não existe, criando...')
                        try {
                          await pool.query(`ALTER TABLE gifts ADD COLUMN buyer_name VARCHAR(255)`)
                          // Tenta novamente após criar a coluna
                          const retryResult = await pool.query(
                            `UPDATE gifts 
                             SET status = 'comprado', buyer_name = $1, updated_at = NOW()
                             WHERE id = $2
                             RETURNING id, nome, status, buyer_name`,
                            [buyerName, parseInt(giftId)]
                          )
                          if (retryResult.rows && retryResult.rows.length > 0) {
                            console.log(`✅ Gift ${giftId} marcado como comprado para: ${buyerName}`)
                          }
                        } catch (error) {
                          console.error('Erro ao criar coluna ou atualizar gift:', error)
                        }
                      } else {
                        console.error('Erro ao atualizar gift:', columnError)
                      }
                    }
                  }

                  break
                }
              }
            }
          }

          if (isPaid) {
            results.push({
              transactionCode: checkoutId,
              status: 'paid',
              giftId: transaction.gift_id,
              chargeId,
            })
          } else {
            results.push({
              transactionCode: checkoutId,
              status: 'pending',
              giftId: transaction.gift_id,
            })
          }
        } catch (error) {
          console.error(`Erro ao verificar ${transaction.transaction_code}:`, error)
          results.push({
            transactionCode: transaction.transaction_code,
            status: 'error',
            giftId: transaction.gift_id,
          })
        }
      }
    } finally {
      await pool.end()
    }

    const paidCount = results.filter((r) => r.status === 'paid').length
    const pendingCount = results.filter((r) => r.status === 'pending').length

    return NextResponse.json({
      success: true,
      message: `Verificação completa: ${paidCount} pagos, ${pendingCount} pendentes`,
      updated: results,
      total: pendingTransactions.length,
      paid: paidCount,
      pending: pendingCount,
    })
  } catch (error) {
    console.error('❌ Erro ao verificar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar pagamentos', details: String(error) },
      { status: 500 }
    )
  }
}
