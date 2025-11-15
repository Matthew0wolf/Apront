# 🔧 Corrigir Senha de App do Google

## ❌ Problema

Erro 535: "Username and Password not accepted"

Isso significa que a senha de app do Google está incorreta ou foi revogada.

## ✅ Solução:

### **1. Gerar Nova Senha de App do Google:**

1. **Acesse:** https://myaccount.google.com/apppasswords
2. **Faça login** com sua conta Google
3. **Selecione "Mail"** e **"Other (Custom name)"**
4. **Digite:** "Apront VPS" (ou qualquer nome)
5. **Clique em "Generate"**
6. **Copie a senha de 16 caracteres** (sem espaços)

### **2. Atualizar arquivo .env:**

```bash
nano backend/.env
```

**Localize a linha:**
```
SMTP_PASSWORD=qcwv mxid pmpd ixku
```

**Substitua pela nova senha de app** (pode ter espaços, o código remove automaticamente):
```
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **3. Verificar se email está correto:**

No arquivo `.env`, verifique:
```
SMTP_USERNAME=matheusdev0998@gmail.com
FROM_EMAIL=matheusdev0998@gmail.com
```

**Ambos devem ser o mesmo email usado para gerar a senha de app.**

### **4. Reiniciar backend:**

```bash
docker compose restart backend
```

### **5. Testar novamente:**

Tente fazer o cadastro novamente e verifique os logs:

```bash
docker compose logs -f backend
```

## 🔍 Verificações Importantes:

### **Verificar se Verificação em 2 Etapas está Ativada:**

1. Acesse: https://myaccount.google.com/security
2. Verifique se "Verificação em duas etapas" está **ATIVADA**
3. Se não estiver, **ative primeiro** antes de gerar senha de app

### **Verificar se Senha de App está Correta:**

```bash
# Verificar senha no .env (sem mostrar a senha completa)
docker compose exec backend cat /app/.env | grep SMTP_PASSWORD
```

**A senha deve ter 16 caracteres** (pode ter espaços a cada 4 caracteres).

### **Testar Credenciais:**

```bash
docker compose exec backend python -c "
import smtplib
import os
from dotenv import load_dotenv
load_dotenv('/app/.env', override=False)

username = os.getenv('SMTP_USERNAME')
password = os.getenv('SMTP_PASSWORD', '').replace(' ', '')

try:
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    server.starttls()
    server.login(username, password)
    print('✅ Autenticação OK!')
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print(f'❌ Erro de autenticação: {e}')
    print('Verifique se a senha de app está correta')
except Exception as e:
    print(f'❌ Erro: {e}')
"
```

## 📋 Checklist:

- [ ] Verificação em 2 etapas ativada no Google
- [ ] Nova senha de app gerada
- [ ] Senha atualizada no `.env`
- [ ] `SMTP_USERNAME` e `FROM_EMAIL` são o mesmo email
- [ ] Backend reiniciado
- [ ] Teste de autenticação passou
- [ ] Cadastro funcionando

## ⚠️ Importante:

- **NÃO use sua senha normal do Gmail**
- **Use APENAS senha de app** (16 caracteres)
- A senha de app pode ter espaços (o código remove automaticamente)
- Se a senha de app não funcionar, **gere uma nova**

