#!/bin/bash
# Script para rodar migração via SQL direto (não precisa de Flask)

echo "=========================================="
echo "MIGRAÇÃO: Adicionar campos de Timer State"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ler variáveis de ambiente ou pedir para o usuário
if [ -z "$DB_HOST" ]; then
    DB_HOST="localhost"
fi

if [ -z "$DB_USER" ]; then
    read -p "Usuário do PostgreSQL: " DB_USER
fi

if [ -z "$DB_NAME" ]; then
    read -p "Nome do banco de dados: " DB_NAME
fi

echo ""
echo "Conectando ao banco: $DB_USER@$DB_HOST/$DB_NAME"
echo ""

# SQL para adicionar as colunas
SQL="
-- Adicionar colunas se não existirem
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;

-- Verificar se foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json')
ORDER BY column_name;
"

# Executar SQL via psql
if command -v psql &> /dev/null; then
    echo "$SQL" | psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Migração concluída com sucesso!${NC}"
        echo ""
        echo "Próximos passos:"
        echo "  1. Reinicie o backend"
        echo "  2. Teste o sistema"
    else
        echo ""
        echo -e "${RED}❌ Erro ao executar migração${NC}"
        echo ""
        echo "Tente executar o SQL manualmente:"
        echo "  psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
        echo ""
        echo "E depois cole este SQL:"
        echo "$SQL"
    fi
else
    echo -e "${RED}❌ psql não encontrado!${NC}"
    echo ""
    echo "Instale o PostgreSQL client:"
    echo "  sudo apt-get install postgresql-client"
    echo ""
    echo "OU execute o SQL manualmente conectando ao banco:"
    echo "  psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
    echo ""
    echo "E cole este SQL:"
    echo "$SQL"
fi

