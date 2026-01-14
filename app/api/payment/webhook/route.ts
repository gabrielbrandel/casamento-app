import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // PagBank v4 envia notificações em JSON
    const body = await req.json();
    
    console.log('🔔 Webhook PagBank recebido:', JSON.stringify(body, null, 2));

    // Extrair informações da notificação
    const { id, reference_id, charges } = body;
    
    if (!id) {
      console.error('❌ Webhook sem ID de transação');
      return NextResponse.json({ error: 'Transaction ID missing' }, { status: 400 });
    }

    // Processar a notificação chamando o check-status
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      const checkResponse = await fetch(`${appUrl}/api/transaction/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionCode: id }),
      });

      const checkData = await checkResponse.json();
      console.log('✅ Webhook processado:', checkData);

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed',
        transactionCode: id,
        paid: checkData.paid,
      });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to process webhook',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Erro ao parsear webhook:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
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
