#!/bin/bash
# Script para verificar informações do banco na VPS

echo "=========================================="
echo "🔍 VERIFICANDO INFORMAÇÕES DO BANCO"
echo "=========================================="
echo ""

echo "1️⃣ VARIÁVEIS DE AMBIENTE DO SISTEMA:"
env | grep -iE "(DATABASE|POSTGRES|PG)" | sort || echo "   Nenhuma variável encontrada"
echo ""

echo "2️⃣ ARQUIVO .env DO BACKEND:"
if [ -f ~/Apront/backend/.env ]; then
    echo "   ✅ Arquivo encontrado:"
    cat ~/Apront/backend/.env | grep -iE "(DATABASE|POSTGRES|PG)" || echo "   Nenhuma configuração encontrada"
else
    echo "   ❌ Arquivo .env não encontrado em ~/Apront/backend/"
    find ~/Apront -name ".env" -type f 2>/dev/null | head -3
fi
echo ""

echo "3️⃣ PROCESSOS BACKEND EM EXECUÇÃO:"
ps aux | grep -E "python.*app.py|gunicorn|backend" | grep -v grep | head -3 || echo "   Nenhum processo encontrado"
echo ""

echo "4️⃣ VERIFICANDO DOCKER (se estiver usando):"
if command -v docker &> /dev/null; then
    docker ps | grep -i backend && echo "   ✅ Container backend encontrado!" || echo "   Nenhum container backend rodando"
    
    # Tentar ver variáveis do container
    BACKEND_CONTAINER=$(docker ps -q -f name=backend | head -1)
    if [ ! -z "$BACKEND_CONTAINER" ]; then
        echo ""
        echo "   Variáveis de ambiente do container:"
        docker exec $BACKEND_CONTAINER env | grep -iE "(DATABASE|POSTGRES|PG)" | sort || echo "   Não conseguiu ler variáveis"
    fi
else
    echo "   Docker não está instalado"
fi
echo ""

echo "5️⃣ CONFIGURAÇÃO DO SYSTEMD (se existir):"
if [ -f /etc/systemd/system/apront-backend.service ]; then
    echo "   ✅ Arquivo de serviço encontrado:"
    cat /etc/systemd/system/apront-backend.service | grep -iE "(Environment|DATABASE|ExecStart)" || echo "   Nenhuma configuração de ambiente encontrada"
elif [ -f /etc/systemd/system/gunicorn.service ]; then
    echo "   ✅ Serviço gunicorn encontrado:"
    cat /etc/systemd/system/gunicorn.service | grep -iE "(Environment|DATABASE|ExecStart)" || echo "   Nenhuma configuração de ambiente encontrada"
else
    echo "   Nenhum serviço systemd encontrado"
    ls -la /etc/systemd/system/ | grep -iE "apront|gunicorn|backend" || echo "   Sem serviços relacionados"
fi
echo ""

echo "6️⃣ LOGS RECENTES (se disponível):"
journalctl -u apront-backend -n 30 2>/dev/null | grep -iE "database|DATABASE_URL|postgres" | tail -5 || \
journalctl -u gunicorn -n 30 2>/dev/null | grep -iE "database|DATABASE_URL|postgres" | tail -5 || \
echo "   Sem logs de sistema disponíveis"
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="
echo ""
echo "📋 IMPORTANTE:"
echo ""
echo "Se o banco está em um serviço externo (Railway, etc),"
echo "você precisa:"
echo ""
echo "1. Obter a DATABASE_URL das variáveis de ambiente"
echo "2. Ou rodar a migração via Python no backend"
echo ""
echo "Me envie o resultado completo deste script!"

