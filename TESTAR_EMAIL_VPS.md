# 🧪 Testar Email no VPS

## ✅ Backend está funcionando!

Vejo que:
- ✅ Ambiente detectado: PRODUÇÃO (VPS/Docker)
- ✅ PostgreSQL conectado
- ✅ WebSocket funcionando

## 📋 Próximos Passos:

### **1. Verificar se configurações SMTP estão sendo carregadas:**

```bash
docker compose exec backend python -c "
import os
from dotenv import load_dotenv
load_dotenv('/app/.env', override=False)
print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('SMTP_PORT:', os.getenv('SMTP_PORT'))
print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))
print('SMTP_PASSWORD:', 'DEFINIDO' if os.getenv('SMTP_PASSWORD') else 'NAO DEFINIDO')
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
"
```

**Deve mostrar todas as configurações SMTP.**

### **2. Testar envio de email diretamente:**

```bash
docker compose exec backend python -c "
from email_utils import send_verification_token_email
result = send_verification_token_email('seu_email@teste.com', 'TESTE123', 'Teste')
print('Resultado:', result)
"
```

### **3. Verificar logs completos do backend:**

```bash
docker compose logs backend | tail -50
```

**Procure por:**
- `[EMAIL] Modo produção VPS`
- `[VALIDACAO] Validando configuracoes SMTP`
- `[OK] Configuracoes SMTP validadas`

### **4. Testar cadastro no navegador:**

1. Acesse: `http://72.60.56.28/register`
2. Preencha o formulário
3. Tente fazer o cadastro
4. Monitore os logs em tempo real:

```bash
docker compose logs -f backend
```

**Procure por mensagens de email nos logs.**

## 🔍 Se ainda der erro:

### **Verificar se arquivo .env está correto:**

```bash
cat backend/.env
```

**Deve ter todas as variáveis SMTP.**

### **Verificar se .env está sendo montado no container:**

```bash
docker compose exec backend ls -la /app/.env
docker compose exec backend cat /app/.env | grep SMTP
```

### **Testar conexão SMTP do container:**

```bash
docker compose exec backend python -c "
import smtplib
try:
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    server.starttls()
    print('✅ Conexão SMTP OK')
    server.quit()
except Exception as e:
    print(f'❌ Erro de conexão: {e}')
"
```

## 📋 Checklist:

- [ ] Configurações SMTP visíveis no container
- [ ] Teste de conexão SMTP OK
- [ ] Logs mostram validação SMTP
- [ ] Teste de cadastro funcionando

