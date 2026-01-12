# Sistema de Transações de Pagamento

## Estrutura Implementada

### 1. **Tabela de Transações** (`transactions`)
Armazena todas as transações de pagamento com os seguintes campos:
- `transaction_code`: Código único da transação (ID do PagBank)
- `gift_id`: ID do presente associado
- `amount`: Valor da transação
- `buyer_name`: Nome do comprador
- `buyer_email`: Email do comprador
- `payment_method`: Método de pagamento (pix/cartao)
- `status`: Status da transação (processing/completed/failed)
- `payment_response`: Resposta completa do PagBank em JSON
- `created_at` / `updated_at`: Timestamps

### 2. **API Endpoints**

#### `/api/transaction/save` (POST)
Salva uma nova transação no banco de dados
```json
{
  "giftId": "123",
  "transactionCode": "ABC123DEF456",
  "amount": 150.50,
  "buyerEmail": "comprador@email.com",
  "buyerName": "João Silva",
  "paymentMethod": "pix"
}
```

#### `/api/transaction/check-status` (POST)
Consulta o status de uma transação no PagBank
```json
{
  "transactionCode": "ABC123DEF456"
}
```

### 3. **Sistema de Polling** (`lib/transaction-poller.ts`)

#### `startPollingTransaction(transactionCode)`
Inicia verificação periódica (a cada 30 segundos) do status da transação

#### `stopPollingTransaction(transactionCode)`
Para o polling de uma transação

#### `resumeActivePolling()`
Retoma polling de transações pendentes ao iniciar a aplicação

### 4. **Fluxo de Pagamento Atualizado**

1. Usuário preenche formulário → clica "Ir para Pagamento"
2. API `/api/payment/create` é chamada
3. Checkout é criado no PagBank → retorna `checkoutUrl` e `transactionCode`
4. Transação é salva no Supabase via `/api/transaction/save`
5. Polling é iniciado via `startPollingTransaction()`
6. Checkout é aberto em nova aba
7. A cada 30 segundos, o sistema consulta o status via `/api/transaction/check-status`
8. Quando pagamento é confirmado (status = PAID), gift é marcado como "comprado"
9. Polling é parado automaticamente

## Setup Necessário

### 1. **Criar a Tabela no Supabase**

Execute o SQL em `migrations/001_create_transactions_table.sql`:

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  gift_id VARCHAR(255) NOT NULL,
  transaction_code VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
  payment_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (gift_id) REFERENCES gifts(id)
);

CREATE INDEX idx_transactions_gift_id ON transactions(gift_id);
CREATE INDEX idx_transactions_transaction_code ON transactions(transaction_code);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 2. **Variáveis de Ambiente**
Certifique-se de que estas variáveis estão configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PAGSEGURO_TOKEN`
- `PAGSEGURO_EMAIL`
- `PAGSEGURO_ENV` (sandbox ou production)

## Arquivos Criados/Modificados

### Criados:
- `lib/supabase-client.ts` - Cliente Supabase
- `app/api/transaction/save/route.ts` - Endpoint para salvar transação
- `app/api/transaction/check-status/route.ts` - Endpoint para verificar status
- `lib/transaction-poller.ts` - Sistema de polling
- `components/transaction-poller-provider.tsx` - Provider para inicializar polling
- `migrations/001_create_transactions_table.sql` - SQL da tabela

### Modificados:
- `app/providers.tsx` - Adicionado TransactionPollerProvider
- `app/api/payment/create/route.ts` - Integra salvar transação após criação
- `components/gift-modal.tsx` - Inicia polling ao abrir checkout

## Monitoramento

O sistema mantém um registro completo de todas as transações:
- Você pode consultar o Supabase para ver histórico de pagamentos
- Status é atualizado automaticamente a cada 30 segundos
- Resposta completa do PagBank é armazenada em `payment_response`

## Próximos Passos

1. Executar o SQL de migração no Supabase
2. Testar o fluxo completo de pagamento
3. Monitorar logs de polling no console do navegador
4. Configurar webhook do PagBank para confirmar pagamentos em tempo real (opcional)
