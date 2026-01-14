-- Adiciona coluna charge_id para armazenar o ID do charge (necessário para estornos)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS charge_id VARCHAR(255);

-- Adiciona índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_charge_id ON transactions(charge_id);

-- Verificar a estrutura atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
