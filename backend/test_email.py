#!/usr/bin/env python3
"""
Script de teste para verificar configuração de email
"""
import sys
import os
from pathlib import Path

# Adiciona o diretório atual ao path
sys.path.insert(0, str(Path(__file__).parent))

# Importa as funções de email
from email_utils import send_verification_token_email, _validate_smtp_config

print("=" * 60)
print("TESTE DE CONFIGURAÇÃO DE EMAIL")
print("=" * 60)
print()

# Valida configurações
print("1. Validando configurações SMTP...")
print("-" * 60)
is_valid = _validate_smtp_config()
print()

if not is_valid:
    print("❌ Configurações inválidas. Corrija o arquivo .env e tente novamente.")
    sys.exit(1)

print("2. Testando envio de email...")
print("-" * 60)

# Usa o FROM_EMAIL ou o primeiro argumento da linha de comando
from email_utils import FROM_EMAIL
if len(sys.argv) > 1:
    test_email = sys.argv[1]
else:
    test_email = FROM_EMAIL
    if not test_email:
        print("[ERRO] Nenhum email fornecido e FROM_EMAIL nao esta definido")
        print("   Use: python test_email.py seu_email@exemplo.com")
        sys.exit(1)

print(f"Enviando email de teste para: {test_email}")
print()

# Tenta enviar o email
success = send_verification_token_email(
    to_email=test_email,
    verification_token="123456",
    user_name="Teste"
)

print()
if success:
    print("=" * 60)
    print("[SUCESSO] Email enviado com sucesso!")
    print("=" * 60)
else:
    print("=" * 60)
    print("[ERRO] FALHA! Verifique os erros acima.")
    print("=" * 60)
    sys.exit(1)

