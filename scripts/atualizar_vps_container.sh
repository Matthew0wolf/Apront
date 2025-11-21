#!/bin/bash
# Script para atualizar código quando está dentro do container Docker

echo "========================================"
echo "Atualizando código no container Docker"
echo "========================================"
echo ""

# Verificar se container está rodando
if ! docker ps | grep -q apront-backend; then
    echo "❌ Container apront-backend não está rodando!"
    exit 1
fi

echo "1. Verificando se há Git no container:"
docker exec apront-backend which git

echo ""
echo "2. Verificando diretório /app no container:"
docker exec apront-backend ls -la /app | head -20

echo ""
echo "3. Verificando se /app é um repositório Git:"
docker exec apront-backend test -d /app/.git && echo "✅ É um repositório Git" || echo "❌ Não é um repositório Git"

echo ""
echo "4. Se não for Git, você precisará:"
echo "   - Copiar código atualizado para o container"
echo "   - Ou reconstruir a imagem Docker"
echo ""

echo "5. Opções de atualização:"
echo ""
echo "   OPÇÃO A: Se /app/.git existe, fazer pull dentro do container:"
echo "   docker exec -it apront-backend bash -c 'cd /app && git pull origin main'"
echo ""
echo "   OPÇÃO B: Copiar código do host para o container:"
echo "   docker cp /caminho/do/codigo/. apront-backend:/app/"
echo ""
echo "   OPÇÃO C: Reconstruir imagem Docker com código atualizado"
echo ""

