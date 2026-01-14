-- Adiciona colunas para armazenar detalhes do pagamento
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Comentário explicando o uso
COMMENT ON COLUMN transactions.payment_details IS 'Detalhes do método de pagamento (bandeira do cartão, número de parcelas, etc.)';

-- Índice para buscar por detalhes específicos (opcional, mas útil)
CREATE INDEX IF NOT EXISTS idx_transactions_payment_details ON transactions USING GIN (payment_details);

-- Verificar a estrutura atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
