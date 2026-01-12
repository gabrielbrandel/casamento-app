import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentMethod } = await req.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'orderId e paymentMethod são obrigatórios' },
        { status: 400 }
      );
    }

    const token = process.env.PAGSEGURO_TOKEN;
    const env = process.env.PAGSEGURO_ENV || 'sandbox';

    if (!token) {
      return NextResponse.json(
        { error: 'Token não configurado' },
        { status: 500 }
      );
    }

    const baseUrl = env === 'production' 
      ? 'https://api.pagseguro.com/orders'
      : 'https://sandbox.api.pagseguro.com/orders';

    const payUrl = `${baseUrl}/${orderId}/pay`;

    console.log('💳 Fazendo POST em /pay com:', { orderId, paymentMethod });

    // Monta o payload baseado no método de pagamento
    let payPayload: any = {};
    
    if (paymentMethod === 'pix') {
      payPayload = {
        charges: [
          {
            payment_method: {
              type: 'PIX',
            },
          },
        ],
      };
    } else if (paymentMethod === 'cartao') {
      // Para cartão, usamos uma URL de redirecionamento simples
      payPayload = {
        charges: [
          {
            payment_method: {
              type: 'CREDIT_CARD',
            },
          },
        ],
      };
    }

    const payResponse = await fetch(payUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payPayload),
    });

    const payResponseText = await payResponse.text();
    console.log('💳 Pay Response Status:', payResponse.status);
    console.log('💳 Pay Response Body:', payResponseText);

    if (!payResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Erro ao processar pagamento',
          details: payResponseText,
          status: payResponse.status,
        },
        { status: payResponse.status }
      );
    }

    let payData;
    try {
      payData = JSON.parse(payResponseText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Resposta inválida do PagSeguro', details: payResponseText },
        { status: 500 }
      );
    }

    // Procura por redirect_url nos links
    const redirectLink = payData.links?.find((link: any) => link.rel === 'REDIRECT');
    const redirectUrl = payData.redirect_url || redirectLink?.href;

    console.log('🔗 Redirect URL encontrada:', redirectUrl);

    return NextResponse.json({
      success: true,
      redirectUrl: redirectUrl || payUrl,
      paymentData: payData,
    });
  } catch (error) {
    console.error('❌ Erro no endpoint /pay:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
