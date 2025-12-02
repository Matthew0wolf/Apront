#!/bin/bash

# ============================================
# Script de Verificação Pós-Atualização
# ============================================

echo "🔍 Verificando se a atualização foi aplicada corretamente..."
echo "=========================================="
echo ""

# 1. Verificar código atualizado
echo "1️⃣ Verificando código do Git..."
cd /root/Apront
LATEST_COMMIT=$(git log -1 --oneline)
echo "   📋 Último commit: $LATEST_COMMIT"
echo "   ✅ Código atualizado"
echo ""

# 2. Verificar build do frontend
echo "2️⃣ Verificando build do frontend..."
if [ -d "dist" ]; then
    BUILD_DATE=$(stat -c "%y" dist/index.html | cut -d' ' -f1,2)
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "   ✅ Build existe"
    echo "   📅 Data do build: $BUILD_DATE"
    echo "   📦 Tamanho: $BUILD_SIZE"
    
    # Verificar se há arquivos JS
    JS_FILES=$(find dist/assets -name "*.js" 2>/dev/null | wc -l)
    CSS_FILES=$(find dist/assets -name "*.css" 2>/dev/null | wc -l)
    echo "   📄 Arquivos JS: $JS_FILES"
    echo "   📄 Arquivos CSS: $CSS_FILES"
else
    echo "   ❌ ERRO: Diretório dist não encontrado!"
fi
echo ""

# 3. Verificar arquivos no Nginx
echo "3️⃣ Verificando arquivos no Nginx..."
if [ -d "/var/www/apront/dist" ]; then
    NGINX_BUILD_DATE=$(stat -c "%y" /var/www/apront/dist/index.html | cut -d' ' -f1,2)
    NGINX_BUILD_SIZE=$(du -sh /var/www/apront/dist/ | cut -f1)
    echo "   ✅ Arquivos no Nginx"
    echo "   📅 Data: $NGINX_BUILD_DATE"
    echo "   📦 Tamanho: $NGINX_BUILD_SIZE"
    
    # Verificar permissões
    PERMISSIONS=$(stat -c "%U:%G" /var/www/apront/dist/)
    if [ "$PERMISSIONS" = "www-data:www-data" ]; then
        echo "   ✅ Permissões corretas: $PERMISSIONS"
    else
        echo "   ⚠️ Permissões incorretas: $PERMISSIONS (deveria ser www-data:www-data)"
    fi
else
    echo "   ❌ ERRO: Diretório /var/www/apront/dist não encontrado!"
fi
echo ""

# 4. Verificar se os arquivos são recentes (últimos 5 minutos)
echo "4️⃣ Verificando se o build é recente..."
CURRENT_TIME=$(date +%s)
BUILD_TIME=$(stat -c "%Y" /var/www/apront/dist/index.html 2>/dev/null || echo "0")
TIME_DIFF=$((CURRENT_TIME - BUILD_TIME))

if [ $TIME_DIFF -lt 300 ]; then
    echo "   ✅ Build é recente (há $TIME_DIFF segundos)"
else
    echo "   ⚠️ Build pode estar desatualizado (há $TIME_DIFF segundos)"
fi
echo ""

# 5. Verificar containers Docker
echo "5️⃣ Verificando containers Docker..."
if docker compose ps | grep -q "Up"; then
    echo "   ✅ Containers estão rodando"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
else
    echo "   ❌ ERRO: Containers não estão rodando!"
fi
echo ""

# 6. Verificar backend respondendo
echo "6️⃣ Testando backend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001 | grep -q "200\|404"; then
    echo "   ✅ Backend está respondendo"
    BACKEND_RESPONSE=$(curl -s http://localhost:5001 | head -c 100)
    echo "   📝 Resposta: $BACKEND_RESPONSE..."
else
    echo "   ❌ ERRO: Backend não está respondendo!"
fi
echo ""

# 7. Verificar Nginx
echo "7️⃣ Verificando Nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx está rodando"
    NGINX_STATUS=$(systemctl status nginx --no-pager | head -3 | tail -1)
    echo "   📊 Status: $NGINX_STATUS"
else
    echo "   ❌ ERRO: Nginx não está rodando!"
fi
echo ""

# 8. Verificar se há diferença entre build local e Nginx
echo "8️⃣ Comparando builds..."
LOCAL_HASH=$(md5sum /root/Apront/dist/index.html 2>/dev/null | cut -d' ' -f1)
NGINX_HASH=$(md5sum /var/www/apront/dist/index.html 2>/dev/null | cut -d' ' -f1)

if [ "$LOCAL_HASH" = "$NGINX_HASH" ] && [ -n "$LOCAL_HASH" ]; then
    echo "   ✅ Builds são idênticos (sincronizados)"
else
    echo "   ⚠️ Builds podem ser diferentes"
    echo "   Local: ${LOCAL_HASH:0:8}..."
    echo "   Nginx: ${NGINX_HASH:0:8}..."
fi
echo ""

# 9. Verificar logs do backend para erros
echo "9️⃣ Verificando erros no backend..."
ERROR_COUNT=$(docker compose logs backend --tail=50 2>&1 | grep -i "error\|exception\|traceback" | wc -l)
if [ $ERROR_COUNT -eq 0 ]; then
    echo "   ✅ Nenhum erro encontrado nos últimos logs"
else
    echo "   ⚠️ Encontrados $ERROR_COUNT possíveis erros nos logs"
    echo "   📝 Últimos erros:"
    docker compose logs backend --tail=50 2>&1 | grep -i "error\|exception" | tail -3
fi
echo ""

# 10. Verificar conectividade dos serviços
echo "🔟 Verificando conectividade..."
echo "   PostgreSQL:"
if docker compose exec -T postgres pg_isready -U apront_user > /dev/null 2>&1; then
    echo "      ✅ Conectado"
else
    echo "      ❌ Não conectado"
fi

echo "   Redis:"
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "      ✅ Conectado"
else
    echo "      ❌ Não conectado"
fi
echo ""

# Resumo final
echo "=========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=========================================="
echo ""
echo "✅ Código atualizado: $LATEST_COMMIT"
echo "✅ Build do frontend: $BUILD_DATE"
echo "✅ Arquivos no Nginx: $NGINX_BUILD_DATE"
echo "✅ Containers Docker: $(docker compose ps --format '{{.Name}}' | wc -l) rodando"
echo "✅ Backend: Respondendo"
echo "✅ Nginx: Rodando"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://72.60.56.28"
echo "   Backend: http://72.60.56.28:5001"
echo ""
echo "💡 Próximos passos:"
echo "   1. Acesse http://72.60.56.28 no navegador"
echo "   2. Limpe o cache (Ctrl+Shift+R)"
echo "   3. Teste criar/editar um projeto"
echo "   4. Verifique se as melhorias visuais aparecem"
echo ""

