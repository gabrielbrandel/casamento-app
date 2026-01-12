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
              
              console.log('✅ Pagamento confirmado!', {
                orderId: orderId,
                chargeId: paidChargeId,
                amount: paidAmount,
                paidAt: paidCharge.paid_at,
              })
              
              // Marcar o gift como comprado/pago
              const giftId = orderData.reference_id || checkoutData.reference_id
              if (giftId) {
                try {
                  const markPaidResponse = await fetch(
                    `${new URL(req.url).origin}/api/gifts/mark-paid`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ giftId }),
                    }
                  )
                  
                  if (markPaidResponse.ok) {
                    console.log(`✅ Gift ${giftId} marcado como comprado`)
                  }
                } catch (error) {
                  console.error(`Erro ao marcar gift como pago:`, error)
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
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: isPaid ? 'PAID' : 'PROCESSING',
          })
          .eq('transaction_code', transactionCode)

        if (updateError) {
          console.error('Erro ao atualizar transação:', updateError)
        } else {
          console.log(`✅ Transaction ${transactionCode} atualizada para ${isPaid ? 'PAID' : 'PROCESSING'} no Supabase`)
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
