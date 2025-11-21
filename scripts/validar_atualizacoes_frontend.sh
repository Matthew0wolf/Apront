#!/bin/bash

echo "🔍 Validando atualizações do frontend na VPS..."
echo ""

# 1. Verificar se está no diretório correto
cd /var/www/apront || exit 1

# 2. Verificar último commit do Git
echo "📋 Último commit no Git:"
git log -1 --oneline
echo ""

# 3. Verificar se há mudanças não commitadas
echo "📋 Status do Git:"
git status --short
echo ""

# 4. Verificar data do build
echo "📋 Data do build (dist/index.html):"
if [ -f "dist/index.html" ]; then
    ls -lh dist/index.html
    echo "Conteúdo do index.html (primeiras 20 linhas):"
    head -20 dist/index.html
else
    echo "❌ dist/index.html não encontrado!"
fi
echo ""

# 5. Verificar se Sidebar.jsx tem notificações
echo "📋 Verificando Sidebar.jsx:"
if grep -q "useNotifications\|Bell\|unreadCount" src/components/shared/Sidebar.jsx 2>/dev/null; then
    echo "✅ Sidebar.jsx contém código de notificações"
    echo "Linhas relevantes:"
    grep -n "useNotifications\|Bell\|unreadCount" src/components/shared/Sidebar.jsx | head -5
else
    echo "❌ Sidebar.jsx NÃO contém código de notificações!"
fi
echo ""

# 6. Verificar se o build contém referências a notificações
echo "📋 Verificando se o build contém 'Bell' ou 'notifications':"
if [ -f "dist/assets/index-*.js" ]; then
    JS_FILE=$(ls -t dist/assets/index-*.js | head -1)
    if grep -q "Bell\|notifications" "$JS_FILE" 2>/dev/null; then
        echo "✅ Build contém referências a notificações"
    else
        echo "⚠️ Build pode não conter notificações (pode estar minificado)"
    fi
else
    echo "❌ Arquivos JS do build não encontrados!"
fi
echo ""

# 7. Verificar permissões
echo "📋 Permissões do dist:"
ls -ld dist/ 2>/dev/null || echo "❌ Diretório dist não encontrado!"
echo ""

# 8. Verificar se Nginx está servindo os arquivos corretos
echo "📋 Verificando Nginx:"
sudo nginx -t 2>&1 | head -3
echo ""

echo "✅ Validação concluída!"
echo ""
echo "💡 Para forçar atualização completa:"
echo "   cd /var/www/apront"
echo "   git pull origin main"
echo "   rm -rf dist/ node_modules/.vite/"
echo "   npm run build"
echo "   sudo chown -R www-data:www-data dist/"
echo "   sudo chmod -R 755 dist/"
echo "   sudo systemctl reload nginx"

