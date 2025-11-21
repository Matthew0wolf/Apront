#!/bin/bash
# Script para FORÇAR atualização completa do frontend

echo "========================================"
echo "FORÇANDO ATUALIZAÇÃO COMPLETA DO FRONTEND"
echo "========================================"
echo ""

cd /var/www/apront

echo "1️⃣ Verificando último commit..."
git log -1 --oneline
echo ""

echo "2️⃣ Fazendo pull do Git..."
git fetch origin
git reset --hard origin/main
echo ""

echo "3️⃣ Removendo TUDO relacionado ao build..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf .vite/
find . -name "*.js.map" -delete 2>/dev/null
echo "   ✅ Arquivos antigos removidos"
echo ""

echo "4️⃣ Rebuildando frontend..."
npm run build
echo ""

if [ ! -d "dist" ]; then
    echo "❌ ERRO: Diretório dist não foi criado!"
    exit 1
fi

echo "5️⃣ Verificando arquivo JavaScript gerado..."
JS_FILE=$(ls -t dist/assets/index-*.js 2>/dev/null | head -1)
if [ -z "$JS_FILE" ]; then
    echo "❌ ERRO: Arquivo JavaScript não encontrado!"
    exit 1
fi

echo "   ✅ Arquivo gerado: $(basename $JS_FILE)"
echo "   📅 Data: $(stat -c %y "$JS_FILE" 2>/dev/null || stat -f %Sm "$JS_FILE" 2>/dev/null)"
echo "   📦 Tamanho: $(du -h "$JS_FILE" | cut -f1)"
echo ""

echo "6️⃣ Corrigindo permissões..."
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist
echo ""

echo "7️⃣ Recarregando Nginx..."
sudo systemctl reload nginx
echo ""

echo "8️⃣ Verificando se Nginx está servindo o arquivo correto..."
NGINX_STATUS=$(sudo systemctl is-active nginx)
if [ "$NGINX_STATUS" != "active" ]; then
    echo "⚠️ Nginx não está ativo!"
else
    echo "   ✅ Nginx está ativo"
fi

echo ""
echo "========================================"
echo "✅ ATUALIZAÇÃO FORÇADA CONCLUÍDA!"
echo "========================================"
echo ""
echo "⚠️ IMPORTANTE:"
echo "   1. No navegador, pressione Ctrl+Shift+R (hard refresh)"
echo "   2. OU abra em aba anônima (Ctrl+Shift+N)"
echo "   3. Verifique no console se aparece: 🔍 [DEBUG] ou 💾 [SAVE]"
echo ""
echo "📋 Para verificar se o arquivo foi atualizado:"
echo "   - Abra: http://72.60.56.28/assets/index-*.js"
echo "   - Procure por: '💾 [SAVE]' ou '🔍 [DEBUG]'"
echo ""

