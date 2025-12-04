-- ============================================
-- MIGRAÇÃO RÁPIDA: Adicionar campos de Timer
-- ============================================
-- Execute este SQL no PostgreSQL em produção
-- 
-- Opção 1: Via psql
-- psql -h localhost -U seu_usuario -d apront_db < MIGRAR_AGORA.sql
--
-- Opção 2: Via linha de comando
-- psql -h localhost -U seu_usuario -d apront_db -c "ALTER TABLE rundowns ADD COLUMN timer_started_at VARCHAR(50);"
-- psql -h localhost -U seu_usuario -d apront_db -c "ALTER TABLE rundowns ADD COLUMN timer_elapsed_base INTEGER DEFAULT 0;"
-- psql -h localhost -U seu_usuario -d apront_db -c "ALTER TABLE rundowns ADD COLUMN is_timer_running BOOLEAN DEFAULT FALSE;"
-- psql -h localhost -U seu_usuario -d apront_db -c "ALTER TABLE rundowns ADD COLUMN current_item_index_json TEXT;"
-- ============================================

-- Adicionar timer_started_at (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);

-- Adicionar timer_elapsed_base (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;

-- Adicionar is_timer_running (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;

-- Adicionar current_item_index_json (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;

-- Verificar se todas foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json')
ORDER BY column_name;

