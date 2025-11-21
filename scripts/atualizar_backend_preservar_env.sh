#!/bin/bash
# Script para atualizar backend preservando o .env

echo "========================================"
echo "Atualizando backend preservando .env"
echo "========================================"
echo ""

# Verificar se container está rodando
if ! docker ps | grep -q apront-backend; then
    echo "❌ Container apront-backend não está rodando!"
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -d "backend" ]; then
    echo "❌ Diretório 'backend' não encontrado!"
    echo "Execute este script da raiz do projeto (onde está o diretório backend/)"
    exit 1
fi

echo "1. Fazendo backup do .env atual do container..."
docker exec apront-backend cat /app/.env > /tmp/.env_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "⚠️ Não foi possível fazer backup do .env (pode não existir)"

echo ""
echo "2. Copiando código atualizado (excluindo .env)..."
cd backend
tar --exclude='.env' --exclude='__pycache__' --exclude='*.pyc' -cf - . | docker cp - apront-backend:/app/
cd ..

echo ""
echo "3. Verificando se .env ainda existe no container..."
if docker exec apront-backend test -f /app/.env; then
    echo "✅ .env preservado no container"
else
    echo "⚠️ .env não encontrado no container após atualização"
    echo "   Se necessário, restaure do backup em /tmp/.env_backup_*"
fi

echo ""
echo "4. Reiniciando container..."
docker restart apront-backend

echo ""
echo "5. Aguardando 5 segundos para container iniciar..."
sleep 5

echo ""
echo "6. Verificando status do container..."
if docker ps | grep -q apront-backend; then
    echo "✅ Container está rodando"
    echo ""
    echo "📋 Últimos logs:"
    docker logs apront-backend --tail=10
else
    echo "❌ Container não está rodando! Verifique os logs:"
    echo "   docker logs apront-backend"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Atualização concluída!"
echo "========================================"

