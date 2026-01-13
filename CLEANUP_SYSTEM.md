# Sistema de Limpeza Automática de Transações

## Visão Geral

Este sistema monitora e limpa automaticamente transações de pagamento que ficam em estado "processing" por mais de 1 hora, liberando os presentes novamente para outros usuários.

## Como Funciona

### 1. Fluxo Normal
1. Usuário seleciona um presente
2. Presente vai para status "processando_pagamento"
3. Transação é salva no Supabase com status "processing"
4. Usuário é redirecionado para o PagSeguro
5. Se o pagamento for confirmado:
   - Transação → "PAID"
   - Presente → "comprado"

### 2. Fluxo de Abandono
Se o usuário **não completar o pagamento** em 1 hora:
- A transação é automaticamente deletada
- O presente volta para "disponivel"
- Outro usuário pode selecionar o presente

## Endpoints

### `/api/transaction/cleanup-old` (POST)
Limpa transações antigas manualmente.

**Uso:**
```bash
POST http://localhost:3000/api/transaction/cleanup-old
```

**Resposta:**
```json
{
  "success": true,
  "message": "Limpeza concluída: 3 transações removidas, 0 erros",
  "cleaned": 3,
  "errors": 0,
  "details": [...]
}
```

### `/api/cron/cleanup-transactions` (GET)
Endpoint para ser chamado por cron jobs automáticos.

**Configuração Vercel Cron:**
O arquivo `vercel.json` já está configurado para executar a cada hora:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-transactions",
    "schedule": "0 * * * *"
  }]
}
```

**Segurança (Opcional):**
Para proteger o endpoint, adicione no `.env`:
```
CRON_SECRET=seu-segredo-aqui
```

E chame o endpoint com header:
```
Authorization: Bearer seu-segredo-aqui
```

## Botão Manual no Admin

No painel administrativo existe um botão "Limpar Transações Antigas" que:
1. Mostra confirmação antes de executar
2. Exibe loading durante a execução
3. Mostra toast com o resultado
4. Recarrega a página automaticamente

## Dados Salvos

### Transações (Supabase)
Cada transação salva agora inclui:
- `transaction_code`: ID do checkout
- `order_id`: ID da ordem (facilita consultas)
- `status`: "processing" ou "PAID"
- `created_at`: Timestamp de criação
- `gift_id`: Referência ao presente

### Lógica de Limpeza
```sql
-- Busca transações antigas
SELECT * FROM transactions 
WHERE status = 'processing' 
  AND created_at < NOW() - INTERVAL '1 hour'

-- Para cada uma:
-- 1. Atualiza presente: UPDATE gifts SET status = 'disponivel'
-- 2. Deleta transação: DELETE FROM transactions WHERE id = ?
```

## Monitoramento

### Logs
Todos os eventos são logados no console:
- `🧹 Encontradas X transações antigas para limpar`
- `✅ Gift X voltou para disponível`
- `🗑️ Transação X deletada`

### Admin Panel
O painel mostra:
- Total de presentes comprados
- Presentes pendentes de conferência
- Botão para limpeza manual

## Testes

### Teste Manual
1. Selecione um presente
2. Vá para o checkout mas **não pague**
3. Espere 1 hora (ou ajuste o tempo no código para testes)
4. Execute o cleanup manualmente no admin
5. Verifique se o presente voltou para "disponivel"

### Teste Rápido (Dev)
Altere temporariamente em `cleanup-old/route.ts`:
```typescript
// De:
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

// Para (1 minuto):
const oneHourAgo = new Date(Date.now() - 60 * 1000).toISOString()
```

## Variáveis de Ambiente

```env
# Obrigatórias
POSTGRES_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://seu-site.vercel.app

# Opcionais
CRON_SECRET=seu-segredo-para-proteger-o-cron
```

## Deployment

### Vercel
O cron job será automaticamente configurado no deploy:
1. Push para Vercel
2. O `vercel.json` é detectado
3. Cron job é configurado
4. Executará automaticamente a cada hora

### Outros Hosts
Configure um cron job para chamar:
```bash
curl -X GET https://seu-site.com/api/cron/cleanup-transactions \
  -H "Authorization: Bearer $CRON_SECRET"
```

## FAQ

**Q: E se houver muitas transações antigas?**
A: O sistema processa todas de uma vez, mas isso é seguro porque só afeta transações não pagas.

**Q: Posso ajustar o tempo de 1 hora?**
A: Sim, edite `cleanup-old/route.ts` e altere o cálculo de `oneHourAgo`.

**Q: O que acontece se o usuário pagar após a limpeza?**
A: O presente estará disponível novamente, então outro usuário pode ter selecionado. O ideal é o usuário pagar dentro de 1 hora.

**Q: Como desabilitar o cron automático?**
A: Delete ou comente o conteúdo do arquivo `vercel.json`.
