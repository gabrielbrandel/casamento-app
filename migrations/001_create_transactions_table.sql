-- Tabela para armazenar transações de pagamento
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  gift_id VARCHAR(255) NOT NULL,
  transaction_code VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'processing', -- processing, completed, failed
  payment_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (gift_id) REFERENCES gifts(id)
);

-- Índices para melhor performance
CREATE INDEX idx_transactions_gift_id ON transactions(gift_id);
CREATE INDEX idx_transactions_transaction_code ON transactions(transaction_code);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
