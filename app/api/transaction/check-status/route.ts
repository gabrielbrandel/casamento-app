import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    const { transactionCode } = await req.json()

    if (!transactionCode) {
      return NextResponse.json(
        { error: 'transactionCode é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar transação no PagBank
    const token = process.env.PAGSEGURO_TOKEN
    const env = process.env.PAGSEGURO_ENV || 'sandbox'

    if (!token) {
      return NextResponse.json(
        { error: 'Token PagBank não configurado' },
        { status: 500 }
      )
    }

    // Consultar o checkout para obter os orders
    const checkoutBaseUrl = env === 'production'
      ? 'https://api.pagseguro.com/checkouts'
      : 'https://sandbox.api.pagseguro.com/checkouts'

    let checkoutResponse = await fetch(`${checkoutBaseUrl}/${transactionCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!checkoutResponse.ok) {
      const errorBody = await checkoutResponse.text()
      console.error('❌ Erro ao consultar checkout:', {
        status: checkoutResponse.status,
        statusText: checkoutResponse.statusText,
        transactionCode,
        errorBody,
      })

      return NextResponse.json({
        success: false,
        error: `Erro ao consultar status: ${checkoutResponse.status}`,
        transactionCode,
        paid: false,
      }, { status: checkoutResponse.status })
    }

    const checkoutData = await checkoutResponse.json()
    
    console.log('✅ Checkout encontrado:', {
      id: checkoutData.id,
      status: checkoutData.status,
      ordersCount: checkoutData.orders?.length || 0,
    })

    // Verificar se há orders e consultar suas charges
    let isPaid = false
    let orderId = null
    let paidChargeId = null
    let paidAmount = 0
    let actualPaymentMethod = 'unknown'

    if (checkoutData.orders && checkoutData.orders.length > 0) {
      const orderBaseUrl = env === 'production'
        ? 'https://api.pagseguro.com/orders'
        : 'https://sandbox.api.pagseguro.com/orders'

      // Verificar cada order
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
              orderId = order.id
              paidChargeId = paidCharge.id
              paidAmount = paidCharge.amount?.value || 0
              
              // Detectar o método de pagamento real usado
              if (paidCharge.payment_method) {
                const paymentType = paidCharge.payment_method.type
                if (paymentType === 'CREDIT_CARD') {
                  actualPaymentMethod = 'cartao'
                } else if (paymentType === 'DEBIT_CARD') {
                  actualPaymentMethod = 'debito'
                } else if (paymentType === 'PIX') {
                  actualPaymentMethod = 'pix'
                } else if (paymentType === 'BOLETO') {
                  actualPaymentMethod = 'boleto'
                }
              }
              
              console.log('✅ Pagamento confirmado!', {
                orderId: orderId,
                chargeId: paidChargeId,
                amount: paidAmount,
                paymentMethod: actualPaymentMethod,
                paidAt: paidCharge.paid_at,
              })
              
              // Marcar o gift como comprado/pago
              const giftId = orderData.reference_id || checkoutData.reference_id
              if (giftId) {
                const { markGiftAsPaid } = await import('@/lib/mark-gift-paid')
                const result = await markGiftAsPaid(giftId)
                if (result.success) {
                  console.log(`✅ Gift ${giftId} marcado como comprado`)
                } else {
                  console.error(`❌ Erro ao marcar gift ${giftId} como pago:`, result.error)
                }
              }
              
              break
            }
          }
        }
      }
    }

    // Atualizar status na tabela de transações do Supabase
    if (supabase) {
      try {
        const updateData: any = {
          status: isPaid ? 'completed' : 'processing',
          updated_at: new Date().toISOString(),
        }
        
        // Se temos o charge ID, salvar também
        if (isPaid && paidChargeId) {
          updateData.charge_id = paidChargeId
        }
        
        // Se temos o order ID, salvar também
        if (isPaid && orderId) {
          updateData.order_id = orderId
        }
        
        // Se detectamos o método de pagamento real, atualizar
        if (isPaid && actualPaymentMethod !== 'unknown') {
          updateData.payment_method = actualPaymentMethod
        }
        
        // Salvar detalhes do pagamento para referência futura
        if (isPaid && paidChargeId) {
          // Buscar os detalhes completos do charge para salvar
          try {
            const chargeUrl = `${env === 'production' ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com'}/charges/${paidChargeId}`
            const chargeResponse = await fetch(chargeUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (chargeResponse.ok) {
              const chargeData = await chargeResponse.json()
              const paymentMethod = chargeData.payment_method
              
              if (paymentMethod) {
                const paymentDetails: any = {
                  type: paymentMethod.type,
                }
                
                // Salvar detalhes específicos por tipo
                if (paymentMethod.type === 'CREDIT_CARD' || paymentMethod.type === 'DEBIT_CARD') {
                  paymentDetails.installments = paymentMethod.installments
                  if (paymentMethod.card) {
                    paymentDetails.card = {
                      brand: paymentMethod.card.brand,
                      first_digits: paymentMethod.card.first_digits,
                      last_digits: paymentMethod.card.last_digits,
                    }
                  }
                }
                
                updateData.payment_details = paymentDetails
                console.log('💳 Detalhes do pagamento salvos:', paymentDetails)
              }
            }
          } catch (error) {
            console.error('⚠️ Erro ao buscar detalhes do pagamento:', error)
            // Continua sem salvar detalhes
          }
        }

        const { error: updateError } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('transaction_code', transactionCode)

        if (updateError) {
          console.error('Erro ao atualizar transação:', updateError)
        } else {
          console.log(`✅ Transaction ${transactionCode} atualizada para ${isPaid ? 'completed' : 'processing'} no Supabase`)
          if (paidChargeId) {
            console.log(`✅ Charge ID ${paidChargeId} salvo para estornos futuros`)
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar transação:', error)
      }
    }

    return NextResponse.json({
      success: true,
      transactionCode,
      checkoutStatus: checkoutData.status,
      paid: isPaid,
      chargeId: paidChargeId,
      amount: paidAmount,
    }, { status: 200 })
  } catch (error) {
    console.error('❌ Erro ao consultar status:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar status da transação', details: String(error) },
      { status: 500 }
    )
  }
}
