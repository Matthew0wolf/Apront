#!/bin/bash
# Script para rodar migrações em produção
# Execute no servidor de produção

echo "=========================================="
echo "MIGRAÇÃO PARA PRODUÇÃO"
echo "=========================================="
echo ""

# 1. Encontrar o diretório do projeto
echo "📍 Procurando diretório do projeto..."
PROJECT_DIR=""
if [ -d "/var/www/apront" ]; then
    PROJECT_DIR="/var/www/apront"
elif [ -d "/home/apront" ]; then
    PROJECT_DIR="/home/apront"
elif [ -d "$HOME/apront" ]; then
    PROJECT_DIR="$HOME/apront"
else
    echo "❌ Diretório do projeto não encontrado!"
    echo "Por favor, informe o caminho completo do diretório do projeto:"
    read PROJECT_DIR
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Diretório $PROJECT_DIR não existe!"
    exit 1
fi

echo "✅ Projeto encontrado em: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 2. Verificar se backend existe
if [ ! -d "backend" ]; then
    echo "❌ Diretório 'backend' não encontrado em $PROJECT_DIR"
    echo "Listando diretórios disponíveis:"
    ls -la
    exit 1
fi

cd backend
echo "✅ Entrando em: $PROJECT_DIR/backend"

# 3. Verificar Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python não encontrado! Instale Python 3 primeiro."
    exit 1
fi

echo "✅ Python encontrado: $PYTHON_CMD"
echo ""

# 4. Verificar se o script de migração existe
if [ ! -f "scripts/migrations/add_timer_state_fields.py" ]; then
    echo "❌ Script de migração não encontrado!"
    echo "Caminho esperado: scripts/migrations/add_timer_state_fields.py"
    exit 1
fi

echo "✅ Script de migração encontrado"
echo ""

# 5. Fazer backup (se possível)
echo "📦 Tentando fazer backup do banco..."
# Se tiver pg_dump configurado, pode fazer backup aqui
# pg_dump -h localhost -U seu_usuario -d apront_db > backup_$(date +%Y%m%d_%H%M%S).sql

echo ""

# 6. Rodar migração
echo "🔄 Rodando migração..."
echo "=========================================="
$PYTHON_CMD scripts/migrations/add_timer_state_fields.py
MIGRATION_EXIT_CODE=$?

echo ""
echo "=========================================="

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Migração concluída com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Reinicie o backend"
    echo "   2. Teste o sistema"
else
    echo "❌ Erro na migração (código: $MIGRATION_EXIT_CODE)"
    echo "   Verifique os logs acima para mais detalhes"
    exit 1
fi

