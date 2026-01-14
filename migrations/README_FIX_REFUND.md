# 🔧 Correção: Estorno requer Charge ID

## Problema Identificado

O estorno estava falhando porque estava tentando usar o **Checkout ID** (`CHEC_`) em vez do **Charge ID** (`CHAR_`).

```
Error: Invalid parameter chargeId: CHEC_902097C3-B439-4A51-8C0D-25CAF862BE29
```

O PagBank precisa do Charge ID para processar estornos, não do Checkout ID.

## Solução Implementada

### 1. **Nova coluna `charge_id`**
Agora salvamos o Charge ID no banco quando o pagamento é confirmado.

### 2. **API de estorno melhorada**
A API agora:
1. ✅ Busca o `charge_id` do banco primeiro (mais rápido)
2. ✅ Se não encontrar, busca da API do PagBank (consultando checkout → order → charge)
3. ✅ Usa o Charge ID correto para fazer o estorno

### 3. **API de check-status atualizada**
Quando detecta pagamento confirmado, salva:
- `charge_id` - para estornos
- `order_id` - para referência
- `status` - atualizado para "completed"

## 🔧 Como Aplicar

### Passo 1: Adicionar coluna no banco

Execute no Supabase SQL Editor:
```sql
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS charge_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_transactions_charge_id ON transactions(charge_id);
```

### Passo 2: Atualizar registros antigos

Para as transações antigas que não têm `charge_id`, você tem 2 opções:

**Opção A - Deixar vazio (recomendado):**
O sistema vai buscar automaticamente quando você tentar estornar.

**Opção B - Popular manualmente:**
No painel admin, clique em "Consultar" em cada transação paga. Isso vai buscar e salvar o `charge_id` automaticamente.

## 🎯 Como Funciona Agora

### Fluxo de Estorno:
1. Usuário clica em "Estornar"
2. Sistema busca `charge_id` do banco
3. Se não encontrar, busca da API do PagBank:
   - Consulta Checkout → pega Order ID
   - Consulta Order → pega Charge ID
4. Faz estorno usando o Charge ID correto
5. Atualiza status para "refunded"

### Exemplo de Log:
```
🔄 Iniciando estorno PagBank
✅ Charge ID encontrado no banco: CHAR_4EF46B98-E727-42A0-BE49-FA4E6A18B51F
📤 Tentando estorno na URL: https://sandbox.api.pagseguro.com/charges/CHAR_.../cancel
✅ Estorno realizado com sucesso
✅ Status atualizado no banco para refunded
```

## 📝 Estrutura Atualizada

```typescript
transactions {
  id
  gift_id
  transaction_code  // CHEC_... (Checkout ID)
  order_id         // ORDE_... (Order ID) 
  charge_id        // CHAR_... (Charge ID) - NOVO!
  amount
  status
  ...
}
```

## ✅ Testando

1. Faça uma compra de teste
2. Clique em "Consultar" na transação
3. Quando o pagamento for aprovado, o `charge_id` será salvo
4. Clique em "Estornar"
5. O estorno deve funcionar corretamente usando o Charge ID

Agora os estornos devem funcionar perfeitamente! 🎉
