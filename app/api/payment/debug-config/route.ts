import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const email = process.env.PAGSEGURO_EMAIL;
    const token = process.env.PAGSEGURO_TOKEN;
    const env = process.env.PAGSEGURO_ENV || 'sandbox';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const baseUrl = env === 'production' 
      ? 'https://api.pagseguro.com/checkouts'
      : 'https://sandbox.api.pagseguro.com/checkouts';

    // Informações de configuração (sem expor o token completo)
    const configInfo = {
      email: {
        configured: !!email,
        value: email,
      },
      token: {
        configured: !!token,
        length: token?.length,
        prefix: token?.substring(0, 10) + '...',
        suffix: '...' + token?.substring(token.length - 10),
      },
      environment: {
        pagseguroEnv: env,
        nodeEnv: process.env.NODE_ENV,
        baseUrl,
        appUrl,
      },
      allPagseguroVars: Object.keys(process.env)
        .filter(k => k.includes('PAGSEGURO'))
        .map(k => ({
          name: k,
          configured: !!process.env[k],
          length: process.env[k]?.length,
        })),
    };

    // Teste de conectividade com a API do PagBank
    let apiTest = null;
    if (email && token) {
      try {
        const testResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference_id: 'test-config',
            items: [{
              name: 'Teste de Configuração',
              quantity: 1,
              unit_amount: 100,
            }],
            customer: {
              name: 'Teste',
              email: 'teste@teste.com',
              tax_id: '12345678909',
            },
          }),
        });

        const testText = await testResponse.text();
        
        apiTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          ok: testResponse.ok,
          responsePreview: testText.substring(0, 500),
        };
      } catch (testError) {
        apiTest = {
          error: testError instanceof Error ? testError.message : 'Unknown error',
        };
      }
    }

    // Detectar erro específico de allowlist
    const isAllowlistError = apiTest?.responsePreview?.includes('allowlist_access_required');
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      config: configInfo,
      apiTest,
      recommendations: [
        !email && '❌ PAGSEGURO_EMAIL não configurado',
        !token && '❌ PAGSEGURO_TOKEN não configurado',
        token && token.length < 30 && '⚠️ Token parece muito curto, verifique se está correto',
        env === 'sandbox' && '⚠️ Ambiente está em SANDBOX, para produção use PAGSEGURO_ENV=production',
        apiTest?.status === 401 && '❌ Token inválido ou expirado - gere um novo token no painel do PagBank',
        apiTest?.status === 403 && isAllowlistError && '🚨 CONTA NÃO LIBERADA: Entre em contato com o PagBank para liberar sua conta para uso da API de produção',
        apiTest?.status === 403 && !isAllowlistError && '❌ Token sem permissões necessárias - verifique as permissões no painel',
        apiTest?.ok && '✅ Configuração OK! API respondeu corretamente',
      ].filter(Boolean),
      helpUrl: isAllowlistError ? 'https://dev.pagseguro.uol.com.br/docs/integracao-e-homologacao' : null,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao verificar configuração', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
