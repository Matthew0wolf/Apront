#!/bin/bash

echo "🚀 Atualizando frontend na VPS..."
echo ""

cd /var/www/apront || exit 1

# 1. Descartar mudanças locais e usar versão do Git
echo "📥 Atualizando código do Git..."
git fetch origin
git reset --hard origin/main

# 2. Limpar cache e build antigo
echo "🧹 Limpando build antigo..."
rm -rf dist/ node_modules/.vite/

# 3. Rebuild do frontend
echo "🔨 Fazendo build do frontend..."
npm run build

# 4. Corrigir permissões
echo "🔐 Corrigindo permissões..."
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/

# 5. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📋 Verificando última atualização:"
git log -1 --oneline
echo ""
echo "📋 Arquivos do build:"
ls -lh dist/assets/ | head -5

