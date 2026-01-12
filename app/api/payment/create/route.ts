import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { giftId, giftName, amount, buyerName, buyerEmail, paymentMethod } = await req.json();

    if (!giftId || !giftName || !amount || !buyerName || !buyerEmail || !paymentMethod) {
      return NextResponse.json(
        { error: 'Dados incompletos. Verifique os campos obrigatórios.' },
        { status: 400 }
      );
    }

    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;
    const env = process.env.PAGSEGURO_ENV || 'sandbox';

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Configuração de pagamento não encontrada' },
        { status: 500 }
      );
    }

    // URL base conforme ambiente
    const baseUrl = env === 'production' 
      ? 'https://ws.pagseguro.uol.com.br/v2/checkout'
      : 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout';

    // Monta XML da requisição PagSeguro
    const xmlData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<checkout>
  <currency>BRL</currency>
  <items>
    <item>
      <id>${giftId}</id>
      <description>${giftName}</description>
      <amount>${Number(amount).toFixed(2)}</amount>
      <quantity>1</quantity>
    </item>
  </items>
  <sender>
    <name>${buyerName}</name>
    <email>${buyerEmail}</email>
  </sender>
  <shipping>
    <addressRequired>false</addressRequired>
  </shipping>
  <redirectURL>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pagamento/sucesso?gift=${giftId}</redirectURL>
  <notificationURL>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/webhook</notificationURL>
  <maxUses>1</maxUses>
  <maxAge>3600</maxAge>
  <enableRecover>true</enableRecover>
</checkout>`;

    // Faz request para PagSeguro
    const response = await fetch(`${baseUrl}?email=${email}&token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
      },
      body: xmlData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('PagSeguro error:', responseText);
      return NextResponse.json(
        { error: 'Erro ao criar pagamento', details: responseText },
        { status: response.status }
      );
    }

    // Parse XML response
    const codeMatch = responseText.match(/<code>(.*?)<\/code>/);
    const code = codeMatch ? codeMatch[1] : null;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de pagamento não encontrado', details: responseText },
        { status: 500 }
      );
    }

    // URL de checkout conforme ambiente
    const checkoutUrl = env === 'production'
      ? `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${code}`
      : `https://sandbox.pagseguro.uol.com.br/v2/checkout/payment.html?code=${code}`;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      paymentCode: code,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
