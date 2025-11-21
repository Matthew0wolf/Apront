#!/bin/bash
# Script completo para atualizar backend e frontend na VPS

echo "========================================"
echo "Atualizando Backend e Frontend na VPS"
echo "========================================"
echo ""

# 1. Atualizar Backend
echo "1️⃣ Atualizando Backend..."
cd /root/Apront
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer git pull do backend"
    exit 1
fi

echo "   ✅ Código atualizado do Git"
echo "   📦 Copiando código para container (preservando .env)..."
cd backend
tar --exclude='.env' --exclude='__pycache__' --exclude='*.pyc' -cf - . | docker cp - apront-backend:/app/
cd ..

echo "   🔄 Reiniciando container..."
docker restart apront-backend
sleep 5

if docker ps | grep -q apront-backend; then
    echo "   ✅ Container reiniciado e rodando"
else
    echo "   ❌ Container não está rodando!"
    exit 1
fi

echo ""
echo "2️⃣ Atualizando Frontend..."
cd /var/www/apront
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer git pull do frontend"
    exit 1
fi

echo "   ✅ Código atualizado do Git"
echo "   🗑️ Removendo build antigo..."
rm -rf dist/

echo "   🔨 Rebuildando frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "   ❌ Erro ao fazer build do frontend"
    exit 1
fi

echo "   ✅ Build concluído"
echo "   🔧 Corrigindo permissões..."
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist

echo "   🔄 Recarregando Nginx..."
sudo systemctl reload nginx

echo ""
echo "3️⃣ Verificando atualizações..."
echo "   📁 Arquivo JavaScript gerado:"
ls -lh dist/assets/ | grep index | tail -1

echo ""
echo "========================================"
echo "✅ Atualização completa!"
echo "========================================"
echo ""
echo "⚠️ IMPORTANTE: No navegador:"
echo "   1. Pressione Ctrl+Shift+R (hard refresh)"
echo "   2. OU abra em aba anônima/privada"
echo "   3. Teste adicionar pasta/evento"
echo "   4. Verifique no console se aparece: 💾 [SAVE]"
echo ""

