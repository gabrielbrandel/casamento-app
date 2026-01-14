import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    const { transactionCode, orderId, amount } = await req.json()

    if (!transactionCode) {
      return NextResponse.json(
        { error: 'Código da transação é obrigatório' },
        { status: 400 }
      )
    }

    const token = process.env.PAGSEGURO_TOKEN
    const env = process.env.PAGSEGURO_ENV || 'sandbox'

    if (!token) {
      return NextResponse.json(
        { 
          error: 'Configuração de pagamento não encontrada',
          help: 'Defina PAGSEGURO_TOKEN nas variáveis de ambiente'
        },
        { status: 500 }
      )
    }

    // URL base conforme ambiente
    const baseUrl = env === 'production' 
      ? 'https://api.pagseguro.com'
      : 'https://sandbox.api.pagseguro.com'

    console.log('🔄 Iniciando estorno PagBank:', {
      env,
      transactionCode,
      orderId,
      amount: amount?.toFixed(2),
    })

    // Primeiro, tentar buscar o charge_id do banco
    let chargeId = null
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('charge_id, order_id')
          .eq('transaction_code', transactionCode)
          .single()

        if (!error && data) {
          chargeId = data.charge_id
          console.log('✅ Charge ID encontrado no banco:', chargeId)
        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar charge_id do banco:', error)
      }
    }

    // Se não tem no banco, precisamos buscar o Charge ID da API do PagBank
    // O transactionCode é o Checkout ID, precisamos buscar o Charge ID
    if (!chargeId) {
      try {
        const checkoutUrl = `${baseUrl}/checkouts/${transactionCode}`
        console.log('🔍 Buscando checkout:', checkoutUrl)
        
        const checkoutResponse = await fetch(checkoutUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (checkoutResponse.ok) {
          const checkoutData = await checkoutResponse.json()
          console.log('✅ Checkout encontrado:', checkoutData)

          // Buscar o charge ID dos orders
          if (checkoutData.orders && checkoutData.orders.length > 0) {
            const orderUrl = `${baseUrl}/orders/${checkoutData.orders[0].id}`
            console.log('🔍 Buscando order:', orderUrl)
            
            const orderResponse = await fetch(orderUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            if (orderResponse.ok) {
              const orderData = await orderResponse.json()
              console.log('✅ Order encontrada:', orderData)

              // Pegar o charge ID
              if (orderData.charges && orderData.charges.length > 0) {
                chargeId = orderData.charges[0].id
                console.log('✅ Charge ID encontrado:', chargeId)
              }
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar Charge ID da API:', error)
      }
    }

    // Se não conseguiu buscar o charge ID, tenta usar o orderId ou transactionCode
    if (!chargeId) {
      chargeId = orderId || transactionCode
      console.log('⚠️ Usando fallback para Charge ID:', chargeId)
    }

    // Verificar se há valor disponível para estorno antes de tentar
    let availableForRefund = 0
    let alreadyRefunded = 0
    let totalAmount = 0
    
    try {
      const chargeUrl = `${baseUrl}/charges/${chargeId}`
      const chargeResponse = await fetch(chargeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (chargeResponse.ok) {
        const chargeData = await chargeResponse.json()
        totalAmount = chargeData.amount?.summary?.total || 0
        alreadyRefunded = chargeData.amount?.summary?.refunded || 0
        availableForRefund = totalAmount - alreadyRefunded
        
        console.log('💰 Valores do charge:', {
          total: `R$ ${(totalAmount / 100).toFixed(2)}`,
          alreadyRefunded: `R$ ${(alreadyRefunded / 100).toFixed(2)}`,
          availableForRefund: `R$ ${(availableForRefund / 100).toFixed(2)}`,
        })

        // Se já foi totalmente estornado ou não há valor disponível
        if (availableForRefund <= 0) {
          return NextResponse.json({
            error: 'Transação já foi estornada',
            message: `Esta transação já foi totalmente estornada. Valor estornado: R$ ${(alreadyRefunded / 100).toFixed(2)}`,
            alreadyRefunded: alreadyRefunded,
          }, { status: 400 })
        }

        // Se o valor solicitado é maior que o disponível, avisar
        const requestedAmount = Math.round((amount || 0) * 100)
        if (requestedAmount > availableForRefund) {
          console.log(`⚠️ Valor solicitado (R$ ${(requestedAmount / 100).toFixed(2)}) é maior que o disponível (R$ ${(availableForRefund / 100).toFixed(2)})`)
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao verificar valor disponível:', error)
      // Continua com o estorno mesmo sem verificar
    }

    // Tentar estorno usando o charge ID
    let refundUrl = `${baseUrl}/charges/${chargeId}/cancel`
    
    console.log('📤 Tentando estorno na URL:', refundUrl)

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          value: Math.round((amount || 0) * 100), // Valor em centavos
        },
      }),
    })

    const responseText = await response.text()
    console.log('📥 PagBank Refund Response Status:', response.status)
    console.log('📥 PagBank Refund Response Body:', responseText)

    let refundData
    try {
      refundData = JSON.parse(responseText)
    } catch (e) {
      refundData = { raw: responseText }
    }

    // Se o estorno falhar, retornar erro detalhado
    if (!response.ok) {
      try {
        const jsonError = JSON.parse(responseText)
        return NextResponse.json(
          { 
            error: 'Erro ao processar estorno no PagBank',
            message: jsonError.error_messages?.[0]?.description || jsonError.message || 'Erro desconhecido',
            details: jsonError,
            chargeIdUsed: chargeId,
          },
          { status: response.status }
        )
      } catch (e) {
        return NextResponse.json(
          { error: 'Erro ao processar estorno', details: responseText, chargeIdUsed: chargeId },
          { status: response.status }
        )
      }
    }

    // Consultar o charge novamente para verificar o status real após o estorno
    let chargeStatus = 'refunded'
    let refundedAmount = 0
    
    try {
      const chargeUrl = `${baseUrl}/charges/${chargeId}`
      const chargeResponse = await fetch(chargeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (chargeResponse.ok) {
        const chargeData = await chargeResponse.json()
        refundedAmount = chargeData.amount?.summary?.refunded || 0
        
        console.log('✅ Status do charge após estorno:', {
          status: chargeData.status,
          refundedAmount,
          totalAmount: chargeData.amount?.summary?.total,
        })

        // Se tem valor estornado, considera como refunded
        if (refundedAmount > 0) {
          chargeStatus = 'refunded'
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao consultar charge após estorno:', error)
      // Continua com status 'refunded' como padrão
    }

    // Atualizar status da transação no banco
    if (supabase) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: chargeStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('transaction_code', transactionCode)

      if (updateError) {
        console.error('⚠️ Erro ao atualizar status no banco:', updateError)
        // Continua mesmo com erro no banco, pois o estorno foi feito
      } else {
        console.log('✅ Status atualizado no banco para refunded')
      }
    }

    console.log('✅ Estorno realizado com sucesso')

    return NextResponse.json({
      success: true,
      refund: refundData,
      refundedAmount,
      chargeStatus,
      message: refundedAmount > 0 
        ? `Estorno de R$ ${(refundedAmount / 100).toFixed(2)} processado com sucesso` 
        : 'Estorno processado com sucesso',
    })
  } catch (error) {
    console.error('❌ Erro ao processar estorno:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar estorno',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
