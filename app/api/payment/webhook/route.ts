import { NextRequest, NextResponse } from 'next/server';
import { upsertGift } from '@/lib/server-db';

export async function POST(req: NextRequest) {
  try {
    // PagSeguro envia notificações via POST com o código da transação
    const body = await req.text();
    const params = new URLSearchParams(body);
    const notificationCode = params.get('notificationCode') || '';
    const notificationType = params.get('notificationType') || '';

    if (!notificationCode) {
      return NextResponse.json({ error: 'Notification code missing' }, { status: 400 });
    }

    // Consulta detalhes da transação no PagSeguro
    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;
    const env = process.env.PAGSEGURO_ENV || 'sandbox';

    if (!email || !token) {
      return NextResponse.json({ error: 'Payment config missing' }, { status: 500 });
    }

    const baseUrl = env === 'production'
      ? 'https://ws.pagseguro.uol.com.br'
      : 'https://ws.sandbox.pagseguro.uol.com.br';

    const transactionUrl = `${baseUrl}/v3/transactions/notifications/${notificationCode}?email=${email}&token=${token}`;

    const response = await fetch(transactionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml; charset=ISO-8859-1',
      },
    });

    const xmlResponse = await response.text();

    if (!response.ok) {
      console.error('PagSeguro transaction query failed:', xmlResponse);
      return NextResponse.json({ error: 'Failed to query transaction' }, { status: response.status });
    }

    // Parse XML para extrair status e informações
    const statusMatch = xmlResponse.match(/<status>(\d+)<\/status>/);
    const referenceMatch = xmlResponse.match(/<reference>(.*?)<\/reference>/);
    const grossAmountMatch = xmlResponse.match(/<grossAmount>([\d.]+)<\/grossAmount>/);
    const senderNameMatch = xmlResponse.match(/<name>(.*?)<\/name>/);
    const senderEmailMatch = xmlResponse.match(/<email>(.*?)<\/email>/);

    const status = statusMatch ? parseInt(statusMatch[1]) : 0;
    const giftId = referenceMatch ? referenceMatch[1] : '';
    const amount = grossAmountMatch ? grossAmountMatch[1] : '0';
    const buyerName = senderNameMatch ? senderNameMatch[1] : '';
    const buyerEmail = senderEmailMatch ? senderEmailMatch[1] : '';

    console.log('Payment webhook received:', {
      status,
      giftId,
      amount,
      buyerName,
      notificationType,
    });

    // Status do PagSeguro:
    // 1 = Aguardando pagamento
    // 2 = Em análise
    // 3 = Paga
    // 4 = Disponível
    // 5 = Em disputa
    // 6 = Devolvida
    // 7 = Cancelada

    // Atualiza gift apenas se pagamento for confirmado (status 3 ou 4)
    if (status === 3 || status === 4) {
      try {
        // Busca gift atual para manter todos os dados
        const giftsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gifts`);
        const gifts = await giftsResponse.json();
        const currentGift = gifts.find((g: any) => g.id === giftId);

        if (currentGift) {
          await upsertGift({
            ...currentGift,
            status: 'comprado',
            compradoPor: buyerName,
            tipoPagamento: 'cartao',
          });

          console.log(`Gift ${giftId} marked as purchased by ${buyerName}`);
        } else {
          console.warn(`Gift ${giftId} not found in database`);
        }
      } catch (dbError) {
        console.error('Failed to update gift in database:', dbError);
        // Não retorna erro para PagSeguro mesmo se falhar no DB
        // Isso evita reenvios infinitos da notificação
      }
    }

    // Retorna 200 para PagSeguro parar de reenviar notificação
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
