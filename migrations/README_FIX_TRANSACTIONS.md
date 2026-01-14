# 🔧 Correção: Transações não estão sendo salvas

## Problema Identificado

O erro ocorre porque a API está tentando salvar o campo `order_id` na tabela `transactions`, mas essa coluna não existe no banco de dados.

```
Error: Could not find the 'order_id' column of 'transactions' in the schema cache
```

## Solução

### Opção 1: Aplicar Migration via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/swxihvypxowniugmvwml/sql/new

2. **Execute o script SQL:**
   - Copie o conteúdo do arquivo `migrations/APPLY_MIGRATION_002.sql`
   - Cole no SQL Editor do Supabase
   - Clique em "Run"

3. **Verifique se funcionou:**
   - O resultado deve mostrar uma tabela com todas as colunas incluindo `order_id`

### Opção 2: Usar CLI do Supabase (se instalado)

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

### Opção 3: Aplicar via psql

```bash
# Conecte ao banco
psql "postgres://postgres.swxihvypxowniugmvwml:2Pfeiom89###@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Execute a migration
\i migrations/002_add_order_id_to_transactions.sql
```

## O que foi Alterado

1. ✅ Criada migration `002_add_order_id_to_transactions.sql`
2. ✅ Adicionada coluna `order_id VARCHAR(255)` na tabela `transactions`
3. ✅ Criado índice para melhor performance
4. ✅ Adicionado trigger para atualizar `updated_at` automaticamente

## Testando a Correção

Após aplicar a migration:

1. Faça uma nova compra no site
2. Verifique o painel admin → Transações
3. A transação deve aparecer com todos os dados incluindo:
   - `transaction_code` (código do checkout)
   - `order_id` (ID do pedido quando o pagamento for aprovado)
   - Todos os outros campos

## Por que isso aconteceu?

A coluna `order_id` é necessária para armazenar o ID do pedido retornado pelo PagBank quando o pagamento é aprovado. O checkout retorna um ID, mas quando o usuário paga, o PagBank cria um ORDER (pedido) com outro ID. Precisamos armazenar ambos para rastreamento completo.

## Estrutura Final da Tabela

```sql
transactions (
  id BIGSERIAL PRIMARY KEY,
  gift_id VARCHAR(255),
  transaction_code VARCHAR(255) UNIQUE,  -- ID do checkout
  order_id VARCHAR(255),                  -- ID do pedido (NOVO!)
  amount DECIMAL(10, 2),
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  payment_method VARCHAR(50),
  status VARCHAR(50),
  payment_response JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Logs de Debug

No console você verá:
- `✅ Transação salva no banco: { success: true, transaction: {...} }`

Se ver erro, copie os logs e me avise!
