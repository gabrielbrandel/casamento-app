-- Script para normalizar status das transações antigas
-- Execute este script no SQL Editor do Supabase Dashboard

-- Atualizar status PAID para completed
UPDATE transactions 
SET 
  status = 'completed',
  updated_at = NOW()
WHERE status = 'PAID';

-- Atualizar status PROCESSING para processing
UPDATE transactions 
SET 
  status = 'processing',
  updated_at = NOW()
WHERE status = 'PROCESSING';

-- Verificar os resultados
SELECT 
  status,
  COUNT(*) as count
FROM transactions 
GROUP BY status
ORDER BY status;
