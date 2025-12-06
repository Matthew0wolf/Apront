#!/bin/bash

# ============================================
# Script para Configurar HTTPS (SSL/TLS) 
# para apront.com.br usando Let's Encrypt
# ============================================

set -e  # Parar se houver erro

echo "🔒 Configurando HTTPS para apront.com.br"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    error "Por favor, execute como root (sudo ./configurar_https_apront.sh)"
    exit 1
fi

info "1. Verificando DNS do domínio..."
DOMAIN_IP=$(dig +short apront.com.br | tail -1)
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$DOMAIN_IP" ]; then
    error "Não foi possível resolver apront.com.br"
    warn "Certifique-se de que o DNS está configurado corretamente"
    exit 1
fi

info "   Domínio resolvido: apront.com.br → $DOMAIN_IP"
if [ "$DOMAIN_IP" != "72.60.56.28" ]; then
    warn "   IP do domínio ($DOMAIN_IP) difere do esperado (72.60.56.28)"
    warn "   Continuando mesmo assim..."
fi

echo ""

# 2. Verificar se Nginx está instalado
info "2. Verificando Nginx..."
if ! command -v nginx &> /dev/null; then
    error "Nginx não está instalado!"
    exit 1
fi
info "   Nginx está instalado"

# Verificar se arquivo de configuração existe
if [ ! -f "/etc/nginx/sites-available/apront" ]; then
    error "Arquivo /etc/nginx/sites-available/apront não encontrado!"
    warn "Configure o Nginx primeiro antes de adicionar HTTPS"
    exit 1
fi
info "   Arquivo de configuração encontrado"

echo ""

# 3. Atualizar configuração do Nginx
info "3. Atualizando configuração do Nginx..."
# Backup do arquivo atual
cp /etc/nginx/sites-available/apront /etc/nginx/sites-available/apront.backup.$(date +%Y%m%d_%H%M%S)
info "   Backup criado"

# Verificar se server_name já está configurado
if grep -q "server_name.*apront.com.br" /etc/nginx/sites-available/apront; then
    info "   Domínio já configurado no server_name"
else
    warn "   Atualizando server_name para incluir apront.com.br"
    sed -i 's/server_name.*;/server_name apront.com.br www.apront.com.br;/' /etc/nginx/sites-available/apront
    info "   server_name atualizado"
fi

# Testar configuração
if nginx -t > /dev/null 2>&1; then
    info "   Configuração do Nginx está válida"
    systemctl reload nginx
    info "   Nginx recarregado"
else
    error "   Erro na configuração do Nginx!"
    nginx -t
    exit 1
fi

echo ""

# 4. Verificar portas no firewall
info "4. Verificando firewall..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        info "   Firewall está ativo"
        if ufw status | grep -q "80/tcp"; then
            info "   Porta 80 já permitida"
        else
            warn "   Permitindo porta 80..."
            ufw allow 80/tcp
        fi
        if ufw status | grep -q "443/tcp"; then
            info "   Porta 443 já permitida"
        else
            warn "   Permitindo porta 443..."
            ufw allow 443/tcp
        fi
    else
        warn "   Firewall não está ativo (pode estar desabilitado)"
    fi
else
    warn "   UFW não encontrado (pode estar usando outro firewall)"
fi

echo ""

# 5. Instalar Certbot
info "5. Verificando Certbot..."
if ! command -v certbot &> /dev/null; then
    warn "   Certbot não está instalado. Instalando..."
    apt update > /dev/null 2>&1
    apt install -y certbot python3-certbot-nginx > /dev/null 2>&1
    info "   Certbot instalado"
else
    info "   Certbot já está instalado"
fi

echo ""

# 6. Verificar se certificado já existe
info "6. Verificando certificados existentes..."
if [ -d "/etc/letsencrypt/live/apront.com.br" ]; then
    warn "   Certificado já existe para apront.com.br"
    read -p "   Deseja renovar/reinstalar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        info "   Mantendo certificado existente"
        
        # Testar renovação
        info "   Testando renovação automática..."
        if certbot renew --dry-run > /dev/null 2>&1; then
            info "   ✅ Renovação automática funcionando"
        else
            warn "   ⚠️  Problema com renovação automática"
        fi
        
        echo ""
        info "=========================================="
        info "✅ HTTPS já está configurado!"
        info "=========================================="
        echo ""
        info "Certificado válido até:"
        certbot certificates | grep -A 3 "apront.com.br" | grep "Expiry Date"
        echo ""
        exit 0
    fi
fi

echo ""

# 7. Obter certificado SSL
info "7. Obtendo certificado SSL..."
warn "   Isso pode solicitar interação (e-mail, termos, redirecionamento)"
echo ""

# Executar certbot
certbot --nginx -d apront.com.br -d www.apront.com.br \
    --non-interactive \
    --agree-tos \
    --redirect \
    --email "${CERTBOT_EMAIL:-admin@apront.com.br}" 2>&1 || {
    
    error "   Falha ao obter certificado SSL"
    warn "   Tentando modo interativo..."
    echo ""
    warn "   Execute manualmente:"
    warn "   sudo certbot --nginx -d apront.com.br -d www.apront.com.br"
    echo ""
    exit 1
}

info "   ✅ Certificado SSL obtido com sucesso!"

echo ""

# 8. Testar renovação automática
info "8. Configurando renovação automática..."
if certbot renew --dry-run > /dev/null 2>&1; then
    info "   ✅ Renovação automática configurada"
else
    warn "   ⚠️  Problema ao testar renovação automática"
    warn "   Verifique manualmente: sudo certbot renew --dry-run"
fi

echo ""

# 9. Verificação final
info "9. Verificação final..."
if nginx -t > /dev/null 2>&1; then
    info "   ✅ Configuração do Nginx válida"
    systemctl reload nginx
    info "   ✅ Nginx recarregado"
else
    error "   ❌ Erro na configuração do Nginx!"
    nginx -t
    exit 1
fi

echo ""

# 10. Testar HTTPS
info "10. Testando HTTPS..."
if curl -sI https://apront.com.br | head -1 | grep -q "200\|301\|302"; then
    info "   ✅ HTTPS funcionando: https://apront.com.br"
else
    warn "   ⚠️  Não foi possível testar HTTPS (pode levar alguns minutos para propagar)"
fi

if curl -sI http://apront.com.br | head -1 | grep -q "301\|302"; then
    info "   ✅ Redirecionamento HTTP → HTTPS funcionando"
else
    warn "   ⚠️  Redirecionamento pode não estar funcionando"
fi

echo ""
echo "=========================================="
info "✅ Configuração HTTPS concluída!"
echo "=========================================="
echo ""
info "🌐 URLs:"
echo "   • https://apront.com.br"
echo "   • https://www.apront.com.br"
echo ""
info "📋 Próximos passos:"
echo "   1. Acesse https://apront.com.br no navegador"
echo "   2. Verifique o cadeado verde 🔒"
echo "   3. Teste todas as funcionalidades (login, API, WebSocket)"
echo ""
info "🔧 Comandos úteis:"
echo "   • Ver certificados: sudo certbot certificates"
echo "   • Renovar manualmente: sudo certbot renew"
echo "   • Ver logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
echo ""

