# 🔍 Verificar Código no Container

## ❌ Problema

Variáveis estão corretas, mas email ainda usa `localhost:3000` e logs não aparecem.

## 🔍 Verificar se código foi atualizado no container:

### **1. Verificar código atual no container:**

```bash
docker compose exec backend grep -A 15 "def send_invite_email" /app/email_utils.py
```

**Deve mostrar os prints de debug.**

### **2. Verificar se arquivo foi montado corretamente:**

```bash

```

### **3. Ver TODOS os logs ao enviar convite (sem filtro):**

```bash
docker compose logs -f backend
```

**Envie um convite e procure por QUALQUER linha que contenha "EMAIL" ou "invite"**

### **4. Forçar recarregar código (se usar volume):**

```bash
docker compose restart backend
```

### **5. Verificar se função está sendo chamada:**

Adicione um print no início da função para garantir que está sendo executada:

```bash
docker compose exec backend sed -i '67a\    print("[EMAIL] ========== send_invite_email CHAMADA ==========")' /app/email_utils.py
docker compose restart backend
```

### **6. Testar função diretamente:**

```bash
docker compose exec backend python -c "
import sys
sys.path.insert(0, '/app')
from email_utils import send_invite_email
print('Testando função...')
result = send_invite_email('teste@exemplo.com', 'token_teste')
print('Resultado:', result)
"
```

## 🚀 Comando Completo para Diagnóstico:

```bash
cd /var/www/apront && \
echo "=== Verificando código no container ===" && \
docker compose exec backend grep -A 5 "def send_invite_email" /app/email_utils.py | head -n 10 && \
echo "" && \
echo "=== Adicionando log de debug no início da função ===" && \
docker compose exec backend sed -i '67a\    print("[EMAIL] ========== send_invite_email CHAMADA ==========")' /app/email_utils.py && \
docker compose restart backend && \
echo "✅ Log adicionado! Agora envie um convite e veja TODOS os logs:"
echo "docker compose logs -f backend"
```

## 📋 Depois de executar:

1. **Envie um convite**
2. **Veja TODOS os logs:**
   ```bash
   docker compose logs -f backend
   ```
3. **Procure por:**
   - `[EMAIL] ========== send_invite_email CHAMADA ==========`
   - `[EMAIL] IS_PRODUCTION:`
   - `[EMAIL] FRONTEND_URL:`
   - Qualquer linha com "EMAIL" ou "invite"

**Copie TODAS as linhas relevantes aqui.**

