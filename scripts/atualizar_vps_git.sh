#!/bin/bash
# Script para atualizar código na VPS a partir do Git

echo "========================================"
echo "Atualizando código na VPS do Git"
echo "========================================"
echo ""

# Verificar se está no diretório correto
if [ ! -d ".git" ]; then
    echo "❌ Diretório .git não encontrado!"
    echo "Navegue até o diretório do projeto primeiro"
    exit 1
fi

echo "1. Verificando status atual do Git:"
git status

echo ""
echo "2. Buscando atualizações do repositório remoto:"
git fetch origin

echo ""
echo "3. Verificando diferenças:"
git log HEAD..origin/main --oneline

echo ""
echo "4. Fazendo pull das atualizações:"
git pull origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Código atualizado com sucesso!"
    echo ""
    echo "5. Reiniciando containers Docker:"
    docker restart apront-backend
    
    echo ""
    echo "6. Aguardando 5 segundos..."
    sleep 5
    
    echo ""
    echo "7. Verificando status dos containers:"
    docker ps | grep apront
    
    echo ""
    echo "========================================"
    echo "✅ Atualização concluída!"
    echo "========================================"
else
    echo ""
    echo "❌ Erro ao fazer pull. Verifique se há conflitos."
    exit 1
fi

