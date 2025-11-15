# 🔍 Verificar Código email_utils.py no Container

## ❌ Problema

Convite enviado com sucesso, mas logs de debug não aparecem. Email ainda usa `localhost:3000`.

## 🔍 Verificar código no container:

### **1. Ver código atual da função send_invite_email:**

```bash
docker compose exec backend grep -A 35 "def send_invite_email" /app/email_utils.py
```

**Deve mostrar os prints de debug nas linhas 76-99.**

### **2. Verificar se arquivo está sendo montado (volume):**

```bash
docker compose exec backend ls -la /app/email_utils.py
docker compose exec backend head -n 100 /app/email_utils.py | tail -n 20
```

### **3. Verificar se Python está usando cache:**

O Python pode estar usando `.pyc` (bytecode cache). Forçar recarregar:

```bash
docker compose exec backend find /app -name "*.pyc" -delete
docker compose exec backend find /app -name "__pycache__" -type d -exec rm -r {} + 2>/dev/null || true
docker compose restart backend
```

### **4. Testar função diretamente com imports:**

```bash
docker compose exec backend python -c "
import sys
import os
sys.path.insert(0, '/app')

# Força recarregar módulo
if 'email_utils' in sys.modules:
    del sys.modules['email_utils']

from email_utils import send_invite_email
from pathlib import Path
from dotenv import load_dotenv

# Carrega .env
load_dotenv('/app/.env', override=False)

print('=== Testando função ===')
print('FRONTEND_URL:', os.getenv('FRONTEND_URL'))
print('FLASK_ENV:', os.getenv('FLASK_ENV'))

# Testa função (vai falhar no SMTP, mas deve mostrar os logs)
try:
    result = send_invite_email('teste@exemplo.com', 'token_teste_123')
    print('Resultado:', result)
except Exception as e:
    print('Erro (esperado no SMTP):', str(e)[:100])
"
```

## 🚀 Comando Completo para Diagnóstico:

```bash
cd /var/www/apront && \
echo "=== 1. Verificando código no container ===" && \
docker compose exec backend grep -A 5 "print.*IS_PRODUCTION" /app/email_utils.py && \
echo "" && \
echo "=== 2. Limpando cache Python ===" && \
docker compose exec backend find /app -name "*.pyc" -delete 2>/dev/null && \
docker compose exec backend find /app -name "__pycache__" -type d -exec rm -r {} + 2>/dev/null || true && \
echo "" && \
echo "=== 3. Reiniciando backend ===" && \
docker compose restart backend && \
echo "" && \
echo "✅ Cache limpo! Agora envie um convite e veja os logs:"
echo "docker compose logs -f backend | grep -i EMAIL"
```

## 📋 Se código não tiver os prints:

O código pode não ter sido atualizado. Verificar:

```bash
docker compose exec backend grep -n "IS_PRODUCTION:" /app/email_utils.py
```

**Se não aparecer nada, o código não foi atualizado no container!**

Nesse caso, pode ser que o volume esteja montado e o código local não foi atualizado. Verificar `docker-compose.yml`:

```bash
grep -A 5 "backend:" docker-compose.yml | grep -A 5 "volumes:"
```

Se houver volume montando `./backend:/app`, o código no container é o mesmo do host. Atualizar no host:

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
docker compose restart backend
```

