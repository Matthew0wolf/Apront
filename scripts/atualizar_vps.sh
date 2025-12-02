#!/bin/bash

# ============================================
# Script de Atualização Completa da VPS
# ============================================
# Este script atualiza o código do Git, reconstrói frontend e backend,
# e copia os arquivos para os locais corretos do Nginx
# ============================================

set -e  # Para o script se houver erro

echo "🚀 Iniciando atualização completa da VPS..."
echo "=========================================="
echo ""

# 1. Navegar para o diretório do projeto
cd /root/Apront
echo "📍 Diretório: $(pwd)"
echo ""

# 2. Fazer backup do .env (segurança)
echo "💾 Fazendo backup do .env..."
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ Backup criado"
else
    echo "   ⚠️ Arquivo .env não encontrado"
fi
echo ""

# 3. Atualizar código do Git
echo "📥 Atualizando código do Git..."
git fetch origin
git pull origin main
echo "   ✅ Código atualizado"
echo "   📋 Último commit: $(git log -1 --oneline)"
echo ""

# 4. Verificar se package.json mudou
echo "📦 Verificando dependências do frontend..."
if git diff HEAD~1 package.json 2>/dev/null | grep -q .; then
    echo "   ⚠️ package.json mudou, reinstalando dependências..."
    rm -rf node_modules/
    npm install
    echo "   ✅ Dependências reinstaladas"
else
    echo "   ✅ Dependências não mudaram"
fi
echo ""

# 5. Limpar build antigo do frontend
echo "🧹 Limpando build antigo do frontend..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf .vite/
rm -rf .cache/
echo "   ✅ Build antigo removido"
echo ""

# 6. Reconstruir frontend
echo "🔨 Reconstruindo frontend (isso pode levar alguns minutos)..."
npm run build

# Verificar se build foi criado
if [ ! -d "dist" ]; then
    echo "   ❌ ERRO: Build não foi criado!"
    exit 1
fi
echo "   ✅ Frontend reconstruído"
echo "   📅 Data do build: $(stat -c "%y" dist/index.html | cut -d' ' -f1,2)"
echo ""

# 7. Copiar build para o diretório do Nginx
echo "📋 Copiando build para o diretório do Nginx..."
sudo mkdir -p /var/www/apront/dist
sudo rm -rf /var/www/apront/dist/*
sudo cp -r dist/* /var/www/apront/dist/
echo "   ✅ Build copiado para /var/www/apront/dist/"
echo ""

# 8. Corrigir permissões
echo "🔐 Corrigindo permissões..."
sudo chown -R www-data:www-data /var/www/apront/dist/
sudo chmod -R 755 /var/www/apront/dist/
echo "   ✅ Permissões corrigidas"
echo ""

# 9. Verificar se requirements.txt do backend mudou
echo "🐍 Verificando dependências do backend..."
if git diff HEAD~1 backend/requirements.txt 2>/dev/null | grep -q .; then
    echo "   ⚠️ requirements.txt mudou, será reconstruído"
    NEED_BACKEND_REBUILD=true
else
    echo "   ✅ Dependências do backend não mudaram"
    NEED_BACKEND_REBUILD=false
fi
echo ""

# 10. Reconstruir backend
echo "🔨 Reconstruindo backend..."
docker compose down
if [ "$NEED_BACKEND_REBUILD" = true ] || git diff HEAD~1 backend/ 2>/dev/null | grep -q "\.py$"; then
    echo "   🔄 Código Python mudou, reconstruindo imagem..."
    docker compose build --no-cache backend
else
    echo "   🔄 Reconstruindo imagem (verificação)..."
    docker compose build backend
fi
docker compose up -d
echo "   ✅ Backend reconstruído e iniciado"
echo ""

# 11. Aguardar inicialização
echo "⏳ Aguardando inicialização dos containers (15 segundos)..."
sleep 15
echo ""

# 12. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo "   ✅ Nginx recarregado"
echo ""

# 13. Verificações finais
echo "📊 Verificando status dos containers..."
docker compose ps
echo ""

echo "📝 Últimos logs do backend:"
docker compose logs backend --tail=20
echo ""

echo "📁 Arquivos no diretório do Nginx:"
ls -lh /var/www/apront/dist/ | head -10
echo ""

echo "🧪 Testando backend..."
if curl -I http://localhost:5001 > /dev/null 2>&1; then
    echo "   ✅ Backend respondendo"
else
    echo "   ⚠️ Backend não respondeu ainda (pode estar iniciando)"
fi
echo ""

echo "=========================================="
echo "✅ Atualização completa concluída!"
echo "=========================================="
echo ""
echo "🌐 Frontend: http://72.60.56.28"
echo "🔧 Backend: http://72.60.56.28:5001"
echo ""
echo "💡 Dica: Limpe o cache do navegador (Ctrl+Shift+R)"
echo ""

