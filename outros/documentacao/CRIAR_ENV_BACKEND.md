# 🔧 Criar .env no Backend com DATABASE_URL Correta

## ✅ Solução: Criar arquivo .env

Mesmo que o docker-compose.yml tenha a DATABASE_URL correta, o código pode estar carregando .env primeiro. Vamos criar um .env com a URL correta:

### **1. Criar arquivo .env no backend:**

```bash
cd /var/www/apront/backend
nano .env
```

### **2. Cole este conteúdo:**

```env
# Banco de dados PostgreSQL (Docker Compose)
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db

# Redis
REDIS_URL=redis://redis:6379/0

# Flask
FLASK_ENV=production

# Chaves (substitua pelas suas chaves geradas)
SECRET_KEY=SUA_SECRET_KEY_AQUI
JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_AQUI

# SMTP (se tiver SendGrid configurado)
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=SUA_API_KEY_SENDGRID
FROM_EMAIL=noreply@seu-dominio.com
```

**⚠️ IMPORTANTE:**
- Use `postgres:5432` (nome do serviço Docker), **NÃO** `localhost:5433`
- Substitua `SUA_SECRET_KEY_AQUI` e `SUA_JWT_SECRET_KEY_AQUI` pelas chaves que você gerou
- Se não tiver SendGrid ainda, pode deixar as linhas SMTP comentadas

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **3. Verificar se arquivo foi criado:**

```bash
cat .env
```

**Deve mostrar o conteúdo que você colou.**

### **4. Reiniciar backend:**

```bash
cd /var/www/apront
docker compose restart backend

# Ver logs
docker compose logs -f backend
```

### **5. Verificar se funcionou:**

Os logs devem mostrar:

```
📝 Carregando variáveis do arquivo .env (desenvolvimento local)
✅ Usando PostgreSQL: postgres:5432/apront_db
```

**NÃO deve mostrar:**
```
❌ localhost:5433
❌ Connection refused
```

## 🔍 Se Ainda Não Funcionar

### **Verificar se .env está sendo lido:**

```bash
docker compose exec backend cat /app/.env
```

**Deve mostrar o conteúdo do .env que você criou.**

### **Verificar variáveis dentro do container:**

```bash
docker compose exec backend env | grep DATABASE_URL
```

**Deve mostrar:** `DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db`

### **Testar conexão manualmente:**

```bash
docker compose exec backend python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('DATABASE_URL:', os.getenv('DATABASE_URL'))
"
```

## 📋 Checklist

- [ ] Arquivo `.env` criado em `/var/www/apront/backend/.env`
- [ ] `.env` contém `DATABASE_URL=postgresql://...@postgres:5432/...`
- [ ] **NÃO** contém `localhost` ou `127.0.0.1`
- [ ] Chaves SECRET_KEY e JWT_SECRET_KEY configuradas
- [ ] Backend reiniciado
- [ ] Logs mostram conexão bem-sucedida

