# 🔍 Diagnosticar Erro de Email

## ❌ Problema

Erro 500 ao fazer cadastro, mas não há logs de email.

## 📋 Diagnóstico:

### **1. Ver logs completos do backend (últimas tentativas):**

```bash
docker compose logs backend | tail -100
```

**Procure por:**
- Mensagens de erro
- `[EMAIL]` ou `[VALIDACAO]`
- Traceback/stack trace

### **2. Verificar se arquivo .env está no container:**

```bash
docker compose exec backend ls -la /app/.env
docker compose exec backend cat /app/.env | grep SMTP
```

### **3. Testar carregamento de variáveis SMTP:**

```bash
docker compose exec backend python -c "
import os
from dotenv import load_dotenv
from pathlib import Path

# Carrega .env
backend_dir = Path('/app')
env_path = backend_dir / '.env'
print(f'Arquivo .env existe: {env_path.exists()}')
load_dotenv(dotenv_path=env_path, override=False)

print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('SMTP_PORT:', os.getenv('SMTP_PORT'))
print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))
print('SMTP_PASSWORD:', 'DEFINIDO' if os.getenv('SMTP_PASSWORD') else 'NAO DEFINIDO')
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
print('FLASK_ENV:', os.getenv('FLASK_ENV'))
"
```

### **4. Testar função de envio diretamente:**

```bash
docker compose exec backend python -c "
import sys
sys.path.insert(0, '/app')
from email_utils import _validate_smtp_config, send_verification_token_email

print('=== Validando SMTP ===')
result = _validate_smtp_config()
print(f'Validação: {result}')

if result:
    print('\\n=== Testando envio ===')
    result = send_verification_token_email('teste@teste.com', 'TESTE123', 'Teste')
    print(f'Envio: {result}')
"
```

### **5. Ver logs em tempo real durante tentativa de cadastro:**

Em um terminal, execute:

```bash
docker compose logs -f backend
```

Em outro terminal ou no navegador, tente fazer o cadastro novamente.

## 🔍 Possíveis Problemas:

1. **Arquivo .env não está sendo montado no container**
2. **Variáveis SMTP não estão sendo carregadas**
3. **Erro de conexão SMTP (firewall/bloqueio)**
4. **Erro de autenticação SMTP (senha incorreta)**

## ✅ Solução Rápida:

Execute todos os comandos acima e compartilhe os resultados, especialmente:
- Logs completos do backend
- Resultado do teste de carregamento de variáveis
- Resultado do teste de validação SMTP

