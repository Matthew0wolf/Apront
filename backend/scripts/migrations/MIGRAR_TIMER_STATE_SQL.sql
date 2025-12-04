-- ============================================
-- MIGRAÇÃO: Adicionar campos de Timer State
-- ============================================
-- Execute este script no PostgreSQL em produção
-- 
-- COMO RODAR:
-- psql -h localhost -U seu_usuario -d apront_db -f MIGRAR_TIMER_STATE_SQL.sql
-- 
-- OU copie e cole os comandos abaixo no psql:
-- ============================================

-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar timer_started_at (VARCHAR(50))
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'timer_started_at'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN timer_started_at VARCHAR(50);
        RAISE NOTICE 'Coluna timer_started_at adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna timer_started_at já existe, pulando...';
    END IF;
    
    -- Adicionar timer_elapsed_base (INTEGER)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'timer_elapsed_base'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN timer_elapsed_base INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna timer_elapsed_base adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna timer_elapsed_base já existe, pulando...';
    END IF;
    
    -- Adicionar is_timer_running (BOOLEAN)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'is_timer_running'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN is_timer_running BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_timer_running adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna is_timer_running já existe, pulando...';
    END IF;
    
    -- Adicionar current_item_index_json (TEXT)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'current_item_index_json'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN current_item_index_json TEXT;
        RAISE NOTICE 'Coluna current_item_index_json adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna current_item_index_json já existe, pulando...';
    END IF;
END $$;

-- Verificar se todas as colunas foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json')
ORDER BY column_name;

RAISE NOTICE '============================================';
RAISE NOTICE '✅ Migração concluída!';
RAISE NOTICE '============================================';

