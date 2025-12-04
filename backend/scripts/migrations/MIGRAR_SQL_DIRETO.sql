-- ============================================
-- MIGRAÇÃO: Adicionar campos de Timer State
-- ============================================
-- Execute este SQL diretamente no PostgreSQL
-- 
-- COMANDO:
-- psql -h localhost -U seu_usuario -d apront_db -f MIGRAR_SQL_DIRETO.sql
-- 
-- OU copie e cole no psql:
-- ============================================

-- Adicionar timer_started_at (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);

-- Adicionar timer_elapsed_base (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;

-- Adicionar is_timer_running (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;

-- Adicionar current_item_index_json (ignora se já existir)
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;

-- Verificar se todas as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'rundowns' 
  AND column_name IN (
      'timer_started_at', 
      'timer_elapsed_base', 
      'is_timer_running', 
      'current_item_index_json'
  )
ORDER BY column_name;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Migração concluída com sucesso!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'As 4 colunas foram adicionadas à tabela rundowns.';
    RAISE NOTICE 'Reinicie o backend para aplicar as mudanças.';
    RAISE NOTICE '============================================';
END $$;

