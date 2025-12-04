#!/bin/bash
# Script para verificar como o backend está rodando

echo "=========================================="
echo "🔍 VERIFICANDO AMBIENTE DO BACKEND"
echo "=========================================="
echo ""

echo "1️⃣ PROCESSOS BACKEND EM EXECUÇÃO:"
ps aux | grep -E "python.*app.py|gunicorn|backend" | grep -v grep
echo ""

echo "2️⃣ VERIFICANDO AMBIENTE VIRTUAL:"
if [ -d ~/Apront/backend/venv ]; then
    echo "   ✅ Ambiente virtual encontrado: ~/Apront/backend/venv"
elif [ -d ~/Apront/venv ]; then
    echo "   ✅ Ambiente virtual encontrado: ~/Apront/venv"
else
    echo "   ❌ Nenhum ambiente virtual encontrado"
    find ~/Apront -name "venv" -type d 2>/dev/null | head -3
fi
echo ""

echo "3️⃣ VERIFICANDO DOCKER:"
if command -v docker &> /dev/null; then
    echo "   ✅ Docker instalado"
    docker ps | grep -i backend || echo "   Nenhum container backend rodando"
else
    echo "   Docker não está instalado"
fi
echo ""

echo "4️⃣ VERIFICANDO SYSTEMD SERVICE:"
if [ -f /etc/systemd/system/apront-backend.service ]; then
    echo "   ✅ Serviço systemd encontrado:"
    cat /etc/systemd/system/apront-backend.service | grep -E "ExecStart|WorkingDirectory|Environment"
elif [ -f /etc/systemd/system/gunicorn.service ]; then
    echo "   ✅ Serviço gunicorn encontrado:"
    cat /etc/systemd/system/gunicorn.service | grep -E "ExecStart|WorkingDirectory|Environment"
else
    echo "   Nenhum serviço systemd encontrado"
    ls -la /etc/systemd/system/ | grep -iE "apront|gunicorn" || echo "   Sem serviços relacionados"
fi
echo ""

echo "5️⃣ VERIFICANDO REQUIREMENTS.TXT:"
if [ -f ~/Apront/backend/requirements.txt ]; then
    echo "   ✅ Arquivo requirements.txt encontrado"
    echo "   Dependências principais:"
    grep -E "^flask|^gunicorn|^psycopg2|^sqlalchemy" ~/Apront/backend/requirements.txt | head -5
else
    echo "   ❌ Arquivo requirements.txt não encontrado"
fi
echo ""

echo "=========================================="
echo "✅ Verificação concluída!"
echo "=========================================="

