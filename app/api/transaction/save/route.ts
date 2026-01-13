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

    const { giftId, transactionCode, orderId, amount, buyerEmail, buyerName, paymentMethod } = await req.json()

    if (!giftId || !transactionCode || !amount) {
      return NextResponse.json(
        { error: 'Dados incompletos (giftId, transactionCode, amount)' },
        { status: 400 }
      )
    }

    // Inserir transação no Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          gift_id: giftId,
          transaction_code: transactionCode,
          order_id: orderId || null,
          amount,
          buyer_email: buyerEmail,
          buyer_name: buyerName,
          payment_method: paymentMethod,
          status: 'processing',
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('Erro ao salvar transação:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar transação' },
        { status: 500 }
      )
    }

    console.log('✅ Transação salva:', data)

    return NextResponse.json({
      success: true,
      transaction: data?.[0],
    })
  } catch (error) {
    console.error('❌ Erro ao salvar transação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar transação' },
      { status: 500 }
    )
  }
}
