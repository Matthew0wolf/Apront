#!/bin/bash
# Script para descobrir informações do banco de dados na VPS

echo "=========================================="
echo "🔍 DESCOBRINDO INFORMAÇÕES DO BANCO"
echo "=========================================="
echo ""

echo "1️⃣ USUÁRIO ATUAL DO SISTEMA:"
whoami
echo ""

echo "2️⃣ VARIÁVEIS DE AMBIENTE RELACIONADAS AO BANCO:"
env | grep -iE "(postgres|database|db)" || echo "   Nenhuma variável encontrada"
echo ""

echo "3️⃣ PROCURANDO ARQUIVO .env:"
if [ -f ~/Apront/backend/.env ]; then
    echo "   ✅ Arquivo .env encontrado:"
    cat ~/Apront/backend/.env | grep -iE "(database|postgres|db)" || echo "   Nenhuma configuração de banco encontrada"
elif [ -f ~/Apront/.env ]; then
    echo "   ✅ Arquivo .env encontrado na raiz:"
    cat ~/Apront/.env | grep -iE "(database|postgres|db)" || echo "   Nenhuma configuração de banco encontrada"
else
    echo "   ❌ Arquivo .env não encontrado"
    find ~/Apront -name ".env" -type f 2>/dev/null | head -3
fi
echo ""

echo "4️⃣ PROCURANDO CONFIGURAÇÃO NO APP.PY:"
if [ -f ~/Apront/backend/app.py ]; then
    echo "   ✅ Arquivo app.py encontrado:"
    grep -iE "database_url|DATABASE|postgres" ~/Apront/backend/app.py | head -5 || echo "   Nenhuma configuração encontrada"
else
    echo "   ❌ Arquivo app.py não encontrado em ~/Apront/backend/"
    find ~ -name "app.py" -path "*/backend/*" 2>/dev/null | head -1
fi
echo ""

echo "5️⃣ TENTANDO CONECTAR NO POSTGRESQL:"
echo "   Tentando como usuário 'postgres'..."
psql -U postgres -l 2>/dev/null && echo "   ✅ Conectado como 'postgres'!" || echo "   ❌ Não conseguiu conectar como 'postgres'"
echo ""

echo "   Tentando sem especificar usuário..."
psql -l 2>/dev/null && echo "   ✅ Conectado!" || echo "   ❌ Não conseguiu conectar"
echo ""

echo "   Tentando com sudo..."
sudo -u postgres psql -l 2>/dev/null && echo "   ✅ Conectado com sudo!" || echo "   ❌ Não conseguiu conectar com sudo"
echo ""

echo "6️⃣ VERIFICANDO PROCESSOS DO POSTGRESQL:"
ps aux | grep postgres | grep -v grep | head -3 || echo "   Nenhum processo PostgreSQL encontrado"
echo ""

echo "7️⃣ VERIFICANDO DOCKER (se estiver usando):"
if command -v docker &> /dev/null; then
    docker ps | grep -i postgres && echo "   ✅ Container PostgreSQL encontrado!" || echo "   Nenhum container PostgreSQL rodando"
else
    echo "   Docker não está instalado ou não está no PATH"
fi
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Se conseguiu conectar no passo 5, use:"
echo "   psql -U postgres -l"
echo "   (ou o usuário que funcionou)"
echo ""
echo "2. Se encontrou configuração no .env ou app.py, use essas informações"
echo ""
echo "3. Me envie o resultado completo deste script para eu te ajudar mais!"
echo ""

