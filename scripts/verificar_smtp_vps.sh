#!/bin/bash
# Script para verificar e corrigir configurações SMTP na VPS

echo "========================================"
echo "Verificando configuracoes SMTP"
echo "========================================"
echo ""

echo "1. Verificando variaveis SMTP no container:"
docker exec apront-backend python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('SMTP_PORT:', os.getenv('SMTP_PORT'))
print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))
print('SMTP_PASSWORD:', 'DEFINIDO (' + str(len(os.getenv('SMTP_PASSWORD', ''))) + ' caracteres)' if os.getenv('SMTP_PASSWORD') else 'NAO DEFINIDO')
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
"
echo ""

echo "2. Verificando arquivo .env no container:"
docker exec apront-backend ls -la /app/.env 2>/dev/null || echo "Arquivo .env nao encontrado em /app/.env"
echo ""

echo "3. Verificando se .env tem configuracoes SMTP:"
docker exec apront-backend grep -i smtp /app/.env 2>/dev/null | sed 's/PASSWORD=.*/PASSWORD=***OCULTO***/' || echo "Nenhuma configuracao SMTP encontrada"
echo ""

echo "========================================"
echo "SOLUCAO:"
echo "========================================"
echo ""
echo "O erro 535 indica que as credenciais SMTP estao incorretas."
echo ""
echo "Para Gmail, voce precisa:"
echo "1. Habilitar autenticacao de 2 fatores na sua conta Google"
echo "2. Criar uma 'Senha de App' (App Password):"
echo "   - Acesse: https://myaccount.google.com/apppasswords"
echo "   - Ou: Configuracoes > Seguranca > Verificacao em duas etapas > Senhas de app"
echo "3. Use a senha de app gerada (16 caracteres) no lugar da senha normal"
echo ""
echo "Para atualizar as credenciais:"
echo "1. Edite o arquivo .env no container ou no host"
echo "2. Atualize SMTP_USERNAME e SMTP_PASSWORD"
echo "3. Reinicie o container: docker restart apront-backend"
echo ""

