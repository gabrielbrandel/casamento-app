import { NextRequest, NextResponse } from 'next/server'
import { markGiftAsPaid } from '@/lib/mark-gift-paid'

export async function POST(req: NextRequest) {
  try {
    const { giftId } = await req.json()

    if (!giftId) {
      return NextResponse.json(
        { error: 'giftId é obrigatório' },
        { status: 400 }
      )
    }

    const result = await markGiftAsPaid(giftId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao marcar presente como pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao marcar presente como pago:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar presente', details: String(error) },
      { status: 500 }
    )
  }
}
