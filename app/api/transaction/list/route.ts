import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado' },
        { status: 500 }
      )
    }

    // Buscar todas as transações ordenadas por data (mais recentes primeiro)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      )
    }

    console.log(`✅ Buscadas ${data?.length || 0} transações`)

    return NextResponse.json({
      success: true,
      transactions: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}
