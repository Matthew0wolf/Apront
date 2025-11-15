# 🔧 Corrigir .env do Backend - COMPLETO

## ❌ Problemas no arquivo atual:

1. `DATABASE_URL=...@localhost:5433/...` → **ERRADO** (deve ser `postgres:5432`)
2. `FLASK_ENV=development` → **ERRADO** (deve ser `production`)
3. Falta `REDIS_URL`

## ✅ Arquivo `.env` CORRETO (cole tudo):

```env
# Configurações de Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=matheusdev0998@gmail.com
SMTP_PASSWORD=qcwv mxid pmpd ixku
FROM_EMAIL=matheusdev0998@gmail.com

# Banco de Dados PostgreSQL (Docker - nome do serviço, NÃO localhost!)
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db

# Redis (Docker - nome do serviço)
REDIS_URL=redis://redis:6379/0

# Segurança
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# Ambiente - IMPORTANTE: production no VPS
FLASK_ENV=production

# Porta
PORT=5001
```

## 📋 Passos no Nano:

### **1. Abrir arquivo:**

```bash
nano backend/.env
```

### **2. Deletar TUDO e colar o conteúdo acima**

- `Ctrl+K` várias vezes para deletar tudo
- Cole o conteúdo completo acima
- `Ctrl+O`, `Enter`, `Ctrl+X` para salvar

### **3. Verificar se está correto:**

```bash
cat backend/.env | grep -E "DATABASE_URL|FLASK_ENV|REDIS_URL"
```

**Deve mostrar:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
REDIS_URL=redis://redis:6379/0
FLASK_ENV=production
```

### **4. Reiniciar backend:**

```bash
cd /var/www/apront
docker compose restart backend
docker compose logs backend | tail -30
```

**Procure por:**
- ✅ `Usando PostgreSQL: postgres:5432/apront_db`
- ✅ `WebSocket CORS: Permitindo qualquer origem em produção`
- ❌ **NÃO deve mostrar:** `localhost:5433`

## 🔑 Mudanças Críticas:

1. **`localhost:5433`** → **`postgres:5432`** (nome do serviço Docker)
2. **`development`** → **`production`**
3. **Adicionar:** `REDIS_URL=redis://redis:6379/0`

## ⚠️ IMPORTANTE:

No Docker Compose, os serviços se comunicam pelo **nome do serviço**, não por `localhost`:
- ✅ `postgres:5432` (nome do serviço)
- ❌ `localhost:5433` (não funciona dentro do container)

