#!/bin/bash
# Script para coletar logs do backend relacionados a rundown

echo "========================================"
echo "Coletando logs do backend"
echo "========================================"
echo ""

# Verificar se container está rodando
if ! docker ps | grep -q apront-backend; then
    echo "❌ Container apront-backend não está rodando!"
    exit 1
fi

echo "📋 Últimos 200 logs do backend:"
echo "----------------------------------------"
docker logs apront-backend --tail=200

echo ""
echo "========================================"
echo "Filtrando logs relacionados a rundown/folder/item:"
echo "========================================"
docker logs apront-backend --tail=500 | grep -i -E "rundown|folder|item|PATCH|update|error|exception" | tail -50

echo ""
echo "========================================"
echo "Logs de erro:"
echo "========================================"
docker logs apront-backend --tail=500 | grep -i -E "error|exception|traceback|failed" | tail -30

echo ""
echo "========================================"
echo "✅ Logs coletados!"
echo "========================================"
echo ""
echo "💡 Dica: Para ver logs em tempo real, execute:"
echo "   docker logs -f apront-backend"

