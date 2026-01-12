import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { giftId, giftName, amount, buyerName, buyerEmail, buyerCpf, paymentMethod } = await req.json();

    if (!giftId || !giftName || !amount || !buyerName || !buyerEmail || !buyerCpf || !paymentMethod) {
      return NextResponse.json(
        { error: 'Dados incompletos. Verifique os campos obrigatórios (nome, email, CPF).' },
        { status: 400 }
      );
    }

    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;
    const env = process.env.PAGSEGURO_ENV || 'sandbox';

    if (!email || !token) {
      return NextResponse.json(
        { 
          error: 'Configuração de pagamento não encontrada',
          help: 'Defina PAGSEGURO_EMAIL e PAGSEGURO_TOKEN nas variáveis de ambiente'
        },
        { status: 500 }
      );
    }

    // URL base conforme ambiente - usando v3 (PagBank) - Checkouts
    const baseUrl = env === 'production' 
      ? 'https://api.pagseguro.com/checkouts'
      : 'https://sandbox.api.pagseguro.com/checkouts';
    
    console.log('⚙️ Configuração PagBank v3:', {
      env,
      baseUrl,
      emailConfigured: !!email,
      tokenConfigured: !!token,
    });

    // Formata CPF para o padrão esperado
    const cleanCpf = buyerCpf.replace(/\D/g, '');

    // Monta JSON para API v3 do PagBank - Checkouts
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const jsonData = {
      reference_id: String(giftId),
      items: [
        {
          name: giftName,
          quantity: 1,
          unit_amount: Math.round(amount * 100),
        }
      ],
      customer: {
        name: buyerName,
        email: buyerEmail,
        tax_id: cleanCpf,
      },
      checkout_url: `${appUrl}/pagamento/sucesso?gift=${giftId}`,
      metadata: {
        gift_id: giftId,
      },
    };

    console.log('🔍 PagBank Request:', {
      url: baseUrl,
      giftId,
      amount: amount.toFixed(2),
      buyerName,
      emailConfigured: !!email,
    });

    // Faz request com Bearer token no header
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    const responseText = await response.text();

    console.log('📥 PagBank Response Status:', response.status);
    console.log('📥 PagBank Response Body:', responseText);

    if (!response.ok) {
      let errorMessage = responseText;
      try {
        const jsonError = JSON.parse(responseText);
        errorMessage = jsonError.message || JSON.stringify(jsonError);
      } catch (e) {
        // Se não for JSON, usa o texto mesmo
      }

      return NextResponse.json(
        { 
          error: 'Erro ao criar pagamento no PagBank',
          message: errorMessage,
          status: response.status,
          details: responseText,
        },
        { status: response.status }
      );
    }

    // Parse resposta JSON v3
    let checkoutData;
    try {
      checkoutData = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Resposta inválida do PagBank', details: responseText },
        { status: 500 }
      );
    }

    // Extrair o link do checkout da resposta
    // Pode vir em checkouts[0] ou direto em links
    let checkoutUrl = null;
    
    if (checkoutData.checkouts && checkoutData.checkouts.length > 0) {
      const checkout = checkoutData.checkouts[0];
      const payLink = checkout.links?.find((link: any) => link.rel === 'PAY');
      checkoutUrl = payLink?.href;
    } else if (checkoutData.links) {
      const payLink = checkoutData.links.find((link: any) => link.rel === 'PAY');
      checkoutUrl = payLink?.href;
    }

    console.log('🔗 Resposta completa:', JSON.stringify(checkoutData, null, 2));
    console.log('🔗 Checkout URL extraída:', checkoutUrl);

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Checkout link não encontrado', details: JSON.stringify(checkoutData) },
        { status: 500 }
      );
    }

    // Extrair transaction code/id da resposta
    // Prioritária: tentar get checkouts[0].id primeiro, depois o ID do checkout principal
    let transactionCode = null
    if (checkoutData.checkouts && checkoutData.checkouts.length > 0) {
      // Tentar pegar o ID da primeira charge dentro do checkout
      const firstCheckout = checkoutData.checkouts[0]
      transactionCode = firstCheckout.id || firstCheckout.reference_id
    }
    // Se não conseguir do checkout, usar o ID principal
    if (!transactionCode) {
      transactionCode = checkoutData.id
    }

    console.log('✅ Pagamento criado com sucesso:', {
      checkoutId: checkoutData.id,
      firstCheckoutId: checkoutData.checkouts?.[0]?.id,
      transactionCode,
      checkoutUrl,
    });

    // Salvar transação no Supabase
    if (transactionCode) {
      try {
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transaction/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            giftId,
            transactionCode,
            amount,
            buyerEmail,
            buyerName,
            paymentMethod,
          }),
        });

        const saveData = await saveResponse.json();
        console.log('💾 Transação salva no banco:', saveData);
      } catch (saveError) {
        console.error('⚠️ Erro ao salvar transação:', saveError);
        // Continua mesmo se falhar ao salvar a transação
      }
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      orderId: checkoutData.id || checkoutData.checkouts?.[0]?.id,
      transactionCode,
    });
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
