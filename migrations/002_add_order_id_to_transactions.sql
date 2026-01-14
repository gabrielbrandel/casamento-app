-- Adiciona coluna order_id para armazenar o ID do pedido do PagBank
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);

-- Adiciona índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);

-- Atualiza o trigger de updated_at se ainda não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
